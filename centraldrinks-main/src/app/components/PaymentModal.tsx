import { useState } from 'react';
import { X, Banknote, CreditCard, Printer } from 'lucide-react';

interface PaymentModalProps {
  total: number;
  paymentMethods: {
    id: string;
    name: string;
    surcharge: number;
  }[];
  onClose: () => void;
  onConfirm: (payments: any[]) => void;
}

interface PaymentLine {
  methodId: string;
  amount: number | string;
}

export function PaymentModal({ total, paymentMethods, onClose, onConfirm }: PaymentModalProps) {
  const [payments, setPayments] = useState<PaymentLine[]>([
    { methodId: paymentMethods[0]?.id || '', amount: total }
  ]);

  const getSurcharge = (methodId: string) => {
    return paymentMethods.find(m => m.id === methodId)?.surcharge || 0;
  };

  const addPaymentMethod = () => {
    const currentTotal = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    if (currentTotal < total) {
      setPayments([...payments, { methodId: paymentMethods[0]?.id || '', amount: total - currentTotal }]);
    }
  };

  const updatePayment = (index: number, field: 'methodId' | 'amount', value: string) => {
    const newPayments = [...payments];
    if (field === 'methodId') {
      newPayments[index].methodId = value;
    } else {
      newPayments[index].amount = value === '' ? '' : value.replace(/^0+(?=\d)/, '');
    }
    setPayments(newPayments);
  };

  const removePayment = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const paidBaseTotal = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingBase = total - paidBaseTotal;
  const canConfirm = Math.abs(remainingBase) < 0.01;

  const finalTotalWithSurcharges = payments.reduce((sum, p) => {
    const amt = Number(p.amount) || 0;
    const surcharge = getSurcharge(p.methodId);
    return sum + amt * (1 + surcharge / 100);
  }, 0);

  const handleConfirm = () => {
    onConfirm(payments.map(p => ({
      methodId: p.methodId,
      amount: Number(p.amount) || 0,
      surcharge: getSurcharge(p.methodId),
      finalAmount: (Number(p.amount) || 0) * (1 + getSurcharge(p.methodId) / 100)
    })));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl border border-[#2a2a2a]">
        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
          <h2 className="text-white text-2xl">Procesar Pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-[#2a2a2a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Subtotal Base:</span>
              <span className="text-white text-2xl font-bold">${total.toFixed(2)}</span>
            </div>
            {finalTotalWithSurcharges !== total && (
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#333]">
                <span className="text-orange-400">Total Final (con recargos):</span>
                <span className="text-orange-400 text-3xl font-bold">${finalTotalWithSurcharges.toFixed(2)}</span>
              </div>
            )}
            {!canConfirm && (
              <div className={`mt-2 text-right ${remainingBase > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                {remainingBase > 0 ? `Falta cubrir base: $${remainingBase.toFixed(2)}` : `Vuelto: $${Math.abs(remainingBase).toFixed(2)}`}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white">Métodos de Pago</h3>
              <button
                onClick={addPaymentMethod}
              className="text-[#8B5CF6] hover:text-[#A855F7] text-sm transition-colors"
                disabled={canConfirm}
              >
                + Agregar Método
              </button>
            </div>

            {payments.map((payment, index) => {
              const surcharge = getSurcharge(payment.methodId);
              const amountNum = Number(payment.amount) || 0;
              const surchargeAmount = amountNum * (surcharge / 100);

              return (
                <div key={index} className="bg-[#2a2a2a] rounded-lg p-4 flex gap-4 items-start">
                  <div className="flex-1">
                    <select
                      value={payment.methodId}
                      onChange={(e) => updatePayment(index, 'methodId', e.target.value)}
                      className="w-full bg-[#1a1a1a] text-white rounded-lg px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none"
                    >
                      {paymentMethods.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.surcharge > 0 ? `(+${m.surcharge}%)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                        className="w-full bg-[#1a1a1a] text-white rounded-lg pl-8 pr-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    {surcharge > 0 && (
                      <p className="text-orange-400 text-xs mt-2 ml-1">
                        + recargo: ${surchargeAmount.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {payments.length > 1 && (
                    <button
                      onClick={() => removePayment(index)}
                      className="text-gray-400 hover:text-red-500 p-3 transition-colors mt-1"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] disabled:bg-[#333] disabled:text-gray-500 disabled:cursor-not-allowed text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Printer size={20} />
            Confirmar e Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
