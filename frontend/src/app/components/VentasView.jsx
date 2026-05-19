import { useState, useEffect } from "react";
import { Search, Lock, Wallet, ShoppingCart } from "lucide-react";
import { ProductCard } from "./ProductCard.jsx";
import { CartSidebar } from "./CartSidebar.jsx";
import { PaymentModal } from "./PaymentModal.jsx";
import { DailyExpenseModal } from "./DailyExpenseModal.jsx";
import { Loader } from "./Loader.jsx";
import { toast } from "sonner";
import api from "../../services/api.js";

export function VentasView({ isCajaOpen, onAddTransaction }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [cartItems, setCartItems] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
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
      throw err;
    }
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleOpenCheckout = () => {
    setShowMobileCart(false);
    setShowPaymentModal(true);
  };

  const handleDailyExpense = async (expenseData) => {
    try {
      await api.post("/daily-expenses", expenseData);
      toast.success("Gasto registrado correctamente");
      setShowExpenseModal(false);
    } catch (err) {
      toast.error("Error al registrar el gasto", { description: err.response?.data?.message || err.message });
      throw err;
    }
  };

  return (
    <div className="flex-1 flex relative overflow-hidden">
      {loading && <Loader />}
      {!isCajaOpen && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-[#121212]/60 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] p-6 md:p-8 rounded-2xl border border-[#2a2a2a] text-center max-w-sm md:max-w-md shadow-2xl w-full">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={28} />
            </div>
            <h2 className="text-white text-xl md:text-2xl font-bold mb-2">Caja Cerrada</h2>
            <p className="text-gray-400 text-sm md:text-base">Pedile al administrador que abra la caja.</p>
          </div>
        </div>
      )}

      {/* Área principal de productos */}
      <div className="flex-1 p-4 pb-24 md:p-8 md:pb-8 overflow-y-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3">
            <h1 className="text-white text-2xl md:text-4xl">Punto de Venta</h1>
            {isCajaOpen && (
              <button
                onClick={() => setShowExpenseModal(true)}
                className="bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors border border-[#333] text-sm md:text-base self-start sm:self-auto"
              >
                <Wallet size={18} className="text-orange-400" />
                Gastos / Extracción
              </button>
            )}
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white rounded-xl pl-12 pr-4 py-3 md:py-4 border border-[#333] focus:border-[#6B21A8] outline-none"
            />
          </div>

          {/* Filtro de categorías — scroll horizontal en móvil */}
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-0 md:flex-wrap scrollbar-hide">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg transition-all text-sm whitespace-nowrap shrink-0 ${
                  selectedCategory === category ? "bg-[#6B21A8] text-white" : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333]"
                }`}
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

      {/* Botón flotante del carrito — solo móvil */}
      <div className="fixed bottom-20 right-4 md:hidden z-30">
        <button
          onClick={() => setShowMobileCart(true)}
          className="bg-[#6B21A8] hover:bg-[#581C87] text-white h-14 px-5 rounded-full flex items-center gap-2.5 shadow-xl shadow-[#6B21A8]/40 transition-all active:scale-95"
        >
          <ShoppingCart size={20} />
          {totalCartItems > 0 && (
            <span className="bg-white text-[#6B21A8] rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold leading-none">
              {totalCartItems}
            </span>
          )}
          <span className="font-medium">${total.toFixed(2)}</span>
        </button>
      </div>

      <CartSidebar
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleOpenCheckout}
        isMobileOpen={showMobileCart}
        onMobileClose={() => setShowMobileCart(false)}
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

      {showExpenseModal && (
        <DailyExpenseModal
          onClose={() => setShowExpenseModal(false)}
          onSubmit={handleDailyExpense}
        />
      )}
    </div>
  );
}
