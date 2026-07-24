const BUSINESS_TZ = "America/Argentina/Buenos_Aires";

/** SQLite/Turso guarda datetime('now') en UTC sin sufijo Z. */
function parseDbDateTime(value) {
  if (!value) return null;
  if (typeof value !== "string") return new Date(value);
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const isoLike = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const d = new Date(`${isoLike}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatBusinessDate(iso) {
  if (!iso) return "—";
  const d = parseDbDateTime(iso);
  if (!d) return "—";
  return d.toLocaleDateString("es-AR", { timeZone: BUSINESS_TZ });
}

export function formatBusinessTime(iso) {
  if (!iso) return "—";
  const d = parseDbDateTime(iso);
  if (!d) return "—";
  return d.toLocaleTimeString("es-AR", {
    timeZone: BUSINESS_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getBusinessDateKey(iso) {
  if (!iso) return null;
  const d = parseDbDateTime(iso);
  if (!d) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${day}`;
}

/** Hora de venta/ticket: prioriza createdAt (UTC) convertido a hora local del negocio. */
export function getTransactionDisplayTime(tx) {
  if (tx?.createdAt) return formatBusinessTime(tx.createdAt);
  return tx?.time || "—";
}
