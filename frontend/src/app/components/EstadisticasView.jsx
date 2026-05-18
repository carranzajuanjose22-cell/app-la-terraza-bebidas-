import { useState, useEffect } from "react";
import { BarChart3, DollarSign, Package, Banknote, CreditCard, TrendingDown, Wallet, Plus, RefreshCw, PackageMinus, Unlock, Lock, Wine, Clock } from "lucide-react";
import api from "../../services/api.js";
import { Loader } from "./Loader.jsx";
import { DailyExpenseModal } from "./DailyExpenseModal.jsx";
import { toast } from "sonner";

export function EstadisticasView() {
  const [period, setPeriod] = useState("semanal");
  const [cajasCerradas, setCajasCerradas] = useState([]);
  const [gastosFijos, setGastosFijos] = useState([]);
  const [gastosDiarios, setGastosDiarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [restockCost, setRestockCost] = useState(0);
  const [activityLog, setActivityLog] = useState([]);

  const LOG_ICONS = {
    Unlock,
    Lock,
    Wallet,
    Wine,
    PackageMinus,
    Package
  };

  useEffect(() => {
    setLoading(true);
    // Usamos allSettled para evitar que fallos en un endpoint afecten toda la vista
    Promise.allSettled([
      api.get("/cash-register/closed"),
      api.get("/fixed-expenses"),
      api.get("/daily-expenses"),
      api.get("/products"),
      api.get("/stats/restock"),
      api.get("/stats/activity-log")
    ])
      .then(([rCajas, rFijos, rDiarios, rProd, rRestock, rLog]) => {
        if (rCajas.status === "fulfilled") setCajasCerradas(rCajas.value.data);
        if (rFijos.status === "fulfilled") setGastosFijos(rFijos.value.data);
        if (rDiarios.status === "fulfilled") setGastosDiarios(rDiarios.value.data);
        if (rProd.status === "fulfilled") setProductos(rProd.value.data);
        if (rRestock.status === "fulfilled") setRestockCost(rRestock.value.data.restockCost || 0);
        if (rLog.status === "fulfilled") setActivityLog(rLog.value.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const revenue = cajasCerradas.reduce((sum, c) => sum + (c.totalIngresos || 0), 0);
  const efectivo = cajasCerradas.reduce((sum, c) => sum + (c.totalEfectivo || 0), 0);
  const virtual = cajasCerradas.reduce((sum, c) => sum + (c.totalTransferencia || 0), 0);

  const chartData = period === "semanal"
    ? ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((label) => ({ label, value: 0 }))
    : ["Sem 1", "Sem 2", "Sem 3", "Sem 4"].map((label) => ({ label, value: 0 }));

  const totalFijos = gastosFijos.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const totalDiarios = gastosDiarios.reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const totalGastosOperativos = totalFijos + totalDiarios;

  // Calculamos el valor real del inventario basado en el costo y stock actual
  const invertidoStock = productos.reduce((sum, p) => sum + ((Number(p.cost) || 0) * (Number(p.stock) || 0)), 0);

  // Separamos los gastos diarios (extracciones) por método para calcular la liquidez
  const gastosDiariosEfectivo = gastosDiarios
    .filter((g) => g.method === "efectivo")
    .reduce((sum, g) => sum + (Number(g.amount) || 0), 0);

  const gastosDiariosVirtual = gastosDiarios
    .filter((g) => g.method === "transferencia")
    .reduce((sum, g) => sum + (Number(g.amount) || 0), 0);

  const disponibleEfectivo = efectivo - gastosDiariosEfectivo;
  const disponibleVirtual = virtual - gastosDiariosVirtual;

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);
  // El Balance Neto ahora considera Ingresos - Gastos Operativos (sin restar el stock invertido)
  const balanceNeto = revenue - totalGastosOperativos;
  const margenPorcentaje = revenue > 0 ? (balanceNeto / revenue) * 100 : 0;

  const handleDailyExpense = async (expenseData) => {
    try {
      await api.post("/daily-expenses", expenseData);
      toast.success("Gasto registrado correctamente");
      setShowExpenseModal(false);
      // Refresca la lista de gastos para mostrar el nuevo en el historial
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
    <div className="flex-1 p-8 overflow-y-auto relative">
      {loading && <Loader />}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-4xl mb-2">Estadísticas</h1>
          <p className="text-gray-400">Rendimiento y métricas de tu local</p>
        </div>
        <div className="bg-[#1a1a1a] p-1 rounded-xl border border-[#2a2a2a] flex gap-1">
          {["semanal", "mensual"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${period === p ? "bg-[#6B21A8] text-white" : "text-gray-400 hover:text-white"}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
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
              {gastosFijos.length === 0 && gastosDiarios.length === 0 && (
                <p className="text-gray-500 text-sm">Sin gastos registrados</p>
              )}
              {gastosFijos.map((g) => (
                <div key={`fijo-${g.id}`} className="flex justify-between items-center text-sm p-2.5 bg-[#2a2a2a] rounded-lg border border-[#333]">
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-gray-300 truncate font-medium">Fijo: {g.name}</span>
                    <span className="text-xs text-gray-500">Gasto recurrente</span>
                  </div>
                  <span className="text-red-400 font-bold">-${Number(g.amount).toFixed(2)}</span>
                </div>
              ))}
              {gastosDiarios.map((g) => (
                <div key={`diario-${g.id}`} className="flex justify-between items-center text-sm p-2.5 bg-[#2a2a2a] rounded-lg border border-[#333]">
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-gray-300 truncate font-medium">Extracción: {g.reason}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(g.createdAt).toLocaleDateString("es-AR")} • {new Date(g.createdAt).toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-red-400 font-bold">-${Number(g.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={`rounded-xl p-6 border flex flex-col ${balanceNeto >= 0 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
          <div className={`flex items-center gap-3 mb-2 ${balanceNeto >= 0 ? "text-green-400" : "text-red-400"}`}>
            <Wallet size={20} /><h3 className="font-medium">Balance Neto Global</h3>
          </div>
          <p className={`text-3xl font-bold ${balanceNeto >= 0 ? "text-green-400" : "text-red-400"}`}>
            {balanceNeto >= 0 ? "+" : "-"}${Math.abs(balanceNeto).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm mt-1 mb-4 ${balanceNeto >= 0 ? "text-green-500/70" : "text-red-500/70"}`}>
            Rentabilidad: {margenPorcentaje.toFixed(1)}%
          </p>

          <div className={`border-t pt-4 mt-auto space-y-2 ${balanceNeto >= 0 ? "border-green-500/20" : "border-red-500/20"}`}>
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
            <h2 className="text-white text-xl font-medium">
              Evolución de Ingresos ({period === "semanal" ? "Últimos 7 días" : "Último mes"})
            </h2>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 md:gap-4 mt-8">
            {chartData.map((d, index) => {
              const heightPercentage = Math.max((d.value / maxChartValue) * 100, 5);
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-3 group relative">
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-xs font-bold py-1 px-2 rounded pointer-events-none">
                    ${d.value.toFixed(2)}
                  </div>
                  <div className="w-full max-w-[4rem] bg-[#6B21A8] hover:bg-[#8B5CF6] transition-colors rounded-t-sm" style={{ height: `${heightPercentage}%` }}></div>
                  <span className="text-sm text-gray-400 whitespace-nowrap">{d.label}</span>
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
            {activityLog.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay movimientos registrados</p>
            ) : (
              activityLog.map((log) => {
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
                    <span className="text-gray-500 text-[10px]">{new Date(log.date).toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' })}</span>
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
