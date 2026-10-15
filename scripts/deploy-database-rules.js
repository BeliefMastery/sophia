const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const path = require("path");

const databaseUrl = "https://sophia-138fe-default-rtdb.asia-southeast1.firebasedatabase.app";
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
  if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
    fail("Firebase service account JSON is missing client_email, private_key, or project_id");
  }
  if (parsed.project_id !== expectedProject) {
    fail(`Firebase project_id is ${parsed.project_id}, expected ${expectedProject}`);
  }
  return parsed;
}

function accessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: [
      "https://www.googleapis.com/auth/firebase.database",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");
  const payload = `${header}.${claim}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(payload), serviceAccount.private_key).toString("base64url");
  const assertion = `${payload}.${signature}`;
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
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

async function main() {
  const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  console.log(`using ${serviceAccount.client_email}`);
  const token = await accessToken(serviceAccount);
  const rules = fs.readFileSync(path.join(__dirname, "..", "database.rules.json"), "utf8");
  JSON.parse(rules);
  const response = await request({
    method: "PUT",
    hostname: "sophia-138fe-default-rtdb.asia-southeast1.firebasedatabase.app",
    path: "/.settings/rules.json",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "content-length": Buffer.byteLength(rules),
    },
    body: rules,
  });
  if (response.status !== 200) {
    let detail = "";
    try {
      detail = JSON.parse(response.body).error || "";
    } catch {
      detail = "";
    }
    fail(`rules deploy failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  const check = await request({
    method: "GET",
    hostname: "sophia-138fe-default-rtdb.asia-southeast1.firebasedatabase.app",
    path: "/.settings/rules.json",
    headers: { authorization: `Bearer ${token}` },
  });
  if (check.status !== 200) fail(`rules read-back failed with HTTP ${check.status}`);
  const deployed = JSON.parse(check.body);
  const names = Object.keys(deployed.rules || {});
  console.log(`rules now: ${names.join(", ")}`);
  const expected = ["roles", "profiles", "strands", "items", "guides", "sources", "attempts", "reviews", "mastery"];
  const missing = expected.filter((name) => !names.includes(name));
  if (missing.length) fail(`rules are missing ${missing.join(", ")}`);
}

main().catch((error) => fail(error.message || "rules deploy failed"));
