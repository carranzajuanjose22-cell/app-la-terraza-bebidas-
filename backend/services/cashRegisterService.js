import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { cashRegisters, transactions, transactionItems, transactionPayments } from "../models/schema.js";

export async function getOpenRegister() {
  const [register] = await db
    .select()
    .from(cashRegisters)
    .where(eq(cashRegisters.status, "open"))
    .limit(1);
  return register || null;
}

export async function openRegister(userId, initialCash) {
  const existing = await getOpenRegister();
  if (existing) throw new Error("Ya hay una caja abierta");

  const [register] = await db
    .insert(cashRegisters)
    .values({ userId, initialCash, status: "open" })
    .returning();
  return register;
}

export async function closeRegister(registerId) {
  const [register] = await db
    .select()
    .from(cashRegisters)
    .where(eq(cashRegisters.id, registerId))
    .limit(1);

  if (!register) throw new Error("Caja no encontrada");
  if (register.status === "closed") throw new Error("La caja ya está cerrada");

  const txs = await db.select().from(transactions).where(eq(transactions.cashRegisterId, registerId));

  let totalEfectivo = 0;
  let totalTransferencia = 0;
  let totalIngresos = 0;

  for (const tx of txs) {
    totalIngresos += tx.total;
    const payments = await db
      .select()
      .from(transactionPayments)
      .where(eq(transactionPayments.transactionId, tx.id));

    for (const p of payments) {
      if (p.methodName.toLowerCase().includes("efectivo")) {
        totalEfectivo += p.amount;
      } else {
        totalTransferencia += p.amount;
      }
    }
  }

  const [closed] = await db
    .update(cashRegisters)
    .set({
      status: "closed",
      closedAt: new Date().toISOString(),
      totalEfectivo,
      totalTransferencia,
      totalIngresos,
      transactionsCount: txs.length,
    })
    .where(eq(cashRegisters.id, registerId))
    .returning();

  return closed;
}

export async function getClosedRegisters(date = null) {
  const allClosed = await db
    .select()
    .from(cashRegisters)
    .where(eq(cashRegisters.status, "closed"))
    .orderBy(desc(cashRegisters.closedAt));

  if (date) {
    return allClosed.filter((c) => c.closedAt && c.closedAt.startsWith(date));
  }
  return allClosed;
}

export async function getRegisterWithItems(registerId) {
  const [register] = await db
    .select()
    .from(cashRegisters)
    .where(eq(cashRegisters.id, registerId))
    .limit(1);

  if (!register) throw new Error("Caja no encontrada");

  const txs = await db
    .select()
    .from(transactions)
    .where(eq(transactions.cashRegisterId, registerId));

  const aggregated = {};
  // Recargos agrupados por método de pago: { "Transferencia (10%)": totalRecargo }
  const surchargeByMethod = {};
  let totalSurcharges = 0;

  for (const tx of txs) {
    const items = await db
      .select()
      .from(transactionItems)
      .where(eq(transactionItems.transactionId, tx.id));

    for (const item of items) {
      if (!aggregated[item.productName]) {
        aggregated[item.productName] = { quantity: 0, total: 0 };
      }
      aggregated[item.productName].quantity += item.quantity;
      aggregated[item.productName].total += item.total;
    }

    const payments = await db
      .select()
      .from(transactionPayments)
      .where(eq(transactionPayments.transactionId, tx.id));

    for (const p of payments) {
      const surchargeAmt = p.amount - (p.baseAmount ?? p.amount);
      if (surchargeAmt > 0 && p.surchargePercent > 0) {
        const key = `${p.methodName} (+${p.surchargePercent}%)`;
        surchargeByMethod[key] = (surchargeByMethod[key] || 0) + surchargeAmt;
        totalSurcharges += surchargeAmt;
      }
    }
  }

  const soldItems = Object.entries(aggregated).map(([name, data]) => ({
    name,
    quantity: data.quantity,
    total: data.total,
  }));

  const surchargeBreakdown = Object.entries(surchargeByMethod).map(([method, amount]) => ({
    method,
    amount,
  }));

  return { ...register, soldItems, totalSurcharges, surchargeBreakdown };
}
