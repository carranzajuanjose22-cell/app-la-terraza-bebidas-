import { useState, useEffect } from "react";
import { TrendingUp, Activity, Clock, ShoppingBag, Lock, Unlock, Receipt, Wine, Plus, Check, X, PackageMinus } from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api.js";
import { Loader } from "./Loader.jsx";

export function InicioView({ isCajaOpen, onOpenCaja, onCloseCaja, transactions }) {
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("0");
  const [expenses, setExpenses] = useState([]);
  const [barBottles, setBarBottles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBottleModal, setShowBottleModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [submittingBottle, setSubmittingBottle] = useState(false);
  const [searchBottle, setSearchBottle] = useState("");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawProductId, setWithdrawProductId] = useState("");
  const [withdrawQty, setWithdrawQty] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [searchWithdraw, setSearchWithdraw] = useState("");

  useEffect(() => {
    setLoading(true);
    // Usamos allSettled para evitar que si un endpoint falla, bloquee la carga de los demás
    Promise.allSettled([
      api.get("/fixed-expenses"),
      api.get("/bar-bottles"),
      api.get("/products")
    ])
      .then(([rExp, rBot, rProd]) => { 
        if (rExp.status === "fulfilled") setExpenses(rExp.value.data); 
        if (rBot.status === "fulfilled") setBarBottles(rBot.value.data); 
        if (rProd.status === "fulfilled") {
          setProducts(rProd.value.data.sort((a, b) => (a.name || "").localeCompare(b.name || ""))); 
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const recentSales = transactions.slice(0, 5).map((t) => ({
    id: t.id,
    time: t.time,
    total: t.total,
    items: t.items?.reduce((sum, i) => sum + i.quantity, 0) || 0,
    details: t.items?.map((i) => `${i.quantity}x ${i.name}`) || [],
  }));

  const ventasHoy = isCajaOpen ? transactions.reduce((sum, t) => sum + t.total, 0) : 0;
  const ticketsHoy = isCajaOpen ? transactions.length : 0;
  const promedio = ticketsHoy > 0 ? (ventasHoy / ticketsHoy).toFixed(2) : "0.00";
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleConfirmOpen = async () => {
    try {
      await onOpenCaja(Number(openingAmount) || 0);
      setShowOpenModal(false);
      setOpeningAmount("0");
      toast.success("Caja abierta exitosamente");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al abrir caja");
    }
  };

  const handleConfirmClose = async () => {
    try {
      await onCloseCaja();
      setShowClosureModal(false);
      toast.success("Caja cerrada exitosamente");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al cerrar caja");
    }
  };

  const handleOpenBottle = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setSubmittingBottle(true);
    try {
      await api.post("/bar-bottles", { productId: Number(selectedProductId) });
      toast.success("Botella abierta y descontada del stock");
      setShowBottleModal(false);
      setSelectedProductId("");
      setSearchBottle("");
      const [rBot, rProd] = await Promise.allSettled([api.get("/bar-bottles"), api.get("/products")]);
      if (rBot.status === "fulfilled") {
        setBarBottles(rBot.value.data);
      }
      if (rProd.status === "fulfilled") {
        setProducts(rProd.value.data.sort((a, b) => (a.name || "").localeCompare(b.name || "")));
      }
    } catch (err) {
      toast.error("Error al abrir botella", { description: err.response?.data?.message || err.message });
    } finally {
      setSubmittingBottle(false);
    }
  };

  const handleEmptyBottle = async (id) => {
    try {
      await api.patch(`/bar-bottles/${id}/empty`);
      toast.success("Botella marcada como terminada");
      setBarBottles(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      toast.error("Error al actualizar estado");
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawProductId || !withdrawQty || withdrawQty <= 0) return;
    setSubmittingWithdraw(true);
    try {
      await api.post("/internal-withdrawals", { productId: Number(withdrawProductId), quantity: Number(withdrawQty) });
      toast.success("Mercadería retirada correctamente");
      setShowWithdrawModal(false);
      setWithdrawProductId("");
      setWithdrawQty("");
      setSearchWithdraw("");
      const rProd = await api.get("/products");
      setProducts(rProd.data.sort((a, b) => (a.name || "").localeCompare(b.name || "")));
    } catch (err) {
      toast.error("Error al retirar", { description: err.response?.data?.message || err.message });
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto relative">
      {loading && <Loader />}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-white text-4xl mb-2">Panel de Inicio</h1>
          <p className="text-gray-400">Resumen en vivo de tu negocio</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowWithdrawModal(true)} className="bg-[#2a2a2a] hover:bg-[#333] text-gray-300 hover:text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all border border-[#333]">
            <PackageMinus size={20} className="text-orange-400" /> Retirar Consumo
          </button>
          {isCajaOpen ? (
            <button onClick={() => setShowClosureModal(true)} className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
              <Lock size={20} /> Cerrar Caja
            </button>
          ) : (
            <button onClick={() => setShowOpenModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
              <Unlock size={20} /> Abrir Caja
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#6B21A8]/10 rounded-full blur-xl"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#6B21A8]/20 p-3 rounded-lg text-[#8B5CF6]"><Activity size={24} /></div>
            <h3 className="text-gray-400 font-medium">Estado de Caja</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isCajaOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
            <p className="text-white text-2xl font-bold">{isCajaOpen ? "Operando" : "Cerrada"}</p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-500/10 p-3 rounded-lg text-green-500"><TrendingUp size={24} /></div>
            <h3 className="text-gray-400 font-medium">Ventas de Hoy</h3>
          </div>
          <p className="text-white text-3xl font-bold">${ventasHoy.toFixed(2)}</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-500/10 p-3 rounded-lg text-blue-500"><ShoppingBag size={24} /></div>
            <h3 className="text-gray-400 font-medium">Tickets Emitidos</h3>
          </div>
          <p className="text-white text-3xl font-bold">{ticketsHoy}</p>
          <p className="text-gray-500 text-sm mt-2">{ticketsHoy > 0 ? `Promedio: $${promedio}/ticket` : "Sin actividad"}</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#8B5CF6]/10 p-3 rounded-lg text-[#8B5CF6]"><Wine size={24} /></div>
              <h3 className="text-gray-400 font-medium">En Barra</h3>
            </div>
            <button onClick={() => setShowBottleModal(true)} className="bg-[#2a2a2a] hover:bg-[#333] text-gray-400 hover:text-white p-1.5 rounded-lg transition-colors border border-[#333]" title="Abrir nueva botella">
              <Plus size={18} />
            </button>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-32 pr-1 custom-scrollbar">
            {barBottles.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay botellas</p>
            ) : (
              barBottles.map((bottle) => (
                <div key={bottle.id} className="flex items-center justify-between p-2 bg-[#2a2a2a] rounded-lg border border-[#333]">
                  <span className="text-gray-300 text-sm font-medium truncate pr-2" title={bottle.productName}>{bottle.productName}</span>
                  <button onClick={() => handleEmptyBottle(bottle.id)} className="text-gray-500 hover:text-green-500 transition-colors p-1 bg-[#1a1a1a] rounded-md border border-[#333]" title="Marcar como terminada/vacía">
                    <Check size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-white text-xl font-medium">Actividad Reciente</h2>
              <Clock size={20} className="text-gray-500" />
            </div>
            <div className="p-2">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <div key={sale.id} className="flex flex-col p-4 hover:bg-[#2a2a2a] rounded-lg transition-colors border-b border-[#2a2a2a] last:border-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-gray-400 text-xs">#{sale.id}</div>
                        <div>
                          <p className="text-white font-medium">Venta en salón</p>
                          <p className="text-gray-500 text-sm">{sale.time} • {sale.items} productos</p>
                        </div>
                      </div>
                      <span className="text-[#8B5CF6] font-bold text-lg">+${sale.total.toFixed(2)}</span>
                    </div>
                    <div className="ml-14 bg-[#121212] rounded-lg p-3 border border-[#2a2a2a]">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">Detalle:</p>
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
                  <p className="text-lg text-white font-medium">{isCajaOpen ? "No hay operaciones aún" : "La caja está cerrada"}</p>
                  <p className="text-sm mt-1">{isCajaOpen ? "Las ventas aparecerán aquí" : "Abre la caja para comenzar"}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      <div className="xl:col-span-1 flex flex-col gap-8">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-6">
              <Receipt className="text-blue-500" size={24} />
              <h2 className="text-white text-xl font-medium">Gastos Fijos</h2>
            </div>
            <div className="space-y-4 flex-1">
              {expenses.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin gastos configurados</p>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between">
                    <span className="text-gray-400">{expense.name}</span>
                    <span className="text-white font-medium">${expense.amount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-auto pt-6 border-t border-[#2a2a2a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Total a cubrir:</span>
                <span className="text-white font-bold">${totalExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {showOpenModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-white text-2xl flex items-center gap-2"><Unlock size={24} className="text-green-500" /> Abrir Caja</h2>
            </div>
            <div className="p-6 space-y-4">
              <label className="text-gray-400 text-sm block">Monto inicial en caja (Cambio)</label>
              <input type="number" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-4 border border-[#333] focus:border-green-500 outline-none" placeholder="0.00" step="0.01" min="0" />
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setShowOpenModal(false)} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">Cancelar</button>
              <button onClick={handleConfirmOpen} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl transition-all">Confirmar Apertura</button>
            </div>
          </div>
        </div>
      )}

      {showClosureModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a]">
              <h2 className="text-white text-2xl flex items-center gap-2"><Lock size={24} className="text-[#8B5CF6]" /> Cierre de Caja</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-400">¿Estás seguro que deseas cerrar la caja? Para ver el resumen detallado dirígete a la pestaña "Caja".</p>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setShowClosureModal(false)} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">Cancelar</button>
              <button onClick={handleConfirmClose} className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] text-white py-4 rounded-xl transition-all">Confirmar Cierre</button>
            </div>
          </div>
        </div>
      )}

    {showBottleModal && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
          <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
            <h2 className="text-white text-2xl flex items-center gap-2"><Wine size={24} className="text-[#8B5CF6]" /> Abrir Nueva Botella</h2>
            <button onClick={() => { setShowBottleModal(false); setSearchBottle(""); }} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
          </div>
          <form onSubmit={handleOpenBottle} className="p-6 space-y-4">
            <p className="text-gray-400 text-sm mb-4">Seleccioná un producto de tu inventario para llevar a la barra. Se descontará 1 unidad del stock automáticamente.</p>
            <div>
              <label className="text-gray-400 text-sm block mb-2">Producto</label>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchBottle}
                onChange={(e) => setSearchBottle(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white rounded-xl px-4 py-3 mb-3 border border-[#333] focus:border-[#6B21A8] outline-none"
              />
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none"
                required
              >
                <option value="">Seleccione una botella...</option>
                {products.filter(p => p.name.toLowerCase().includes(searchBottle.toLowerCase()) && Number(p.stock) > 0).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-4 flex gap-4">
              <button type="button" onClick={() => { setShowBottleModal(false); setSearchBottle(""); }} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">Cancelar</button>
              <button type="submit" disabled={submittingBottle || !selectedProductId} className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] disabled:opacity-60 text-white py-4 rounded-xl transition-all">{submittingBottle ? "Abriendo..." : "Confirmar Apertura"}</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {showWithdrawModal && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
          <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
            <h2 className="text-white text-2xl flex items-center gap-2"><PackageMinus size={24} className="text-orange-400" /> Retirar Consumo Interno</h2>
            <button onClick={() => { setShowWithdrawModal(false); setSearchWithdraw(""); setWithdrawQty(""); }} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
          </div>
          <form onSubmit={handleWithdraw} className="p-6 space-y-4">
            <p className="text-gray-400 text-sm mb-4">Seleccioná el producto y la cantidad a retirar para consumo interno. Se descontará del stock y quedará registrado.</p>
            <div>
              <label className="text-gray-400 text-sm block mb-2">Producto</label>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchWithdraw}
                onChange={(e) => setSearchWithdraw(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white rounded-xl px-4 py-3 mb-3 border border-[#333] focus:border-orange-500 outline-none"
              />
              <select
                value={withdrawProductId}
                onChange={(e) => setWithdrawProductId(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-orange-500 outline-none"
                required
              >
                <option value="">Seleccione un producto...</option>
                {products.filter(p => p.name.toLowerCase().includes(searchWithdraw.toLowerCase()) && Number(p.stock) > 0).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-2">Cantidad a retirar</label>
              <input
                type="number"
                min="1"
                step="1"
                value={withdrawQty}
                onChange={(e) => setWithdrawQty(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-orange-500 outline-none"
                required
              />
            </div>
            <div className="pt-4 flex gap-4">
              <button type="button" onClick={() => { setShowWithdrawModal(false); setSearchWithdraw(""); setWithdrawQty(""); }} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">Cancelar</button>
              <button type="submit" disabled={submittingWithdraw || !withdrawProductId || !withdrawQty} className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white py-4 rounded-xl transition-all">{submittingWithdraw ? "Retirando..." : "Confirmar Retiro"}</button>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  );
}
