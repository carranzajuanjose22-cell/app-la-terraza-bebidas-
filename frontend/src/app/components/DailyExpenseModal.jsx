import { useState } from "react";
import { X, Wallet } from "lucide-react";

export function DailyExpenseModal({ onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("efectivo");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !amount || amount <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ reason, amount: Number(amount), method });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-white text-2xl flex items-center gap-2">
            <Wallet size={24} className="text-orange-400" />
            Registrar Gasto Diario
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-2">Motivo de extracción</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Compra de hielo, Pago proveedor..."
              className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-orange-500 outline-none"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-2">Monto ($)</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                // Reemplaza todo lo que no sea número o punto
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setAmount(val === "" ? "" : val.replace(/^0+(?=\d)/, ""));
              }}
              onFocus={(e) => e.target.select()}
              placeholder="0.00"
              className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-orange-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-2">Método de extracción</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-orange-500 outline-none"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white py-4 rounded-xl transition-all"
            >
              {submitting ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}