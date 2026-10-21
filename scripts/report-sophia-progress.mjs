/**
 * Read live RTDB progress for the Sophia student and print held fields.
 * Uses FIREBASE_SERVICE_ACCOUNT_JSON + SOPHIA_AUTH_EMAIL (to resolve uid via Auth list).
 */
import crypto from "crypto";
import https from "https";
import { fieldStudy } from "../lib/expansion.mjs";

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

function accessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: [
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
    if (response.status !== 200) fail(`token HTTP ${response.status}`);
    return JSON.parse(response.body).access_token;
  });
}

async function getJson(token, path) {
  const response = await request({
    method: "GET",
    hostname: databaseHost,
    path,
    headers: { authorization: `Bearer ${token}` },
  });
  if (response.status !== 200) fail(`read ${path} HTTP ${response.status}`);
  if (!response.body || response.body === "null") return null;
  return JSON.parse(response.body);
}

async function listUsers(projectId, token) {
  const users = [];
  let pageToken = "";
  do {
    const query = new URLSearchParams({ maxResults: "500" });
    if (pageToken) query.set("nextPageToken", pageToken);
    const response = await request({
      method: "GET",
      hostname: "identitytoolkit.googleapis.com",
      path: `/v1/projects/${projectId}/accounts:batchGet?${query.toString()}`,
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.status !== 200) fail(`accounts HTTP ${response.status}`);
    const parsed = JSON.parse(response.body);
    users.push(...(parsed.users || []));
    pageToken = parsed.nextPageToken || "";
  } while (pageToken);
  return users;
}

function listFrom(value) {
  if (!value) return [];
  return Object.entries(value).map(([id, record]) => ({ id, ...record }));
}

async function main() {
  const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const token = await accessToken(serviceAccount);
  const sophiaEmail = (process.env.SOPHIA_AUTH_EMAIL || "").trim().toLowerCase();
  if (!sophiaEmail) fail("SOPHIA_AUTH_EMAIL required");

  const users = await listUsers(serviceAccount.project_id, token);
  const sophia = users.find((user) => (user.email || "").trim().toLowerCase() === sophiaEmail);
  if (!sophia?.localId) fail("Sophia auth user not found");
  const uid = sophia.localId;

  const [strands, items, attempts, repairs, profiles] = await Promise.all([
    getJson(token, "/strands.json"),
    getJson(token, "/items.json"),
    getJson(token, `/attempts/${encodeURIComponent(uid)}.json`),
    getJson(token, `/repairs/${encodeURIComponent(uid)}.json`),
    getJson(token, "/profiles.json"),
  ]);

  const fields = fieldStudy(strands || {}, listFrom(items), listFrom(attempts), repairs || {});
  const held = fields.filter((field) => field.complete && field.held);
  const complete = fields.filter((field) => field.complete);
  const active = fields.filter((field) => field.answered > 0 && !field.complete);

  console.log(JSON.stringify({
    uid,
    name: profiles?.[uid]?.name || sophia.displayName || "Sophia",
    held: held.map((field) => ({
      id: field.id,
      title: field.title,
      matched: field.matched,
      total: field.total,
      depth: field.depth,
      nextStrandId: field.nextStrandId,
      awaitingModule: field.awaitingModule,
    })),
    completeNotHeld: complete.filter((field) => !field.held).map((field) => ({
      id: field.id,
      title: field.title,
      matched: field.matched,
      need: field.need,
      total: field.total,
    })),
    inProgress: active.map((field) => ({
      id: field.id,
      title: field.title,
      answered: field.answered,
      total: field.total,
    })),
  }, null, 2));
}

main().catch((error) => fail(error.message || "report failed"));
