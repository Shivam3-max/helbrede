import mysql, { Pool } from "mysql2/promise";
import crypto from "crypto";
import rawProducts from "@/data/products.json";
import { enrichRaw, groupOf } from "./enrich";
import { sampleImageForGroup } from "./product-images";
import { Order, Product, RawProduct, Role, User, UserStatus } from "./types";

/**
 * Data layer backed by MySQL (via mysql2).
 *  - Local dev: connects to 127.0.0.1:3306 (Laragon or any local MySQL) by default.
 *  - Production: set MYSQL_HOST/MYSQL_PORT/MYSQL_USER/MYSQL_PASSWORD/MYSQL_DATABASE
 *    (or a single MYSQL_URL connection string) to point at the hosting provider's MySQL.
 * Same async API either way.
 */

declare global {
  // eslint-disable-next-line no-var
  var __helbredePool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __helbredeInit: Promise<void> | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlArg = any;
interface Query {
  sql: string;
  args?: SqlArg[];
}
interface ExecResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[];
}

// Remote hosts (Hostinger, etc.) are typically capped at a low concurrent-connection
// count on shared plans. Vercel runs each warm serverless instance with its own pool,
// so keep the per-instance limit small — override with MYSQL_CONNECTION_LIMIT if needed.
const CONNECTION_LIMIT = Number(process.env.MYSQL_CONNECTION_LIMIT ?? 3);

// Some remote MySQL providers require/prefer SSL for external connections.
// Set MYSQL_SSL=true to enable it; MYSQL_SSL_REJECT_UNAUTHORIZED=false to accept
// a provider's self-signed cert (common on shared hosting) instead of a CA-signed one.
function sslConfig(): mysql.PoolOptions["ssl"] {
  if (process.env.MYSQL_SSL !== "true") return undefined;
  return { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== "false" };
}

function makePool(): Pool {
  const url = process.env.MYSQL_URL;
  if (url) {
    return mysql.createPool({
      uri: url,
      waitForConnections: true,
      connectionLimit: CONNECTION_LIMIT,
      connectTimeout: 10_000,
      dateStrings: true,
      ssl: sslConfig(),
    });
  }

  return mysql.createPool({
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE ?? "helbrede",
    waitForConnections: true,
    connectionLimit: CONNECTION_LIMIT,
    connectTimeout: 10_000,
    dateStrings: true,
    ssl: sslConfig(),
  });
}

function pool(): Pool {
  if (!global.__helbredePool) global.__helbredePool = makePool();
  return global.__helbredePool;
}

async function execute(query: string | Query): Promise<ExecResult> {
  const sql = typeof query === "string" ? query : query.sql;
  const args = typeof query === "string" ? [] : (query.args ?? []);
  const [rows] = await pool().query(sql, args);
  return { rows: rows as ExecResult["rows"] };
}

