const crypto = require("crypto");
const http = require("http");
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

function request({ method, hostname, port, path, headers, body, protocol }) {
  const transport = protocol === "http" ? http : https;
  return new Promise((resolve, reject) => {
    const req = transport.request({ method, hostname, port, path, headers }, (res) => {
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
    scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
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

function databaseWrites(strand, items, publicItem, guideRecord, moduleStrands, moduleItems, interestCatalog, treeCatalog) {
  const writes = [[`/strands/placement-check`, strand]];
  for (const item of items) {
    writes.push([`/items/${item.id}`, publicItem(item)]);
    writes.push([`/guides/${item.id}`, guideRecord(item)]);
  }
  for (const moduleStrand of moduleStrands) {
    const { id, ...record } = moduleStrand;
    writes.push([`/strands/${id}`, record]);
  }
  for (const item of moduleItems) {
    writes.push([`/items/${item.id}`, publicItem(item)]);
    writes.push([`/guides/${item.id}`, guideRecord(item)]);
  }
  writes.push(["/catalog/interests", interestCatalog]);
  writes.push(["/catalog/tree", treeCatalog]);
  return writes;
}

async function putProduction(token, dbPath, value) {
  const body = JSON.stringify(value);
  const response = await request({
    method: "PUT",
    hostname: databaseHost,
    path: `${dbPath}.json`,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
    },
    body,
  });
  if (response.status !== 200) fail(`Write failed with HTTP ${response.status}`);
}

async function putEmulator(dbPath, value) {
  const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
  const [hostname, portText] = host.split(":");
  const project = `${process.env.GCLOUD_PROJECT || "demo-sophia"}-default-rtdb`;
  const body = JSON.stringify(value);
  const response = await request({
    method: "PUT",
    protocol: "http",
    hostname,
    port: Number(portText),
    path: `${dbPath}.json?ns=${encodeURIComponent(project)}`,
    headers: {
      authorization: "Bearer owner",
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
    },
    body,
  });
  if (response.status !== 200) fail(`Emulator write failed with HTTP ${response.status}`);
}

async function main() {
  const { strand, items } = await import("../content/placement-check.mjs");
  const { strands: firstStrands, items: firstItems } = await import("../content/modules.mjs");
  const { strands: secondStrands, items: secondItems } = await import("../content/modules-part2.mjs");
  const { options, interestsCatalogRecord } = await import("../content/interest-tree.mjs");
  const { nodes, treeCatalogRecord } = await import("../content/knowledge-tree.mjs");
  const moduleStrands = [...firstStrands, ...secondStrands];
  const moduleItems = [...firstItems, ...secondItems];
  const { checkContent } = await import("../lib/checkContent.mjs");
  const { checkModules } = await import("../lib/checkModules.mjs");
  const { checkInterestTree } = await import("../lib/checkInterestTree.mjs");
  const { checkKnowledgeTree } = await import("../lib/checkKnowledgeTree.mjs");
  const { publicItem, guideRecord } = await import("../lib/records.mjs");
  const errors = checkContent(strand, items)
    .concat(checkModules(moduleStrands, moduleItems, items))
    .concat(checkInterestTree(options))
    .concat(checkKnowledgeTree(nodes));
  if (errors.length) fail(errors.join("; "));
  const interestCatalog = interestsCatalogRecord(options);
  const treeCatalog = treeCatalogRecord(nodes);
  const writes = databaseWrites(
    strand,
    items,
    publicItem,
    guideRecord,
    moduleStrands,
    moduleItems,
    interestCatalog,
    treeCatalog,
  );
  if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
    for (const [dbPath, value] of writes) await putEmulator(dbPath, value);
  } else {
    const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    const token = await accessToken(serviceAccount);
    for (const [dbPath, value] of writes) await putProduction(token, dbPath, value);
  }
  console.log(`placement check seeded: ${items.length} questions; modules seeded: ${moduleItems.length}; interests seeded: ${options.length}; tree nodes: ${nodes.length}`);
}

main().catch((error) => fail(error.message || "placement seed failed"));
