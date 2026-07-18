import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import paymentMethodRoutes from "./routes/paymentMethodRoutes.js";
import fixedExpenseRoutes from "./routes/fixedExpenseRoutes.js";
import cashRegisterRoutes from "./routes/cashRegisterRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import dailyExpenseRoutes from "./routes/dailyExpenseRoutes.js";
import barBottleRoutes from "./routes/barBottleRoutes.js";
import internalWithdrawalRoutes from "./routes/internalWithdrawalRoutes.js";
import { db } from "./db/index.js";
import { transactionItems, products, barBottles, cashRegisters, dailyExpenses, internalWithdrawals, stockModifications, transactions } from "./models/schema.js";
import { and, eq, gte, isNull, lt } from "drizzle-orm";

/** Suma un día calendario a YYYY-MM-DD (para filtro exclusivo superior). */
function nextDayYYYYMMDD(dateStr) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map((o) => o.trim()) : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    // Permitir cualquier subdominio de vercel.app en preview
    if (origin.endsWith(".vercel.app") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS bloqueado para: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

app.get("/", (req, res) => res.json({ status: "ok", message: "La Terraza API corriendo correctamente" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/fixed-expenses", fixedExpenseRoutes);
app.use("/api/cash-register", cashRegisterRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/daily-expenses", dailyExpenseRoutes);
app.use("/api/bar-bottles", barBottleRoutes);
app.use("/api/internal-withdrawals", internalWithdrawalRoutes);

app.get("/api/stats/restock", async (req, res) => {
  try {
    let total = 0;
    const from = typeof req.query.from === "string" ? req.query.from.slice(0, 10) : null;
    const to = typeof req.query.to === "string" ? req.query.to.slice(0, 10) : null;
    const toExclusive = to ? nextDayYYYYMMDD(to) : null;

    // Sumar el costo de todo lo vendido en el POS (a costo actual del producto).
    // Excluimos los "vasos de trago" (bottleProductId != null) porque su costo ya
    // se contabilizo cuando se abrio la botella en la barra; contarlo aca seria
    // duplicar el gasto.
    const txConds = [isNull(products.bottleProductId)];
    if (from) txConds.push(gte(transactions.createdAt, from));
    if (toExclusive) txConds.push(lt(transactions.createdAt, toExclusive));

    const txItems = await db.select({ quantity: transactionItems.quantity, cost: products.cost })
      .from(transactionItems)
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(and(...txConds));
    txItems.forEach(i => total += (i.quantity * i.cost));

    // Sumar el costo de todas las botellas que se abrieron en la barra.
    const bottleConds = [];
    if (from) bottleConds.push(gte(barBottles.createdAt, from));
    if (toExclusive) bottleConds.push(lt(barBottles.createdAt, toExclusive));

    const bottlesQuery = db.select({ cost: products.cost })
      .from(barBottles)
      .innerJoin(products, eq(barBottles.productId, products.id));
    const bottles = bottleConds.length
      ? await bottlesQuery.where(and(...bottleConds))
      : await bottlesQuery;
    bottles.forEach(b => total += b.cost);

    // Los retiros internos ya guardan el costo del momento del retiro (product.cost * quantity),
    // asi que se usa directo sin join para respetar el historico.
    const wConds = [];
    if (from) wConds.push(gte(internalWithdrawals.createdAt, from));
    if (toExclusive) wConds.push(lt(internalWithdrawals.createdAt, toExclusive));

    const withdrawalsQuery = db.select({ cost: internalWithdrawals.cost }).from(internalWithdrawals);
    const withdrawals = wConds.length
      ? await withdrawalsQuery.where(and(...wConds))
      : await withdrawalsQuery;
    withdrawals.forEach(w => total += (Number(w.cost) || 0));

    res.json({ restockCost: total, from: from || null, to: to || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error calculando restock" });
  }
});

app.post("/api/stats/stock-modifications", async (req, res) => {
  try {
    const { productId, productName, oldStock, newStock } = req.body;
    await db.insert(stockModifications).values({
      productId,
      productName,
      oldStock,
      newStock
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error registrando modificación" });
  }
});

app.get("/api/stats/activity-log", async (req, res) => {
  try {
    const logs = [];

    const registers = await db.select().from(cashRegisters);
    registers.forEach(r => {
      logs.push({
        id: `caja-open-${r.id}`,
        type: "Apertura de Caja",
        date: r.openedAt,
        details: `Fondo inicial: $${r.initialCash}`,
        icon: "Unlock",
        color: "text-green-500",
        bg: "bg-green-500/10"
      });
      if (r.status === "closed" && r.closedAt) {
        logs.push({
          id: `caja-close-${r.id}`,
          type: "Cierre de Caja",
          date: r.closedAt,
          details: `Total ingresos: $${r.totalIngresos}`,
          icon: "Lock",
          color: "text-[#8B5CF6]",
          bg: "bg-[#8B5CF6]/10"
        });
      }
    });

    const dExpenses = await db.select().from(dailyExpenses);
    dExpenses.forEach(e => {
      logs.push({
        id: `gasto-${e.id}`,
        type: "Extracción",
        date: e.createdAt,
        details: `${e.reason} - $${e.amount}`,
        icon: "Wallet",
        color: "text-red-400",
        bg: "bg-red-400/10"
      });
    });

    const bottles = await db.select().from(barBottles);
    bottles.forEach(b => {
      logs.push({
        id: `botella-${b.id}`,
        type: "Botella a Barra",
        date: b.createdAt,
        details: b.productName,
        icon: "Wine",
        color: "text-purple-400",
        bg: "bg-purple-400/10"
      });
    });

    const withdrawals = await db.select().from(internalWithdrawals);
    withdrawals.forEach(w => {
      logs.push({
        id: `retiro-${w.id}`,
        type: "Retiro Consumo",
        date: w.createdAt,
        details: `${w.quantity}x ${w.productName}`,
        icon: "PackageMinus",
        color: "text-orange-400",
        bg: "bg-orange-400/10"
      });
    });

    const stockMods = await db.select().from(stockModifications);
    stockMods.forEach(m => {
      logs.push({
        id: `stock-${m.id}`,
        type: "Ajuste de Stock",
        date: m.createdAt,
        details: `${m.productName}: ${m.oldStock} ➔ ${m.newStock} un.`,
        icon: "Package",
        color: "text-blue-400",
        bg: "bg-blue-400/10"
      });
    });

    // Ordenamos por fecha de lo más reciente a lo más antiguo
    logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(logs.slice(0, 50)); // Retornamos los últimos 50 eventos
  } catch (err) {
    res.status(500).json({ message: "Error obteniendo historial" });
  }
});

app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Error interno del servidor" });
});

// En serverless (Vercel) no se debe llamar a listen(); Vercel importa el handler exportado.
// Solo arrancamos el servidor cuando corremos fuera de Vercel (desarrollo local, `node index.js`).
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
}

export default app;
