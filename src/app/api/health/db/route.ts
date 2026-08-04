import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

/**
 * Temporary production diagnostic — reports whether the MySQL env vars are
 * set and whether a live connection actually succeeds, without leaking
 * secret values. Delete this route once the deployment is confirmed working.
 */
export async function GET() {
  const envPresent = {
    MYSQL_URL: !!process.env.MYSQL_URL,
    MYSQL_HOST: !!process.env.MYSQL_HOST,
    MYSQL_PORT: !!process.env.MYSQL_PORT,
    MYSQL_USER: !!process.env.MYSQL_USER,
    MYSQL_PASSWORD: !!process.env.MYSQL_PASSWORD,
    MYSQL_DATABASE: !!process.env.MYSQL_DATABASE,
  };
  const resolvedHost = process.env.MYSQL_HOST ?? "127.0.0.1";
  const resolvedPort = Number(process.env.MYSQL_PORT ?? 3306);

  try {
    const conn = process.env.MYSQL_URL
      ? await mysql.createConnection({ uri: process.env.MYSQL_URL, connectTimeout: 8000 })
      : await mysql.createConnection({
          host: resolvedHost,
          port: resolvedPort,
          user: process.env.MYSQL_USER ?? "root",
          password: process.env.MYSQL_PASSWORD ?? "",
          database: process.env.MYSQL_DATABASE ?? "helbrede",
          connectTimeout: 8000,
        });
    await conn.query("SELECT 1");
    await conn.end();
    return NextResponse.json({ ok: true, envPresent, resolvedHost, resolvedPort });
  } catch (e) {
    const err = e as { code?: string; errno?: number; sqlMessage?: string; message?: string };
    return NextResponse.json(
      {
        ok: false,
        envPresent,
        resolvedHost,
        resolvedPort,
        error: { code: err.code, errno: err.errno, message: err.sqlMessage || err.message },
      },
      { status: 500 }
    );
  }
}
