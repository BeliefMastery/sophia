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

function errorCode(body) {
  try {
    const message = JSON.parse(body).error.message || "";
    return String(message).split(":")[0].replace(/[^A-Z0-9_]/g, "").slice(0, 60);
  } catch {
    return "";
  }
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

async function enableEmailPassword(projectId, token) {
  const body = JSON.stringify({ signIn: { email: { enabled: true, passwordRequired: true } } });
  const response = await request({
    method: "PATCH",
    hostname: "identitytoolkit.googleapis.com",
    path: `/admin/v2/projects/${projectId}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired`,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
    },
    body,
  });
  if (response.status !== 200) fail(`Could not enable email sign-in (${errorCode(response.body) || response.status})`);
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
  if (lookup.status === 400 && errorCode(lookup.body) === "OPERATION_NOT_ALLOWED") {
    await enableEmailPassword(projectId, token);
    lookup = await postJson(`${base}/accounts:query`, token, { email: [email] });
  }
  if (lookup.status !== 200) fail(`Account lookup failed (${errorCode(lookup.body) || lookup.status})`);

  const existing = JSON.parse(lookup.body).userInfo?.[0]?.localId;
  let uid = existing;
  if (uid) {
    const updated = await postJson(`${base}/accounts:update`, token, {
      localId: uid,
      password,
      displayName: "Sophia",
    });
    if (updated.status !== 200) fail(`Account update failed (${errorCode(updated.body) || updated.status})`);
    console.log(`updated ${uid}`);
  } else {
    let created = await postJson(`${base}/accounts`, token, {
      email,
      password,
      displayName: "Sophia",
      emailVerified: false,
    });
    if (created.status !== 200 && errorCode(created.body) === "OPERATION_NOT_ALLOWED") {
      await enableEmailPassword(projectId, token);
      created = await postJson(`${base}/accounts`, token, {
        email,
        password,
        displayName: "Sophia",
        emailVerified: false,
      });
    }
    if (created.status !== 200) fail(`Account create failed (${errorCode(created.body) || created.status})`);
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
