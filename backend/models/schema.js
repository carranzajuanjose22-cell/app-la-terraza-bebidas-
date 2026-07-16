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
  role: text("role", { enum: ["admin", "cajero", "creator"] }).notNull().default("cajero"),
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
  isPromotion: integer("is_promotion", { mode: "boolean" }).notNull().default(false),
  // Si estan seteados, el producto es un "vaso de trago" servido desde una botella abierta
  // en la barra. El vaso no consume stock propio ni de la botella al venderse, solo
  // incrementa servedGlasses de la bar_bottle correspondiente.
  bottleProductId: integer("bottle_product_id").references(() => products.id, { onDelete: "set null" }),
  glassesPerBottle: integer("glasses_per_bottle"),
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

// ─────────────────────────────────────────
// GASTOS DIARIOS / EXTRACCIONES
// ─────────────────────────────────────────
export const dailyExpenses = sqliteTable("daily_expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cashRegisterId: integer("cash_register_id").references(() => cashRegisters.id),
  userId: integer("user_id").references(() => users.id),
  reason: text("reason").notNull(),
  amount: real("amount").notNull(),
  method: text("method", { enum: ["efectivo", "transferencia"] }).notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────
// BOTELLAS DE LA BARRA (ABIERTAS)
// ─────────────────────────────────────────
export const barBottles = sqliteTable("bar_bottles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  status: text("status", { enum: ["open", "empty"] }).notNull().default("open"),
  // Cantidad de vasos servidos desde esta botella. Se auto-marca como "empty"
  // cuando llega al glassesPerBottle del vaso de trago asociado.
  servedGlasses: integer("served_glasses").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────
// RETIROS / CONSUMO INTERNO
// ─────────────────────────────────────────
export const internalWithdrawals = sqliteTable("internal_withdrawals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  cost: real("cost").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────
// ÍTEMS DE PROMOCIÓN (productos que la componen)
// ─────────────────────────────────────────
export const promotionItems = sqliteTable("promotion_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  promotionId: integer("promotion_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
});

// ─────────────────────────────────────────
// ÍTEMS DE TRAGO (botellas que componen un vaso/trago)
// Un trago puede usar 1+ botellas; glassesUsed = cuánto consume de cada una
// por unidad vendida; glassesPerBottle = rendimiento de esa botella hasta vaciarse.
// ─────────────────────────────────────────
export const drinkBottleItems = sqliteTable("drink_bottle_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  drinkProductId: integer("drink_product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  bottleProductId: integer("bottle_product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  glassesUsed: integer("glasses_used").notNull().default(1),
  glassesPerBottle: integer("glasses_per_bottle").notNull(),
});

// ─────────────────────────────────────────
// CONFIGURACIÓN DE SUSCRIPCIÓN (siempre 1 fila, id=1)
// ─────────────────────────────────────────
export const subscriptionConfig = sqliteTable("subscription_config", {
  id: integer("id").primaryKey(),
  subscriptionDay: integer("subscription_day"),
  nextExpiry: text("next_expiry"),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────
// MODIFICACIONES DE STOCK MANUALES
// ─────────────────────────────────────────
export const stockModifications = sqliteTable("stock_modifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  oldStock: integer("old_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});
