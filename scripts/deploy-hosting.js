const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const path = require("path");
const { spawnSync } = require("child_process");

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
      "https://www.googleapis.com/auth/firebase",
      "https://www.googleapis.com/auth/cloud-platform",
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

function request({ method, hostname, path: requestPath, headers, body }) {
  return new Promise((resolve, reject) => {
    const req = https.request({ method, hostname, path: requestPath, headers }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({
        status: res.statusCode,
        body: Buffer.concat(chunks),
      }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function gzipBody(file) {
  return new Promise((resolve, reject) => {
    const zlib = require("zlib");
    zlib.gzip(fs.readFileSync(file), { level: 9 }, (error, compressed) => {
      if (error) reject(error);
      else resolve(compressed);
    });
  });
}

function shortError(body) {
  return body.toString("utf8").replace(/[A-Za-z0-9_-]{20,}/g, "[redacted]").slice(0, 180);
}

async function main() {
  const dist = path.join(__dirname, "..", "dist");
  const indexFile = path.join(dist, "index.html");
  if (!fs.existsSync(indexFile)) fail("dist/index.html is missing. Run npm run build first.");

  const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const token = await accessToken(serviceAccount);
  const site = expectedProject;
  const files = walk(dist);
  const hashes = {};
  const byHash = new Map();

  for (const file of files) {
    const relative = `/${path.relative(dist, file).split(path.sep).join("/")}`;
    const compressed = await gzipBody(file);
    const hash = crypto.createHash("sha256").update(compressed).digest("hex");
    hashes[relative] = hash;
    byHash.set(hash, compressed);
  }

  const created = await request({
    method: "POST",
    hostname: "firebasehosting.googleapis.com",
    path: `/v1beta1/sites/${site}/versions`,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      config: {
        rewrites: [{ glob: "**", path: "/index.html" }],
      },
    }),
  });
    if (created.status !== 200) {
    fail(`Hosting version create failed with HTTP ${created.status}: ${shortError(created.body)}`);
  }
  const versionName = JSON.parse(created.body.toString("utf8")).name;
  if (!versionName) fail("Hosting version create returned no name");

  const populate = await request({
    method: "POST",
    hostname: "firebasehosting.googleapis.com",
    path: `/v1beta1/${versionName}:populateFiles`,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ files: hashes }),
  });
  if (populate.status !== 200) {
    fail(`Hosting file populate failed with HTTP ${populate.status}: ${shortError(populate.body)}`);
  }
  const uploadUrl = JSON.parse(populate.body.toString("utf8")).uploadUrl;
  const required = JSON.parse(populate.body.toString("utf8")).uploadRequiredHashes || [];

  for (const hash of required) {
    const compressed = byHash.get(hash);
    if (!compressed) fail("Hosting asked for a file hash that was not in dist");
    const endpoint = new URL(uploadUrl);
    endpoint.pathname = `${endpoint.pathname.replace(/\/$/, "")}/${hash}`;
    const upload = await request({
      method: "POST",
      hostname: endpoint.hostname,
      path: `${endpoint.pathname}${endpoint.search}`,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/octet-stream",
        "content-length": compressed.length,
      },
      body: compressed,
    });
    if (upload.status !== 200) fail(`Hosting upload failed with HTTP ${upload.status}: ${shortError(upload.body)}`);
  }

  const finalized = await request({
    method: "PATCH",
    hostname: "firebasehosting.googleapis.com",
    path: `/v1beta1/${versionName}?updateMask=status`,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ status: "FINALIZED" }),
  });
  if (finalized.status !== 200) {
    fail(`Hosting finalize failed with HTTP ${finalized.status}: ${shortError(finalized.body)}`);
  }

  const release = await request({
    method: "POST",
    hostname: "firebasehosting.googleapis.com",
    path: `/v1beta1/sites/${site}/channels/live/releases?versionName=${encodeURIComponent(versionName)}`,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: "{}",
  });
  if (release.status !== 200) {
    fail(`Hosting release failed with HTTP ${release.status}: ${shortError(release.body)}`);
  }

  console.log(`site deployed: https://${site}.web.app (${files.length} files)`);
}

main().catch((error) => fail(error.message || "Hosting deploy failed"));
