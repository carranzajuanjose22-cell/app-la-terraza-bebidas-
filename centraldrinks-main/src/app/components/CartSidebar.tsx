import { X, Plus, Minus, Trash2, CreditCard } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartSidebarProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export function CartSidebar({ items, onUpdateQuantity, onRemoveItem, onCheckout }: CartSidebarProps) {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="w-96 bg-[#1a1a1a] border-l border-[#2a2a2a] flex flex-col">
      <div className="p-6 border-b border-[#2a2a2a]">
        <h2 className="text-white text-2xl">Carrito</h2>
        <p className="text-gray-400 text-sm mt-1">{itemCount} productos</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <p>Carrito vacío</p>
            <p className="text-sm mt-2">Agrega productos para comenzar</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-white">{item.name}</h4>
                <p className="text-[#8B5CF6] mt-1">${item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-1">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-[#333] rounded transition-colors"
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-white w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-white hover:bg-[#333] rounded transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <span className="text-white font-bold">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-[#2a2a2a] space-y-4">
        <div className="flex items-center justify-between text-xl">
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
    </div>
  );
}
