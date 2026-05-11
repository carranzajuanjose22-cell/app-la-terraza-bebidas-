import { useState } from 'react';
import { CreditCard, Receipt, Plus, Trash2, Save } from 'lucide-react';
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

  const handleUpdatePayment = (id: string, field: keyof PaymentMethod, value: string | number) => {
    setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleAddPayment = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setPaymentMethods([...paymentMethods, { id: newId, name: 'Nuevo Método', surcharge: 0 }]);
  };

  const handleRemovePayment = (id: string) => {
    setPaymentMethods(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateExpense = (id: string, field: keyof FixedExpense, value: string | number) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleAddExpense = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setExpenses([...expenses, { id: newId, name: 'Nuevo Gasto', amount: 0 }]);
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleSave = () => {
    toast.success('Configuración guardada exitosamente');
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-4xl mb-2">Configuración</h1>
          <p className="text-gray-400">Ajustes generales y financieros del sistema</p>
        </div>
        <button onClick={handleSave} className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-[#6B21A8]/20">
          <Save size={20} />
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Panel de Métodos de Pago */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="text-[#8B5CF6]" size={24} />
              <h2 className="text-white text-xl font-medium">Métodos de Pago y Cargos</h2>
            </div>
            <button onClick={handleAddPayment} className="text-gray-400 hover:text-white transition-colors p-2 bg-[#2a2a2a] rounded-lg">
              <Plus size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex gap-4 items-center">
                <input
                  type="text"
                  value={method.name}
                  onChange={(e) => handleUpdatePayment(method.id, 'name', e.target.value)}
                  className="flex-1 bg-[#2a2a2a] text-white rounded-lg px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                  placeholder="Nombre del método"
                />
                <div className="relative w-32">
                  <input
                    type="number"
                    value={method.surcharge === 0 ? '' : method.surcharge}
                    onChange={(e) => handleUpdatePayment(method.id, 'surcharge', Number(e.target.value))}
                    className="w-full bg-[#2a2a2a] text-white rounded-lg pl-4 pr-8 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                </div>
                <button onClick={() => handleRemovePayment(method.id)} className="text-gray-500 hover:text-red-500 p-2 transition-colors">
                  <Trash2 size={20} />
                </button>
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
            <button onClick={handleAddExpense} className="text-gray-400 hover:text-white transition-colors p-2 bg-[#2a2a2a] rounded-lg">
              <Plus size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex gap-4 items-center">
                <input
                  type="text"
                  value={expense.name}
                  onChange={(e) => handleUpdateExpense(expense.id, 'name', e.target.value)}
                  className="flex-1 bg-[#2a2a2a] text-white rounded-lg px-4 py-3 border border-[#333] focus:border-blue-500 outline-none transition-colors"
                  placeholder="Descripción del gasto"
                />
                <div className="relative w-40">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    value={expense.amount === 0 ? '' : expense.amount}
                    onChange={(e) => handleUpdateExpense(expense.id, 'amount', Number(e.target.value))}
                    className="w-full bg-[#2a2a2a] text-white rounded-lg pl-8 pr-4 py-3 border border-[#333] focus:border-blue-500 outline-none transition-colors"
                    placeholder="0.00"
                  />
                </div>
                <button onClick={() => handleRemoveExpense(expense.id)} className="text-gray-500 hover:text-red-500 p-2 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}