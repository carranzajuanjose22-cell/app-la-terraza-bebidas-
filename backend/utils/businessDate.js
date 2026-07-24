/** Zona horaria del negocio (Argentina por defecto). */
export const BUSINESS_TZ = process.env.BUSINESS_TIMEZONE || "America/Argentina/Buenos_Aires";

/** YYYY-MM-DD en la zona horaria del negocio. */
export function getBusinessDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

export function getBusinessDateKeyFromIso(iso) {
  if (!iso) return null;
  const trimmed = iso.trim();
  const d = trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed)
    ? new Date(trimmed)
    : new Date(`${(trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T"))}Z`);
  if (Number.isNaN(d.getTime())) return null;
  return getBusinessDateKey(d);
}

/** HH:MM en la zona horaria del negocio. */
export function getBusinessTimeKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

/** true si la fecha ISO cae en un día de negocio anterior al de referencia. */
export function isPreviousBusinessDay(iso, reference = new Date()) {
  const openedKey = getBusinessDateKeyFromIso(iso);
  const todayKey = getBusinessDateKey(reference);
  if (!openedKey) return false;
  return openedKey < todayKey;
}
