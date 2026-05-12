import { useState } from 'react';
import { CreditCard, Receipt, Plus, Trash2, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  name: string;
  surcharge: number;
}

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
}

interface ConfiguracionViewProps {
  paymentMethods: PaymentMethod[];
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  expenses: FixedExpense[];
  setExpenses: React.Dispatch<React.SetStateAction<FixedExpense[]>>;
}

export function ConfiguracionView({ paymentMethods, setPaymentMethods, expenses, setExpenses }: ConfiguracionViewProps) {
  const [paymentModal, setPaymentModal] = useState<{isOpen: boolean, item: PaymentMethod | null}>({isOpen: false, item: null});
  const [expenseModal, setExpenseModal] = useState<{isOpen: boolean, item: FixedExpense | null}>({isOpen: false, item: null});

  const handleSavePayment = (payment: PaymentMethod) => {
    if (!payment.name.trim()) {
      toast.error('El nombre del método es obligatorio');
      return;
    }
    if (paymentMethods.some(p => p.id === payment.id)) {
      setPaymentMethods(prev => prev.map(p => p.id === payment.id ? payment : p));
      toast.success('Método de pago actualizado');
    } else {
      setPaymentMethods([...paymentMethods, payment]);
      toast.success('Método de pago agregado');
    }
    setPaymentModal({isOpen: false, item: null});
  };

  const handleRemovePayment = (id: string) => {
    setPaymentMethods(prev => prev.filter(p => p.id !== id));
    toast.success('Método de pago eliminado');
  };

  const handleSaveExpense = (expense: FixedExpense) => {
    if (!expense.name.trim()) {
      toast.error('La descripción del gasto es obligatoria');
      return;
    }
    if (expenses.some(e => e.id === expense.id)) {
      setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
      toast.success('Gasto actualizado');
    } else {
      setExpenses([...expenses, expense]);
      toast.success('Gasto agregado');
    }
    setExpenseModal({isOpen: false, item: null});
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('Gasto eliminado');
  };

  const openAddPayment = () => {
    setPaymentModal({
      isOpen: true,
      item: { id: Math.random().toString(36).substr(2, 9), name: '', surcharge: 0 }
    });
  };

  const openAddExpense = () => {
    setExpenseModal({
      isOpen: true,
      item: { id: Math.random().toString(36).substr(2, 9), name: '', amount: 0 }
    });
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-4xl mb-2">Configuración</h1>
          <p className="text-gray-400">Ajustes generales y financieros del sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Panel de Métodos de Pago */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="text-[#8B5CF6]" size={24} />
              <h2 className="text-white text-xl font-medium">Métodos de Pago y Cargos</h2>
            </div>
            <button onClick={openAddPayment} className="text-gray-400 hover:text-white transition-colors p-2 bg-[#2a2a2a] rounded-lg">
              <Plus size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex gap-4 items-center bg-[#2a2a2a] p-4 rounded-xl border border-[#333]">
                <div className="flex-1">
                  <span className="text-white font-medium">{method.name}</span>
                </div>
                <div className="text-gray-400 w-32 text-right">
                  {method.surcharge > 0 ? `+${method.surcharge}%` : '0%'}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPaymentModal({isOpen: true, item: method})} className="text-gray-400 hover:text-white p-2 transition-colors">
                    <Edit2 size={20} />
                  </button>
                  <button onClick={() => handleRemovePayment(method.id)} className="text-gray-500 hover:text-red-500 p-2 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Gastos Fijos */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="text-blue-500" size={24} />
              <h2 className="text-white text-xl font-medium">Gastos Fijos</h2>
            </div>
            <button onClick={openAddExpense} className="text-gray-400 hover:text-white transition-colors p-2 bg-[#2a2a2a] rounded-lg">
              <Plus size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex gap-4 items-center bg-[#2a2a2a] p-4 rounded-xl border border-[#333]">
                <div className="flex-1">
                  <span className="text-white font-medium">{expense.name}</span>
                </div>
                <div className="text-gray-400 w-40 text-right font-medium">
                  ${expense.amount.toFixed(2)}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setExpenseModal({isOpen: true, item: expense})} className="text-gray-400 hover:text-white p-2 transition-colors">
                    <Edit2 size={20} />
                  </button>
                  <button onClick={() => handleRemoveExpense(expense.id)} className="text-gray-500 hover:text-red-500 p-2 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Método de Pago */}
      {paymentModal.isOpen && paymentModal.item && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-white text-2xl flex items-center gap-2">
                <CreditCard size={24} className="text-[#8B5CF6]" />
                {paymentMethods.some(p => p.id === paymentModal.item!.id) ? 'Editar Método' : 'Nuevo Método'}
              </h2>
              <button onClick={() => setPaymentModal({isOpen: false, item: null})} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Nombre del método</label>
                <input
                  type="text"
                  value={paymentModal.item.name}
                  onChange={(e) => setPaymentModal(prev => ({...prev, item: prev.item ? {...prev.item, name: e.target.value} : null}))}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                  placeholder="Ej. Mercado Pago"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Recargo (%)</label>
                <input
                  type="number"
                  value={paymentModal.item.surcharge}
                  onChange={(e) => setPaymentModal(prev => ({...prev, item: prev.item ? {...prev.item, surcharge: Number(e.target.value)} : null}))}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setPaymentModal({isOpen: false, item: null})} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">
                Cancelar
              </button>
              <button onClick={() => handleSavePayment(paymentModal.item!)} className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] text-white py-4 rounded-xl transition-all">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gasto Fijo */}
      {expenseModal.isOpen && expenseModal.item && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-white text-2xl flex items-center gap-2">
                <Receipt size={24} className="text-blue-500" />
                {expenses.some(e => e.id === expenseModal.item!.id) ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h2>
              <button onClick={() => setExpenseModal({isOpen: false, item: null})} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Descripción del gasto</label>
                <input
                  type="text"
                  value={expenseModal.item.name}
                  onChange={(e) => setExpenseModal(prev => ({...prev, item: prev.item ? {...prev.item, name: e.target.value} : null}))}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-blue-500 outline-none transition-colors"
                  placeholder="Ej. Alquiler"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Monto ($)</label>
                <input
                  type="number"
                  value={expenseModal.item.amount}
                  onChange={(e) => setExpenseModal(prev => ({...prev, item: prev.item ? {...prev.item, amount: Number(e.target.value)} : null}))}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-blue-500 outline-none transition-colors"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setExpenseModal({isOpen: false, item: null})} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">
                Cancelar
              </button>
              <button onClick={() => handleSaveExpense(expenseModal.item!)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl transition-all">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}