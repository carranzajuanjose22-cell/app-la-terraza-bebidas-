import { ShoppingCart, Package, DollarSign, Settings, LogOut, Home, BarChart3, Users } from "lucide-react";

export function Sidebar({ activeView, onViewChange, role, onLogout }) {
  const menuItems = [
    { id: "inicio", icon: Home, label: "Inicio", roles: ["admin"] },
    { id: "ventas", icon: ShoppingCart, label: "Ventas", roles: ["admin", "cajero"] },
    { id: "inventario", icon: Package, label: "Stock", roles: ["admin"] },
    { id: "caja", icon: DollarSign, label: "Caja", roles: ["admin", "cajero"] },
    { id: "estadisticas", icon: BarChart3, label: "Stats", roles: ["admin"] },
    { id: "usuarios", icon: Users, label: "Usuarios", roles: ["admin"] },
    { id: "configuracion", icon: Settings, label: "Config", roles: ["admin"] },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <div className="w-20 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col items-center py-6 h-screen sticky top-0">
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
  );
}
