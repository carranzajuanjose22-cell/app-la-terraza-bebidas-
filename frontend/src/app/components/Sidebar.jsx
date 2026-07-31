import { useState, useEffect } from "react";
import { ShoppingCart, Package, DollarSign, Settings, LogOut, Home, BarChart3, Users, Armchair, Menu, X } from "lucide-react";

export function Sidebar({ activeView, onViewChange, role, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(false);   // controla si el DOM existe
  const [animIn, setAnimIn] = useState(false);      // controla la animación CSS

  const openDrawer = () => {
    setVisible(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)));
  };

  const closeDrawer = () => {
    setAnimIn(false);
    // esperar que termine la transición antes de desmontar
    setTimeout(() => { setVisible(false); setMobileOpen(false); }, 300);
  };

  useEffect(() => {
    if (mobileOpen) openDrawer();
  }, [mobileOpen]);

  const menuItems = [
    { id: "inicio", icon: Home, label: "Inicio", roles: ["admin"] },
    { id: "ventas", icon: ShoppingCart, label: "Ventas", roles: ["admin", "cajero"] },
    { id: "mesas", icon: Armchair, label: "Mesas", roles: ["admin", "cajero"] },
    { id: "inventario", icon: Package, label: "Stock", roles: ["admin"] },
    { id: "caja", icon: DollarSign, label: "Caja", roles: ["admin", "cajero"] },
    { id: "estadisticas", icon: BarChart3, label: "Stats", roles: ["admin"] },
    { id: "usuarios", icon: Users, label: "Usuarios", roles: ["admin"] },
    { id: "configuracion", icon: Settings, label: "Config", roles: ["admin"] },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.roles.includes(role));

  const handleNavigate = (id) => {
    onViewChange(id);
  };

  return (
    <>
      {/* ── Sidebar desktop ───────────────────────────────────────────────── */}
      <div className="hidden md:flex w-20 bg-[#1a1a1a] border-r border-[#2a2a2a] flex-col items-center py-6 h-screen sticky top-0 shrink-0">
        <div className="mb-8 w-12 h-12 bg-[#6B21A8] rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl">LT</span>
        </div>

        <div className="flex-1 flex flex-col gap-2 w-full px-3">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive ? "bg-[#6B21A8] text-white" : "text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
                }`}
              >
                <Icon size={24} />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="w-full px-3 mt-auto pt-4 border-t border-[#2a2a2a]">
          <button
            onClick={onLogout}
            className="w-full aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-all"
          >
            <LogOut size={24} />
            <span className="text-[10px]">Salir</span>
          </button>
        </div>
      </div>

      {/* ── Botón hamburguesa fijo — móvil ───────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-6 right-5 z-40 w-14 h-14 bg-[#6B21A8] rounded-full flex items-center justify-center shadow-lg shadow-black/40 active:scale-90 transition-transform"
        aria-label="Abrir menú"
      >
        <Menu size={26} className="text-white" />
      </button>

      {/* ── Drawer lateral — móvil ────────────────────────────────────────── */}
      {visible && (
        <>
          {/* Overlay con fade */}
          <div
            onClick={closeDrawer}
            style={{ transition: "opacity 300ms ease" }}
            className={`md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm ${animIn ? "opacity-100" : "opacity-0"}`}
          />

          {/* Panel con slide-in desde la derecha */}
          <div
            style={{ transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)" }}
            className={`md:hidden fixed right-0 top-0 bottom-0 z-50 w-64 bg-[#1a1a1a] border-l border-[#2a2a2a] flex flex-col shadow-2xl ${animIn ? "translate-x-0" : "translate-x-full"}`}
          >
            {/* Header del drawer */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#6B21A8] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LT</span>
                </div>
                <span className="text-white font-semibold">La Terraza</span>
              </div>
              <button
                onClick={closeDrawer}
                className="text-gray-400 hover:text-white p-1 transition-colors"
                aria-label="Cerrar menú"
              >
                <X size={22} />
              </button>
            </div>

            {/* Items de navegación con stagger */}
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              {visibleMenuItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { handleNavigate(item.id); closeDrawer(); }}
                    style={{
                      transition: `opacity 250ms ease ${animIn ? i * 40 : 0}ms, transform 250ms ease ${animIn ? i * 40 : 0}ms`,
                      opacity: animIn ? 1 : 0,
                      transform: animIn ? "translateX(0)" : "translateX(24px)",
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors active:scale-95 ${
                      isActive
                        ? "bg-[#6B21A8] text-white"
                        : "text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-base font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cerrar sesión */}
            <div
              style={{
                transition: `opacity 250ms ease ${animIn ? visibleMenuItems.length * 40 : 0}ms, transform 250ms ease ${animIn ? visibleMenuItems.length * 40 : 0}ms`,
                opacity: animIn ? 1 : 0,
                transform: animIn ? "translateX(0)" : "translateX(24px)",
              }}
              className="px-3 pb-8 pt-3 border-t border-[#2a2a2a]"
            >
              <button
                onClick={() => { closeDrawer(); setTimeout(onLogout, 320); }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-all active:scale-95"
              >
                <LogOut size={22} />
                <span className="text-base font-medium">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
