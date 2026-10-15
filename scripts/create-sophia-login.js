const crypto = require("crypto");
const https = require("https");

const expectedProject = "sophia-138fe";
const databaseHost = "sophia-138fe-default-rtdb.asia-southeast1.firebasedatabase.app";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseServiceAccount(raw) {
  if (!raw || !raw.trim()) fail("Firebase service account secret is empty");
  let parsed;
  try {
    parsed = JSON.parse(raw);
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
  } catch {
    fail("Firebase service account secret is not JSON");
  }
  if (!parsed.client_email || !parsed.private_key || parsed.project_id !== expectedProject) {
    fail("Firebase service account is not for sophia-138fe");
  }
  return parsed;
}

function request({ method, hostname, path, headers, body }) {
  return new Promise((resolve, reject) => {
    const req = https.request({ method, hostname, path, headers }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function errorText(body) {
  let message = "";
  try {
    const parsed = JSON.parse(body);
    message = parsed.error?.message || parsed.error?.status || "";
  } catch {
    message = "";
  }
  const email = process.env.SOPHIA_AUTH_EMAIL || "";
  const password = process.env.SOPHIA_AUTH_PASSWORD || "";
  if (email) message = message.split(email).join("[email]");
  if (password) message = message.split(password).join("[password]");
  return message.replace(/\s+/g, " ").slice(0, 180);
}

function accessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/firebase.database",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");
  const payload = `${header}.${claim}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(payload), serviceAccount.private_key).toString("base64url");
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: `${payload}.${signature}`,
  }).toString();
  return request({
    method: "POST",
    hostname: "oauth2.googleapis.com",
    path: "/token",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "content-length": Buffer.byteLength(body),
    },
    body,
  }).then((response) => {
    if (response.status !== 200) fail(`Google token request failed with HTTP ${response.status}`);
    const token = JSON.parse(response.body).access_token;
    if (!token) fail("Google token response had no access token");
    return token;
  });
}

function postJson(path, token, payload) {
  const body = JSON.stringify(payload);
  return request({
    method: "POST",
    hostname: "identitytoolkit.googleapis.com",
    path,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
    },
    body,
  });
}

async function initializeAuth(projectId, token) {
  const response = await request({
    method: "POST",
    hostname: "identitytoolkit.googleapis.com",
    path: `/v2/projects/${projectId}/identityPlatform:initializeAuth`,
    headers: {
      authorization: `Bearer ${token}`,
      "content-length": 0,
    },
  });
  if (response.status !== 200) {
    fail(`Could not turn on Firebase Authentication (${response.status}: ${errorText(response.body)})`);
  }
  console.log("authentication initialized");
}

async function enableEmailPassword(projectId, token) {
  const body = JSON.stringify({ signIn: { email: { enabled: true, passwordRequired: true } } });
  const response = await request({
    method: "PATCH",
    hostname: "identitytoolkit.googleapis.com",
    path: `/v2/projects/${projectId}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired`,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
    },
    body,
  });
  if (response.status !== 200) fail(`Could not enable email sign-in (${response.status}: ${errorText(response.body)})`);
  console.log("email sign-in enabled");
}

async function main() {
  const email = (process.env.SOPHIA_AUTH_EMAIL || "").trim();
  const password = process.env.SOPHIA_AUTH_PASSWORD || "";
  if (!email || !password) fail("Login secrets are missing");
  if (password.length < 6) fail("Password is shorter than Firebase allows");

  const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const token = await accessToken(serviceAccount);
  const projectId = serviceAccount.project_id;
  const base = `/v1/projects/${projectId}`;

  let lookup = await postJson(`${base}/accounts:query`, token, { email: [email] });
  const lookupCode = errorText(lookup.body);
  if (lookup.status !== 200 && (lookupCode === "CONFIGURATION_NOT_FOUND" || lookupCode === "OPERATION_NOT_ALLOWED")) {
    if (lookupCode === "CONFIGURATION_NOT_FOUND") await initializeAuth(projectId, token);
    else await enableEmailPassword(projectId, token);
    lookup = await postJson(`${base}/accounts:query`, token, { email: [email] });
  }
  if (lookup.status !== 200) fail(`Account lookup failed (${lookup.status}: ${errorText(lookup.body)})`);

  const existing = JSON.parse(lookup.body).userInfo?.[0]?.localId;
  let uid = existing;
  if (uid) {
    const updated = await postJson(`${base}/accounts:update`, token, {
      localId: uid,
      password,
      displayName: "Sophia",
    });
    if (updated.status !== 200) fail(`Account update failed (${updated.status}: ${errorText(updated.body)})`);
    console.log(`updated ${uid}`);
  } else {
    let created = await postJson(`${base}/accounts`, token, {
      email,
      password,
      displayName: "Sophia",
      emailVerified: false,
    });
    if (created.status !== 200 && errorText(created.body).startsWith("OPERATION_NOT_ALLOWED")) {
      await enableEmailPassword(projectId, token);
      created = await postJson(`${base}/accounts`, token, {
        email,
        password,
        displayName: "Sophia",
        emailVerified: false,
      });
    }
    if (created.status !== 200) fail(`Account create failed (${created.status}: ${errorText(created.body)})`);
    uid = JSON.parse(created.body).localId;
    if (!uid) fail("Account create returned no id");
    console.log(`created ${uid}`);
  }

  const nameBody = JSON.stringify("Sophia");
  const profile = await request({
    method: "PUT",
    hostname: databaseHost,
    path: `/profiles/${encodeURIComponent(uid)}/name.json`,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "content-length": Buffer.byteLength(nameBody),
    },
    body: nameBody,
  });
  if (profile.status !== 200) fail(`Profile name write failed with HTTP ${profile.status}`);
  console.log("profile name set");
}

main().catch((error) => fail(error.message || "login setup failed"));
