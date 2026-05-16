import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ─────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "cajero"] }).notNull().default("cajero"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────
// CATEGORÍAS
// ─────────────────────────────────────────
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────
// PRODUCTOS / BEBIDAS
// ─────────────────────────────────────────
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  price: real("price").notNull(),
  cost: real("cost").notNull().default(0),
  category: text("category").notNull().default("General"),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5),
  icon: text("icon").notNull().default("Package"),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────
// MÉTODOS DE PAGO (configurables)
// ─────────────────────────────────────────
export const paymentMethods = sqliteTable("payment_methods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  surcharge: real("surcharge").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────
// GASTOS FIJOS
// ─────────────────────────────────────────
export const fixedExpenses = sqliteTable("fixed_expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  amount: real("amount").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────
// CAJAS (sesiones de caja)
// ─────────────────────────────────────────
export const cashRegisters = sqliteTable("cash_registers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  initialCash: real("initial_cash").notNull().default(0),
  totalEfectivo: real("total_efectivo").notNull().default(0),
  totalTransferencia: real("total_transferencia").notNull().default(0),
  totalIngresos: real("total_ingresos").notNull().default(0),
  transactionsCount: integer("transactions_count").notNull().default(0),
  // open | closed
  status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  openedAt: text("opened_at").notNull().default(sql`(datetime('now'))`),
  closedAt: text("closed_at"),
});

// ─────────────────────────────────────────
// TRANSACCIONES (ventas del POS)
// ─────────────────────────────────────────
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cashRegisterId: integer("cash_register_id").references(() => cashRegisters.id),
  userId: integer("user_id").notNull().references(() => users.id),
  total: real("total").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────
// ÍTEMS DE TRANSACCIÓN
// ─────────────────────────────────────────
export const transactionItems = sqliteTable("transaction_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
});

// ─────────────────────────────────────────
// PAGOS DE TRANSACCIÓN
// ─────────────────────────────────────────
export const transactionPayments = sqliteTable("transaction_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  methodName: text("method_name").notNull(),
  amount: real("amount").notNull(),
  // Monto base antes del recargo
  baseAmount: real("base_amount").notNull().default(0),
  // Porcentaje de recargo aplicado
  surchargePercent: real("surcharge_percent").notNull().default(0),
});
