import { createClient, Client, InValue } from "@libsql/client";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import rawProducts from "@/data/products.json";
import { enrichRaw, groupOf } from "./enrich";
import { Order, Product, RawProduct, Role, User, UserStatus } from "./types";

/**
 * Data layer backed by libSQL.
 *  - Production (Vercel): set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN → hosted Turso.
 *  - Local dev: no env vars → a local SQLite file at data/helbrede.db.
 * Same async API either way.
 */

declare global {
  // eslint-disable-next-line no-var
  var __helbredeClient: Client | undefined;
  // eslint-disable-next-line no-var
  var __helbredeInit: Promise<void> | undefined;
}

function makeClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (url) return createClient({ url, authToken });

  // local dev fallback: file-based libSQL
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return createClient({ url: `file:${path.join(dir, "helbrede.db")}` });
}

function client(): Client {
  if (!global.__helbredeClient) global.__helbredeClient = makeClient();
  return global.__helbredeClient;
}

/* ---------- schema + seed (idempotent, run once per instance) ---------- */

async function doInit(): Promise<void> {
  const db = client();

  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY, sno INTEGER NOT NULL, name TEXT NOT NULL,
        composition TEXT NOT NULL DEFAULT '', packing TEXT NOT NULL DEFAULT '',
        mrp REAL NOT NULL, category TEXT NOT NULL DEFAULT 'Other', grp TEXT NOT NULL DEFAULT 'Other',
        isRx INTEGER NOT NULL DEFAULT 0, schemeBuy INTEGER, schemeFree INTEGER,
        movement TEXT NOT NULL DEFAULT 'steady', stock INTEGER NOT NULL DEFAULT 1000, image TEXT,
        priceDistributor REAL, priceStockist REAL, priceChemist REAL, priceDoctor REAL
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY, name TEXT NOT NULL, password TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '', role TEXT NOT NULL, firmName TEXT, drugLicense TEXT,
        gstNumber TEXT, medicalRegNo TEXT, city TEXT, state TEXT,
        status TEXT NOT NULL DEFAULT 'pending', isAdmin INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY, userEmail TEXT NOT NULL, userName TEXT NOT NULL, role TEXT NOT NULL,
        city TEXT, placedAt TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Placed', lines TEXT NOT NULL,
        subtotal REAL NOT NULL, gst REAL NOT NULL, total REAL NOT NULL, savingsVsMrp REAL NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY, email TEXT NOT NULL, createdAt TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY, kind TEXT NOT NULL, name TEXT NOT NULL, phone TEXT,
        city TEXT, goal TEXT, budget REAL, note TEXT, createdAt TEXT NOT NULL
      )`,
    ],
    "write"
  );

  // seed products once
  const pc = await db.execute("SELECT COUNT(*) AS n FROM products");
  if (Number(pc.rows[0].n) === 0) {
    const stmts = (rawProducts as RawProduct[])
      .map(enrichRaw)
      .filter((e) => e.mrp > 0 || (e.priceDistributor ?? 0) > 0)
      .map((e) => ({
        sql: `INSERT OR IGNORE INTO products
          (id, sno, name, composition, packing, mrp, category, grp, isRx, schemeBuy, schemeFree, movement, stock, image, priceDistributor, priceStockist, priceChemist, priceDoctor)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          e.id, e.sno, e.name, e.composition, e.packing, e.mrp, e.category, e.grp,
          e.isRx, e.schemeBuy, e.schemeFree, e.movement, e.stock, e.image,
          e.priceDistributor, e.priceStockist, e.priceChemist, e.priceDoctor,
        ] as InValue[],
      }));
    // libSQL caps statements per batch; chunk to be safe
    for (let i = 0; i < stmts.length; i += 100) {
      await db.batch(stmts.slice(i, i + 100), "write");
    }
  }

  // seed demo users once
  const uc = await db.execute("SELECT COUNT(*) AS n FROM users");
  if (Number(uc.rows[0].n) === 0) {
    const seed = [
      ["admin@helbrede.com", "Admin", "admin123", "9000000000", "distributor", null, null, null, null, "Panchkula", "Haryana", "active", 1, "2026-01-01T00:00:00.000Z"],
      ["distributor@demo.in", "Verma Pharma Distributors", "demo123", "9811111111", "distributor", "Verma Pharma Distributors", "PB-20B-114455", "03AAACV1234F1Z5", null, "Ludhiana", "Punjab", "active", 0, "2026-02-11T00:00:00.000Z"],
      ["stockist@demo.in", "Aggarwal Medicine Stockist", "demo123", "9822222222", "stockist", "Aggarwal Medicine Co.", "HR-20B-778899", "06AABCA9876K1Z2", null, "Panchkula", "Haryana", "active", 0, "2026-03-05T00:00:00.000Z"],
      ["chemist@demo.in", "Sharma Medicos", "demo123", "9833333333", "chemist", "Sharma Medicos", "CH-21B-334455", "04AAHCS4321M1Z9", null, "Chandigarh", "Chandigarh", "active", 0, "2026-03-20T00:00:00.000Z"],
      ["doctor@demo.in", "Dr. Neha Kapoor", "demo123", "9844444444", "doctor", null, null, null, "PMC-56789", "Mohali", "Punjab", "active", 0, "2026-04-02T00:00:00.000Z"],
      ["pending@demo.in", "Gupta Pharma Agency", "demo123", "9855555555", "stockist", "Gupta Pharma Agency", "DL-20B-990011", "07AAKCG5678P1Z3", null, "Delhi", "Delhi", "pending", 0, "2026-07-01T00:00:00.000Z"],
    ];
    await db.batch(
      seed.map((s) => ({
        sql: `INSERT OR IGNORE INTO users
          (email, name, password, phone, role, firmName, drugLicense, gstNumber, medicalRegNo, city, state, status, isAdmin, createdAt)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        args: s as InValue[],
      })),
      "write"
    );
  }
}

async function ready(): Promise<Client> {
  if (!global.__helbredeInit) global.__helbredeInit = doInit();
  await global.__helbredeInit;
  return client();
}

/* ---------- row mapping ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(r: any): Product {
  return {
    id: r.id,
    sno: Number(r.sno),
    name: r.name,
    composition: r.composition,
    packing: r.packing,
    mrp: Number(r.mrp),
    category: r.category,
    group: r.grp,
    isRx: !!Number(r.isRx),
    scheme: r.schemeBuy && r.schemeFree ? { buy: Number(r.schemeBuy), free: Number(r.schemeFree) } : null,
    movement: r.movement,
    stock: Number(r.stock),
    image: r.image ?? null,
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

export async function listProducts(): Promise<Product[]> {
  const db = await ready();
  const res = await db.execute("SELECT * FROM products ORDER BY name");
  return res.rows.map(rowToProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const db = await ready();
  const res = await db.execute({ sql: "SELECT * FROM products WHERE id = ?", args: [id] });
  return res.rows[0] ? rowToProduct(res.rows[0]) : null;
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
  const db = await ready();
  const maxRes = await db.execute("SELECT MAX(sno) AS m FROM products");
  const sno = Number(maxRes.rows[0].m ?? 0) + 1;
  const id =
    `${input.name}-${input.packing}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + `-${sno}`;
  await db.execute({
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
  const db = await ready();
  await db.execute({
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
  const db = await ready();
  await db.execute({ sql: "UPDATE products SET image=? WHERE id=?", args: [image, id] });
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await ready();
  await db.execute({ sql: "DELETE FROM products WHERE id=?", args: [id] });
}

/* ---------- users & sessions ---------- */

export async function getUser(email: string): Promise<User | null> {
  const db = await ready();
  const res = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email.toLowerCase()] });
  return res.rows[0] ? rowToUser(res.rows[0]) : null;
}

export async function listUsers(): Promise<User[]> {
  const db = await ready();
  const res = await db.execute("SELECT * FROM users ORDER BY createdAt DESC");
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
  status: UserStatus;
  isAdmin?: boolean;
}

export async function createUser(input: UserInput): Promise<User> {
  const db = await ready();
  await db.execute({
    sql: `INSERT INTO users (email, name, password, phone, role, firmName, drugLicense, gstNumber, medicalRegNo, city, state, status, isAdmin, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      input.email.toLowerCase(), input.name, input.password, input.phone, input.role,
      input.firmName ?? null, input.drugLicense ?? null, input.gstNumber ?? null,
      input.medicalRegNo ?? null, input.city ?? null, input.state ?? null,
      input.status, input.isAdmin ? 1 : 0, new Date().toISOString(),
    ],
  });
  return (await getUser(input.email))!;
}

export async function setUserStatus(email: string, status: UserStatus): Promise<void> {
  const db = await ready();
  await db.execute({ sql: "UPDATE users SET status=? WHERE email=?", args: [status, email.toLowerCase()] });
}

export async function deleteUser(email: string): Promise<void> {
  const db = await ready();
  await db.execute({ sql: "DELETE FROM sessions WHERE email=?", args: [email.toLowerCase()] });
  await db.execute({ sql: "DELETE FROM users WHERE email=?", args: [email.toLowerCase()] });
}

export async function createSession(email: string): Promise<string> {
  const db = await ready();
  const token = crypto.randomBytes(24).toString("hex");
  await db.execute({
    sql: "INSERT INTO sessions (token, email, createdAt) VALUES (?, ?, ?)",
    args: [token, email.toLowerCase(), new Date().toISOString()],
  });
  return token;
}

export async function getSessionUser(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const db = await ready();
  const res = await db.execute({ sql: "SELECT email FROM sessions WHERE token = ?", args: [token] });
  const email = res.rows[0]?.email as string | undefined;
  return email ? getUser(email) : null;
}

export async function deleteSession(token: string): Promise<void> {
  const db = await ready();
  await db.execute({ sql: "DELETE FROM sessions WHERE token=?", args: [token] });
}

/* ---------- orders ---------- */

export async function insertOrder(o: Order): Promise<void> {
  const db = await ready();
  await db.execute({
    sql: `INSERT INTO orders (id, userEmail, userName, role, city, placedAt, status, lines, subtotal, gst, total, savingsVsMrp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      o.id, o.userEmail, o.userName, o.role, o.city ?? null, o.placedAt, o.status,
      JSON.stringify(o.lines), o.subtotal, o.gst, o.total, o.savingsVsMrp,
    ],
  });
}

export async function listOrders(userEmail?: string): Promise<Order[]> {
  const db = await ready();
  const res = userEmail
    ? await db.execute({ sql: "SELECT * FROM orders WHERE userEmail=? ORDER BY placedAt DESC", args: [userEmail] })
    : await db.execute("SELECT * FROM orders ORDER BY placedAt DESC");
  return res.rows.map(rowToOrder);
}

export async function setOrderStatus(id: string, status: string): Promise<void> {
  const db = await ready();
  await db.execute({ sql: "UPDATE orders SET status=? WHERE id=?", args: [status, id] });
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
  const db = await ready();
  const id = "LD" + Date.now().toString(36).toUpperCase();
  const createdAt = new Date().toISOString();
  await db.execute({
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
  const db = await ready();
  const res = await db.execute("SELECT * FROM leads ORDER BY createdAt DESC");
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
  const db = await ready();
  const res = await db.execute({
    sql: "SELECT role, city, lines, placedAt FROM orders ORDER BY placedAt DESC LIMIT ?",
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
