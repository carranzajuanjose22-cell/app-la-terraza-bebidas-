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
  const [activeView, setActiveView] = useState<'inicio' | 'ventas' | 'inventario' | 'caja' | 'estadisticas' | 'configuracion'>('ventas');
  const [role, setRole] = useState<'admin' | 'cajero' | null>(null);
  const [isCajaOpen, setIsCajaOpen] = useState(false);
  const [initialCash, setInitialCash] = useState(0);

  // Estado global de los métodos de pago
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', name: 'Efectivo', surcharge: 0 },
    { id: '2', name: 'Transferencia', surcharge: 0 },
    { id: '3', name: 'Débito', surcharge: 0 },
    { id: '4', name: 'Crédito', surcharge: 10 },
    { id: '5', name: 'QR', surcharge: 0 },
  ]);

  const [expenses, setExpenses] = useState<FixedExpense[]>([
    { id: '1', name: 'Alquiler', amount: 150000 },
    { id: '2', name: 'Luz', amount: 25000 },
    { id: '3', name: 'Sueldos', amount: 80000 },
  ]);

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
        />
      )}
      {activeView === 'ventas' && <VentasView isCajaOpen={isCajaOpen} paymentMethods={paymentMethods} />}
      {activeView === 'inventario' && role === 'admin' && <InventarioView />}
      {activeView === 'caja' && (
        <CajaView 
          role={role} 
          isCajaOpen={isCajaOpen}
          onOpenCaja={handleOpenCaja}
          onCloseCaja={handleCloseCaja}
          initialCash={initialCash}
        />
      )}
      {activeView === 'estadisticas' && role === 'admin' && <EstadisticasView />}
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