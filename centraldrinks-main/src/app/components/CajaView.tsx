import { useState, Fragment } from 'react';
import { Lock, Calendar, Clock, Unlock, Eye } from 'lucide-react';
import { toast } from 'sonner';

export interface Transaction {
  id: string;
  date: string;
  time: string;
  total: number;
  payments: { type: string; amount: number }[];
  items?: {
    name: string;
    quantity: number;
    total: number;
  }[];
}

export interface CajaCerrada {
  id: string;
  date: string;
  time: string;
  initialCash: number;
  totalEfectivo: number;
  totalTransferencia: number;
  totalIngresos: number;
  transactionsCount: number;
  soldItems: {
    name: string;
    quantity: number;
    total: number;
  }[];
}

interface CajaViewProps {
  role?: 'admin' | 'cajero';
  isCajaOpen: boolean;
  onOpenCaja: (amount: number) => void;
  onCloseCaja: () => void;
  initialCash: number;
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  cajasCerradas: CajaCerrada[];
  setCajasCerradas: (c: CajaCerrada[]) => void;
}

export function CajaView({ 
  role = 'admin', 
  isCajaOpen, 
  onOpenCaja, 
  onCloseCaja, 
  initialCash,
  transactions,
  setTransactions,
  cajasCerradas,
  setCajasCerradas
}: CajaViewProps) {
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('0');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchDate, setSearchDate] = useState('');

  const totalIngresos = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalEfectivo = transactions.reduce((sum, t) =>
    sum + t.payments.filter(p => p.type === 'efectivo').reduce((s, p) => s + p.amount, 0), 0
  );
  const totalTransferencia = transactions.reduce((sum, t) =>
    sum + t.payments.filter(p => p.type === 'transferencia').reduce((s, p) => s + p.amount, 0), 0
  );

  const handleCloseCaja = () => {
    toast.success('Caja cerrada exitosamente', {
      description: `Total del día: $${totalIngresos.toFixed(2)}`,
    });
    setShowClosureModal(false);
    onCloseCaja();
  };

  const handleConfirmOpen = () => {
    onOpenCaja(Number(openingAmount) || 0);
    setShowOpenModal(false);
    setOpeningAmount('0');
    toast.success('Caja abierta exitosamente');
  };

  const filteredCajas = searchDate ? cajasCerradas.filter(caja => caja.date === searchDate) : cajasCerradas;

  return (
    <div className="flex-1 p-8 overflow-y-auto relative">
      {/* Capa de desenfoque para el cajero si la caja está cerrada */}
      {role === 'cajero' && !isCajaOpen && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-[#121212]/60 flex items-center justify-center">
          <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#2a2a2a] text-center max-w-md shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Caja Cerrada</h2>
            <p className="text-gray-400">
              Caja cerrada, pedile al administrador que abra la caja.
            </p>
          </div>
        </div>
      )}

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-white text-4xl mb-2 flex items-center gap-4">
            Control de Caja
            {isCajaOpen ? (
              <span className="text-sm bg-green-500/20 text-green-400 px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div> Abierta
              </span>
            ) : (
              <span className="text-sm bg-red-500/20 text-red-400 px-3 py-1 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400"></div> Cerrada
              </span>
            )}
          </h1>
          <p className="text-gray-400">
            {isCajaOpen ? `Fondo inicial para cambio: $${initialCash.toFixed(2)}` : 'Resumen financiero del día'}
          </p>
        </div>
      </div>

      {role === 'admin' ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <h2 className="text-white text-2xl">Historial de Cajas Cerradas</h2>
              <input 
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="bg-[#1a1a1a] text-gray-400 rounded-lg px-4 py-2 border border-[#2a2a2a] focus:border-[#6B21A8] outline-none text-sm cursor-pointer"
              />
            </div>
            {isCajaOpen ? (
              <button
                onClick={() => setShowClosureModal(true)}
                className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
              >
                <Lock size={20} />
                Cerrar Caja
              </button>
            ) : (
              <button
                onClick={() => setShowOpenModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
              >
                <Unlock size={20} />
                Abrir Caja
              </button>
            )}
          </div>

          <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left text-gray-400 p-4">Fecha</th>
                  <th className="text-left text-gray-400 p-4">Hora Cierre</th>
                  <th className="text-left text-gray-400 p-4">Total Ingresos</th>
                  <th className="text-right text-gray-400 p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCajas.length > 0 ? (
                  filteredCajas.map(caja => (
                    <Fragment key={caja.id}>
                      <tr className={`border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors ${expandedId === caja.id ? 'bg-[#2a2a2a]' : ''}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-white">
                            <Calendar size={16} className="text-gray-400" />
                            {caja.date}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-white">
                            <Clock size={16} className="text-gray-400" />
                            {caja.time}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-white font-bold">${caja.totalIngresos.toFixed(2)}</span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setExpandedId(expandedId === caja.id ? null : caja.id)}
                            className="text-gray-400 hover:text-white transition-colors p-2"
                          >
                            <Eye size={20} />
                          </button>
                        </td>
                      </tr>
                      {expandedId === caja.id && (
                        <tr className="border-b border-[#2a2a2a] bg-[#121212]">
                          <td colSpan={4} className="p-6">
                            <h4 className="text-white font-medium mb-4">Detalle de Caja Cerrada</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2a2a]">
                                <p className="text-gray-400 text-sm mb-1">Fondo Inicial</p>
                                <p className="text-white font-bold text-lg">${caja.initialCash.toFixed(2)}</p>
                              </div>
                              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2a2a]">
                                <p className="text-gray-400 text-sm mb-1">Efectivo Cobrado</p>
                                <p className="text-green-400 font-bold text-lg">${caja.totalEfectivo.toFixed(2)}</p>
                              </div>
                              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2a2a]">
                                <p className="text-gray-400 text-sm mb-1">Transferencias</p>
                                <p className="text-blue-400 font-bold text-lg">${caja.totalTransferencia.toFixed(2)}</p>
                              </div>
                              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2a2a]">
                                <p className="text-gray-400 text-sm mb-1">Total Operaciones</p>
                                <p className="text-white font-bold text-lg">{caja.transactionsCount}</p>
                              </div>
                            </div>

                            <div className="mt-6">
                              <h5 className="text-white font-medium mb-3">Productos Vendidos en la Jornada</h5>
                              <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-[#2a2a2a]">
                                    <tr>
                                      <th className="text-left text-gray-400 p-3 font-medium">Producto</th>
                                      <th className="text-center text-gray-400 p-3 font-medium">Cantidad</th>
                                      <th className="text-right text-gray-400 p-3 font-medium">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {caja.soldItems && caja.soldItems.length > 0 ? (
                                      caja.soldItems.map((item, idx) => (
                                        <tr key={idx} className="border-t border-[#2a2a2a]">
                                          <td className="p-3 text-white">{item.name}</td>
                                          <td className="p-3 text-center text-gray-400">{item.quantity}</td>
                                          <td className="p-3 text-right text-white font-medium">${item.total.toFixed(2)}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={3} className="p-4 text-center text-gray-500">
                                          No hay detalles de productos para esta caja.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No se encontraron cajas cerradas en la fecha seleccionada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-2xl">Movimientos de Caja Actual</h2>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left text-gray-400 p-4">Hora</th>
                  <th className="text-left text-gray-400 p-4">Método de Pago</th>
                  <th className="text-right text-gray-400 p-4">Total</th>
                  <th className="text-right text-gray-400 p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isCajaOpen && transactions.length > 0 ? (
                  transactions.map(t => (
                    <Fragment key={t.id}>
                      <tr className={`border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors ${expandedId === t.id ? 'bg-[#2a2a2a]' : ''}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-white">
                            <Clock size={16} className="text-gray-400" />
                            {t.time}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {t.payments.map((payment, idx) => (
                              <span
                                key={idx}
                                className={`px-3 py-1 rounded-full text-sm ${
                                  payment.type.toLowerCase().includes('efectivo')
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-blue-500/20 text-blue-400'
                                }`}
                              >
                                {payment.type}: ${payment.amount.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right text-white font-bold">
                          ${t.total.toFixed(2)}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                            className="text-gray-400 hover:text-white transition-colors p-2"
                          >
                            <Eye size={20} />
                          </button>
                        </td>
                      </tr>
                      {expandedId === t.id && (
                        <tr className="border-b border-[#2a2a2a] bg-[#121212]">
                          <td colSpan={4} className="p-6">
                            <h5 className="text-white font-medium mb-3">Detalle de la Transacción</h5>
                            <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-[#2a2a2a]">
                                  <tr>
                                    <th className="text-left text-gray-400 p-3 font-medium">Producto</th>
                                    <th className="text-center text-gray-400 p-3 font-medium">Cantidad</th>
                                    <th className="text-right text-gray-400 p-3 font-medium">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {t.items && t.items.length > 0 ? (
                                    t.items.map((item, idx) => (
                                      <tr key={idx} className="border-t border-[#2a2a2a]">
                                        <td className="p-3 text-white">{item.name}</td>
                                        <td className="p-3 text-center text-gray-400">{item.quantity}</td>
                                        <td className="p-3 text-right text-white font-medium">${item.total.toFixed(2)}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={3} className="p-4 text-center text-gray-500">
                                        Detalle de productos no disponible.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">
                      {isCajaOpen ? 'Aún no hay movimientos registrados.' : 'La caja está cerrada.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showClosureModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-white text-2xl">Cierre de Caja</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-[#2a2a2a] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-[#333]">
                  <span className="text-gray-400">Fecha:</span>
                  <span className="text-white font-bold">
                    {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-[#333]">
                  <span className="text-gray-400">Transacciones:</span>
                  <span className="text-white font-bold">{transactions.length}</span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-[#333]">
                  <span className="text-gray-400">Fondo Inicial:</span>
                  <span className="text-white font-bold">${initialCash.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-[#333]">
                  <span className="text-gray-400">Efectivo en Caja (Ventas + Fondo):</span>
                  <span className="text-green-400 font-bold">${(totalEfectivo + initialCash).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-[#333]">
                  <span className="text-gray-400">Total Transferencia:</span>
                  <span className="text-blue-400 font-bold">${totalTransferencia.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-white text-xl">Total del Día:</span>
                  <span className="text-[#8B5CF6] text-3xl font-bold">${totalIngresos.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button
                onClick={() => setShowClosureModal(false)}
                className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseCaja}
                className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] text-white py-4 rounded-xl transition-all"
              >
                Confirmar Cierre e Imprimir Resumen
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
