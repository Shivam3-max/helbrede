# Deploying Helbrede Healthcare to Vercel

The app now uses **Turso** (cloud SQLite) for the database and **Vercel Blob** for
product image uploads, because Vercel's servers have a read-only filesystem.

Local development needs **nothing** — with no env vars set it automatically uses a
local SQLite file at `data/helbrede.db`.

For production you set **three environment variables** in Vercel. One-time setup:

## 1. Create the Turso database (free)

Install the CLI and create a DB:

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup                 # opens browser, free account
turso db create helbrede
turso db show helbrede --url      # → copy this = TURSO_DATABASE_URL
turso db tokens create helbrede   # → copy this = TURSO_AUTH_TOKEN
```

(You can also do this from the Turso web dashboard: create a database, then
create a token under the database's settings.)

## 2. Create a Vercel Blob store (free)

In your Vercel project:
**Storage → Create Database → Blob → Connect to this project.**

Vercel automatically adds the `BLOB_READ_WRITE_TOKEN` env var for you — nothing to copy.

## 3. Set environment variables in Vercel

**Project → Settings → Environment Variables** (Production + Preview):

| Name                  | Value                                   |
|-----------------------|-----------------------------------------|
| `TURSO_DATABASE_URL`  | from step 1 (`libsql://helbrede-...`)   |
| `TURSO_AUTH_TOKEN`    | from step 1                             |
| `BLOB_READ_WRITE_TOKEN` | added automatically in step 2         |

## 4. Redeploy

Trigger a new deployment (push a commit, or **Deployments → Redeploy**).

On the first request, the database **auto-seeds** all 355 products and the demo
accounts — no manual import needed.

## Demo logins after deploy

- Admin: `admin@helbrede.com` / `admin123`
- Buyers: `chemist@demo.in`, `stockist@demo.in`, `distributor@demo.in`, `doctor@demo.in` — all `demo123`
- Pending (shows verification gate): `pending@demo.in` / `demo123`

## Notes

- Data now persists across devices and deploys (it lives in Turso, not the local file).
- Product images uploaded from the admin panel are stored in Vercel Blob and served from its CDN.
- To reset the demo data, drop the tables in Turso (or create a fresh Turso DB) and redeploy — it re-seeds automatically.
