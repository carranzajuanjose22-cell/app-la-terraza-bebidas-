import { useState, useEffect } from "react";
import { BarChart3, DollarSign, Package, Banknote, CreditCard, TrendingDown, Wallet } from "lucide-react";
import api from "../../services/api.js";
import { Loader } from "./Loader.jsx";

export function EstadisticasView() {
  const [period, setPeriod] = useState("semanal");
  const [cajasCerradas, setCajasCerradas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/cash-register/closed")
      .then((r) => setCajasCerradas(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const revenue = cajasCerradas.reduce((sum, c) => sum + (c.totalIngresos || 0), 0);
  const efectivo = cajasCerradas.reduce((sum, c) => sum + (c.totalEfectivo || 0), 0);
  const virtual = cajasCerradas.reduce((sum, c) => sum + (c.totalTransferencia || 0), 0);

  const chartData = period === "semanal"
    ? ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((label) => ({ label, value: 0 }))
    : ["Sem 1", "Sem 2", "Sem 3", "Sem 4"].map((label) => ({ label, value: 0 }));

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);
  const balanceNeto = revenue;
  const margenPorcentaje = 0;

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
          <div className="flex items-center gap-3 mb-4 text-[#8B5CF6]"><Package size={20} /><h3 className="text-gray-400 font-medium">Cajas Cerradas</h3></div>
          <p className="text-white text-xl font-bold">{cajasCerradas.length}</p>
          <p className="text-[#8B5CF6] text-sm mt-2">Total registradas</p>
        </div>
      </div>

      <h2 className="text-white text-2xl mb-6 mt-4">Balance Financiero</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-orange-400"><Package size={20} /><h3 className="text-gray-400 font-medium">Invertido en Stock</h3></div>
          <p className="text-white text-3xl font-bold">$0.00</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-red-400"><TrendingDown size={20} /><h3 className="text-gray-400 font-medium">Gastos Operativos</h3></div>
          <p className="text-white text-3xl font-bold">$0.00</p>
        </div>
        <div className={`rounded-xl p-6 border ${balanceNeto >= 0 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
          <div className={`flex items-center gap-3 mb-4 ${balanceNeto >= 0 ? "text-green-400" : "text-red-400"}`}>
            <Wallet size={20} /><h3 className="font-medium">Balance Neto</h3>
          </div>
          <p className={`text-3xl font-bold ${balanceNeto >= 0 ? "text-green-400" : "text-red-400"}`}>
            {balanceNeto >= 0 ? "+" : "-"}${Math.abs(balanceNeto).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm mt-2 ${balanceNeto >= 0 ? "text-green-500/70" : "text-red-500/70"}`}>
            Margen: {margenPorcentaje.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6 mb-8">
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
    </div>
  );
}
