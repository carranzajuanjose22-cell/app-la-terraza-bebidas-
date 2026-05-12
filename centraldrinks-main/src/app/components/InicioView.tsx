import { useState } from 'react';
import { TrendingUp, Activity, Clock, ShoppingBag, Lock, Unlock, Receipt } from 'lucide-react';
import { toast } from 'sonner';

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
}

interface InicioViewProps {
  isCajaOpen: boolean;
  onOpenCaja: (amount: number) => void;
  onCloseCaja: () => void;
  expenses: FixedExpense[];
  transactions: any[];
}

export function InicioView({ isCajaOpen, onOpenCaja, onCloseCaja, expenses, transactions }: InicioViewProps) {
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('0');

  // Convertimos transacciones reales a ventas recientes (últimas 5)
  const recentSales = transactions.slice(0, 5).map(t => ({
    id: t.id,
    time: t.time,
    total: t.total,
    items: t.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0,
    details: t.items?.map((i: any) => `${i.quantity}x ${i.name}`) || []
  }));
  
  const displaySales = isCajaOpen ? recentSales : [];
  const ventasHoy = isCajaOpen ? transactions.reduce((sum, t) => sum + t.total, 0) : 0;
  const ticketsHoy = isCajaOpen ? transactions.length : 0;
  const promedio = ticketsHoy > 0 ? (ventasHoy / ticketsHoy).toFixed(2) : '0.00';

  // Cálculos para la tarjeta de Gastos Fijos
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const mockMonthlyRevenue = 0; // En el futuro será calculado con ventas reales
  const coveragePercentage = totalExpenses > 0 ? Math.min(100, (mockMonthlyRevenue / totalExpenses) * 100) : 100;
  const isCovered = mockMonthlyRevenue >= totalExpenses;

  const handleConfirmOpen = () => {
    onOpenCaja(Number(openingAmount) || 0);
    setShowOpenModal(false);
    setOpeningAmount('0');
    toast.success('Caja abierta exitosamente');
  };

  const handleConfirmClose = () => {
    onCloseCaja();
    setShowClosureModal(false);
    toast.success('Caja cerrada exitosamente');
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-white text-4xl mb-2">Panel de Inicio</h1>
          <p className="text-gray-400">Resumen en vivo de tu negocio</p>
        </div>
        <div>
          {isCajaOpen ? (
            <button onClick={() => setShowClosureModal(true)} className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
              <Lock size={20} />
              Cerrar Caja
            </button>
          ) : (
            <button onClick={() => setShowOpenModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
              <Unlock size={20} />
              Abrir Caja
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Resumen Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#6B21A8]/10 rounded-full blur-xl"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#6B21A8]/20 p-3 rounded-lg text-[#8B5CF6]">
              <Activity size={24} />
            </div>
            <h3 className="text-gray-400 font-medium">Estado de Caja</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isCajaOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <p className="text-white text-2xl font-bold">
              {isCajaOpen ? 'Operando' : 'Cerrada'}
            </p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-500/10 p-3 rounded-lg text-green-500">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-gray-400 font-medium">Ventas de Hoy</h3>
          </div>
          <p className="text-white text-3xl font-bold">${ventasHoy.toFixed(2)}</p>
          <p className={`${isCajaOpen ? 'text-green-500' : 'text-gray-500'} text-sm mt-2 flex items-center gap-1`}>
            {isCajaOpen && ticketsHoy > 0 ? 'En curso' : 'Sin operaciones'}
          </p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-500/10 p-3 rounded-lg text-blue-500">
              <ShoppingBag size={24} />
            </div>
            <h3 className="text-gray-400 font-medium">Tickets Emitidos</h3>
          </div>
          <p className="text-white text-3xl font-bold">{ticketsHoy}</p>
          <p className="text-gray-500 text-sm mt-2">{isCajaOpen && ticketsHoy > 0 ? `Promedio: $${promedio}/ticket` : 'Sin actividad'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 flex flex-col gap-8">
          {/* Operaciones Recientes */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-white text-xl font-medium">Actividad Reciente</h2>
              <Clock size={20} className="text-gray-500" />
            </div>
            <div className="p-2">
              {displaySales.length > 0 ? (
                displaySales.map((sale) => (
                  <div key={sale.id} className="flex flex-col p-4 hover:bg-[#2a2a2a] rounded-lg transition-colors cursor-pointer border-b border-[#2a2a2a] last:border-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-gray-400">
                          #{sale.id}
                        </div>
                        <div>
                          <p className="text-white font-medium">Venta en salón</p>
                          <p className="text-gray-500 text-sm">{sale.time} • {sale.items} productos</p>
                        </div>
                      </div>
                      <span className="text-[#8B5CF6] font-bold text-lg">+${sale.total.toFixed(2)}</span>
                    </div>
                    
                    {/* Detalle de la venta */}
                    <div className="ml-14 bg-[#121212] rounded-lg p-3 border border-[#2a2a2a]">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">Detalle del ticket:</p>
                      <ul className="text-sm text-gray-300 space-y-1.5">
                        {sale.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6B21A8]"></span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              ) : (
                 <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                   <Clock size={48} className="mb-4 opacity-20" />
                   <p className="text-lg text-white font-medium">{isCajaOpen ? 'No hay operaciones aún' : 'La caja está cerrada'}</p>
                   <p className="text-sm mt-1">{isCajaOpen ? 'Las ventas aparecerán aquí' : 'Abre la caja para comenzar a registrar operaciones'}</p>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Tarjeta de Gastos Fijos */}
        <div className="xl:col-span-1">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <Receipt className="text-blue-500" size={24} />
              <h2 className="text-white text-xl font-medium">Gastos Fijos</h2>
            </div>

            <div className="space-y-4 mb-6 flex-1">
              {expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between">
                  <span className="text-gray-400">{expense.name}</span>
                  <span className="text-white font-medium">${expense.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-[#2a2a2a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Total a cubrir:</span>
                <span className="text-white font-bold">${totalExpenses.toLocaleString()}</span>
              </div>
              
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Ingresos del mes:</span>
                <span className="text-green-400">${mockMonthlyRevenue.toLocaleString()}</span>
              </div>

              <div className="w-full bg-[#2a2a2a] rounded-full h-2.5 mb-2">
                <div 
                  className={`h-2.5 rounded-full ${isCovered ? 'bg-green-500' : 'bg-orange-500'}`} 
                  style={{ width: `${coveragePercentage}%` }}
                ></div>
              </div>
              <p className={`text-xs text-right ${isCovered ? 'text-green-500' : 'text-orange-500'}`}>
                {isCovered ? '¡Gastos cubiertos!' : `${coveragePercentage.toFixed(1)}% cubierto`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Abrir Caja */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-white text-2xl flex items-center gap-2">
                <Unlock size={24} className="text-green-500" /> Abrir Caja
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <label className="text-gray-400 text-sm block">Monto inicial en caja (Cambio)</label>
              <input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-4 border border-[#333] focus:border-green-500 outline-none transition-colors"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setShowOpenModal(false)} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">
                Cancelar
              </button>
              <button onClick={handleConfirmOpen} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl transition-all">
                Confirmar Apertura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cierre Rápido */}
      {showClosureModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-white text-2xl flex items-center gap-2">
                <Lock size={24} className="text-[#8B5CF6]" /> Cierre de Caja Rápido
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-400">
                ¿Estás seguro que deseas cerrar la caja? Para ver el resumen detallado de ingresos y operaciones, dirígete a la pestaña "Caja".
              </p>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setShowClosureModal(false)} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">
                Cancelar
              </button>
              <button onClick={handleConfirmClose} className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] text-white py-4 rounded-xl transition-all">
                Confirmar Cierre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}