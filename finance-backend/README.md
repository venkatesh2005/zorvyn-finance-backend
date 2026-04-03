# Finance Dashboard — Backend API

**Venkatesh M** · venkat42005@gmail.com

Node.js + Express + MongoDB API for a finance dashboard: users with roles, transaction records, summary/analytics endpoints, and JWT auth.

---

## Quick start

You need **Node 18+** and **MongoDB** (local or Atlas).

```bash
cd finance-backend
npm install
copy .env.example .env          # Mac/Linux: cp .env.example .env
```

Edit `.env`: set `MONGODB_URI` and `JWT_SECRET`.

```bash
npm run seed    # optional — demo users + sample records
npm start       # API on http://localhost:5000 (or your PORT)
npm run dev     # same, with nodemon
```

---

## Environment variables

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## What’s in the box

**Stack:** Express 5, Mongoose 9, JWT, express-validator, bcrypt, helmet, cors, rate limit (100 requests / 15 min on `/api`).

**Folders:** `src/routes` → `src/controllers` → `src/models`. Auth helpers live in `src/middleware`. `scripts/api-smoke-test.js` hits the main endpoints (`npm run test:api`). `src/utils/seed.js` loads demo data. `src/utils/queryHelpers.js` keeps record `search`/`sort` safe on the list endpoint.

---

## Roles (what each user can do)

- **Viewer** — Read records (list + detail). Dashboard **summary** only (no trends / category-stats). Cannot create or edit records.
- **Analyst** — Same reads, plus **create** records. Can call **trends** and **category-stats**.
- **Admin** — Full CRUD on records, manage users (`/api/users`), everything analysts can do.

Registering via `POST /api/auth/register` defaults to **viewer**. Only an admin can promote someone to admin or analyst (`PATCH /api/users/:id`).

---

## API (short reference)

Send this header on protected routes:

`Authorization: Bearer <token>`

**Auth**

- `POST /api/auth/register` — name, email, password; optional role (cannot self-pick admin).
- `POST /api/auth/login`
- `GET /api/auth/me`

**Users — admin only**

- `GET /api/users` — optional query: `role`, `status`, `page`, `limit`
- `GET /api/users/:id`
- `PATCH /api/users/:id` — send at least one of: `name`, `role`, `status`
- `DELETE /api/users/:id` — soft delete (not yourself)

**Records — any logged-in user for GET; create/update/delete as per role above**

- `GET /api/records` — filters: `type`, `category`, dates, amounts, `page`, `limit`, `search` (description), `sort` (only: `date`, `-date`, `amount`, `-amount`, `createdAt`, `-createdAt`)
- `GET /api/records/:id`
- `POST /api/records` — analyst + admin
- `PUT /api/records/:id` — admin only; only fields you send are updated
- `DELETE /api/records/:id` — admin only, soft delete

**Dashboard**

- `GET /api/dashboard/summary` — everyone (with a token). Optional `startDate`, `endDate`.
- `GET /api/dashboard/trends` — analyst + admin. Default is **monthly** (`months` 1–24, default 6). For **weekly** buckets use `interval=week` and optional `weeks` (1–52, default 12).
- `GET /api/dashboard/category-stats` — analyst + admin. Optional `type=income` or `expense`.

---

## Errors

Validation issues usually return **422** with a list of `field` / `message` pairs. Other cases: **400** bad input, **401** not logged in, **403** wrong role, **404** missing resource, **409** duplicate email, **429** rate limit, **500** server error. Bodies are JSON with `success: false` and a `message` unless noted above.

---

## Smoke test

With Mongo running and the server started:

```bash
npm run test:api
```

Use another base URL if needed, e.g. `API_TEST_BASE=http://127.0.0.1:5001 npm run test:api`.

---

## Seed logins (after `npm run seed`)

- Admin: `admin@finance.com` / `admin123`
- Analyst: `analyst@finance.com` / `analyst123`
- Viewer: `viewer@finance.com` / `viewer123`

---

## Assumptions I made

Viewers can **see** transactions and the high-level summary, but not the extra chart endpoints—that still satisfies “viewer can’t create or modify.” Analysts can add rows; only admins edit or delete them, so analysts can’t change other people’s entries. One JWT per session, no refresh token. Dates are normal Mongo dates; clients should use ISO strings. Users and records use **soft delete** (`isDeleted`), not hard removal.

---

## Assignment checklist (quick)

Users and roles with active/inactive — yes. Records with amount, type, category, date, description — yes. List filters, pagination, search — yes. Dashboard totals, categories, recent activity, monthly/weekly trends — yes. Middleware-based access control — yes. Validation and sensible status codes — yes. MongoDB persistence — yes. Extras: JWT, rate limit, soft deletes, `npm run test:api`. I did not add a full unit test suite (that was optional).

---

## Note

There’s no OpenAPI file; use this file or Postman/Thunder Client against the routes above. Analytics use Mongo aggregations so we don’t pull the whole collection into Node for every chart.

---

*Zorvyn FinTech — Backend Developer Intern assignment.*
