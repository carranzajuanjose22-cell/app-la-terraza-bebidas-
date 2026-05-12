import { useState } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from './components/Sidebar';
import { VentasView } from './components/VentasView';
import { InventarioView } from './components/InventarioView';
import { CajaView } from './components/CajaView';
import { LoginView } from './components/LoginView';
import { InicioView } from './components/InicioView';
import { ConfiguracionView } from './components/ConfiguracionView';
import { EstadisticasView } from './components/EstadisticasView';
import { UsuariosView } from './components/UsuariosView';
import { Transaction, CajaCerrada } from './components/CajaView';

export interface PaymentMethod {
  id: string;
  name: string;
  surcharge: number;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
}

export default function App() {
  const [activeView, setActiveView] = useState<'inicio' | 'ventas' | 'inventario' | 'caja' | 'estadisticas' | 'usuarios' | 'configuracion'>('ventas');
  const [role, setRole] = useState<'admin' | 'cajero' | null>(null);
  const [isCajaOpen, setIsCajaOpen] = useState(false);
  const [initialCash, setInitialCash] = useState(0);

  // Estado global de los movimientos y cajas cerradas
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cajasCerradas, setCajasCerradas] = useState<CajaCerrada[]>([]);

  // Estado global de los métodos de pago
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [expenses, setExpenses] = useState<FixedExpense[]>([]);

  // Si no hay un rol asignado (nadie ha iniciado sesión), mostramos el Login
  if (!role) {
    return <LoginView onLogin={(newRole) => {
      setRole(newRole);
      if (newRole === 'admin') {
        setActiveView('inicio'); // El admin entra directo a su panel principal
      } else {
        setActiveView('ventas'); // El cajero entra directo a vender
      }
    }} />;
  }

  const handleOpenCaja = (amount: number) => {
    setInitialCash(amount);
    setIsCajaOpen(true);
  };

  const handleCloseCaja = () => {
    // Creamos el resumen de productos y transacciones antes de cerrar
    const aggregatedItems: { [name: string]: { quantity: number; total: number } } = {};
    transactions.forEach(t => {
      if (t.items) {
        t.items.forEach(item => {
          if (!aggregatedItems[item.name]) {
            aggregatedItems[item.name] = { quantity: 0, total: 0 };
          }
          aggregatedItems[item.name].quantity += item.quantity;
          aggregatedItems[item.name].total += item.total;
        });
      }
    });
    const soldItems = Object.entries(aggregatedItems).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      total: data.total
    }));

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const totalIngresos = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalEfectivo = transactions.reduce((sum, t) =>
      sum + t.payments.filter(p => p.type.toLowerCase().includes('efectivo')).reduce((s, p) => s + p.amount, 0), 0
    );
    const totalTransferencia = transactions.reduce((sum, t) =>
      sum + t.payments.filter(p => !p.type.toLowerCase().includes('efectivo')).reduce((s, p) => s + p.amount, 0), 0
    );

    const nuevaCaja: CajaCerrada = {
      id: Math.random().toString(36).substr(2, 9),
      date: dateStr,
      time: timeStr,
      initialCash,
      totalEfectivo,
      totalTransferencia,
      totalIngresos,
      transactionsCount: transactions.length,
      soldItems
    };

    setCajasCerradas(prev => [nuevaCaja, ...prev]);
    setTransactions([]); // <- Vaciamos todo para asegurar que la próxima inicie en cero
    setIsCajaOpen(false);
    setInitialCash(0);
  };

  return (
    <div className="size-full flex bg-[#121212] dark">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        role={role}
        onLogout={() => { setRole(null); setActiveView('ventas'); }}
      />

      {activeView === 'inicio' && role === 'admin' && (
        <InicioView 
          isCajaOpen={isCajaOpen} 
          onOpenCaja={handleOpenCaja}
          onCloseCaja={handleCloseCaja}
          expenses={expenses}
          transactions={transactions}
        />
      )}
      {activeView === 'ventas' && (
        <VentasView 
          isCajaOpen={isCajaOpen} 
          paymentMethods={paymentMethods} 
          onAddTransaction={(t) => setTransactions([t, ...transactions])} 
        />
      )}
      {activeView === 'inventario' && role === 'admin' && <InventarioView />}
      {activeView === 'caja' && (
        <CajaView 
          role={role} 
          isCajaOpen={isCajaOpen}
          onOpenCaja={handleOpenCaja}
          onCloseCaja={handleCloseCaja}
          initialCash={initialCash}
          transactions={transactions}
          setTransactions={setTransactions}
          cajasCerradas={cajasCerradas}
          setCajasCerradas={setCajasCerradas}
        />
      )}
      {activeView === 'estadisticas' && role === 'admin' && <EstadisticasView />}
      {activeView === 'usuarios' && role === 'admin' && <UsuariosView />}
      {activeView === 'configuracion' && role === 'admin' && (
        <ConfiguracionView 
          paymentMethods={paymentMethods} 
          setPaymentMethods={setPaymentMethods} 
          expenses={expenses}
          setExpenses={setExpenses}
        />
      )}

      <Toaster theme="dark" position="top-right" />
    </div>
  );
}