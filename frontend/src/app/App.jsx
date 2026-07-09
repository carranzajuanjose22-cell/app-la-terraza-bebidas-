import { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";
import { Sidebar } from "./components/Sidebar.jsx";
import { VentasView } from "./components/VentasView.jsx";
import { InventarioView } from "./components/InventarioView.jsx";
import { CajaView } from "./components/CajaView.jsx";
import { LoginView } from "./components/LoginView.jsx";
import { InicioView } from "./components/InicioView.jsx";
import { ConfiguracionView } from "./components/ConfiguracionView.jsx";
import { EstadisticasView } from "./components/EstadisticasView.jsx";
import { UsuariosView } from "./components/UsuariosView.jsx";
import { Loader } from "./components/Loader.jsx";
import api from "../services/api.js";
import { SubscriptionProvider } from "./modules/subscription/SubscriptionContext.jsx";
import { SubscriptionOverlay } from "./modules/subscription/SubscriptionOverlay.jsx";
import { CreatorDashboard } from "./modules/subscription/CreatorDashboard.jsx";

// Decodifica el payload del JWT sin librería externa
function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null; // convertir a ms
  } catch {
    return null;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState("ventas");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!stored || !token) return null;
    // Verificar si el token ya expiró al cargar la app
    const expiry = getTokenExpiry(token);
    if (expiry && Date.now() > expiry) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    return JSON.parse(stored);
  });
  const expiryTimerRef = useRef(null);

  // Estado de caja (sincronizado con el backend)
  const [cajaStatus, setCajaStatus] = useState({ isOpen: false, register: null });
  const [appLoading, setAppLoading] = useState(false);

  // Transacciones de la caja actual (en memoria para velocidad, se persisten en el backend)
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (user) {
      fetchCajaStatus(true);
    }
  }, [user]);

  async function fetchCajaStatus(showLoader = false) {
    if (showLoader) setAppLoading(true);
    try {
      const { data } = await api.get("/cash-register/status");
      setCajaStatus(data);
      if (data.isOpen && data.register) {
        const txRes = await api.get(`/transactions/register/${data.register.id}`);
        setTransactions(txRes.data.map((t) => ({
          id: String(t.id),
          date: t.date,
          time: t.time,
          total: t.total,
          payments: t.payments.map((p) => ({ type: p.methodName, amount: p.amount })),
          items: t.items.map((i) => ({ name: i.productName, quantity: i.quantity, total: i.total })),
        })));
      } else {
        setTransactions([]);
      }
    } catch {
      // sin conexión aún
    } finally {
      setAppLoading(false);
    }
  }

  async function handleOpenCaja(amount) {
    const { data } = await api.post("/cash-register/open", { initialCash: amount });
    setCajaStatus({ isOpen: true, register: data });
    setTransactions([]);
  }

  async function handleCloseCaja() {
    if (!cajaStatus.register) return;
    await api.post("/cash-register/close", { registerId: cajaStatus.register.id });
    setCajaStatus({ isOpen: false, register: null });
    setTransactions([]);
    await fetchCajaStatus();
  }

  async function handleAddTransaction(transaction) {
    try {
      const payload = {
        total: transaction.total,
        payments: transaction.payments,
        items: transaction.items,
      };
      const { data } = await api.post("/transactions", payload);
      const normalized = {
        id: String(data.id),
        date: data.date,
        time: data.time,
        total: data.total,
        payments: data.payments.map((p) => ({ type: p.methodName, amount: p.amount })),
        items: data.items.map((i) => ({ name: i.productName, quantity: i.quantity, total: i.total })),
      };
      setTransactions((prev) => [normalized, ...prev]);
    } catch {
      setTransactions((prev) => [transaction, ...prev]);
    }
  }

  function handleLogin(loggedUser) {
    setUser(loggedUser);
    if (loggedUser.role !== "creator") {
      setActiveView(loggedUser.role === "admin" ? "inicio" : "ventas");
    }
  }

  function handleLogout() {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setActiveView("ventas");
    setCajaStatus({ isOpen: false, register: null });
    setTransactions([]);
  }

  // Programar cierre de sesión automático cuando el token expire
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!user || !token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const msUntilExpiry = expiry - Date.now();
    if (msUntilExpiry <= 0) {
      handleLogout();
      toast.warning("Tu sesión expiró. Iniciá sesión nuevamente.");
      return;
    }

    expiryTimerRef.current = setTimeout(() => {
      handleLogout();
      toast.warning("Tu sesión expiró. Iniciá sesión nuevamente.");
    }, msUntilExpiry);

    return () => { if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current); };
  }, [user]);

  // Escuchar el evento de sesión expirada lanzado por el interceptor de Axios (401)
  useEffect(() => {
    const onExpired = () => {
      handleLogout();
      toast.warning("Tu sesión expiró. Iniciá sesión nuevamente.");
    };
    window.addEventListener("session-expired", onExpired);
    return () => window.removeEventListener("session-expired", onExpired);
  }, []);

  if (!user) {
    return (
      <>
        <Toaster theme="dark" position="top-right" />
        <LoginView onLogin={handleLogin} />
      </>
    );
  }

  // El creator tiene su propio panel separado
  if (user.role === "creator") {
    return (
      <SubscriptionProvider>
        <Toaster theme="dark" position="top-right" />
        <CreatorDashboard onLogout={handleLogout} />
      </SubscriptionProvider>
    );
  }

  return (
    <SubscriptionProvider>
    <div className="size-full flex bg-[#121212] dark relative overflow-x-hidden" style={{ minHeight: "100vh" }}>
      {appLoading && <Loader fullScreen />}
      <SubscriptionOverlay onLogout={handleLogout} userRole={user.role} />
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        role={user.role}
        onLogout={handleLogout}
      />

      {activeView === "inicio" && user.role === "admin" && (
        <InicioView
          isCajaOpen={cajaStatus.isOpen}
          onOpenCaja={handleOpenCaja}
          onCloseCaja={handleCloseCaja}
          transactions={transactions}
        />
      )}
      {activeView === "ventas" && (
        <VentasView
          isCajaOpen={cajaStatus.isOpen}
          onAddTransaction={handleAddTransaction}
        />
      )}
      {activeView === "inventario" && user.role === "admin" && <InventarioView />}
      {activeView === "caja" && (
        <CajaView
          role={user.role}
          isCajaOpen={cajaStatus.isOpen}
          register={cajaStatus.register}
          onOpenCaja={handleOpenCaja}
          onCloseCaja={handleCloseCaja}
          transactions={transactions}
          onRefresh={fetchCajaStatus}
        />
      )}
      {activeView === "estadisticas" && user.role === "admin" && <EstadisticasView />}
      {activeView === "usuarios" && user.role === "admin" && <UsuariosView />}
      {activeView === "configuracion" && user.role === "admin" && <ConfiguracionView />}

      <Toaster theme="dark" position="top-right" />
    </div>
    </SubscriptionProvider>
  );
}
