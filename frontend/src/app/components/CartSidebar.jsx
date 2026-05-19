import { Plus, Minus, Trash2, CreditCard, X } from "lucide-react";

export function CartSidebar({ items, onUpdateQuantity, onRemoveItem, onCheckout, isMobileOpen, onMobileClose }) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const ItemsList = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {items.length === 0 ? (
        <div className="text-center text-gray-500 mt-16">
          <p>Carrito vacío</p>
          <p className="text-sm mt-2">Agrega productos para comenzar</p>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="bg-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 mr-2">
                <h4 className="text-white text-sm leading-snug">{item.name}</h4>
                <p className="text-[#8B5CF6] mt-1 text-sm">${Number(item.price).toFixed(2)}</p>
              </div>
              <button onClick={() => onRemoveItem(item.id)} className="text-gray-400 hover:text-white transition-colors shrink-0">
                <Trash2 size={18} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-1">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="text-white w-7 text-center text-sm">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={item.stock != null && item.quantity >= item.stock}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="text-right">
                <span className="text-white font-bold block text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                {item.stock != null && item.stock <= 5 && (
                  <span className="text-orange-400 text-xs">Stock: {item.stock}</span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const Footer = () => (
    <div className="p-4 md:p-6 border-t border-[#2a2a2a] space-y-3">
      <div className="flex items-center justify-between text-lg md:text-xl">
        <span className="text-gray-400">Total:</span>
        <span className="text-white font-bold">${total.toFixed(2)}</span>
      </div>
      <button
        onClick={onCheckout}
        disabled={items.length === 0}
        className="w-full bg-[#6B21A8] hover:bg-[#581C87] disabled:bg-[#333] disabled:text-gray-500 disabled:cursor-not-allowed text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        <CreditCard size={20} />
        Finalizar Venta
      </button>
    </div>
  );

  return (
    <>
      {/* Panel derecho — desktop */}
      <div className="hidden md:flex w-96 bg-[#1a1a1a] border-l border-[#2a2a2a] flex-col shrink-0">
        <div className="p-6 border-b border-[#2a2a2a]">
          <h2 className="text-white text-2xl">Carrito</h2>
          <p className="text-gray-400 text-sm mt-1">{itemCount} productos</p>
        </div>
        <ItemsList />
        <Footer />
      </div>

      {/* Drawer desde abajo — móvil */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] rounded-t-2xl border-t border-[#2a2a2a] flex flex-col"
            style={{ maxHeight: "85vh" }}
          >
            {/* Handle visual */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#3a3a3a]" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a2a]">
              <div>
                <h2 className="text-white text-xl font-medium">Carrito</h2>
                <p className="text-gray-400 text-xs mt-0.5">{itemCount} productos</p>
              </div>
              <button
                onClick={onMobileClose}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#2a2a2a]"
              >
                <X size={22} />
              </button>
            </div>
            <ItemsList />
            <Footer />
          </div>
        </div>
      )}
    </>
  );
}
