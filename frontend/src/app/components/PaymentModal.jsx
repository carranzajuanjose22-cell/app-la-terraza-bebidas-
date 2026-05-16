import { useState } from "react";
import { X, Printer } from "lucide-react";

export function PaymentModal({ total, paymentMethods, onClose, onConfirm }) {
  const [payments, setPayments] = useState([
    { methodId: String(paymentMethods[0]?.id || ""), amount: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const getSurcharge = (methodId) => {
    const m = paymentMethods.find((m) => String(m.id) === String(methodId));
    return m?.surcharge || 0;
  };

  const getMethodName = (methodId) => {
    const m = paymentMethods.find((m) => String(m.id) === String(methodId));
    return m?.name || "";
  };

  const isCash = (methodId) =>
    getMethodName(methodId).toLowerCase().includes("efectivo");

  const addPaymentMethod = () => {
    setPayments([...payments, { methodId: String(paymentMethods[0]?.id || ""), amount: "" }]);
  };

  const updatePayment = (index, field, value) => {
    const newPayments = [...payments];
    if (field === "methodId") {
      newPayments[index].methodId = value;
    } else {
      // Fix 3: eliminar ceros a la izquierda al escribir
      newPayments[index].amount = value === "" ? "" : value.replace(/^0+(?=\d)/, "");
    }
    setPayments(newPayments);
  };

  const removePayment = (index) => {
    if (payments.length > 1) setPayments(payments.filter((_, i) => i !== index));
  };

  const paidBaseTotal = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingBase = total - paidBaseTotal;

  // Fix 2: para efectivo se permite pagar de más (hay vuelto), para otros métodos debe ser exacto
  const allCash = payments.every((p) => isCash(p.methodId));
  const canConfirm = allCash
    ? paidBaseTotal >= total          // efectivo: se puede pagar de más
    : Math.abs(remainingBase) < 0.01; // otros: monto exacto

  const change = allCash && paidBaseTotal > total ? paidBaseTotal - total : 0;

  const finalTotalWithSurcharges = payments.reduce((sum, p) => {
    const amt = Number(p.amount) || 0;
    const surcharge = getSurcharge(p.methodId);
    return sum + amt * (1 + surcharge / 100);
  }, 0);

  // Solo mostrar fila de recargos si al menos un método activo tiene recargo > 0
  const hasActiveSurcharge = payments.some(
    (p) => getSurcharge(p.methodId) > 0 && (Number(p.amount) || 0) > 0
  );

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(
        payments.map((p) => {
          const surcharge = getSurcharge(p.methodId);
          const base = isCash(p.methodId) && payments.length === 1
            ? total
            : (Number(p.amount) || 0);
          const withSurcharge = base * (1 + surcharge / 100);
          return {
            methodId: p.methodId,
            type: getMethodName(p.methodId),
            baseAmount: base,
            surchargePercent: surcharge,
            amount: withSurcharge,
            finalAmount: withSurcharge,
          };
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl border border-[#2a2a2a]">
        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-white text-2xl">Procesar Pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-[#2a2a2a] rounded-xl p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total a cobrar:</span>
              <span className="text-white text-2xl font-bold">${total.toFixed(2)}</span>
            </div>

            {hasActiveSurcharge && (
              <div className="flex items-center justify-between pt-2 border-t border-[#333]">
                <span className="text-orange-400">Total con recargos:</span>
                <span className="text-orange-400 text-2xl font-bold">${finalTotalWithSurcharges.toFixed(2)}</span>
              </div>
            )}

            {/* Estado del pago */}
            {paidBaseTotal > 0 && (
              <div className="pt-2 border-t border-[#333]">
                {remainingBase > 0.01 ? (
                  // Falta plata — cualquier método
                  <div className="flex items-center justify-between">
                    <span className="text-orange-500">Falta cubrir:</span>
                    <span className="text-orange-500 font-bold">${remainingBase.toFixed(2)}</span>
                  </div>
                ) : remainingBase < -0.01 && allCash ? (
                  // Pagó de más en efectivo → vuelto permitido
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 font-medium">Vuelto a entregar:</span>
                    <span className="text-green-400 text-xl font-bold">${change.toFixed(2)}</span>
                  </div>
                ) : remainingBase < -0.01 && !allCash ? (
                  // Pagó de más con no-efectivo → error
                  <div className="flex items-center justify-between">
                    <span className="text-red-400">Monto excedido en:</span>
                    <span className="text-red-400 font-bold">${Math.abs(remainingBase).toFixed(2)}</span>
                  </div>
                ) : (
                  // Monto exacto
                  <div className="flex items-center justify-between">
                    <span className="text-green-400">Monto exacto</span>
                    <span className="text-green-400">✓</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white">Métodos de Pago</h3>
              <button
                onClick={addPaymentMethod}
                className="text-[#8B5CF6] hover:text-[#A855F7] text-sm transition-colors"
              >
                + Agregar Método
              </button>
            </div>

            {payments.map((payment, index) => {
              const surcharge = getSurcharge(payment.methodId);
              const amountNum = Number(payment.amount) || 0;
              const surchargeAmount = amountNum * (surcharge / 100);
              const isThisCash = isCash(payment.methodId);

              return (
                <div key={index} className="bg-[#2a2a2a] rounded-lg p-4 flex gap-4 items-start">
                  <div className="flex-1">
                    <select
                      value={payment.methodId}
                      onChange={(e) => updatePayment(index, "methodId", e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white rounded-lg px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none"
                    >
                      {paymentMethods.map((m) => (
                        <option key={m.id} value={String(m.id)}>
                          {m.name} {m.surcharge > 0 ? `(+${m.surcharge}%)` : ""}
                        </option>
                      ))}
                    </select>
                    {!isThisCash && payments.length > 1 && (
                      <p className="text-gray-500 text-xs mt-1 ml-1">Monto exacto requerido</p>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => updatePayment(index, "amount", e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="0.00"
                        className="w-full bg-[#1a1a1a] text-white rounded-lg pl-8 pr-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    {surcharge > 0 && amountNum > 0 && (
                      <p className="text-orange-400 text-xs mt-2 ml-1">+ recargo: ${surchargeAmount.toFixed(2)}</p>
                    )}
                  </div>

                  {payments.length > 1 && (
                    <button onClick={() => removePayment(index)} className="text-gray-400 hover:text-red-500 p-3 transition-colors mt-1">
                      <X size={20} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
          <button onClick={onClose} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || submitting}
            className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] disabled:bg-[#333] disabled:text-gray-500 disabled:cursor-not-allowed text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Printer size={20} />
            {submitting ? "Registrando..." : change > 0 ? `Confirmar — Dar vuelto $${change.toFixed(2)}` : "Confirmar e Imprimir Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}