/** Runs statements sequentially inside one transaction. */
async function batch(stmts: Query[]): Promise<void> {
  const conn = await pool().getConnection();
  try {
    await conn.beginTransaction();
    for (const s of stmts) await conn.query(s.sql, s.args ?? []);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/* ---------- schema + seed (idempotent, run once per instance) ---------- */

async function doInit(): Promise<void> {
  await batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(191) PRIMARY KEY, sno INT NOT NULL, name VARCHAR(255) NOT NULL,
        composition VARCHAR(600) NOT NULL DEFAULT '', packing VARCHAR(50) NOT NULL DEFAULT '',
        mrp DOUBLE NOT NULL, category VARCHAR(100) NOT NULL DEFAULT 'Other', grp VARCHAR(100) NOT NULL DEFAULT 'Other',
        isRx TINYINT(1) NOT NULL DEFAULT 0, schemeBuy INT, schemeFree INT,
        movement VARCHAR(20) NOT NULL DEFAULT 'steady', stock INT NOT NULL DEFAULT 1000, image VARCHAR(500),
        priceDistributor DOUBLE, priceStockist DOUBLE, priceChemist DOUBLE, priceDoctor DOUBLE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(191) PRIMARY KEY, name VARCHAR(255) NOT NULL, password VARCHAR(255) NOT NULL,
        phone VARCHAR(30) NOT NULL DEFAULT '', role VARCHAR(20) NOT NULL, firmName VARCHAR(255), drugLicense VARCHAR(100),
        gstNumber VARCHAR(50), medicalRegNo VARCHAR(100), city VARCHAR(100), state VARCHAR(100),
        turnoverBand VARCHAR(20), businessType VARCHAR(20), degreeUrl VARCHAR(500),
        status VARCHAR(20) NOT NULL DEFAULT 'pending', isAdmin TINYINT(1) NOT NULL DEFAULT 0, createdAt VARCHAR(40) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY, userEmail VARCHAR(191) NOT NULL, userName VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL,
        city VARCHAR(100), placedAt VARCHAR(40) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'Placed', \`lines\` TEXT NOT NULL,
        subtotal DOUBLE NOT NULL, gst DOUBLE NOT NULL, total DOUBLE NOT NULL, savingsVsMrp DOUBLE NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(191) PRIMARY KEY, email VARCHAR(191) NOT NULL, createdAt VARCHAR(40) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(50) PRIMARY KEY, kind VARCHAR(20) NOT NULL, name VARCHAR(255) NOT NULL, phone VARCHAR(30),
        city VARCHAR(100), goal VARCHAR(255), budget DOUBLE, note TEXT, createdAt VARCHAR(40) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    },
  ]);

  // migrate: add columns for existing DBs created before turnover-based registration
  for (const col of ["turnoverBand VARCHAR(20)", "businessType VARCHAR(20)", "degreeUrl VARCHAR(500)"]) {
    try {
      await execute(`ALTER TABLE users ADD COLUMN ${col}`);
    } catch {
      /* column already exists */
    }
  }

  // seed products once
  const pc = await execute("SELECT COUNT(*) AS n FROM products");
  if (Number(pc.rows[0].n) === 0) {
    const stmts = (rawProducts as RawProduct[])
      .map(enrichRaw)
      .filter((e) => e.mrp > 0 || (e.priceDistributor ?? 0) > 0)
      .map((e) => ({
        sql: `INSERT IGNORE INTO products
          (id, sno, name, composition, packing, mrp, category, grp, isRx, schemeBuy, schemeFree, movement, stock, image, priceDistributor, priceStockist, priceChemist, priceDoctor)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          e.id, e.sno, e.name, e.composition, e.packing, e.mrp, e.category, e.grp,
          e.isRx, e.schemeBuy, e.schemeFree, e.movement, e.stock, e.image,
          e.priceDistributor, e.priceStockist, e.priceChemist, e.priceDoctor,
        ] as SqlArg[],
      }));
    for (let i = 0; i < stmts.length; i += 100) {
      await batch(stmts.slice(i, i + 100));
    }
  }

  // seed demo users once
  const uc = await execute("SELECT COUNT(*) AS n FROM users");
  if (Number(uc.rows[0].n) === 0) {
    const seed = [
      ["admin@helbrede.com", "Admin", "admin123", "9000000000", "distributor", null, null, null, null, "Panchkula", "Haryana", "active", 1, "2026-01-01T00:00:00.000Z"],
      ["distributor@demo.in", "Verma Pharma Distributors", "demo123", "9811111111", "distributor", "Verma Pharma Distributors", "PB-20B-114455", "03AAACV1234F1Z5", null, "Ludhiana", "Punjab", "active", 0, "2026-02-11T00:00:00.000Z"],
      ["stockist@demo.in", "Aggarwal Medicine Stockist", "demo123", "9822222222", "stockist", "Aggarwal Medicine Co.", "HR-20B-778899", "06AABCA9876K1Z2", null, "Panchkula", "Haryana", "active", 0, "2026-03-05T00:00:00.000Z"],
      ["chemist@demo.in", "Sharma Medicos", "demo123", "9833333333", "chemist", "Sharma Medicos", "CH-21B-334455", "04AAHCS4321M1Z9", null, "Chandigarh", "Chandigarh", "active", 0, "2026-03-20T00:00:00.000Z"],
      ["doctor@demo.in", "Dr. Neha Kapoor", "demo123", "9844444444", "doctor", null, null, null, "PMC-56789", "Mohali", "Punjab", "active", 0, "2026-04-02T00:00:00.000Z"],
      ["pending@demo.in", "Gupta Pharma Agency", "demo123", "9855555555", "stockist", "Gupta Pharma Agency", "DL-20B-990011", "07AAKCG5678P1Z3", null, "Delhi", "Delhi", "pending", 0, "2026-07-01T00:00:00.000Z"],
    ];
    await batch(
      seed.map((s) => ({
        sql: `INSERT IGNORE INTO users
          (email, name, password, phone, role, firmName, drugLicense, gstNumber, medicalRegNo, city, state, status, isAdmin, createdAt)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: s as SqlArg[],
      }))
    );
  }
}

async function ready(): Promise<void> {
  if (!global.__helbredeInit) global.__helbredeInit = doInit();
  await global.__helbredeInit;
}

/* ---------- row mapping ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(r: any): Product {
  const group = r.grp;
  return {
    id: r.id,
    sno: Number(r.sno),
    name: r.name,
    composition: r.composition,
    packing: r.packing,
    mrp: Number(r.mrp),
    category: r.category,
    group,
    isRx: !!Number(r.isRx),
    scheme: r.schemeBuy && r.schemeFree ? { buy: Number(r.schemeBuy), free: Number(r.schemeFree) } : null,
    movement: r.movement,
    stock: Number(r.stock),
    image: r.image ?? sampleImageForGroup(group),
    prices: {
      distributor: r.priceDistributor != null ? Number(r.priceDistributor) : null,
      stockist: r.priceStockist != null ? Number(r.priceStockist) : null,
      chemist: r.priceChemist != null ? Number(r.priceChemist) : null,
      doctor: r.priceDoctor != null ? Number(r.priceDoctor) : null,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUser(r: any): User {
  return {
    email: r.email,
    name: r.name,
    password: r.password,
    phone: r.phone ?? "",
    role: r.role,
    firmName: r.firmName ?? undefined,
    drugLicense: r.drugLicense ?? undefined,
    gstNumber: r.gstNumber ?? undefined,
    medicalRegNo: r.medicalRegNo ?? undefined,
    city: r.city ?? undefined,
    state: r.state ?? undefined,
    turnoverBand: r.turnoverBand ?? undefined,
    businessType: r.businessType ?? undefined,
    degreeUrl: r.degreeUrl ?? undefined,
    status: r.status,
    isAdmin: !!Number(r.isAdmin),
    createdAt: r.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOrder(r: any): Order {
  return {
    id: r.id,
    userEmail: r.userEmail,
    userName: r.userName,
    role: r.role,
    city: r.city ?? null,
    placedAt: r.placedAt,
    status: r.status,
    lines: JSON.parse(r.lines),
    subtotal: Number(r.subtotal),
    gst: Number(r.gst),
    total: Number(r.total),
    savingsVsMrp: Number(r.savingsVsMrp),
  };
}

/* ---------- products ---------- */

/**
 * Read-only fallback to the bundled catalog (src/data/products.json), built once.
 * Lets the public homepage / catalog / product pages render even when the database
 * is unreachable — e.g. deployed without MySQL env vars on a read-only host.
 * Writes (auth, orders, admin edits) still require a real database.
 */
let fallbackCache: Product[] | null = null;
function fallbackProducts(): Product[] {
  if (!fallbackCache) {
    fallbackCache = (rawProducts as RawProduct[])
      .map(enrichRaw)
      .filter((e) => e.mrp > 0 || (e.priceDistributor ?? 0) > 0)
      .map(rowToProduct)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return fallbackCache;
}

export async function listProducts(): Promise<Product[]> {
  try {
    await ready();
    const res = await execute("SELECT * FROM products ORDER BY name");
    return res.rows.map(rowToProduct);
  } catch (e) {
    console.error("[db] listProducts: database unavailable, serving bundled catalog.", e);
    return fallbackProducts();
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    await ready();
    const res = await execute({ sql: "SELECT * FROM products WHERE id = ?", args: [id] });
    return res.rows[0] ? rowToProduct(res.rows[0]) : null;
  } catch (e) {
    console.error("[db] getProduct: database unavailable, serving bundled catalog.", e);
    return fallbackProducts().find((p) => p.id === id) ?? null;
  }
}

export interface ProductInput {
  name: string;
  composition: string;
  packing: string;
  mrp: number;
  category: string;
  isRx: boolean;
  schemeBuy: number | null;
  schemeFree: number | null;
  stock: number;
  priceDistributor: number | null;
  priceStockist: number | null;
  priceChemist: number | null;
  priceDoctor: number | null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  await ready();
  const maxRes = await execute("SELECT MAX(sno) AS m FROM products");
  const sno = Number(maxRes.rows[0].m ?? 0) + 1;
  const id =
    `${input.name}-${input.packing}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + `-${sno}`;
  await execute({
    sql: `INSERT INTO products (id, sno, name, composition, packing, mrp, category, grp, isRx, schemeBuy, schemeFree, movement, stock, image, priceDistributor, priceStockist, priceChemist, priceDoctor)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'steady', ?, NULL, ?, ?, ?, ?)`,
    args: [
      id, sno, input.name, input.composition, input.packing, input.mrp,
      input.category, groupOf(input.category), input.isRx ? 1 : 0,
      input.schemeBuy, input.schemeFree, input.stock,
      input.priceDistributor, input.priceStockist, input.priceChemist, input.priceDoctor,
    ],
  });
  return (await getProduct(id))!;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product | null> {
  await ready();
  await execute({
    sql: `UPDATE products SET name=?, composition=?, packing=?, mrp=?, category=?, grp=?, isRx=?, schemeBuy=?, schemeFree=?, stock=?,
            priceDistributor=?, priceStockist=?, priceChemist=?, priceDoctor=? WHERE id=?`,
    args: [
      input.name, input.composition, input.packing, input.mrp, input.category,
      groupOf(input.category), input.isRx ? 1 : 0, input.schemeBuy, input.schemeFree, input.stock,
      input.priceDistributor, input.priceStockist, input.priceChemist, input.priceDoctor, id,
    ],
  });
  return getProduct(id);
}

export async function setProductImage(id: string, image: string | null): Promise<void> {
  await ready();
  await execute({ sql: "UPDATE products SET image=? WHERE id=?", args: [image, id] });
}

export async function deleteProduct(id: string): Promise<void> {
  await ready();
  await execute({ sql: "DELETE FROM products WHERE id=?", args: [id] });
}

/* ---------- users & sessions ---------- */

export async function getUser(email: string): Promise<User | null> {
  await ready();
  const res = await execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email.toLowerCase()] });
  return res.rows[0] ? rowToUser(res.rows[0]) : null;
}

export async function listUsers(): Promise<User[]> {
  await ready();
  const res = await execute("SELECT * FROM users ORDER BY createdAt DESC");
  return res.rows.map(rowToUser);
}

export interface UserInput {
  email: string;
  name: string;
  password: string;
  phone: string;
  role: Role;
  firmName?: string | null;
  drugLicense?: string | null;
  gstNumber?: string | null;
  medicalRegNo?: string | null;
  city?: string | null;
  state?: string | null;
  turnoverBand?: string | null;
  businessType?: string | null;
  status: UserStatus;
  isAdmin?: boolean;
}

export async function createUser(input: UserInput): Promise<User> {
  await ready();
  await execute({
    sql: `INSERT INTO users (email, name, password, phone, role, firmName, drugLicense, gstNumber, medicalRegNo, city, state, turnoverBand, businessType, status, isAdmin, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      input.email.toLowerCase(), input.name, input.password, input.phone, input.role,
      input.firmName ?? null, input.drugLicense ?? null, input.gstNumber ?? null,
      input.medicalRegNo ?? null, input.city ?? null, input.state ?? null,
      input.turnoverBand ?? null, input.businessType ?? null,
      input.status, input.isAdmin ? 1 : 0, new Date().toISOString(),
    ],
  });
  return (await getUser(input.email))!;
}

export async function setUserStatus(email: string, status: UserStatus): Promise<void> {
  await ready();
  await execute({ sql: "UPDATE users SET status=? WHERE email=?", args: [status, email.toLowerCase()] });
}

export async function setUserDegree(email: string, degreeUrl: string | null): Promise<void> {
  await ready();
  await execute({ sql: "UPDATE users SET degreeUrl=? WHERE email=?", args: [degreeUrl, email.toLowerCase()] });
}

export async function deleteUser(email: string): Promise<void> {
  await ready();
  await execute({ sql: "DELETE FROM sessions WHERE email=?", args: [email.toLowerCase()] });
  await execute({ sql: "DELETE FROM users WHERE email=?", args: [email.toLowerCase()] });
}

export async function createSession(email: string): Promise<string> {
  await ready();
  const token = crypto.randomBytes(24).toString("hex");
  await execute({
    sql: "INSERT INTO sessions (token, email, createdAt) VALUES (?, ?, ?)",
    args: [token, email.toLowerCase(), new Date().toISOString()],
  });
  return token;
}

export async function getSessionUser(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  try {
    await ready();
    const res = await execute({ sql: "SELECT email FROM sessions WHERE token = ?", args: [token] });
    const email = res.rows[0]?.email as string | undefined;
    return email ? getUser(email) : null;
  } catch (e) {
    // DB unavailable — treat as logged-out rather than 500-ing every page's auth check.
    console.error("[db] getSessionUser: database unavailable.", e);
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  await ready();
  await execute({ sql: "DELETE FROM sessions WHERE token=?", args: [token] });
}

/* ---------- orders ---------- */

export async function insertOrder(o: Order): Promise<void> {
  await ready();
  await execute({
    sql: `INSERT INTO orders (id, userEmail, userName, role, city, placedAt, status, \`lines\`, subtotal, gst, total, savingsVsMrp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      o.id, o.userEmail, o.userName, o.role, o.city ?? null, o.placedAt, o.status,
      JSON.stringify(o.lines), o.subtotal, o.gst, o.total, o.savingsVsMrp,
    ],
  });
}

export async function listOrders(userEmail?: string): Promise<Order[]> {
  await ready();
  const res = userEmail
    ? await execute({ sql: "SELECT * FROM orders WHERE userEmail=? ORDER BY placedAt DESC", args: [userEmail] })
    : await execute("SELECT * FROM orders ORDER BY placedAt DESC");
  return res.rows.map(rowToOrder);
}

export async function setOrderStatus(id: string, status: string): Promise<void> {
  await ready();
  await execute({ sql: "UPDATE orders SET status=? WHERE id=?", args: [status, id] });
}

/* ---------- leads ---------- */

export interface Lead {
  id: string;
  kind: string; // "plan" | "consultation"
  name: string;
  phone?: string | null;
  city?: string | null;
  goal?: string | null;
  budget?: number | null;
  note?: string | null;
  createdAt: string;
}

export async function insertLead(l: Omit<Lead, "id" | "createdAt">): Promise<Lead> {
  await ready();
  const id = "LD" + Date.now().toString(36).toUpperCase();
  const createdAt = new Date().toISOString();
  await execute({
    sql: `INSERT INTO leads (id, kind, name, phone, city, goal, budget, note, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, l.kind, l.name, l.phone ?? null, l.city ?? null, l.goal ?? null,
      l.budget ?? null, l.note ?? null, createdAt,
    ],
  });
  return { id, createdAt, ...l };
}

export async function listLeads(): Promise<Lead[]> {
  await ready();
  const res = await execute("SELECT * FROM leads ORDER BY createdAt DESC");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return res.rows.map((r: any) => ({
    id: r.id,
    kind: r.kind,
    name: r.name,
    phone: r.phone ?? null,
    city: r.city ?? null,
    goal: r.goal ?? null,
    budget: r.budget != null ? Number(r.budget) : null,
    note: r.note ?? null,
    createdAt: r.createdAt,
  }));
}

export async function recentOrdersForFeed(limit = 20) {
  await ready();
  const res = await execute({
    sql: "SELECT role, city, `lines`, placedAt FROM orders ORDER BY placedAt DESC LIMIT ?",
    args: [limit],
  });
  return res.rows.map((r) => {
    const lines = JSON.parse(r.lines as string) as { name: string; qty: number }[];
    return {
      role: r.role as Role,
      city: (r.city as string) || "India",
      product: lines[0]?.name ?? "products",
      qty: lines[0]?.qty ?? 0,
      placedAt: r.placedAt as string,
    };
  });
}
