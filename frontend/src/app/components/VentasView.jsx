import { useState, useEffect } from "react";
import { Search, Lock } from "lucide-react";
import { ProductCard } from "./ProductCard.jsx";
import { CartSidebar } from "./CartSidebar.jsx";
import { PaymentModal } from "./PaymentModal.jsx";
import { Loader } from "./Loader.jsx";
import { toast } from "sonner";
import api from "../../services/api.js";

export function VentasView({ isCajaOpen, onAddTransaction }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cartItems, setCartItems] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/products"),
      api.get("/payment-methods"),
      api.get("/categories"),
    ]).then(([pRes, mRes, cRes]) => {
      setProducts(pRes.data);
      setPaymentMethods(mRes.data);
      setCategories(cRes.data.map((c) => c.name));
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const allCategories = ["Todos", ...categories];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isAvailable;
  });

  const handleAddToCart = (product) => {
    const existing = cartItems.find((item) => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    if (currentQty >= product.stock) {
      toast.error("Sin stock suficiente", { description: `Solo hay ${product.stock} unidad${product.stock === 1 ? "" : "es"} de ${product.name}` });
      return;
    }
    if (existing) {
      setCartItems((prev) => prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCartItems((prev) => [...prev, { id: product.id, name: product.name, price: product.price, stock: product.stock, quantity: 1 }]);
    }
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleUpdateQuantity = (id, quantity) => {
    if (quantity <= 0) { handleRemoveItem(id); return; }
    const item = cartItems.find((i) => i.id === id);
    if (item && quantity > item.stock) {
      toast.error("Sin stock suficiente", { description: `Solo hay ${item.stock} unidad${item.stock === 1 ? "" : "es"} de ${item.name}` });
      return;
    }
    setCartItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
  };

  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    toast.info("Producto eliminado del carrito");
  };

  const handleConfirmPayment = async (payments) => {
    const finalTotal = payments.reduce((sum, p) => sum + p.finalAmount, 0);
    const transaction = {
      total: finalTotal,
      payments: payments.map((p) => ({
        type: p.type,
        amount: p.finalAmount,
        baseAmount: p.baseAmount,
        surchargePercent: p.surchargePercent,
      })),
      items: cartItems.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      })),
    };

    try {
      await onAddTransaction(transaction);
      toast.success("Venta procesada exitosamente", { description: `Total cobrado: $${finalTotal.toFixed(2)}` });
      setCartItems([]);
      setShowPaymentModal(false);
    } catch (err) {
      toast.error("No se pudo registrar la venta", { description: err.response?.data?.message || err.message });
      throw err; // re-lanzar para que PaymentModal libere el estado submitting
    }
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="flex-1 flex relative">
      {loading && <Loader />}
      {!isCajaOpen && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-[#121212]/60 flex items-center justify-center">
          <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#2a2a2a] text-center max-w-md shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Caja Cerrada</h2>
            <p className="text-gray-400">Pedile al administrador que abra la caja.</p>
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
          <div className="flex gap-3 flex-wrap">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-lg transition-all ${selectedCategory === category ? "bg-[#6B21A8] text-white" : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333]"}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredProducts.length === 0 && (
            <p className="text-gray-500 text-center py-12">No hay productos disponibles</p>
          )}
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </div>

      <CartSidebar
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => setShowPaymentModal(true)}
      />

      {showPaymentModal && paymentMethods.length > 0 && (
        <PaymentModal
          total={total}
          paymentMethods={paymentMethods}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleConfirmPayment}
        />
      )}
      {showPaymentModal && paymentMethods.length === 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a] p-8 text-center">
            <p className="text-white text-xl mb-4">No hay métodos de pago configurados</p>
            <p className="text-gray-400 mb-6">Configurá al menos un método de pago en la sección Configuración.</p>
            <button onClick={() => setShowPaymentModal(false)} className="bg-[#6B21A8] text-white px-6 py-3 rounded-xl">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
