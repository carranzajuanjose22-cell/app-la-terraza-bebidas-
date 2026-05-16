import { useState, useEffect } from "react";
import { CreditCard, Receipt, Plus, Trash2, Edit2, Tag, X } from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api.js";
import { Loader } from "./Loader.jsx";

export function ConfiguracionView() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, item: null });
  const [expenseModal, setExpenseModal] = useState({ isOpen: false, item: null });
  const [categoryModal, setCategoryModal] = useState({ isOpen: false, item: null });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const [pRes, eRes, cRes] = await Promise.all([
        api.get("/payment-methods"),
        api.get("/fixed-expenses"),
        api.get("/categories"),
      ]);
      setPaymentMethods(pRes.data);
      setExpenses(eRes.data);
      setCategories(cRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  // ── Métodos de pago ──────────────────────────────────
  const handleSavePayment = async (payment) => {
    if (!payment.name.trim()) { toast.error("El nombre del método es obligatorio"); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      if (payment.id && paymentMethods.some((p) => p.id === payment.id)) {
        await api.put(`/payment-methods/${payment.id}`, payment);
        toast.success("Método de pago actualizado");
      } else {
        await api.post("/payment-methods", payment);
        toast.success("Método de pago agregado");
      }
      setPaymentModal({ isOpen: false, item: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePayment = async (id) => {
    try {
      await api.delete(`/payment-methods/${id}`);
      toast.success("Método de pago eliminado");
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Error"); }
  };

  // ── Gastos fijos ─────────────────────────────────────
  const handleSaveExpense = async (expense) => {
    if (!expense.name.trim()) { toast.error("La descripción del gasto es obligatoria"); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      if (expense.id && expenses.some((e) => e.id === expense.id)) {
        await api.put(`/fixed-expenses/${expense.id}`, expense);
        toast.success("Gasto actualizado");
      } else {
        await api.post("/fixed-expenses", expense);
        toast.success("Gasto agregado");
      }
      setExpenseModal({ isOpen: false, item: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveExpense = async (id) => {
    try {
      await api.delete(`/fixed-expenses/${id}`);
      toast.success("Gasto eliminado");
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Error"); }
  };

  // ── Categorías ───────────────────────────────────────
  const handleSaveCategory = async () => {
    const { item } = categoryModal;
    if (!item?.name?.trim()) { toast.error("El nombre de la categoría es obligatorio"); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      if (item.id) {
        await api.put(`/categories/${item.id}`, { name: item.name.trim() });
        toast.success("Categoría actualizada");
      } else {
        await api.post("/categories", { name: item.name.trim() });
        toast.success("Categoría agregada");
      }
      setCategoryModal({ isOpen: false, item: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Categoría eliminada");
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Error"); }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto relative">
      {loading && <Loader />}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-4xl mb-2">Configuración</h1>
          <p className="text-gray-400">Ajustes generales y financieros del sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Métodos de pago */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="text-[#8B5CF6]" size={24} />
              <h2 className="text-white text-xl font-medium">Métodos de Pago y Cargos</h2>
            </div>
            <button onClick={() => setPaymentModal({ isOpen: true, item: { name: "", surcharge: 0 } })} className="text-gray-400 hover:text-white transition-colors p-2 bg-[#2a2a2a] rounded-lg">
              <Plus size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex gap-4 items-center bg-[#2a2a2a] p-4 rounded-xl border border-[#333]">
                <div className="flex-1"><span className="text-white font-medium">{method.name}</span></div>
                <div className="text-gray-400 w-32 text-right">{method.surcharge > 0 ? `+${method.surcharge}%` : "0%"}</div>
                <div className="flex gap-2">
                  <button onClick={() => setPaymentModal({ isOpen: true, item: { ...method } })} className="text-gray-400 hover:text-white p-2 transition-colors"><Edit2 size={20} /></button>
                  <button onClick={() => handleRemovePayment(method.id)} className="text-gray-500 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
            {paymentMethods.length === 0 && <p className="text-gray-500 text-sm">Sin métodos de pago configurados</p>}
          </div>
        </div>

        {/* Gastos fijos */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="text-blue-500" size={24} />
              <h2 className="text-white text-xl font-medium">Gastos Fijos</h2>
            </div>
            <button onClick={() => setExpenseModal({ isOpen: true, item: { name: "", amount: 0 } })} className="text-gray-400 hover:text-white transition-colors p-2 bg-[#2a2a2a] rounded-lg">
              <Plus size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex gap-4 items-center bg-[#2a2a2a] p-4 rounded-xl border border-[#333]">
                <div className="flex-1"><span className="text-white font-medium">{expense.name}</span></div>
                <div className="text-gray-400 w-40 text-right font-medium">${Number(expense.amount).toFixed(2)}</div>
                <div className="flex gap-2">
                  <button onClick={() => setExpenseModal({ isOpen: true, item: { ...expense } })} className="text-gray-400 hover:text-white p-2 transition-colors"><Edit2 size={20} /></button>
                  <button onClick={() => handleRemoveExpense(expense.id)} className="text-gray-500 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
            {expenses.length === 0 && <p className="text-gray-500 text-sm">Sin gastos configurados</p>}
          </div>
        </div>

        {/* Categorías de producto */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tag className="text-green-400" size={24} />
              <h2 className="text-white text-xl font-medium">Categorías de Producto</h2>
            </div>
            <button onClick={() => setCategoryModal({ isOpen: true, item: { name: "" } })} className="text-gray-400 hover:text-white transition-colors p-2 bg-[#2a2a2a] rounded-lg">
              <Plus size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {categories.map((cat) => (
              <div key={cat.id} className="flex gap-4 items-center bg-[#2a2a2a] p-4 rounded-xl border border-[#333]">
                <div className="flex-1"><span className="text-white font-medium">{cat.name}</span></div>
                <div className="flex gap-2">
                  <button onClick={() => setCategoryModal({ isOpen: true, item: { ...cat } })} className="text-gray-400 hover:text-white p-2 transition-colors"><Edit2 size={20} /></button>
                  <button onClick={() => handleRemoveCategory(cat.id)} className="text-gray-500 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <p className="text-gray-500 text-sm">Sin categorías configuradas</p>}
          </div>
        </div>

      </div>

      {/* Modal método de pago */}
      {paymentModal.isOpen && paymentModal.item && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-white text-2xl flex items-center gap-2"><CreditCard size={24} className="text-[#8B5CF6]" />{paymentModal.item.id ? "Editar Método" : "Nuevo Método"}</h2>
              <button onClick={() => setPaymentModal({ isOpen: false, item: null })} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Nombre del método</label>
                <input type="text" value={paymentModal.item.name} onChange={(e) => setPaymentModal((prev) => ({ ...prev, item: { ...prev.item, name: e.target.value } }))} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none" placeholder="Ej. Mercado Pago" />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Recargo (%)</label>
                <input type="number" value={paymentModal.item.surcharge} onChange={(e) => setPaymentModal((prev) => ({ ...prev, item: { ...prev.item, surcharge: Number(e.target.value) } }))} onFocus={(e) => e.target.select()} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none" placeholder="0" min="0" step="0.01" />
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setPaymentModal({ isOpen: false, item: null })} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">Cancelar</button>
              <button onClick={() => handleSavePayment(paymentModal.item)} disabled={submitting} className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-all">{submitting ? "Guardando..." : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal gasto fijo */}
      {expenseModal.isOpen && expenseModal.item && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-white text-2xl flex items-center gap-2"><Receipt size={24} className="text-blue-500" />{expenseModal.item.id ? "Editar Gasto" : "Nuevo Gasto"}</h2>
              <button onClick={() => setExpenseModal({ isOpen: false, item: null })} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Descripción del gasto</label>
                <input type="text" value={expenseModal.item.name} onChange={(e) => setExpenseModal((prev) => ({ ...prev, item: { ...prev.item, name: e.target.value } }))} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-blue-500 outline-none" placeholder="Ej. Alquiler" />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Monto ($)</label>
                <input type="number" value={expenseModal.item.amount} onChange={(e) => setExpenseModal((prev) => ({ ...prev, item: { ...prev.item, amount: Number(e.target.value) } }))} onFocus={(e) => e.target.select()} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-blue-500 outline-none" placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setExpenseModal({ isOpen: false, item: null })} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">Cancelar</button>
              <button onClick={() => handleSaveExpense(expenseModal.item)} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-all">{submitting ? "Guardando..." : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal categoría */}
      {categoryModal.isOpen && categoryModal.item && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-white text-2xl flex items-center gap-2">
                <Tag size={24} className="text-green-400" />
                {categoryModal.item.id ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <button onClick={() => setCategoryModal({ isOpen: false, item: null })} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6">
              <label className="text-gray-400 text-sm block mb-2">Nombre de la categoría</label>
              <input
                type="text"
                value={categoryModal.item.name}
                onChange={(e) => setCategoryModal((prev) => ({ ...prev, item: { ...prev.item, name: e.target.value } }))}
                onKeyDown={(e) => e.key === "Enter" && handleSaveCategory()}
                className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-green-500 outline-none transition-colors"
                placeholder="Ej. Vinos, Cervezas, Espirituosas..."
                autoFocus
              />
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setCategoryModal({ isOpen: false, item: null })} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSaveCategory} disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-all">{submitting ? "Guardando..." : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
