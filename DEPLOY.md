# Deploying Helbrede Healthcare

The app uses **MySQL** for the database (via `mysql2`) and **Vercel Blob** for
product image uploads on Vercel, because Vercel's servers have a read-only filesystem.

Local development needs a MySQL server reachable at `127.0.0.1:3306` (e.g. Laragon,
XAMPP, or `docker run -p 3306:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=yes mysql`) with a
database named `helbrede`. With no `MYSQL_*` env vars set, the app connects as
`root` with no password — matching most local MySQL installs out of the box.

## 1. Create the local database (one-time)

```sql
CREATE DATABASE helbrede CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. Set environment variables for production

Any MySQL host works (your hosting provider's MySQL, PlanetScale, RDS, etc).
Either set a single connection string, or the discrete parts:

| Name              | Value                                          |
|--------------------|------------------------------------------------|
| `MYSQL_URL`        | `mysql://user:password@host:3306/dbname` (or use the four vars below instead) |
| `MYSQL_HOST`        | e.g. `db.yourhost.com`                         |
| `MYSQL_PORT`        | e.g. `3306`                                    |
| `MYSQL_USER`        | your MySQL username                            |
| `MYSQL_PASSWORD`    | your MySQL password                            |
| `MYSQL_DATABASE`    | e.g. `helbrede`                                 |
| `BLOB_READ_WRITE_TOKEN` | only needed on Vercel — added automatically when you connect a Blob store |

If deployed somewhere with a writable filesystem (a VPS, cPanel/Node hosting, etc.),
`BLOB_READ_WRITE_TOKEN` can be left unset — uploads then fall back to writing into
`public/uploads/`.

### Vercel + Hostinger MySQL

Hostinger's shared/business MySQL can be used from Vercel, with a few things to get right:

1. **Allow remote access.** In hPanel → Databases → Remote MySQL, add host `%` (Any Host).
   Vercel serverless functions don't have a fixed outbound IP, so a specific-IP
   allowlist won't work.
2. **Set env vars on Vercel** (Project Settings → Environment Variables) — the discrete
   `MYSQL_HOST`/`MYSQL_USER`/`MYSQL_PASSWORD`/`MYSQL_DATABASE` vars from the table above,
   using the values from hPanel → Databases → Management (Hostinger db users/names are
   usually prefixed like `u123456789_dbname`).
3. **Keep `MYSQL_CONNECTION_LIMIT` low** (default is `3`). Shared hosting plans cap total
   concurrent MySQL connections (often 20-30), and every warm Vercel function instance
   opens its own pool — a high per-instance limit can exhaust the cap under real traffic.
4. **Enable SSL only if Hostinger requires it** for remote connections — set `MYSQL_SSL=true`,
   and `MYSQL_SSL_REJECT_UNAUTHORIZED=false` if it presents a self-signed certificate.
5. Expect extra latency per query if the Hostinger server's region is far from where
   Vercel runs your functions — there's no connection pooling proxy in front of it.

If this turns out to be too limiting under real traffic (connection errors, slow
queries), a serverless-native MySQL host (e.g. PlanetScale) is a drop-in swap — same
`mysql2` pool code, just point `MYSQL_URL` at it instead.

## 3. Deploy

On the first request, the app **auto-creates the tables and seeds** all products
and the demo accounts against whatever MySQL database it's pointed at — no manual
import needed.

## Demo logins after deploy

- Admin: `admin@helbrede.com` / `admin123`
- Buyers: `chemist@demo.in`, `stockist@demo.in`, `distributor@demo.in`, `doctor@demo.in` — all `demo123`
- Pending (shows verification gate): `pending@demo.in` / `demo123`

## Notes

- Data persists across devices/deploys as long as everything points at the same MySQL database.
- To reset the demo data, drop the tables (or point at a fresh database) and redeploy — it re-seeds automatically.
