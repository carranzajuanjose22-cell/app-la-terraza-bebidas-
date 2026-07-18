import { useState, useEffect, useMemo } from "react";
import { BarChart3, DollarSign, Package, Banknote, CreditCard, TrendingDown, Wallet, Plus, RefreshCw, PackageMinus, Unlock, Lock, Wine, Clock } from "lucide-react";
import api from "../../services/api.js";
import { Loader } from "./Loader.jsx";
import { DailyExpenseModal } from "./DailyExpenseModal.jsx";
import { toast } from "sonner";

const PERIODS = [
  { id: "total", label: "Total" },
  { id: "mensual", label: "Mes" },
  { id: "semanal", label: "Semana" },
  { id: "diario", label: "Día" },
];

const LOG_ICONS = { Unlock, Lock, Wallet, Wine, PackageMinus, Package };

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Lunes 00:00 → domingo 23:59:59 de la semana local. */
function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0=domingo
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function endOfWeek(d = new Date()) {
  const start = startOfWeek(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return endOfDay(end);
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function toYYYYMMDD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Fecha calendario YYYY-MM-DD tal como se guarda/muestra en Caja (sin shift de TZ). */
function dateKey(str) {
  if (!str) return null;
  return str.slice(0, 10);
}

/** Fecha de negocio de una caja: cierre si existe, si no apertura. */
function cajaDateKey(caja) {
  return dateKey(caja.closedAt) || dateKey(caja.openedAt);
}

function inRange(dateStr, from, to) {
  const key = dateKey(dateStr);
  if (!key) return false;
  if (from && key < toYYYYMMDD(from)) return false;
  if (to && key > toYYYYMMDD(to)) return false;
  return true;
}

function cajaInRange(caja, from, to) {
  const key = cajaDateKey(caja);
  if (!key) return false;
  if (from && key < toYYYYMMDD(from)) return false;
  if (to && key > toYYYYMMDD(to)) return false;
  return true;
}

function getPeriodRange(period) {
  const now = new Date();
  if (period === "diario") {
    return { from: startOfDay(now), to: endOfDay(now) };
  }
  if (period === "semanal") {
    return { from: startOfWeek(now), to: endOfWeek(now) };
  }
  if (period === "mensual") {
    return { from: startOfMonth(now), to: endOfMonth(now) };
  }
  // total: sin límite (desde el primer dato de la app)
  return { from: null, to: null };
}

function formatRangeLabel(period, from, to) {
  if (period === "total") return "Desde el inicio de la app";
  if (!from || !to) return "";
  const opts = { day: "numeric", month: "short", year: "numeric" };
  if (period === "diario") {
    return from.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  return `${from.toLocaleDateString("es-AR", opts)} – ${to.toLocaleDateString("es-AR", opts)}`;
}

function buildChartData(period, cajas, rangeFrom, rangeTo) {
  const sumByKey = (keys) => {
    const map = Object.fromEntries(keys.map((k) => [k, 0]));
    for (const c of cajas) {
      const key = cajaDateKey(c);
      if (key != null && key in map) map[key] += Number(c.totalIngresos) || 0;
    }
    return map;
  };

  if (period === "diario") {
    const key = toYYYYMMDD(rangeFrom || new Date());
    const map = sumByKey([key]);
    return [{ label: "Hoy", value: map[key] || 0 }];
  }

  if (period === "semanal") {
    const labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const keys = [];
    const start = rangeFrom || startOfWeek();
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      keys.push(toYYYYMMDD(d));
    }
    const map = sumByKey(keys);
    return labels.map((label, i) => ({ label, value: map[keys[i]] || 0 }));
  }

  if (period === "mensual") {
    const start = rangeFrom || startOfMonth();
    const end = rangeTo || endOfMonth();
    const daysInMonth = end.getDate();
    const keys = [];
    for (let day = 1; day <= daysInMonth; day++) {
      keys.push(toYYYYMMDD(new Date(start.getFullYear(), start.getMonth(), day)));
    }
    const map = sumByKey(keys);
    return keys.map((key, i) => ({
      label: String(i + 1),
      value: map[key] || 0,
    }));
  }

  // total: un mes por barra desde la primera caja hasta hoy
  const now = new Date();
  let earliestKey = null;
  for (const c of cajas) {
    const key = cajaDateKey(c);
    if (key && (!earliestKey || key < earliestKey)) earliestKey = key;
  }
  const earliest = earliestKey
    ? new Date(Number(earliestKey.slice(0, 4)), Number(earliestKey.slice(5, 7)) - 1, 1)
    : startOfMonth(now);

  const cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const buckets = [];
  while (cursor <= endMonth) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, "0")}`;
    buckets.push({
      key,
      label: cursor.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
      value: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const c of cajas) {
    const fullKey = cajaDateKey(c);
    if (!fullKey) continue;
    const key = fullKey.slice(0, 7);
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.value += Number(c.totalIngresos) || 0;
  }

  return buckets.map(({ label, value }) => ({ label, value }));
}

export function EstadisticasView() {
  const [period, setPeriod] = useState("mensual");
  const [cajasCerradas, setCajasCerradas] = useState([]);
  const [cajaAbierta, setCajaAbierta] = useState(null);
  const [gastosFijos, setGastosFijos] = useState([]);
  const [gastosDiarios, setGastosDiarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [restockCost, setRestockCost] = useState(0);
  const [activityLog, setActivityLog] = useState([]);

  const range = useMemo(() => getPeriodRange(period), [period]);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      api.get("/cash-register/closed"),
      api.get("/cash-register/status"),
      api.get("/fixed-expenses"),
      api.get("/daily-expenses"),
      api.get("/products"),
      api.get("/stats/activity-log"),
    ])
      .then(([rCajas, rStatus, rFijos, rDiarios, rProd, rLog]) => {
        if (rCajas.status === "fulfilled") setCajasCerradas(rCajas.value.data || []);
        if (rStatus.status === "fulfilled") {
          setCajaAbierta(rStatus.value.data?.isOpen ? rStatus.value.data.register : null);
        }
        if (rFijos.status === "fulfilled") setGastosFijos(rFijos.value.data || []);
        if (rDiarios.status === "fulfilled") setGastosDiarios(rDiarios.value.data || []);
        if (rProd.status === "fulfilled") setProductos(rProd.value.data || []);
        if (rLog.status === "fulfilled") setActivityLog(rLog.value.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Restock filtrado por el período seleccionado
  useEffect(() => {
    const params = {};
    if (range.from) params.from = toYYYYMMDD(range.from);
    if (range.to) params.to = toYYYYMMDD(range.to);
    api
      .get("/stats/restock", { params })
      .then((r) => setRestockCost(r.data.restockCost || 0))
      .catch(() => setRestockCost(0));
  }, [range.from, range.to, period]);

  const cajasPeriodo = useMemo(() => {
    const closed = (cajasCerradas || []).filter((c) => {
      if (period === "total") return true;
      return cajaInRange(c, range.from, range.to);
    });

    // Incluir caja abierta si su apertura cae en el período (ventas del día en curso)
    if (cajaAbierta && (period === "total" || cajaInRange(cajaAbierta, range.from, range.to))) {
      const already = closed.some((c) => c.id === cajaAbierta.id);
      if (!already) return [...closed, cajaAbierta];
    }
    return closed;
  }, [cajasCerradas, cajaAbierta, period, range.from, range.to]);

  const gastosDiariosPeriodo = useMemo(() => {
    if (period === "total") return gastosDiarios;
    return gastosDiarios.filter((g) => inRange(g.createdAt, range.from, range.to));
  }, [gastosDiarios, period, range.from, range.to]);

  const activityLogPeriodo = useMemo(() => {
    if (period === "total") return activityLog;
    return activityLog.filter((log) => inRange(log.date, range.from, range.to));
  }, [activityLog, period, range.from, range.to]);

  // Gastos fijos: solo en vista Mes y Total (son costos mensuales recurrentes)
  const incluirFijos = period === "mensual" || period === "total";
  const gastosFijosPeriodo = incluirFijos ? gastosFijos : [];

  const revenue = cajasPeriodo.reduce((sum, c) => sum + (c.totalIngresos || 0), 0);
  const efectivo = cajasPeriodo.reduce((sum, c) => sum + (c.totalEfectivo || 0), 0);
  const virtual = cajasPeriodo.reduce((sum, c) => sum + (c.totalTransferencia || 0), 0);

  const chartData = useMemo(
    () => buildChartData(period, cajasPeriodo, range.from, range.to),
    [period, cajasPeriodo, range.from, range.to],
  );

  const totalFijos = gastosFijosPeriodo.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const totalDiarios = gastosDiariosPeriodo.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const totalGastosOperativos = totalFijos + totalDiarios;

  const invertidoStock = productos
    .filter((p) => !p.isPromotion)
    .reduce((sum, p) => sum + ((Number(p.cost) || 0) * (Number(p.stock) || 0)), 0);

  const gastosDiariosEfectivo = gastosDiariosPeriodo
    .filter((g) => g.method === "efectivo")
    .reduce((sum, g) => sum + (Number(g.amount) || 0), 0);

  const gastosDiariosVirtual = gastosDiariosPeriodo
    .filter((g) => g.method === "transferencia")
    .reduce((sum, g) => sum + (Number(g.amount) || 0), 0);

  const disponibleEfectivo = efectivo - gastosDiariosEfectivo;
  const disponibleVirtual = virtual - gastosDiariosVirtual;

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);
  const gananciaBruta = revenue - restockCost;
  const balanceNeto = gananciaBruta - totalGastosOperativos;
  const margenPorcentaje = revenue > 0 ? (balanceNeto / revenue) * 100 : 0;

  const chartTitle =
    period === "total"
      ? "Evolución de Ingresos (histórico)"
      : period === "mensual"
        ? "Evolución de Ingresos (días del mes)"
        : period === "semanal"
          ? "Evolución de Ingresos (lun – dom)"
          : "Ingresos del día";

  const handleDailyExpense = async (expenseData) => {
    try {
      await api.post("/daily-expenses", expenseData);
      toast.success("Gasto registrado correctamente");
      setShowExpenseModal(false);
      const rDiarios = await api.get("/daily-expenses");
      setGastosDiarios(rDiarios.data);
      const rLog = await api.get("/stats/activity-log");
      setActivityLog(rLog.data);
    } catch (err) {
      toast.error("Error al registrar el gasto", { description: err.response?.data?.message || err.message });
      throw err;
    }
  };

  return (
    <div className="flex-1 p-4 pb-20 md:p-8 overflow-y-auto relative">
      {loading && <Loader />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-3">
        <div>
          <h1 className="text-white text-2xl md:text-4xl mb-1 md:mb-2">Estadísticas</h1>
          <p className="text-gray-400 text-sm">Rendimiento y métricas de tu local</p>
          <p className="text-[#8B5CF6] text-xs mt-1 capitalize">
            {formatRangeLabel(period, range.from, range.to)}
          </p>
        </div>
        <div className="bg-[#1a1a1a] p-1 rounded-xl border border-[#2a2a2a] flex flex-wrap gap-1 self-start sm:self-auto">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p.id ? "bg-[#6B21A8] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-green-500"><DollarSign size={20} /><h3 className="text-gray-400 font-medium">Ingresos Totales</h3></div>
          <p className="text-white text-3xl font-bold">${revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-green-400"><Banknote size={20} /><h3 className="text-gray-400 font-medium">En Efectivo</h3></div>
          <p className="text-white text-3xl font-bold">${efectivo.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-gray-500 text-sm mt-2">{revenue > 0 ? ((efectivo / revenue) * 100).toFixed(1) : 0}% del total</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-blue-400"><CreditCard size={20} /><h3 className="text-gray-400 font-medium">Virtual</h3></div>
          <p className="text-white text-3xl font-bold">${virtual.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-gray-500 text-sm mt-2">Tarjetas, transferencias y QR</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-[#8B5CF6]"><RefreshCw size={20} /><h3 className="text-gray-400 font-medium">Gasto de Restock</h3></div>
          <p className="text-white text-3xl font-bold">${restockCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[#8B5CF6] text-sm mt-2">Costo para reponer lo vendido</p>
        </div>
      </div>

      <h2 className="text-white text-2xl mb-6 mt-4">Balance Financiero</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-orange-400"><Package size={20} /><h3 className="text-gray-400 font-medium">Invertido en Stock</h3></div>
          <p className="text-white text-3xl font-bold">${invertidoStock.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-orange-400/70 text-sm mt-2">Valor actual del inventario (costo × stock)</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-red-400">
              <TrendingDown size={20} />
              <h3 className="text-gray-400 font-medium">Gastos Operativos</h3>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="bg-[#2a2a2a] hover:bg-[#333] text-gray-400 hover:text-white p-1.5 rounded-lg transition-colors border border-[#333]"
              title="Registrar Gasto Diario"
            >
              <Plus size={18} />
            </button>
          </div>
          <p className="text-white text-3xl font-bold mb-4">${totalGastosOperativos.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>

          <div className="border-t border-[#2a2a2a] pt-4 mt-auto">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-medium">Detalle de Gastos</p>
            <div className="space-y-3 max-h-32 overflow-y-auto pr-2">
              {gastosFijosPeriodo.length === 0 && gastosDiariosPeriodo.length === 0 && (
                <p className="text-gray-500 text-sm">Sin gastos en este período</p>
              )}
              {gastosFijosPeriodo.map((g) => (
                <div key={`fijo-${g.id}`} className="flex justify-between items-center text-sm p-2.5 bg-[#2a2a2a] rounded-lg border border-[#333]">
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-gray-300 truncate font-medium">Fijo: {g.name}</span>
                    <span className="text-xs text-gray-500">Gasto recurrente mensual</span>
                  </div>
                  <span className="text-red-400 font-bold">-${Number(g.amount).toFixed(2)}</span>
                </div>
              ))}
              {gastosDiariosPeriodo.map((g) => (
                <div key={`diario-${g.id}`} className="flex justify-between items-center text-sm p-2.5 bg-[#2a2a2a] rounded-lg border border-[#333]">
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-gray-300 truncate font-medium">Extracción: {g.reason}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(g.createdAt).toLocaleDateString("es-AR")} • {new Date(g.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span className="text-red-400 font-bold">-${Number(g.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {!incluirFijos && (
              <p className="text-[11px] text-gray-600 mt-2">Los gastos fijos mensuales solo se incluyen en Mes y Total.</p>
            )}
          </div>
        </div>
        <div className={`rounded-xl p-6 border flex flex-col ${balanceNeto >= 0 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
          <div className={`flex items-center gap-3 mb-2 ${balanceNeto >= 0 ? "text-green-400" : "text-red-400"}`}>
            <Wallet size={20} /><h3 className="font-medium">Balance Neto</h3>
          </div>
          <p className={`text-3xl font-bold ${balanceNeto >= 0 ? "text-green-400" : "text-red-400"}`}>
            {balanceNeto >= 0 ? "+" : "-"}${Math.abs(balanceNeto).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm mt-1 mb-4 ${balanceNeto >= 0 ? "text-green-500/70" : "text-red-500/70"}`}>
            Rentabilidad: {margenPorcentaje.toFixed(1)}%
          </p>

          <div className={`border-t pt-4 space-y-2 ${balanceNeto >= 0 ? "border-green-500/20" : "border-red-500/20"}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Desglose</p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Ingresos</span>
              <span className="text-green-400 font-medium">+${revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Costo de mercadería</span>
              <span className="text-[#8B5CF6] font-medium">-${restockCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Gastos operativos</span>
              <span className="text-red-400 font-medium">-${totalGastosOperativos.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className={`border-t pt-4 mt-4 space-y-2 ${balanceNeto >= 0 ? "border-green-500/20" : "border-red-500/20"}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Liquidez Disponible</p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">En Efectivo</span>
              <span className="text-green-400 font-medium">${disponibleEfectivo.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Virtual</span>
              <span className="text-blue-400 font-medium">${disponibleVirtual.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="text-[#8B5CF6]" size={24} />
            <h2 className="text-white text-xl font-medium">{chartTitle}</h2>
          </div>
          <div className={`h-64 flex items-end justify-between gap-1 md:gap-2 mt-8 ${period === "mensual" ? "overflow-x-auto" : ""}`}>
            {chartData.map((d, index) => {
              const heightPercentage = Math.max((d.value / maxChartValue) * 100, d.value > 0 ? 5 : 2);
              return (
                <div key={index} className={`flex flex-col items-center gap-2 group relative ${period === "mensual" ? "min-w-[1.1rem] flex-1" : "flex-1"}`}>
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-xs font-bold py-1 px-2 rounded pointer-events-none z-10 whitespace-nowrap">
                    ${d.value.toFixed(2)}
                  </div>
                  <div
                    className="w-full max-w-[4rem] bg-[#6B21A8] hover:bg-[#8B5CF6] transition-colors rounded-t-sm"
                    style={{ height: `${heightPercentage}%` }}
                  />
                  <span className={`text-gray-400 whitespace-nowrap ${period === "mensual" ? "text-[10px]" : "text-sm"}`}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="text-blue-400" size={24} />
            <h2 className="text-white text-xl font-medium">Historial de Movimientos</h2>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-3 custom-scrollbar">
            {activityLogPeriodo.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay movimientos en este período</p>
            ) : (
              activityLogPeriodo.map((log) => {
                const Icon = LOG_ICONS[log.icon] || Clock;
                return (
                  <div key={log.id} className="bg-[#2a2a2a] rounded-lg p-3 border border-[#333] flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${log.bg} ${log.color} shrink-0`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-300 text-sm font-medium truncate">{log.type}</p>
                      <p className="text-gray-500 text-xs truncate">{log.details}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-gray-400 text-xs block">{new Date(log.date).toLocaleDateString("es-AR")}</span>
                      <span className="text-gray-500 text-[10px]">{new Date(log.date).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showExpenseModal && (
        <DailyExpenseModal
          onClose={() => setShowExpenseModal(false)}
          onSubmit={handleDailyExpense}
        />
      )}
    </div>
  );
}
