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

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Vino Tinto Reserva', price: 45.99, cost: 25.00, category: 'Vinos', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400', stock: 15, minStock: 10 },
  { id: '2', name: 'Cerveza Artesanal IPA', price: 8.50, cost: 4.00, category: 'Cervezas', image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', stock: 45, minStock: 20 },
  { id: '3', name: 'Whisky Single Malt', price: 89.99, cost: 50.00, category: 'Espirituosas', image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400', stock: 8, minStock: 5 },
  { id: '4', name: 'Champagne Brut', price: 65.00, cost: 35.00, category: 'Vinos', image: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400', stock: 12, minStock: 10 },
  { id: '5', name: 'Gin Premium', price: 42.50, cost: 20.00, category: 'Espirituosas', image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400', stock: 20, minStock: 10 },
  { id: '6', name: 'Cerveza Lager', price: 6.00, cost: 3.00, category: 'Cervezas', image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400', stock: 60, minStock: 24 },
  { id: '7', name: 'Ron Añejo', price: 38.00, cost: 18.00, category: 'Espirituosas', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400', stock: 18, minStock: 8 },
  { id: '8', name: 'Vino Blanco Seco', price: 32.00, cost: 15.00, category: 'Vinos', image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400', stock: 22, minStock: 10 },
];

interface VentasViewProps {
  isCajaOpen: boolean;
  paymentMethods: {
    id: string;
    name: string;
    surcharge: number;
  }[];
}

export function VentasView({ isCajaOpen, paymentMethods }: VentasViewProps) {
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

  const handleConfirmPayment = (payments: { finalAmount: number }[]) => {
    // Sumamos los montos finales ya calculados (incluyendo recargos)
    const finalTotal = payments.reduce((sum, p) => sum + p.finalAmount, 0);

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
