import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import rawProducts from "@/data/products.json";
import { enrichRaw } from "./enrich";
import { Order, Product, RawProduct, Role, User, UserStatus } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __helbredeDb: Database.Database | undefined;
}

function createDb(): Database.Database {
  const db = new Database(path.join(DATA_DIR, "helbrede.db"));
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sno INTEGER NOT NULL,
      name TEXT NOT NULL,
      composition TEXT NOT NULL DEFAULT '',
      packing TEXT NOT NULL DEFAULT '',
      mrp REAL NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      grp TEXT NOT NULL DEFAULT 'Other',
      isRx INTEGER NOT NULL DEFAULT 0,
      schemeBuy INTEGER,
      schemeFree INTEGER,
      movement TEXT NOT NULL DEFAULT 'steady',
      stock INTEGER NOT NULL DEFAULT 1000,
      image TEXT,
      priceDistributor REAL,
      priceStockist REAL,
      priceChemist REAL,
      priceDoctor REAL
    );
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL,
      firmName TEXT,
      drugLicense TEXT,
      gstNumber TEXT,
      medicalRegNo TEXT,
      city TEXT,
      state TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      isAdmin INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userEmail TEXT NOT NULL,
      userName TEXT NOT NULL,
      role TEXT NOT NULL,
      city TEXT,
      placedAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Placed',
      lines TEXT NOT NULL,
      subtotal REAL NOT NULL,
      gst REAL NOT NULL,
      total REAL NOT NULL,
      savingsVsMrp REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  // migrate older databases that predate per-role pricing columns
  const cols = (db.prepare("PRAGMA table_info(products)").all() as { name: string }[]).map((c) => c.name);
  for (const col of ["priceDistributor", "priceStockist", "priceChemist", "priceDoctor"]) {
    if (!cols.includes(col)) db.exec(`ALTER TABLE products ADD COLUMN ${col} REAL`);
  }

  // seed products once
  const count = (db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number }).n;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO products (id, sno, name, composition, packing, mrp, category, grp, isRx, schemeBuy, schemeFree, movement, stock, image)
      VALUES (@id, @sno, @name, @composition, @packing, @mrp, @category, @grp, @isRx, @schemeBuy, @schemeFree, @movement, @stock, @image)
    `);
    const tx = db.transaction((rows: RawProduct[]) => {
      for (const r of rows) {
        const e = enrichRaw(r);
        if (e.mrp > 0) insert.run(e);
      }
    });
    tx(rawProducts as RawProduct[]);
  }

  // seed demo users once
  const usersCount = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  if (usersCount === 0) {
    const insert = db.prepare(`
      INSERT INTO users (email, name, password, phone, role, firmName, drugLicense, gstNumber, medicalRegNo, city, state, status, isAdmin, createdAt)
      VALUES (@email, @name, @password, @phone, @role, @firmName, @drugLicense, @gstNumber, @medicalRegNo, @city, @state, @status, @isAdmin, @createdAt)
    `);
    const seed = [
      { email: "admin@helbrede.com", name: "Admin", password: "admin123", phone: "9000000000", role: "distributor", firmName: null, drugLicense: null, gstNumber: null, medicalRegNo: null, city: "Panchkula", state: "Haryana", status: "active", isAdmin: 1, createdAt: "2026-01-01T00:00:00.000Z" },
      { email: "distributor@demo.in", name: "Verma Pharma Distributors", password: "demo123", phone: "9811111111", role: "distributor", firmName: "Verma Pharma Distributors", drugLicense: "PB-20B-114455", gstNumber: "03AAACV1234F1Z5", medicalRegNo: null, city: "Ludhiana", state: "Punjab", status: "active", isAdmin: 0, createdAt: "2026-02-11T00:00:00.000Z" },
      { email: "stockist@demo.in", name: "Aggarwal Medicine Stockist", password: "demo123", phone: "9822222222", role: "stockist", firmName: "Aggarwal Medicine Co.", drugLicense: "HR-20B-778899", gstNumber: "06AABCA9876K1Z2", medicalRegNo: null, city: "Panchkula", state: "Haryana", status: "active", isAdmin: 0, createdAt: "2026-03-05T00:00:00.000Z" },
      { email: "chemist@demo.in", name: "Sharma Medicos", password: "demo123", phone: "9833333333", role: "chemist", firmName: "Sharma Medicos", drugLicense: "CH-21B-334455", gstNumber: "04AAHCS4321M1Z9", medicalRegNo: null, city: "Chandigarh", state: "Chandigarh", status: "active", isAdmin: 0, createdAt: "2026-03-20T00:00:00.000Z" },
      { email: "doctor@demo.in", name: "Dr. Neha Kapoor", password: "demo123", phone: "9844444444", role: "doctor", firmName: null, drugLicense: null, gstNumber: null, medicalRegNo: "PMC-56789", city: "Mohali", state: "Punjab", status: "active", isAdmin: 0, createdAt: "2026-04-02T00:00:00.000Z" },
      { email: "pending@demo.in", name: "Gupta Pharma Agency", password: "demo123", phone: "9855555555", role: "stockist", firmName: "Gupta Pharma Agency", drugLicense: "DL-20B-990011", gstNumber: "07AAKCG5678P1Z3", medicalRegNo: null, city: "Delhi", state: "Delhi", status: "pending", isAdmin: 0, createdAt: "2026-07-01T00:00:00.000Z" },
    ];
    for (const u of seed) insert.run(u);
  }

  return db;
}

export function getDb(): Database.Database {
  if (!global.__helbredeDb) global.__helbredeDb = createDb();
  return global.__helbredeDb;
}

/* ---------- row mapping ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(r: any): Product {
  return {
    id: r.id,
    sno: r.sno,
    name: r.name,
    composition: r.composition,
    packing: r.packing,
    mrp: r.mrp,
    category: r.category,
    group: r.grp,
    isRx: !!r.isRx,
    scheme: r.schemeBuy && r.schemeFree ? { buy: r.schemeBuy, free: r.schemeFree } : null,
    movement: r.movement,
    stock: r.stock,
    image: r.image,
    prices: {
      distributor: r.priceDistributor ?? null,
      stockist: r.priceStockist ?? null,
      chemist: r.priceChemist ?? null,
      doctor: r.priceDoctor ?? null,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUser(r: any): User {
  return { ...r, isAdmin: !!r.isAdmin };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOrder(r: any): Order {
  return { ...r, lines: JSON.parse(r.lines) };
}

/* ---------- products ---------- */

export function listProducts(): Product[] {
  return getDb().prepare("SELECT * FROM products ORDER BY name").all().map(rowToProduct);
}

export function getProduct(id: string): Product | null {
  const r = getDb().prepare("SELECT * FROM products WHERE id = ?").get(id);
  return r ? rowToProduct(r) : null;
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

export function createProduct(input: ProductInput): Product {
  const db = getDb();
  const maxSno = (db.prepare("SELECT MAX(sno) AS m FROM products").get() as { m: number }).m || 0;
  const sno = maxSno + 1;
  const id =
    `${input.name}-${input.packing}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + `-${sno}`;
  const { groupOf } = require("./enrich") as typeof import("./enrich");
  db.prepare(`
    INSERT INTO products (id, sno, name, composition, packing, mrp, category, grp, isRx, schemeBuy, schemeFree, movement, stock, image, priceDistributor, priceStockist, priceChemist, priceDoctor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'steady', ?, NULL, ?, ?, ?, ?)
  `).run(
    id, sno, input.name, input.composition, input.packing, input.mrp,
    input.category, groupOf(input.category), input.isRx ? 1 : 0,
    input.schemeBuy, input.schemeFree, input.stock,
    input.priceDistributor, input.priceStockist, input.priceChemist, input.priceDoctor
  );
  return getProduct(id)!;
}

