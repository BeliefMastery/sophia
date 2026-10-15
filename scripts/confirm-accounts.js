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
  for (const key of ["SOPHIA_AUTH_EMAIL", "PARENT_AUTH_EMAIL"]) {
    const email = process.env[key] || "";
    if (email) message = message.split(email).join("[email]");
  }
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

async function listUsers(projectId, token) {
  const users = [];
  let pageToken = "";
  do {
    const query = new URLSearchParams({ maxResults: "500" });
    if (pageToken) query.set("nextPageToken", pageToken);
    const response = await googleJson({
      method: "GET",
      hostname: "identitytoolkit.googleapis.com",
      path: `/v1/projects/${projectId}/accounts:batchGet?${query.toString()}`,
      token,
    });
    if (response.status !== 200) fail(`Account list failed (${response.status}: ${errorText(response.body)})`);
    const parsed = JSON.parse(response.body);
    users.push(...(parsed.users || []));
    pageToken = parsed.nextPageToken || "";
  } while (pageToken);
  return users;
}

async function readJson(path, token) {
  const response = await googleJson({
    method: "GET",
    hostname: databaseHost,
    path,
    token,
  });
  if (response.status !== 200) fail(`Database read failed (${response.status}: ${errorText(response.body)})`);
  if (!response.body || response.body === "null") return null;
  return JSON.parse(response.body);
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

function labelFor(email) {
  const value = (email || "").trim().toLowerCase();
  if (!value) return "unnamed";
  if (value === (process.env.SOPHIA_AUTH_EMAIL || "").trim().toLowerCase()) return "student";
  if (value === (process.env.PARENT_AUTH_EMAIL || "").trim().toLowerCase()) return "parent";
  return "other";
}

function providers(user) {
  const ids = (user.providerUserInfo || []).map((provider) => provider.providerId).filter(Boolean);
  if (user.passwordHash) ids.push("password");
  return [...new Set(ids)].join(",") || "none";
}

async function main() {
  const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const token = await accessToken(serviceAccount);
  const users = await listUsers(serviceAccount.project_id, token);
  const profiles = (await readJson("/profiles.json", token)) || {};
  const roles = (await readJson("/roles.json", token)) || {};

  console.log(`accounts ${users.length}`);
  for (const user of users) {
    const uid = user.localId || "";
    const label = labelFor(user.email);
    const profileName = profiles[uid]?.name || "";
    const parent = roles[uid]?.parent === true;
    console.log(`${label} ${uid} display=${user.displayName || ""} profile=${profileName} parent=${parent} providers=${providers(user)}`);

    if (label === "student" && parent) {
      const removed = await request({
        method: "DELETE",
        hostname: databaseHost,
        path: `/roles/${encodeURIComponent(uid)}/parent.json`,
        headers: { authorization: `Bearer ${token}` },
      });
      if (removed.status !== 200) fail(`Student role removal failed with HTTP ${removed.status}`);
      console.log(`student parent role removed ${uid}`);
    }
    if (label === "student" && profileName !== "Sophia") {
      const written = await putJson(`/profiles/${encodeURIComponent(uid)}/name.json`, token, "Sophia");
      if (written.status !== 200) fail(`Student profile write failed with HTTP ${written.status}`);
      console.log(`student profile set ${uid}`);
    }
    if (label === "student" && user.displayName !== "Sophia") {
      const named = await googleJson({
        method: "POST",
        hostname: "identitytoolkit.googleapis.com",
        path: `/v1/projects/${serviceAccount.project_id}/accounts:update`,
        token,
        payload: { localId: uid, displayName: "Sophia" },
      });
      if (named.status !== 200) fail(`Student display name failed (${named.status}: ${errorText(named.body)})`);
      console.log(`student display name set ${uid}`);
    }
    if (label === "parent" && !parent) {
      const written = await putJson(`/roles/${encodeURIComponent(uid)}/parent.json`, token, true);
      if (written.status !== 200) fail(`Parent role write failed with HTTP ${written.status}`);
      console.log(`parent role set ${uid}`);
    }
    if (label === "parent" && !profileName) {
      const written = await putJson(`/profiles/${encodeURIComponent(uid)}/name.json`, token, "Warwick");
      if (written.status !== 200) fail(`Parent profile write failed with HTTP ${written.status}`);
      console.log(`parent profile set ${uid}`);
    }
  }

  const labels = users.map((user) => labelFor(user.email));
  if (!labels.includes("student")) console.log("student account missing");
  if (!labels.includes("parent")) console.log("parent account missing");

  const profilesAfter = (await readJson("/profiles.json", token)) || {};
  const rolesAfter = (await readJson("/roles.json", token)) || {};
  for (const user of users) {
    const uid = user.localId || "";
    const label = labelFor(user.email);
    console.log(`now ${label} ${uid} profile=${profilesAfter[uid]?.name || ""} parent=${rolesAfter[uid]?.parent === true}`);
  }
}

main().catch((error) => fail(error.message || "account check failed"));
