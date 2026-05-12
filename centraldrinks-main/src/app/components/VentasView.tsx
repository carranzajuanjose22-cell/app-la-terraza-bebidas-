import { useState } from 'react';
import { Search, Lock } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { CartSidebar } from './CartSidebar';
import { PaymentModal } from './PaymentModal';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  image: string;
  stock: number;
  minStock: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const MOCK_PRODUCTS: Product[] = [];

interface VentasViewProps {
  isCajaOpen: boolean;
  paymentMethods: {
    id: string;
    name: string;
    surcharge: number;
  }[];
  onAddTransaction: (transaction: any) => void;
}

export function VentasView({ isCajaOpen, paymentMethods, onAddTransaction }: VentasViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const categories = ['Todos', 'Vinos', 'Cervezas', 'Espirituosas'];

  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCartItems(prev =>
      prev.map(item => item.id === id ? { ...item, quantity } : item)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    toast.info('Producto eliminado del carrito');
  };

  const handleCheckout = () => {
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = (payments: { finalAmount: number, methodId: string }[]) => {
    // Sumamos los montos finales ya calculados (incluyendo recargos)
    const finalTotal = payments.reduce((sum, p) => sum + p.finalAmount, 0);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onAddTransaction({
      id: Math.random().toString(36).substr(2, 9),
      date: dateStr,
      time: timeStr,
      total: finalTotal,
      payments: payments.map(p => {
        const method = paymentMethods.find(m => m.id === p.methodId);
        return {
          type: method ? method.name : 'Virtual',
          amount: p.finalAmount
        };
      }),
      items: cartItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        total: item.price * item.quantity
      }))
    });

    toast.success('Venta procesada exitosamente', {
      description: `Total cobrado: $${finalTotal.toFixed(2)}`,
    });

    setCartItems([]);
    setShowPaymentModal(false);
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex-1 flex relative">
      {!isCajaOpen && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-[#121212]/60 flex items-center justify-center">
          <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#2a2a2a] text-center max-w-md shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Caja Cerrada</h2>
            <p className="text-gray-400">
              Caja cerrada, pedile al administrador que abra la caja.
            </p>
          </div>
        </div>
      )}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-white text-4xl mb-6">Punto de Venta</h1>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white rounded-xl pl-12 pr-4 py-4 border border-[#333] focus:border-[#6B21A8] outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  px-6 py-3 rounded-lg transition-all
                  ${selectedCategory === category
                    ? 'bg-[#6B21A8] text-white'
                    : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333]'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </div>

      <CartSidebar
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      {showPaymentModal && (
        <PaymentModal
          total={total}
          paymentMethods={paymentMethods}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleConfirmPayment}
        />
      )}
    </div>
  );
}