export function updateProduct(id: string, input: ProductInput): Product | null {
  const { groupOf } = require("./enrich") as typeof import("./enrich");
  getDb().prepare(`
    UPDATE products SET name=?, composition=?, packing=?, mrp=?, category=?, grp=?, isRx=?, schemeBuy=?, schemeFree=?, stock=?,
      priceDistributor=?, priceStockist=?, priceChemist=?, priceDoctor=?
    WHERE id=?
  `).run(
    input.name, input.composition, input.packing, input.mrp, input.category,
    groupOf(input.category), input.isRx ? 1 : 0, input.schemeBuy, input.schemeFree, input.stock,
    input.priceDistributor, input.priceStockist, input.priceChemist, input.priceDoctor, id
  );
  return getProduct(id);
}

export function setProductImage(id: string, image: string | null): void {
  getDb().prepare("UPDATE products SET image=? WHERE id=?").run(image, id);
}

export function deleteProduct(id: string): void {
  getDb().prepare("DELETE FROM products WHERE id=?").run(id);
}

/* ---------- users & sessions ---------- */

export function getUser(email: string): User | null {
  const r = getDb().prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  return r ? rowToUser(r) : null;
}

export function listUsers(): User[] {
  return getDb().prepare("SELECT * FROM users ORDER BY createdAt DESC").all().map(rowToUser);
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

export function createUser(input: UserInput): User {
  getDb().prepare(`
    INSERT INTO users (email, name, password, phone, role, firmName, drugLicense, gstNumber, medicalRegNo, city, state, status, isAdmin, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.email.toLowerCase(), input.name, input.password, input.phone, input.role,
    input.firmName ?? null, input.drugLicense ?? null, input.gstNumber ?? null,
    input.medicalRegNo ?? null, input.city ?? null, input.state ?? null,
    input.status, input.isAdmin ? 1 : 0, new Date().toISOString()
  );
  return getUser(input.email)!;
}

export function setUserStatus(email: string, status: UserStatus): void {
  getDb().prepare("UPDATE users SET status=? WHERE email=?").run(status, email.toLowerCase());
}

export function deleteUser(email: string): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE email=?").run(email.toLowerCase());
  db.prepare("DELETE FROM users WHERE email=?").run(email.toLowerCase());
}

export function createSession(email: string): string {
  const token = crypto.randomBytes(24).toString("hex");
  getDb().prepare("INSERT INTO sessions (token, email, createdAt) VALUES (?, ?, ?)").run(
    token, email.toLowerCase(), new Date().toISOString()
  );
  return token;
}

export function getSessionUser(token: string | undefined): User | null {
  if (!token) return null;
  const r = getDb().prepare("SELECT email FROM sessions WHERE token = ?").get(token) as
    | { email: string }
    | undefined;
  return r ? getUser(r.email) : null;
}

export function deleteSession(token: string): void {
  getDb().prepare("DELETE FROM sessions WHERE token=?").run(token);
}

/* ---------- orders ---------- */

export function insertOrder(o: Order): void {
  getDb().prepare(`
    INSERT INTO orders (id, userEmail, userName, role, city, placedAt, status, lines, subtotal, gst, total, savingsVsMrp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    o.id, o.userEmail, o.userName, o.role, o.city ?? null, o.placedAt, o.status,
    JSON.stringify(o.lines), o.subtotal, o.gst, o.total, o.savingsVsMrp
  );
}

export function listOrders(userEmail?: string): Order[] {
  const db = getDb();
  const rows = userEmail
    ? db.prepare("SELECT * FROM orders WHERE userEmail=? ORDER BY placedAt DESC").all(userEmail)
    : db.prepare("SELECT * FROM orders ORDER BY placedAt DESC").all();
  return rows.map(rowToOrder);
}

export function setOrderStatus(id: string, status: string): void {
  getDb().prepare("UPDATE orders SET status=? WHERE id=?").run(status, id);
}

export function recentOrdersForFeed(limit = 20) {
  return getDb()
    .prepare("SELECT role, city, lines, placedAt FROM orders ORDER BY placedAt DESC LIMIT ?")
    .all(limit)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => {
      const lines = JSON.parse(r.lines) as { name: string; qty: number }[];
      return {
        role: r.role as Role,
        city: (r.city as string) || "India",
        product: lines[0]?.name ?? "products",
        qty: lines[0]?.qty ?? 0,
        placedAt: r.placedAt as string,
      };
    });
}
