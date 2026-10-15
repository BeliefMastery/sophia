const crypto = require("crypto");
const https = require("https");

const expectedProject = "sophia-138fe";

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

function accessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform",
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
    return JSON.parse(response.body).access_token;
  });
}

function getJson(path, token) {
  return request({
    method: "GET",
    hostname: "firebase.googleapis.com",
    path,
    headers: { authorization: `Bearer ${token}` },
  }).then((response) => {
    if (response.status !== 200) fail(`Web config request failed with HTTP ${response.status}`);
    return JSON.parse(response.body);
  });
}

async function main() {
  const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const token = await accessToken(serviceAccount);
  const listed = await getJson(`/v1beta1/projects/${expectedProject}/webApps`, token);
  const app = (listed.apps || []).find((entry) => entry.appId);
  if (!app) fail("No web app exists");
  const config = await getJson(`/v1beta1/projects/${expectedProject}/webApps/${encodeURIComponent(app.appId)}/config`, token);
  const fields = {
    apiKey: config.apiKey || "",
    authDomain: config.authDomain || `${expectedProject}.firebaseapp.com`,
    databaseURL: "https://sophia-138fe-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: config.projectId || expectedProject,
    appId: config.appId || app.appId,
  };
  if (!fields.apiKey || !fields.appId) fail("Web config was incomplete");
  console.log(JSON.stringify(fields));
}

main().catch((error) => fail(error.message || "web config failed"));
