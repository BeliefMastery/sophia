const crypto = require("crypto");
const https = require("https");

const expectedProject = "sophia-138fe";
const databaseHost = "sophia-138fe-default-rtdb.asia-southeast1.firebasedatabase.app";

const REMOVE_NAME = /^(debora|deborah|ella)$/i;
const REMOVE_EMAIL = /(debora|deborah|ella)/i;

const USER_PATHS = [
  "profiles",
  "attempts",
  "repairs",
  "reviews",
  "misses",
  "mastery",
  "interests",
  "entrance",
];

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
  return String(message).replace(/-----BEGIN[\s\S]*?-----END[^\s]*/g, "[key]").replace(/\s+/g, " ").slice(0, 180);
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

function protectedEmails() {
  return new Set([
    (process.env.SOPHIA_AUTH_EMAIL || "").trim().toLowerCase(),
    (process.env.PARENT_AUTH_EMAIL || "").trim().toLowerCase(),
  ].filter(Boolean));
}

function shouldRemove(user, profileName, protectedSet) {
  const email = (user.email || "").trim().toLowerCase();
  if (email && protectedSet.has(email)) return false;
  const display = (user.displayName || "").trim();
  const profile = (profileName || "").trim();
  if (REMOVE_NAME.test(display) || REMOVE_NAME.test(profile)) return true;
  if (email && REMOVE_EMAIL.test(email)) return true;
  return false;
}

async function deleteAuthUser(projectId, token, uid) {
  const response = await googleJson({
    method: "POST",
    hostname: "identitytoolkit.googleapis.com",
    path: `/v1/projects/${projectId}/accounts:delete`,
    token,
    payload: { localId: uid },
  });
  if (response.status !== 200) fail(`Auth delete failed for ${uid} (${response.status}: ${errorText(response.body)})`);
}

async function deleteUserData(token, uid) {
  for (const root of USER_PATHS) {
    const response = await request({
      method: "DELETE",
      hostname: databaseHost,
      path: `/${root}/${encodeURIComponent(uid)}.json`,
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.status !== 200) fail(`RTDB delete failed ${root}/${uid} HTTP ${response.status}`);
  }
  const role = await request({
    method: "DELETE",
    hostname: databaseHost,
    path: `/roles/${encodeURIComponent(uid)}.json`,
    headers: { authorization: `Bearer ${token}` },
  });
  if (role.status !== 200) fail(`RTDB delete failed roles/${uid} HTTP ${role.status}`);
}

async function main() {
  const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const token = await accessToken(serviceAccount);
  const protectedSet = protectedEmails();
  if (!protectedSet.size) fail("SOPHIA_AUTH_EMAIL and PARENT_AUTH_EMAIL must be set so protected accounts are never deleted");

  const users = await listUsers(serviceAccount.project_id, token);
  const profiles = (await readJson("/profiles.json", token)) || {};
  const removed = [];

  for (const user of users) {
    const uid = user.localId || "";
    if (!uid) continue;
    const profileName = profiles[uid]?.name || "";
    if (!shouldRemove(user, profileName, protectedSet)) continue;
    console.log(`removing ${uid} email=${user.email || ""} display=${user.displayName || ""} profile=${profileName}`);
    await deleteUserData(token, uid);
    await deleteAuthUser(serviceAccount.project_id, token, uid);
    removed.push({ uid, email: user.email || "", display: user.displayName || "", profile: profileName });
  }

  if (!removed.length) console.log("no Debora/Ella accounts found");
  else console.log(`removed ${removed.length} account(s): ${removed.map((row) => row.profile || row.display || row.email).join(", ")}`);

  const remaining = await listUsers(serviceAccount.project_id, token);
  const profilesAfter = (await readJson("/profiles.json", token)) || {};
  for (const user of remaining) {
    const uid = user.localId || "";
    console.log(`keep ${uid} email=${user.email || ""} display=${user.displayName || ""} profile=${profilesAfter[uid]?.name || ""}`);
  }
}

main().catch((error) => fail(error.message || "remove extra students failed"));
