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
  const [barBottles, setBarBottles] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchBarBottles() {
    try {
      const { data } = await api.get("/bar-bottles");
      setBarBottles(data);
    } catch {
      setBarBottles([]);
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/products"),
      api.get("/payment-methods"),
      api.get("/categories"),
      api.get("/bar-bottles").catch(() => ({ data: [] })),
    ]).then(([pRes, mRes, cRes, bRes]) => {
      setProducts(pRes.data);
      setPaymentMethods(mRes.data);
      setCategories(cRes.data.map((c) => c.name));
      setBarBottles(bRes.data || []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const allCategories = ["Todos", ...categories];

  const getDrinkRecipe = (productOrItem) => {
    if (Array.isArray(productOrItem.drinkBottleItems) && productOrItem.drinkBottleItems.length > 0) {
      return productOrItem.drinkBottleItems.map((i) => ({
        bottleProductId: Number(i.bottleProductId),
        glassesUsed: Number(i.glassesUsed) || 1,
        glassesPerBottle: Number(i.glassesPerBottle) || 0,
      }));
    }
    if (productOrItem.bottleProductId) {
      return [{
        bottleProductId: Number(productOrItem.bottleProductId),
        glassesUsed: 1,
        glassesPerBottle: Number(productOrItem.glassesPerBottle) || 0,
      }];
    }
    return [];
  };

  // Capacidad restante en barra para un tipo de botella.
  const getAvailableGlasses = (bottleProductId, glassesPerBottle) => {
    if (!bottleProductId || !glassesPerBottle || glassesPerBottle <= 0) return 0;
    return barBottles
      .filter((b) => Number(b.productId) === Number(bottleProductId))
      .reduce((acc, b) => acc + Math.max(0, glassesPerBottle - (Number(b.servedGlasses) || 0)), 0);
  };

  // Porciones ya reservadas en el carrito para una botella (suma glassesUsed * qty).
  const getCartReservedPortions = (bottleProductId, excludeProductId = null) => {
    return cartItems.reduce((sum, item) => {
      if (excludeProductId != null && item.id === excludeProductId) return sum;
      const recipe = getDrinkRecipe(item);
      return sum + recipe
        .filter((ing) => Number(ing.bottleProductId) === Number(bottleProductId))
        .reduce((s, ing) => s + ing.glassesUsed * item.quantity, 0);
    }, 0);
  };

  // Máximo de unidades del trago que se pueden agregar ahora (limitado por la botella más escasa).
  const getMaxDrinkUnitsAvailable = (product, excludeSelfFromCart = false) => {
    const recipe = getDrinkRecipe(product);
    if (recipe.length === 0) return 0;
    let maxUnits = Infinity;
    for (const ing of recipe) {
      if (ing.glassesPerBottle <= 0 || ing.glassesUsed <= 0) return 0;
      const available = getAvailableGlasses(ing.bottleProductId, ing.glassesPerBottle);
      const reserved = getCartReservedPortions(
        ing.bottleProductId,
        excludeSelfFromCart ? product.id : null,
      );
      const free = Math.max(0, available - reserved);
      maxUnits = Math.min(maxUnits, Math.floor(free / ing.glassesUsed));
    }
    return maxUnits === Infinity ? 0 : maxUnits;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isAvailable;
  });

  const handleAddToCart = async (product) => {
    const existing = cartItems.find((item) => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const recipe = getDrinkRecipe(product);
    const isDrinkGlass = recipe.length > 0;

    // Receta inválida (trago a medias): no permitir venta
    if (isDrinkGlass && recipe.some((ing) => !ing.bottleProductId || ing.glassesPerBottle <= 0 || ing.glassesUsed <= 0)) {
      toast.error("Trago mal configurado", {
        description: "Editá el producto en Inventario y completá botella, uso por trago y rendimiento.",
      });
      return;
    }

    // Refrescar botellas abiertas antes de validar un trago (evita datos viejos en memoria)
    let bottlesSnapshot = barBottles;
    if (isDrinkGlass) {
      try {
        const { data } = await api.get("/bar-bottles");
        bottlesSnapshot = data || [];
        setBarBottles(bottlesSnapshot);
      } catch {
        // si falla, usamos el snapshot en memoria
      }
    }

    const availableFromSnapshot = (bottleProductId, glassesPerBottle) => {
      if (!bottleProductId || !glassesPerBottle || glassesPerBottle <= 0) return 0;
      return bottlesSnapshot
        .filter((b) => Number(b.productId) === Number(bottleProductId))
        .reduce((acc, b) => acc + Math.max(0, glassesPerBottle - (Number(b.servedGlasses) || 0)), 0);
    };

    if (isDrinkGlass) {
      let maxUnits = Infinity;
      let missingIng = null;
      for (const ing of recipe) {
        const available = availableFromSnapshot(ing.bottleProductId, ing.glassesPerBottle);
        const reserved = getCartReservedPortions(ing.bottleProductId, product.id);
        const free = Math.max(0, available - reserved);
        const units = Math.floor(free / ing.glassesUsed);
        if (units < maxUnits) {
          maxUnits = units;
          if (free < ing.glassesUsed * (currentQty + 1)) missingIng = ing;
        }
      }
      if (maxUnits === Infinity) maxUnits = 0;

      if (maxUnits < currentQty + 1) {
        const bottleName = missingIng
          ? (products.find((p) => Number(p.id) === Number(missingIng.bottleProductId))?.name || "una botella")
          : "las botellas";
        toast.error("Sin botella abierta en la barra", {
          description: maxUnits <= 0 && currentQty === 0
            ? `Abrí en Inicio → En Barra: ${bottleName}.`
            : `Capacidad insuficiente de ${bottleName} para otro vaso.`,
        });
        return;
      }
    } else {
      const stock = Number(product.stock) || 0;
      if (currentQty >= stock) {
        toast.error("Sin stock suficiente", {
          description: stock <= 0
            ? `No hay stock de ${product.name}`
            : `Solo hay ${stock} unidad${stock === 1 ? "" : "es"} de ${product.name}`,
        });
        return;
      }
    }

    if (existing) {
      setCartItems((prev) => prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCartItems((prev) => [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        quantity: 1,
        bottleProductId: product.bottleProductId || null,
        glassesPerBottle: product.glassesPerBottle || null,
        drinkBottleItems: recipe,
      }]);
    }
    toast.success(`${product.name} agregado al carrito`);
  };

  const handleUpdateQuantity = (id, quantity) => {
    if (quantity <= 0) { handleRemoveItem(id); return; }
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;

    const recipe = getDrinkRecipe(item);
    if (recipe.length > 0) {
      const maxUnits = getMaxDrinkUnitsAvailable(item, true);
      if (quantity > maxUnits) {
        toast.error("Sin botellas abiertas suficientes", {
          description: `Solo podés cargar hasta ${maxUnits} de este trago con las botellas abiertas.`,
        });
        return;
      }
    } else if (quantity > item.stock) {
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
      await fetchBarBottles();
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
          {filteredProducts.map((product) => {
            const recipe = getDrinkRecipe(product);
            const isDrink = recipe.length > 0;
            return (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              availableGlasses={
                isDrink ? getMaxDrinkUnitsAvailable(product, true) : null
              }
            />
            );
          })}
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
