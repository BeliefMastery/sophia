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
  return message.replace(/-----BEGIN[\s\S]*?-----END[^\s]*/g, "[key]").replace(/\s+/g, " ").slice(0, 180);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function postJson(path, token, payload) {
  return googleJson({
    method: "POST",
    hostname: "identitytoolkit.googleapis.com",
    path,
    token,
    payload,
  });
}

async function pollOperation(name, token) {
  const operationName = String(name || "").replace(/^\//, "");
  if (!operationName) fail("Firebase operation had no name");
  const deadline = Date.now() + 180000;
  let wait = 1000;
  while (Date.now() < deadline) {
    const response = await googleJson({
      method: "GET",
      hostname: "firebase.googleapis.com",
      path: `/v1beta1/${operationName}`,
      token,
    });
    if (response.status !== 200) {
      throw new Error(`Operation poll failed (${response.status}: ${errorText(response.body)})`);
    }
    const operation = JSON.parse(response.body);
    if (operation.error) {
      throw new Error(`Operation failed (${operation.error.status || operation.error.code}: ${errorText(JSON.stringify({ error: operation.error }))})`);
    }
    if (operation.done) return operation.response || {};
    await sleep(wait);
    wait = Math.min(wait * 2, 5000);
  }
  throw new Error("Firebase operation timed out");
}

async function pollServiceOperation(name, token) {
  const operationName = String(name || "").replace(/^\//, "");
  const deadline = Date.now() + 180000;
  let wait = 1000;
  while (Date.now() < deadline) {
    const response = await googleJson({
      method: "GET",
      hostname: "serviceusage.googleapis.com",
      path: `/v1/${operationName}`,
      token,
    });
    if (response.status !== 200) return `poll ${response.status}: ${errorText(response.body)}`;
    const operation = JSON.parse(response.body);
    if (operation.error) return errorText(JSON.stringify({ error: operation.error }));
    if (operation.done) return "";
    await sleep(wait);
    wait = Math.min(wait * 2, 5000);
  }
  return "timed out";
}

async function tryEnableIdentityToolkit(projectId, token) {
  const response = await googleJson({
    method: "POST",
    hostname: "serviceusage.googleapis.com",
    path: `/v1/projects/${projectId}/services:batchEnable`,
    token,
    payload: { serviceIds: ["identitytoolkit.googleapis.com", "securetoken.googleapis.com"] },
  });
  if (response.status !== 200) {
    console.log(`service enable skipped (${response.status}: ${errorText(response.body)})`);
    return false;
  }
  const operation = JSON.parse(response.body);
  if (operation.name && !operation.done) {
    const problem = await pollServiceOperation(operation.name, token);
    if (problem) {
      console.log(`service enable skipped (${problem})`);
      return false;
    }
  }
  console.log("identity toolkit service enabled");
  return true;
}

async function tryPatchEmailProvider(projectId, token) {
  const response = await googleJson({
    method: "PATCH",
    hostname: "identitytoolkit.googleapis.com",
    path: `/admin/v2/projects/${projectId}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired`,
    token,
    payload: { signIn: { email: { enabled: true, passwordRequired: true } } },
  });
  if (response.status === 200) {
    console.log("email sign-in enabled via config");
    return true;
  }
  console.log(`config update skipped (${response.status}: ${errorText(response.body)})`);
  return false;
}

async function ensureWebApp(projectId, token) {
  const listed = await googleJson({
    method: "GET",
    hostname: "firebase.googleapis.com",
    path: `/v1beta1/projects/${projectId}/webApps`,
    token,
  });
  if (listed.status !== 200) fail(`Web app list failed (${listed.status}: ${errorText(listed.body)})`);
  const existing = (JSON.parse(listed.body).apps || []).find((app) => app.appId);
  if (existing) {
    console.log("web app present");
    return existing.appId;
  }

  const created = await googleJson({
    method: "POST",
    hostname: "firebase.googleapis.com",
    path: `/v1beta1/projects/${projectId}/webApps`,
    token,
    payload: { displayName: "Sophia" },
  });
  if (created.status !== 200) fail(`Web app create failed (${created.status}: ${errorText(created.body)})`);
  const operation = JSON.parse(created.body);
  const result = operation.done ? operation.response || {} : await pollOperation(operation.name, token);
  if (!result.appId) fail("Web app create returned no app id");
  console.log("web app created");
  return result.appId;
}

async function enableEmailPassword(projectId, token) {
  const appId = await ensureWebApp(projectId, token);
  await tryEnableIdentityToolkit(projectId, token);
  const response = await googleJson({
    method: "POST",
    hostname: "firebase.googleapis.com",
    path: "/v1alpha/firebase:provisionFirebaseApp",
    token,
    payload: {
      appNamespace: appId,
      parent: `projects/${projectId}`,
      webInput: {},
      firebaseAuthInput: { emailAuthProviderMode: "PROVIDER_ENABLED" },
    },
  });
  if (response.status !== 200) {
    console.log(`provision skipped (${response.status}: ${errorText(response.body)})`);
  } else {
    const operation = JSON.parse(response.body);
    if (operation.error) {
      console.log(`provision skipped (${errorText(JSON.stringify(operation))})`);
    } else if (!operation.done && operation.name) {
      try {
        await pollOperation(operation.name, token);
        console.log("email sign-in enabled");
      } catch (error) {
        console.log(`provision skipped (${error.message})`);
      }
    } else {
      console.log("email sign-in enabled");
    }
  }
  await tryPatchEmailProvider(projectId, token);
  return appId;
}

async function webApiKey(projectId, appId, token) {
  const config = await googleJson({
    method: "GET",
    hostname: "firebase.googleapis.com",
    path: `/v1beta1/projects/${projectId}/webApps/${encodeURIComponent(appId)}/config`,
    token,
  });
  if (config.status !== 200) fail(`Web config read failed (${config.status}: ${errorText(config.body)})`);
  const apiKey = JSON.parse(config.body).apiKey;
  if (!apiKey) fail("Web config had no api key");
  return apiKey;
}

async function clientAccount(projectId, appId, token, email, password) {
  const apiKey = await webApiKey(projectId, appId, token);
  let response = await googleJson({
    method: "POST",
    hostname: "identitytoolkit.googleapis.com",
    path: `/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`,
    payload: { email, password, returnSecureToken: true },
  });
  if (response.status !== 200 && errorText(response.body).includes("EMAIL_EXISTS")) {
    response = await googleJson({
      method: "POST",
      hostname: "identitytoolkit.googleapis.com",
      path: `/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      payload: { email, password, returnSecureToken: true },
    });
  }
  if (response.status !== 200) return { error: `${response.status}: ${errorText(response.body)}` };
  const parsed = JSON.parse(response.body);
  if (!parsed.localId || !parsed.idToken) return { error: "client auth returned no account" };
  const named = await googleJson({
    method: "POST",
    hostname: "identitytoolkit.googleapis.com",
    path: `/v1/accounts:update?key=${encodeURIComponent(apiKey)}`,
    payload: { idToken: parsed.idToken, displayName: "Sophia", returnSecureToken: false },
  });
  if (named.status !== 200) return { error: `display name update failed (${named.status}: ${errorText(named.body)})` };
  return { uid: parsed.localId };
}

async function verifyPassword(projectId, appId, token, email, password, uid) {
  const apiKey = await webApiKey(projectId, appId, token);
  const signedIn = await googleJson({
    method: "POST",
    hostname: "identitytoolkit.googleapis.com",
    path: `/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    payload: { email, password, returnSecureToken: true },
  });
  if (signedIn.status !== 200) fail(`Sign-in check failed (${signedIn.status}: ${errorText(signedIn.body)})`);
  const localId = JSON.parse(signedIn.body).localId;
  if (!localId || localId !== uid) fail("Sign-in check did not match the account");
  console.log(`sign-in verified ${localId}`);
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
  let appId = "";
  if (lookup.status !== 200 && (lookupCode.startsWith("CONFIGURATION_NOT_FOUND") || lookupCode.startsWith("OPERATION_NOT_ALLOWED"))) {
    appId = await enableEmailPassword(projectId, token);
    lookup = await postJson(`${base}/accounts:query`, token, { email: [email] });
  }
  let uid = "";
  if (lookup.status === 200) uid = JSON.parse(lookup.body).userInfo?.[0]?.localId || "";
  if (!uid && lookup.status !== 200) {
    if (!appId) appId = await ensureWebApp(projectId, token);
    const client = await clientAccount(projectId, appId, token, email, password);
    if (client.error) {
      fail(`Account lookup failed (${lookup.status}: ${errorText(lookup.body)}). Client sign-up failed (${client.error})`);
    }
    uid = client.uid;
    console.log(`created ${uid}`);
  } else if (uid) {
    const updated = await postJson(`${base}/accounts:update`, token, {
      localId: uid,
      password,
      displayName: "Sophia",
      disableUser: false,
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
      appId = await enableEmailPassword(projectId, token);
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

  if (!appId) appId = await ensureWebApp(projectId, token);
  await verifyPassword(projectId, appId, token, email, password, uid);
}

main().catch((error) => fail(error.message || "login setup failed"));
