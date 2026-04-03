/**
 * HTTP smoke tests for all public and protected routes.
 * Requires: MongoDB, server running (e.g. npm start).
 * Usage: node scripts/api-smoke-test.js
 * Optional: API_TEST_BASE=http://127.0.0.1:5001 node scripts/api-smoke-test.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const BASE = process.env.API_TEST_BASE || `http://127.0.0.1:${process.env.PORT || 5000}`;

let passed = 0;
let failed = 0;

function fail(name, detail) {
  failed += 1;
  console.error(`FAIL  ${name}`);
  if (detail != null) console.error(`       ${detail}`);
}

function pass(name) {
  passed += 1;
  console.log(`OK    ${name}`);
}

async function api(method, path, opts = {}) {
  const url = `${BASE}${path}`;
  const headers = { ...opts.headers };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { status: res.status, json };
}

function expect(name, cond, detail) {
  if (cond) pass(name);
  else fail(name, detail);
}

async function login(email, password) {
  const { status, json } = await api("POST", "/api/auth/login", {
    body: { email, password },
  });
  if (status !== 200 || !json?.data?.token) {
    throw new Error(`Login failed for ${email}: ${status} ${JSON.stringify(json)}`);
  }
  return json.data.token;
}

async function main() {
  console.log(`API smoke test → ${BASE}\n`);

  // --- Health ---
  {
    const { status, json } = await api("GET", "/");
    expect("GET /", status === 200 && json?.success === true && json?.message?.includes("Finance"), JSON.stringify(json));
  }

  // --- Auth ---
  let adminToken;
  let analystToken;
  let viewerToken;
  try {
    adminToken = await login("admin@finance.com", "admin123");
    pass("POST /api/auth/login (admin)");
  } catch (e) {
    fail("POST /api/auth/login (admin)", e.message);
    console.error("\nEnsure DB is seeded: npm run seed\n");
    process.exit(1);
  }

  try {
    analystToken = await login("analyst@finance.com", "analyst123");
    pass("POST /api/auth/login (analyst)");
  } catch (e) {
    fail("POST /api/auth/login (analyst)", e.message);
  }

  try {
    viewerToken = await login("viewer@finance.com", "viewer123");
    pass("POST /api/auth/login (viewer)");
  } catch (e) {
    fail("POST /api/auth/login (viewer)", e.message);
  }

  let adminUserId;
  {
    const { status, json } = await api("GET", "/api/auth/me", { token: adminToken });
    adminUserId = json?.data?.user?._id || json?.data?.user?.id;
    expect("GET /api/auth/me", status === 200 && json?.data?.user?.email, JSON.stringify(json));
  }

  if (adminUserId) {
    const { status, json } = await api("DELETE", `/api/users/${adminUserId}`, { token: adminToken });
    expect("DELETE /api/users/:id (self → 400)", status === 400, JSON.stringify(json));
  }

  {
    const email = `smoke_${Date.now()}@example.com`;
    const { status, json } = await api("POST", "/api/auth/register", {
      body: { name: "Smoke User", email, password: "smokepass1" },
    });
    expect(
      "POST /api/auth/register",
      status === 201 && json?.success && json?.data?.token,
      `${status} ${JSON.stringify(json)}`
    );
  }

  {
    const { status } = await api("GET", "/api/records");
    expect("GET /api/records (no token)", status === 401, `expected 401, got ${status}`);
  }

  // --- Users (admin) ---
  let anyUserId;
  let viewerUserId;
  {
    const { status, json } = await api("GET", "/api/users?limit=20", { token: adminToken });
    const users = json?.data?.users || [];
    const ok = status === 200 && Array.isArray(users);
    anyUserId = users[0]?._id || users[0]?.id;
    const viewer = users.find((u) => u.role === "viewer");
    viewerUserId = viewer?._id || viewer?.id;
    expect("GET /api/users (admin)", ok && anyUserId, JSON.stringify(json));
  }

  if (anyUserId) {
    const { status, json } = await api("GET", `/api/users/${anyUserId}`, { token: adminToken });
    expect("GET /api/users/:id (admin)", status === 200 && json?.data?.user, JSON.stringify(json));
  }

  if (viewerUserId) {
    const { status, json } = await api("PATCH", `/api/users/${viewerUserId}`, {
      token: adminToken,
      body: { name: "Viewer User" },
    });
    expect("PATCH /api/users/:id (admin, viewer)", status === 200 && json?.success, JSON.stringify(json));
  } else {
    fail("PATCH /api/users/:id (admin)", "no viewer user in list to patch safely");
  }

  {
    const { status } = await api("GET", "/api/users", { token: viewerToken });
    expect("GET /api/users (viewer → 403)", status === 403, `expected 403, got ${status}`);
  }

  // --- Records ---
  let recordId;
  {
    const { status, json } = await api("GET", "/api/records?limit=2&sort=-date&search=a", { token: viewerToken });
    recordId = json?.data?.records?.[0]?._id || json?.data?.records?.[0]?.id;
    expect("GET /api/records (viewer)", status === 200 && json?.data?.pagination, JSON.stringify(json));
  }

  if (recordId) {
    const { status, json } = await api("GET", `/api/records/${recordId}`, { token: viewerToken });
    expect("GET /api/records/:id", status === 200 && json?.data?.record, JSON.stringify(json));
  }

  let createdId;
  {
    const { status, json } = await api("POST", "/api/records", {
      token: analystToken,
      body: {
        amount: 9.99,
        type: "expense",
        category: "food",
        description: "API smoke test",
      },
    });
    createdId = json?.data?.record?._id || json?.data?.record?.id;
    expect("POST /api/records (analyst)", status === 201 && createdId, `${status} ${JSON.stringify(json)}`);
  }

  {
    const { status } = await api("POST", "/api/records", {
      token: viewerToken,
      body: { amount: 1, type: "income", category: "salary" },
    });
    expect("POST /api/records (viewer → 403)", status === 403, `expected 403, got ${status}`);
  }

  if (createdId) {
    const { status, json } = await api("PUT", `/api/records/${createdId}`, {
      token: adminToken,
      body: { amount: 10.5, description: "updated by smoke test" },
    });
    expect("PUT /api/records/:id (admin)", status === 200 && json?.success, JSON.stringify(json));
  }

  if (createdId) {
    const { status, json } = await api("DELETE", `/api/records/${createdId}`, { token: adminToken });
    expect("DELETE /api/records/:id (admin)", status === 200 && json?.success, JSON.stringify(json));
  }

  // --- Dashboard ---
  {
    const { status, json } = await api("GET", "/api/dashboard/summary", { token: viewerToken });
    expect("GET /api/dashboard/summary (viewer)", status === 200 && json?.data, JSON.stringify(json));
  }

  {
    const { status, json } = await api("GET", "/api/dashboard/trends?months=3", { token: analystToken });
    expect(
      "GET /api/dashboard/trends (analyst)",
      status === 200 && Array.isArray(json?.data?.trends),
      JSON.stringify(json)
    );

  }

  {
    const { status } = await api("GET", "/api/dashboard/trends", { token: viewerToken });
    expect("GET /api/dashboard/trends (viewer → 403)", status === 403, `expected 403, got ${status}`);
  }

  {
    const { status, json } = await api("GET", "/api/dashboard/category-stats?type=expense", {
      token: adminToken,
    });
    expect("GET /api/dashboard/category-stats (admin)", status === 200 && json?.data, JSON.stringify(json));
  }

  {
    const { status } = await api("GET", "/api/dashboard/category-stats", { token: viewerToken });
    expect("GET /api/dashboard/category-stats (viewer → 403)", status === 403, `expected 403, got ${status}`);
  }

  console.log(`\n── ${passed} passed, ${failed} failed ──`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  if (err.cause?.code === "ECONNREFUSED" || err.code === "ECONNREFUSED") {
    console.error(`Cannot connect to ${BASE}. Start the server: npm start`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
