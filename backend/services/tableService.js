import { asc, eq, max } from "drizzle-orm";
import { db } from "../db/index.js";
import { tables, openTableAccounts } from "../models/schema.js";

const VALID_STATUS = new Set(["libre", "ocupada", "cerrando"]);
export const DEFAULT_TABLE_COUNT = 8;

function parseItems(json) {
  try {
    const items = JSON.parse(json || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

/** Crea Mesas 1–8 si faltan (idempotente). */
export async function ensureDefaultTables() {
  const existing = await db.select().from(tables);
  const numbers = new Set(existing.map((t) => t.number));
  const toInsert = [];
  for (let n = 1; n <= DEFAULT_TABLE_COUNT; n++) {
    if (!numbers.has(n)) {
      toInsert.push({
        number: n,
        name: `Mesa ${n}`,
        status: "libre",
        isActive: true,
      });
    }
  }
  if (toInsert.length > 0) {
    await db.insert(tables).values(toInsert);
  }
}

export async function getAllTables() {
  await ensureDefaultTables();
  return db.select().from(tables).orderBy(asc(tables.number));
}

export async function createTable({ name } = {}) {
  await ensureDefaultTables();
  const [row] = await db.select({ maxNumber: max(tables.number) }).from(tables);
  const nextNumber = (row?.maxNumber || 0) + 1;
  const label = (name && String(name).trim()) || `Mesa ${nextNumber}`;

  const [created] = await db
    .insert(tables)
    .values({
      number: nextNumber,
      name: label,
      status: "libre",
      isActive: true,
    })
    .returning();
  return created;
}

export async function updateTable(id, data) {
  const [existing] = await db.select().from(tables).where(eq(tables.id, id)).limit(1);
  if (!existing) throw new Error("Mesa no encontrada");

  const patch = {};
  if (data.status !== undefined) {
    if (!VALID_STATUS.has(data.status)) {
      throw new Error("Estado inválido. Usá: libre, ocupada o cerrando");
    }
    patch.status = data.status;
  }
  if (data.isActive !== undefined) {
    patch.isActive = !!data.isActive;
  }
  if (data.name !== undefined) {
    const label = String(data.name).trim();
    if (!label) throw new Error("El nombre de la mesa no puede estar vacío");
    patch.name = label;
  }
  if (Object.keys(patch).length === 0) {
    throw new Error("Nada para actualizar");
  }

  const [updated] = await db
    .update(tables)
    .set(patch)
    .where(eq(tables.id, id))
    .returning();
  return updated;
}

async function getAccountItems(tableNumber) {
  const [row] = await db
    .select()
    .from(openTableAccounts)
    .where(eq(openTableAccounts.tableNumber, tableNumber))
    .limit(1);
  return row ? parseItems(row.itemsJson) : [];
}

export async function deleteTable(id) {
  const [existing] = await db.select().from(tables).where(eq(tables.id, id)).limit(1);
  if (!existing) throw new Error("Mesa no encontrada");

  if (existing.number <= DEFAULT_TABLE_COUNT) {
    throw new Error(`Las mesas 1 a ${DEFAULT_TABLE_COUNT} son predeterminadas y no se pueden eliminar`);
  }

  const items = await getAccountItems(existing.number);
  if (items.length > 0 || existing.status === "ocupada" || existing.status === "cerrando") {
    throw new Error("No se puede eliminar una mesa que está consumiendo. Cobrá o vaciá la cuenta primero.");
  }

  await db.delete(openTableAccounts).where(eq(openTableAccounts.tableNumber, existing.number));
  await db.delete(tables).where(eq(tables.id, id));
  return { message: "Mesa eliminada" };
}

export async function setStatusByNumber(tableNumber, status) {
  if (!VALID_STATUS.has(status)) {
    throw new Error("Estado inválido. Usá: libre, ocupada o cerrando");
  }
  const [existing] = await db
    .select()
    .from(tables)
    .where(eq(tables.number, tableNumber))
    .limit(1);
  if (!existing) throw new Error(`Mesa ${tableNumber} no encontrada`);

  const [updated] = await db
    .update(tables)
    .set({ status })
    .where(eq(tables.id, existing.id))
    .returning();
  return updated;
}

/** { [tableNumber]: items[] } */
export async function getAllOpenAccounts() {
  const rows = await db.select().from(openTableAccounts);
  const map = {};
  for (const row of rows) {
    const items = parseItems(row.itemsJson);
    if (items.length > 0) map[row.tableNumber] = items;
  }
  return map;
}

export async function saveOpenAccount(tableNumber, items) {
  const n = Number(tableNumber);
  if (!n || Number.isNaN(n)) throw new Error("Número de mesa inválido");

  const [table] = await db.select().from(tables).where(eq(tables.number, n)).limit(1);
  if (!table) throw new Error(`Mesa ${n} no encontrada`);

  const list = Array.isArray(items) ? items : [];
  const now = new Date().toISOString();

  const [existing] = await db
    .select()
    .from(openTableAccounts)
    .where(eq(openTableAccounts.tableNumber, n))
    .limit(1);

  if (list.length === 0) {
    if (existing) {
      await db.delete(openTableAccounts).where(eq(openTableAccounts.tableNumber, n));
    }
    await db.update(tables).set({ status: "libre" }).where(eq(tables.id, table.id));
    return { tableNumber: n, items: [], status: "libre" };
  }

  const payload = JSON.stringify(list);
  if (existing) {
    await db
      .update(openTableAccounts)
      .set({ itemsJson: payload, updatedAt: now })
      .where(eq(openTableAccounts.tableNumber, n));
  } else {
    await db.insert(openTableAccounts).values({
      tableNumber: n,
      itemsJson: payload,
      updatedAt: now,
    });
  }

  const nextStatus = table.status === "cerrando" ? "cerrando" : "ocupada";
  await db.update(tables).set({ status: nextStatus }).where(eq(tables.id, table.id));
  return { tableNumber: n, items: list, status: nextStatus };
}

export async function clearOpenAccount(tableNumber) {
  return saveOpenAccount(tableNumber, []);
}

/** true si hay alguna mesa con consumo o estado ocupada/cerrando */
export async function hasOpenTableAccounts() {
  const occupied = await db.select().from(tables);
  for (const t of occupied) {
    if (t.status === "ocupada" || t.status === "cerrando") return true;
  }
  const accounts = await db.select().from(openTableAccounts);
  for (const a of accounts) {
    if (parseItems(a.itemsJson).length > 0) return true;
  }
  return false;
}

export async function listOpenTablesSummary() {
  const all = await getAllTables();
  const accounts = await getAllOpenAccounts();
  return all
    .filter((t) => t.status !== "libre" || (accounts[t.number] || []).length > 0)
    .map((t) => ({
      number: t.number,
      name: t.name,
      status: t.status,
      itemsCount: (accounts[t.number] || []).reduce((s, i) => s + (i.quantity || 0), 0),
    }));
}
