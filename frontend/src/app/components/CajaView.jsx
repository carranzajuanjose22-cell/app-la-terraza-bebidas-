import { useState, useEffect, Fragment } from "react";
import { Lock, Calendar, Clock, Unlock, Eye } from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api.js";
import { Loader } from "./Loader.jsx";

export function CajaView({ role = "admin", isCajaOpen, register, onOpenCaja, onCloseCaja, transactions, onRefresh }) {
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [searchDate, setSearchDate] = useState("");
  const [cajasCerradas, setCajasCerradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  useEffect(() => {
    if (role === "admin") {
      setLoading(true);
      api.get("/cash-register/closed")
        .then((r) => setCajasCerradas(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [role, isCajaOpen]);

  const totalIngresos = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalEfectivo = transactions.reduce((sum, t) =>
    sum + t.payments.filter((p) => p.type.toLowerCase().includes("efectivo")).reduce((s, p) => s + p.amount, 0), 0
  );
  const totalTransferencia = transactions.reduce((sum, t) =>
    sum + t.payments.filter((p) => !p.type.toLowerCase().includes("efectivo")).reduce((s, p) => s + p.amount, 0), 0
  );

  const handleCloseCaja = async () => {
    try {
      await onCloseCaja();
      setShowClosureModal(false);
      toast.success("Caja cerrada exitosamente", { description: `Total del día: $${totalIngresos.toFixed(2)}` });
      const r = await api.get("/cash-register/closed");
      setCajasCerradas(r.data);
    } catch (err) { toast.error(err.response?.data?.message || "Error al cerrar caja"); }
  };

  const handleConfirmOpen = async () => {
    try {
      await onOpenCaja(Number(openingAmount) || 0);
      setShowOpenModal(false);
      setOpeningAmount("0");
      toast.success("Caja abierta exitosamente");
    } catch (err) { toast.error(err.response?.data?.message || "Error al abrir caja"); }
  };

  const handleToggleCajaDetail = async (cajaId) => {
    if (expandedId === cajaId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(cajaId);
    const current = cajasCerradas.find((c) => c.id === cajaId);
    if (current?.soldItems) return;
    setLoadingDetailId(cajaId);
    try {
      const { data } = await api.get(`/cash-register/closed/${cajaId}`);
      setCajasCerradas((prev) => prev.map((c) => (c.id === cajaId ? { ...c, ...data } : c)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al cargar el detalle de la caja");
    } finally {
      setLoadingDetailId(null);
    }
  };

  const filteredCajas = searchDate
    ? cajasCerradas.filter((c) => c.closedAt && c.closedAt.startsWith(searchDate))
    : cajasCerradas;

  const initialCash = register?.initialCash || 0;

  return (
    <div className="flex-1 p-4 pb-20 md:p-8 overflow-y-auto relative">
      {loading && <Loader />}
      {role === "cajero" && !isCajaOpen && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-[#121212]/60 flex items-center justify-center">
          <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#2a2a2a] text-center max-w-md shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32} /></div>
            <h2 className="text-white text-2xl font-bold mb-2">Caja Cerrada</h2>
            <p className="text-gray-400">Pedile al administrador que abra la caja.</p>
          </div>
        </div>
      )}

      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-white text-2xl md:text-4xl mb-2 flex flex-wrap items-center gap-3 md:gap-4">
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
          <p className="text-gray-400">{isCajaOpen ? `Fondo inicial: $${initialCash.toFixed(2)}` : "Resumen financiero del día"}</p>
        </div>
      </div>

      {role === "admin" ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-white text-lg md:text-2xl">Historial de Cajas Cerradas</h2>
              <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="bg-[#1a1a1a] text-gray-400 rounded-lg px-4 py-2 border border-[#2a2a2a] focus:border-[#6B21A8] outline-none text-sm cursor-pointer w-full sm:w-auto" />
            </div>
            {isCajaOpen ? (
              <button onClick={() => setShowClosureModal(true)} className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl flex items-center gap-2 transition-all text-sm md:text-base self-start sm:self-auto">
                <Lock size={18} /> Cerrar Caja
              </button>
            ) : (
              <button onClick={() => setShowOpenModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl flex items-center gap-2 transition-all text-sm md:text-base self-start sm:self-auto">
                <Unlock size={18} /> Abrir Caja
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
                  filteredCajas.map((caja) => (
                    <Fragment key={caja.id}>
                      <tr className={`border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors ${expandedId === caja.id ? "bg-[#2a2a2a]" : ""}`}>
                        <td className="p-4"><div className="flex items-center gap-2 text-white"><Calendar size={16} className="text-gray-400" />{caja.closedAt?.split("T")[0] || "-"}</div></td>
                        <td className="p-4"><div className="flex items-center gap-2 text-white"><Clock size={16} className="text-gray-400" />{caja.closedAt ? new Date(caja.closedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "-"}</div></td>
                        <td className="p-4"><span className="text-white font-bold">${Number(caja.totalIngresos || 0).toFixed(2)}</span></td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleToggleCajaDetail(caja.id)} className="text-gray-400 hover:text-white transition-colors p-2"><Eye size={20} /></button>
                        </td>
                      </tr>
                      {expandedId === caja.id && (
                        <tr className="border-b border-[#2a2a2a] bg-[#121212]">
                          <td colSpan={4} className="p-6">
                            {loadingDetailId === caja.id && (
                              <p className="text-gray-400 text-sm mb-4">Cargando detalle…</p>
                            )}
                            <h4 className="text-white font-medium mb-4">Detalle de Caja Cerrada</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                              {[
                                { label: "Fondo Inicial", value: `$${Number(caja.initialCash || 0).toFixed(2)}`, color: "text-white" },
                                { label: "Efectivo de Ventas", value: `$${Number(caja.totalEfectivo || 0).toFixed(2)}`, color: "text-green-400" },
                                { label: "Transferencias / Otros", value: `$${Number(caja.totalTransferencia || 0).toFixed(2)}`, color: "text-blue-400" },
                                { label: "Total Operaciones", value: caja.transactionsCount, color: "text-white" },
                              ].map(({ label, value, color }) => (
                                <div key={label} className="bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2a2a]">
                                  <p className="text-gray-400 text-sm mb-1">{label}</p>
                                  <p className={`${color} font-bold text-lg`}>{value}</p>
                                </div>
                              ))}
                            </div>

                            {/* Desglose de recargos */}
                            {caja.surchargeBreakdown && caja.surchargeBreakdown.length > 0 && (
                              <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                                <p className="text-orange-400 font-medium mb-2">Recargos aplicados</p>
                                <div className="space-y-1">
                                  {caja.surchargeBreakdown.map((s, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="text-gray-300">{s.method}</span>
                                      <span className="text-orange-300 font-medium">+${Number(s.amount).toFixed(2)}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between text-sm pt-2 border-t border-orange-500/20 mt-2">
                                    <span className="text-orange-400 font-semibold">Total recargos cobrados</span>
                                    <span className="text-orange-400 font-bold">+${Number(caja.totalSurcharges || 0).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {caja.soldItems && caja.soldItems.length > 0 && (
                              <div className="mt-6">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-white font-medium">Productos Vendidos</h5>
                                  {caja.totalSurcharges > 0 && (
                                    <span className="text-xs text-gray-400 italic">Los totales son precio base sin recargo</span>
                                  )}
                                </div>
                                <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-[#2a2a2a]">
                                      <tr>
                                        <th className="text-left text-gray-400 p-3">Producto</th>
                                        <th className="text-center text-gray-400 p-3">Cantidad</th>
                                        <th className="text-right text-gray-400 p-3">Subtotal (base)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {caja.soldItems.map((item, idx) => (
                                        <tr key={idx} className="border-t border-[#2a2a2a]">
                                          <td className="p-3 text-white">{item.name}</td>
                                          <td className="p-3 text-center text-gray-400">{item.quantity}</td>
                                          <td className="p-3 text-right text-white">${Number(item.total).toFixed(2)}</td>
                                        </tr>
                                      ))}
                                      {/* Fila de subtotal base */}
                                      <tr className="border-t-2 border-[#333] bg-[#2a2a2a]">
                                        <td className="p-3 text-gray-400 font-medium" colSpan={2}>Subtotal productos</td>
                                        <td className="p-3 text-right text-white font-bold">
                                          ${caja.soldItems.reduce((s, i) => s + Number(i.total), 0).toFixed(2)}
                                        </td>
                                      </tr>
                                      {caja.totalSurcharges > 0 && (
                                        <tr className="bg-[#2a2a2a]">
                                          <td className="p-3 text-orange-400 font-medium" colSpan={2}>Recargos cobrados</td>
                                          <td className="p-3 text-right text-orange-400 font-bold">+${Number(caja.totalSurcharges).toFixed(2)}</td>
                                        </tr>
                                      )}
                                      <tr className="bg-[#2a2a2a]">
                                        <td className="p-3 text-[#8B5CF6] font-bold text-base" colSpan={2}>Total Ingresos del Día</td>
                                        <td className="p-3 text-right text-[#8B5CF6] font-bold text-base">${Number(caja.totalIngresos || 0).toFixed(2)}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-500">No se encontraron cajas cerradas.</td></tr>
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
                  transactions.map((t) => (
                    <Fragment key={t.id}>
                      <tr className={`border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors ${expandedId === t.id ? "bg-[#2a2a2a]" : ""}`}>
                        <td className="p-4"><div className="flex items-center gap-2 text-white"><Clock size={16} className="text-gray-400" />{t.time}</div></td>
                        <td className="p-4">
                          <div className="flex gap-2 flex-wrap">
                            {t.payments.map((payment, idx) => {
                              const isEfectivo = payment.type.toLowerCase().includes("efectivo");
                              const hasSurcharge = payment.surchargePercent > 0;
                              return (
                                <span key={idx} className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${isEfectivo ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                                  {payment.type}: ${Number(payment.amount).toFixed(2)}
                                  {hasSurcharge && (
                                    <span className="text-orange-400 text-xs">(+{payment.surchargePercent}%)</span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-4 text-right text-white font-bold">${Number(t.total).toFixed(2)}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => setExpandedId(expandedId === t.id ? null : t.id)} className="text-gray-400 hover:text-white transition-colors p-2"><Eye size={20} /></button>
                        </td>
                      </tr>
                      {expandedId === t.id && t.items && (
                        <tr className="border-b border-[#2a2a2a] bg-[#121212]">
                          <td colSpan={4} className="p-6">
                            <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-[#2a2a2a]"><tr><th className="text-left text-gray-400 p-3">Producto</th><th className="text-center text-gray-400 p-3">Cant.</th><th className="text-right text-gray-400 p-3">Total</th></tr></thead>
                                <tbody>
                                  {t.items.map((item, idx) => (
                                    <tr key={idx} className="border-t border-[#2a2a2a]">
                                      <td className="p-3 text-white">{item.name}</td>
                                      <td className="p-3 text-center text-gray-400">{item.quantity}</td>
                                      <td className="p-3 text-right text-white">${Number(item.total).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-500">{isCajaOpen ? "Aún no hay movimientos." : "La caja está cerrada."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showClosureModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a]"><h2 className="text-white text-2xl">Cierre de Caja</h2></div>
            <div className="p-6 space-y-6">
              <div className="bg-[#2a2a2a] rounded-xl p-6 space-y-4">
                {[
                  { label: "Fecha:", value: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) },
                  { label: "Transacciones:", value: transactions.length },
                  { label: "Fondo Inicial:", value: `$${initialCash.toFixed(2)}` },
                  { label: "Efectivo Cobrado (Ventas):", value: `$${totalEfectivo.toFixed(2)}`, color: "text-green-400" },
                  { label: "Efectivo Total en Caja:", value: `$${(totalEfectivo + initialCash).toFixed(2)}`, color: "text-green-400" },
                  { label: "Transferencias / Otros:", value: `$${totalTransferencia.toFixed(2)}`, color: "text-blue-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between pb-4 border-b border-[#333]">
                    <span className="text-gray-400">{label}</span>
                    <span className={`font-bold ${color || "text-white"}`}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-white text-xl">Total del Día:</span>
                  <span className="text-[#8B5CF6] text-3xl font-bold">${totalIngresos.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setShowClosureModal(false)} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">Cancelar</button>
              <button onClick={handleCloseCaja} className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] text-white py-4 rounded-xl transition-all">Confirmar Cierre</button>
            </div>
          </div>
        </div>
      )}

      {showOpenModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a]"><h2 className="text-white text-2xl flex items-center gap-2"><Unlock size={24} className="text-green-500" /> Abrir Caja</h2></div>
            <div className="p-6 space-y-4">
              <label className="text-gray-400 text-sm block">Monto inicial en caja (Cambio)</label>
              <input type="number" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} onFocus={(e) => e.target.select()} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-4 border border-[#333] focus:border-green-500 outline-none" placeholder="0.00" step="0.01" min="0" />
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setShowOpenModal(false)} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">Cancelar</button>
              <button onClick={handleConfirmOpen} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl transition-all">Confirmar Apertura</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
