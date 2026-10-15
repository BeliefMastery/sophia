const crypto = require("crypto");
const https = require("https");

const expectedProject = "sophia-138fe";
const databaseHost = "sophia-138fe-default-rtdb.asia-southeast1.firebasedatabase.app";
const displayName = "Warwick";

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
  const email = process.env.PARENT_AUTH_EMAIL || "";
  const password = process.env.PARENT_AUTH_PASSWORD || "";
  if (email) message = message.split(email).join("[email]");
  if (password) message = message.split(password).join("[password]");
  return message.replace(/-----BEGIN[\s\S]*?-----END[^\s]*/g, "[key]").replace(/\s+/g, " ").slice(0, 180);
}

function accessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: [
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/firebase",
      "https://www.googleapis.com/auth/identitytoolkit",
      "https://www.googleapis.com/auth/firebase.database",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
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

function googleJson({ method, hostname, path, token, payload }) {
  const body = payload === undefined ? undefined : JSON.stringify(payload);
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) {
    headers["content-type"] = "application/json";
    headers["content-length"] = Buffer.byteLength(body);
  }
  return request({ method, hostname, path, headers, body });
}

function putJson(path, token, value) {
  const body = JSON.stringify(value);
  return request({
    method: "PUT",
    hostname: databaseHost,
    path,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
    },
    body,
  });
}

async function webApiKey(projectId, token) {
  const listed = await googleJson({
    method: "GET",
    hostname: "firebase.googleapis.com",
    path: `/v1beta1/projects/${projectId}/webApps`,
    token,
  });
  if (listed.status !== 200) fail(`Web app list failed (${listed.status}: ${errorText(listed.body)})`);
  const app = (JSON.parse(listed.body).apps || []).find((entry) => entry.appId);
  if (!app) fail("Web app is missing");
  const config = await googleJson({
    method: "GET",
    hostname: "firebase.googleapis.com",
    path: `/v1beta1/projects/${projectId}/webApps/${encodeURIComponent(app.appId)}/config`,
    token,
  });
  if (config.status !== 200) fail(`Web config read failed (${config.status}: ${errorText(config.body)})`);
  const apiKey = JSON.parse(config.body).apiKey;
  if (!apiKey) fail("Web config had no api key");
  return apiKey;
}

async function main() {
  const email = (process.env.PARENT_AUTH_EMAIL || "").trim();
  const password = process.env.PARENT_AUTH_PASSWORD || "";
  if (!email || !password) fail("Login secrets are missing");
  if (password.length < 6) fail("Password is shorter than Firebase allows");

  const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const token = await accessToken(serviceAccount);
  const projectId = serviceAccount.project_id;
  const lookup = await googleJson({
    method: "POST",
    hostname: "identitytoolkit.googleapis.com",
    path: `/v1/projects/${projectId}/accounts:query`,
    token,
    payload: { email: [email] },
  });
  if (lookup.status !== 200) fail(`Account lookup failed (${lookup.status}: ${errorText(lookup.body)})`);

  let uid = JSON.parse(lookup.body).userInfo?.[0]?.localId || "";
  if (!uid) {
    const created = await googleJson({
      method: "POST",
      hostname: "identitytoolkit.googleapis.com",
      path: `/v1/projects/${projectId}/accounts`,
      token,
      payload: { email, password, displayName, emailVerified: false },
    });
    if (created.status !== 200) fail(`Account create failed (${created.status}: ${errorText(created.body)})`);
    uid = JSON.parse(created.body).localId;
    if (!uid) fail("Account create returned no id");
    console.log(`created ${uid}`);
  } else {
    const named = await googleJson({
      method: "POST",
      hostname: "identitytoolkit.googleapis.com",
      path: `/v1/projects/${projectId}/accounts:update`,
      token,
      payload: { localId: uid, displayName, password },
    });
    if (named.status !== 200) fail(`Account update failed (${named.status}: ${errorText(named.body)})`);
    console.log(`account present ${uid}`);
  }

  const role = await putJson(`/roles/${encodeURIComponent(uid)}/parent.json`, token, true);
  if (role.status !== 200) fail(`Parent role write failed with HTTP ${role.status}: ${errorText(role.body)}`);
  const profile = await putJson(`/profiles/${encodeURIComponent(uid)}/name.json`, token, displayName);
  if (profile.status !== 200) fail(`Profile name write failed with HTTP ${profile.status}`);
  console.log("parent role set");

  const apiKey = await webApiKey(projectId, token);
  const signedIn = await googleJson({
    method: "POST",
    hostname: "identitytoolkit.googleapis.com",
    path: `/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    payload: { email, password, returnSecureToken: true },
  });
  if (signedIn.status !== 200) fail(`Sign-in check failed (${signedIn.status}: ${errorText(signedIn.body)})`);
  const localId = JSON.parse(signedIn.body).localId;
  if (localId !== uid) fail("Sign-in check did not match the account");
  console.log(`sign-in verified ${localId}`);
}

main().catch((error) => fail(error.message || "parent login setup failed"));
