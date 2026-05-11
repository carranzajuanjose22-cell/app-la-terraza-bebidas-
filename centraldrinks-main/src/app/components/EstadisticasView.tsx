import { useState } from 'react';
import { BarChart3, DollarSign, Package, Banknote, CreditCard, TrendingDown, Wallet } from 'lucide-react';

export function EstadisticasView() {
  const [period, setPeriod] = useState<'semanal' | 'mensual'>('semanal');

  // Datos mockeados para el ejemplo. Luego se pueden calcular de transacciones reales.
  const dataSemanal = {
    revenue: 115000.00,
    efectivo: 45000.00,
    virtual: 70000.00,
    costoStock: 30000.00,
    gastos: 63750.00, // Proporción de 1 semana aprox
    topProduct: 'Vino Tinto Reserva',
    growth: '+12.5%',
    chart: [
      { label: 'Lun', value: 12150 },
      { label: 'Mar', value: 14040 },
      { label: 'Mié', value: 10260 },
      { label: 'Jue', value: 16470 },
      { label: 'Vie', value: 22950 },
      { label: 'Sáb', value: 29700 },
      { label: 'Dom', value: 9430 },
    ]
  };

  const dataMensual = {
    revenue: 450000.00,
    efectivo: 150000.00,
    virtual: 300000.00,
    costoStock: 120000.00,
    gastos: 255000.00, // Total de gastos fijos configurados
    topProduct: 'Cerveza Artesanal IPA',
    growth: '+8.2%',
    chart: [
      { label: 'Sem 1', value: 100000 },
      { label: 'Sem 2', value: 115000 },
      { label: 'Sem 3', value: 105000 },
      { label: 'Sem 4', value: 130000 },
    ]
  };

  const currentData = period === 'semanal' ? dataSemanal : dataMensual;
  const maxChartValue = Math.max(...currentData.chart.map(d => d.value));
  const balanceNeto = currentData.revenue - currentData.costoStock - currentData.gastos;
  const margenPorcentaje = (balanceNeto / currentData.revenue) * 100;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-4xl mb-2">Estadísticas</h1>
          <p className="text-gray-400">Rendimiento y métricas de tu local</p>
        </div>
        
        {/* Toggle Semanal / Mensual */}
        <div className="bg-[#1a1a1a] p-1 rounded-xl border border-[#2a2a2a] flex gap-1">
          <button
            onClick={() => setPeriod('semanal')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              period === 'semanal' ? 'bg-[#6B21A8] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => setPeriod('mensual')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              period === 'mensual' ? 'bg-[#6B21A8] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Mensual
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-green-500">
            <DollarSign size={20} />
            <h3 className="text-gray-400 font-medium">Ingresos Totales</h3>
          </div>
          <p className="text-white text-3xl font-bold">${currentData.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-green-500 text-sm mt-2">{currentData.growth} vs periodo anterior</p>
        </div>
        
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-green-400">
            <Banknote size={20} />
            <h3 className="text-gray-400 font-medium">En Efectivo</h3>
          </div>
          <p className="text-white text-3xl font-bold">${currentData.efectivo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-gray-500 text-sm mt-2">{((currentData.efectivo / currentData.revenue) * 100).toFixed(1)}% del total</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-blue-400">
            <CreditCard size={20} />
            <h3 className="text-gray-400 font-medium">Virtual</h3>
          </div>
          <p className="text-white text-3xl font-bold">${currentData.virtual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-gray-500 text-sm mt-2">Tarjetas, transferencias y QR</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-[#8B5CF6]">
            <Package size={20} />
            <h3 className="text-gray-400 font-medium">Producto Estrella</h3>
          </div>
          <p className="text-white text-xl font-bold line-clamp-1">{currentData.topProduct}</p>
          <p className="text-[#8B5CF6] text-sm mt-2 mt-auto">Más vendido en el periodo</p>
        </div>
      </div>

      {/* Balance Financiero */}
      <h2 className="text-white text-2xl mb-6 mt-4">Balance Financiero</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-orange-400">
            <Package size={20} />
            <h3 className="text-gray-400 font-medium">Invertido en Stock</h3>
          </div>
          <p className="text-white text-3xl font-bold">-${currentData.costoStock.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-gray-500 text-sm mt-2">Costo de mercadería vendida</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-4 text-red-400">
            <TrendingDown size={20} />
            <h3 className="text-gray-400 font-medium">Gastos Operativos</h3>
          </div>
          <p className="text-white text-3xl font-bold">-${currentData.gastos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-gray-500 text-sm mt-2">Alquiler, servicios, sueldos, etc.</p>
        </div>

        <div className={`rounded-xl p-6 border ${balanceNeto >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className={`flex items-center gap-3 mb-4 ${balanceNeto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <Wallet size={20} />
            <h3 className="font-medium">Balance Neto</h3>
          </div>
          <p className={`text-3xl font-bold ${balanceNeto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {balanceNeto >= 0 ? '+' : '-'}${Math.abs(balanceNeto).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm mt-2 ${balanceNeto >= 0 ? 'text-green-500/70' : 'text-red-500/70'}`}>
            Margen de ganancia: {margenPorcentaje.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Gráfico de Ingresos */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6 mb-8">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="text-[#8B5CF6]" size={24} />
          <h2 className="text-white text-xl font-medium">
            Evolución de Ingresos ({period === 'semanal' ? 'Últimos 7 días' : 'Último mes'})
          </h2>
        </div>
        
        <div className="h-64 flex items-end justify-between gap-2 md:gap-4 mt-8">
          {currentData.chart.map((d, index) => {
            const heightPercentage = Math.max((d.value / maxChartValue) * 100, 5); // min height 5%
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-3 group relative">
                {/* Tooltip on hover */}
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