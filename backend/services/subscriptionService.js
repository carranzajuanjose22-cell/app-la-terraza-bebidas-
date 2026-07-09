import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { subscriptionConfig } from "../models/schema.js";

/**
 * Calcula la PRÓXIMA fecha de vencimiento a partir de HOY para el día de corte dado.
 *
 * Regla: si hoy < díaDeCorte en el mes actual  → vence este mes (díaDeCorte).
 *        si hoy >= díaDeCorte en el mes actual → vence el mes siguiente (díaDeCorte).
 *
 * Esto garantiza que si hoy es 7 y el corte es 2, el próximo vencimiento
 * sea el 2 del mes siguiente, nunca el 2 del mes actual que ya pasó.
 */
function calcNextExpiry(day) {
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const currentDay = today.getDate();

  // Ajustar el día por si el mes no tiene suficientes días (ej: día 31 en febrero)
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const adjustedDay = Math.min(day, daysInCurrentMonth);

  if (currentDay < adjustedDay) {
    // El corte de este mes todavía no llegó → vence este mes, final del día
    return new Date(year, month, adjustedDay, 23, 59, 59).toISOString();
  }

  // Ya pasamos (o es hoy) el corte de este mes → siguiente mes
  const nextMonthIndex = month + 1;
  const nextYear  = nextMonthIndex > 11 ? year + 1 : year;
  const nextMonth = nextMonthIndex % 12;
  const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
  const nextAdjustedDay = Math.min(day, daysInNextMonth);

  return new Date(nextYear, nextMonth, nextAdjustedDay, 23, 59, 59).toISOString();
}

export async function getStatus() {
  const [config] = await db
    .select()
    .from(subscriptionConfig)
    .where(eq(subscriptionConfig.id, 1))
    .limit(1);

  if (!config || !config.subscriptionDay || !config.nextExpiry) {
    return {
      isConfigured: false,
      subscriptionDay: null,
      nextExpiry: null,
      isExpired: false,
      isWarning: false,
      daysRemaining: null,
    };
  }

  const now    = new Date();
  const expiry = new Date(config.nextExpiry);
  const diffMs = expiry.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isExpired = now > expiry;
  const isWarning = !isExpired && daysRemaining <= 5;

  return {
    isConfigured: true,
    subscriptionDay: config.subscriptionDay,
    nextExpiry: config.nextExpiry,
    isExpired,
    isWarning,
    daysRemaining: Math.max(0, daysRemaining),
  };
}

export async function configure(day) {
  const nextExpiry = calcNextExpiry(day);

  await db
    .insert(subscriptionConfig)
    .values({ id: 1, subscriptionDay: day, nextExpiry, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: subscriptionConfig.id,
      set: { subscriptionDay: day, nextExpiry, updatedAt: new Date().toISOString() },
    });

  return getStatus();
}

export async function renew() {
  const [config] = await db
    .select()
    .from(subscriptionConfig)
    .where(eq(subscriptionConfig.id, 1))
    .limit(1);

  if (!config || !config.subscriptionDay) {
    throw new Error("No hay suscripción configurada");
  }

  const nextExpiry = calcNextExpiry(config.subscriptionDay);

  await db
    .update(subscriptionConfig)
    .set({ nextExpiry, updatedAt: new Date().toISOString() })
    .where(eq(subscriptionConfig.id, 1));

  return getStatus();
}
