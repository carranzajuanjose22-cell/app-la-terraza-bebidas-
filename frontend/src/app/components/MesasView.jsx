import { useState, useEffect } from "react";
import {
  Search, Lock, Plus, Trash2, ArrowLeft, Pencil, ShoppingCart, Armchair,
} from "lucide-react";
import { ProductCard } from "./ProductCard.jsx";
import { CartSidebar } from "./CartSidebar.jsx";
import { PaymentModal } from "./PaymentModal.jsx";
import { Loader } from "./Loader.jsx";
import { toast } from "sonner";
import api from "../../services/api.js";

function unitPriceMesa(product) {
  return Number(product.priceMesa ?? product.price) || 0;
}

const STATUS_STYLE = {
  libre: "border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/15",
  ocupada: "border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/15",
  cerrando: "border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/15",
};

const STATUS_BADGE = {
  libre: "bg-emerald-500/20 text-emerald-300",
  ocupada: "bg-amber-500/20 text-amber-300",
  cerrando: "bg-orange-500/20 text-orange-300",
};

export function MesasView({
  isCajaOpen,
  onAddTransaction,
  role = "cajero",
  mesaSeleccionada,
  setMesaSeleccionada,
  cargaMesas,
  setCargaMesas,
  tables,
  setTables,
  onAccountsReload,
}) {
  const [products, setProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [barBottles, setBarBottles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [editingNameId, setEditingNameId] = useState(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const cartItems = mesaSeleccionada != null ? (cargaMesas[mesaSeleccionada] || []) : [];
  const selectedTable = tables.find((t) => t.number === mesaSeleccionada) || null;

  async function refreshTables() {
    const { data } = await api.get("/tables");
    setTables(data || []);
    return data || [];
  }

  async function persistAccount(tableNumber, items) {
    try {
      await api.put(`/tables/accounts/${tableNumber}`, { items });
      await refreshTables();
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo guardar la cuenta de la mesa");
    }
  }

  const setCartItems = (updater) => {
    if (mesaSeleccionada == null) return;
    setCargaMesas((prev) => {
      const current = prev[mesaSeleccionada] || [];
      const nextItems = typeof updater === "function" ? updater(current) : updater;
      const next = { ...prev };
      if (!nextItems.length) delete next[mesaSeleccionada];
      else next[mesaSeleccionada] = nextItems;
      queueMicrotask(() => persistAccount(mesaSeleccionada, nextItems));
      return next;
    });
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/tables").catch(() => ({ data: [] })),
      api.get("/tables/accounts").catch(() => ({ data: {} })),
      api.get("/products").catch(() => ({ data: [] })),
      api.get("/payment-methods").catch(() => ({ data: [] })),
      api.get("/categories").catch(() => ({ data: [] })),
      api.get("/bar-bottles").catch(() => ({ data: [] })),
    ])
      .then(([tRes, aRes, pRes, mRes, cRes, bRes]) => {
        setTables(tRes.data || []);
        const raw = aRes.data || {};
        const map = {};
        for (const [k, v] of Object.entries(raw)) map[Number(k)] = v;
        setCargaMesas(map);
        setProducts(pRes.data || []);
        setPaymentMethods(mRes.data || []);
        setCategories((cRes.data || []).map((c) => c.name));
        setBarBottles(bRes.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateTable = async () => {
    setCreating(true);
    try {
      await api.post("/tables", { name: newTableName.trim() || undefined });
      setNewTableName("");
      await refreshTables();
      toast.success("Mesa agregada al salón");
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo crear la mesa");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTable = async (table, e) => {
    e?.stopPropagation?.();
    if (table.number <= 8) return;
    const items = cargaMesas[table.number] || [];
    if (items.length > 0 || table.status === "ocupada" || table.status === "cerrando") {
      toast.error("No se puede eliminar: la mesa está consumiendo");
      return;
    }
    setDeletingId(table.id);
    try {
      await api.delete(`/tables/${table.id}`);
      if (mesaSeleccionada === table.number) setMesaSeleccionada(null);
      setCargaMesas((prev) => {
        const next = { ...prev };
        delete next[table.number];
        return next;
      });
      await refreshTables();
      toast.success(`Se eliminó ${table.name || `Mesa ${table.number}`}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveName = async (table) => {
    const name = editNameValue.trim();
    if (!name) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    try {
      await api.put(`/tables/${table.id}`, { name });
      setEditingNameId(null);
      await refreshTables();
      toast.success("Nombre actualizado");
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo renombrar");
    }
  };

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

  const getAvailableGlasses = (bottleProductId, glassesPerBottle) => {
    if (!bottleProductId || !glassesPerBottle || glassesPerBottle <= 0) return 0;
    return barBottles
      .filter((b) => Number(b.productId) === Number(bottleProductId))
      .reduce((acc, b) => acc + Math.max(0, glassesPerBottle - (Number(b.servedGlasses) || 0)), 0);
  };

  const getCartReservedPortions = (bottleProductId, excludeProductId = null) => {
    return cartItems.reduce((sum, item) => {
      if (excludeProductId != null && item.id === excludeProductId) return sum;
      const recipe = getDrinkRecipe(item);
      return sum + recipe
        .filter((ing) => Number(ing.bottleProductId) === Number(bottleProductId))
        .reduce((s, ing) => s + ing.glassesUsed * item.quantity, 0);
    }, 0);
  };

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

  const handleAddToCart = async (product) => {
    if (mesaSeleccionada == null) return;
    const existing = cartItems.find((item) => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const recipe = getDrinkRecipe(product);
    const isDrinkGlass = recipe.length > 0;
    const price = unitPriceMesa(product);

    if (isDrinkGlass && recipe.some((ing) => !ing.bottleProductId || ing.glassesPerBottle <= 0 || ing.glassesUsed <= 0)) {
      toast.error("Trago mal configurado");
      return;
    }

    let bottlesSnapshot = barBottles;
    if (isDrinkGlass) {
      try {
        const { data } = await api.get("/bar-bottles");
        bottlesSnapshot = data || [];
        setBarBottles(bottlesSnapshot);
      } catch { /* keep */ }
    }

    const availableFromSnapshot = (bottleProductId, glassesPerBottle) => {
      if (!bottleProductId || !glassesPerBottle || glassesPerBottle <= 0) return 0;
      return bottlesSnapshot
        .filter((b) => Number(b.productId) === Number(bottleProductId))
        .reduce((acc, b) => acc + Math.max(0, glassesPerBottle - (Number(b.servedGlasses) || 0)), 0);
    };

    if (isDrinkGlass) {
      let maxUnits = Infinity;
      for (const ing of recipe) {
        const available = availableFromSnapshot(ing.bottleProductId, ing.glassesPerBottle);
        const reserved = getCartReservedPortions(ing.bottleProductId, product.id);
        const free = Math.max(0, available - reserved);
        maxUnits = Math.min(maxUnits, Math.floor(free / ing.glassesUsed));
      }
      if (maxUnits === Infinity) maxUnits = 0;
      if (maxUnits < currentQty + 1) {
        toast.error("Sin botella abierta en la barra");
        return;
      }
    } else {
      const stock = Number(product.stock) || 0;
      if (currentQty >= stock) {
        toast.error("Sin stock suficiente");
        return;
      }
    }

    if (existing) {
      setCartItems((prev) => prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCartItems((prev) => [...prev, {
        id: product.id,
        name: product.name,
        price,
        stock: product.stock,
        quantity: 1,
        bottleProductId: product.bottleProductId || null,
        glassesPerBottle: product.glassesPerBottle || null,
        drinkBottleItems: recipe,
      }]);
    }
    toast.success(`${product.name} agregado`);
  };

  const handleUpdateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    const recipe = getDrinkRecipe(item);
    if (recipe.length > 0) {
      const maxUnits = getMaxDrinkUnitsAvailable(item, true);
      if (quantity > maxUnits) {
        toast.error("Sin botellas abiertas suficientes");
        return;
      }
    } else if (quantity > item.stock) {
      toast.error("Sin stock suficiente");
      return;
    }
    setCartItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
  };

  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    toast.info("Producto eliminado");
  };

  const handleOpenCheckout = async () => {
    if (!cartItems.length) return;
    if (selectedTable) {
      try {
        await api.put(`/tables/${selectedTable.id}`, { status: "cerrando" });
        await refreshTables();
      } catch { /* ignore */ }
    }
    setShowMobileCart(false);
    setShowPaymentModal(true);
  };

  const handleClosePayment = async () => {
    setShowPaymentModal(false);
    if (selectedTable) {
      const hasItems = cartItems.length > 0;
      try {
        await api.put(`/tables/${selectedTable.id}`, { status: hasItems ? "ocupada" : "libre" });
        await refreshTables();
      } catch { /* ignore */ }
    }
  };

  const handleConfirmPayment = async (payments) => {
    const finalTotal = payments.reduce((sum, p) => sum + p.finalAmount, 0);
    const transaction = {
      total: finalTotal,
      saleType: "mesa",
      tableNumber: mesaSeleccionada,
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
      toast.success("Mesa cobrada", {
        description: `${selectedTable?.name || `Mesa ${mesaSeleccionada}`} · $${finalTotal.toFixed(2)}`,
      });
      setShowPaymentModal(false);
      setMesaSeleccionada(null);
      try {
        const { data } = await api.get("/bar-bottles");
        setBarBottles(data || []);
      } catch { /* ignore */ }
      await refreshTables();
      if (onAccountsReload) await onAccountsReload();
    } catch (err) {
      toast.error("No se pudo cobrar la mesa", { description: err.response?.data?.message || err.message });
      throw err;
    }
  };

  const allCategories = ["Todos", ...categories];
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isAvailable;
  });

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const activeTables = tables.filter((t) => t.isActive !== false);

  // ── Vista: grilla del salón ──────────────────────────────────────────────
  if (mesaSeleccionada == null) {
    return (
      <div className="flex-1 p-4 pb-24 md:p-8 overflow-y-auto relative">
        {loading && <Loader />}
        {!isCajaOpen && (
          <div className="absolute inset-0 z-50 backdrop-blur-md bg-[#121212]/60 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] p-6 md:p-8 rounded-2xl border border-[#2a2a2a] text-center max-w-sm shadow-2xl w-full">
              <div className="w-14 h-14 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={28} />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Caja Cerrada</h2>
              <p className="text-gray-400 text-sm">Pedile al administrador que abra la caja.</p>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-white text-2xl md:text-4xl mb-1 flex items-center gap-3">
              <Armchair className="text-[#8B5CF6]" />
              Mesas del salón
            </h1>
            <p className="text-gray-400 text-sm">Elegí una mesa para cargar consumo o cobrar</p>
          </div>
        </div>

        <div className="mb-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="text-gray-400 text-xs block mb-1.5">Nombre de la nueva mesa</label>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Ej: Terraza 1, VIP, Barra…"
              className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleCreateTable()}
            />
          </div>
          <button
            onClick={handleCreateTable}
            disabled={creating}
            className="bg-[#6B21A8] hover:bg-[#581C87] disabled:opacity-60 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={18} />
            Agregar mesa
          </button>
        </div>

        {activeTables.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-[#2a2a2a] rounded-2xl">
            <Armchair size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-white text-lg mb-1">Todavía no hay mesas</p>
            <p className="text-sm">Agregá la primera con el botón de arriba</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {activeTables.map((t) => {
              const items = cargaMesas[t.number] || [];
              const count = items.reduce((s, i) => s + i.quantity, 0);
              const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
              // Estado visual: ocupada si hay consumo, aunque el backend diga libre
              const visualStatus = count > 0
                ? (t.status === "cerrando" ? "cerrando" : "ocupada")
                : "libre";

              return (
                <div
                  key={t.id}
                  className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${STATUS_STYLE[visualStatus]}`}
                >
                  <button
                    type="button"
                    onClick={() => setMesaSeleccionada(t.number)}
                    className="text-left flex-1"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-white text-xl font-bold leading-tight">
                        {t.name || `Mesa ${t.number}`}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[visualStatus]}`}>
                        {visualStatus}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs">Nº {t.number}</p>
                    {count > 0 ? (
                      <div className="mt-3">
                        <p className="text-white text-sm">{count} producto{count === 1 ? "" : "s"}</p>
                        <p className="text-[#8B5CF6] font-bold text-lg">${subtotal.toFixed(2)}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mt-3">Sin consumo</p>
                    )}
                  </button>

                  {editingNameId === t.id ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveName(t)}
                        className="flex-1 bg-[#121212] text-white text-sm rounded-lg px-2 py-1.5 border border-[#333] outline-none focus:border-[#6B21A8]"
                      />
                      <button
                        onClick={() => handleSaveName(t)}
                        className="text-xs bg-[#6B21A8] text-white px-2 rounded-lg"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setEditingNameId(null)}
                        className="text-xs text-gray-400 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNameId(t.id);
                          setEditNameValue(t.name || `Mesa ${t.number}`);
                        }}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        <Pencil size={12} /> Renombrar
                      </button>
                      {t.number > 8 && visualStatus === "libre" && (
                        <button
                          type="button"
                          disabled={deletingId === t.id}
                          onClick={(e) => handleDeleteTable(t, e)}
                          className="flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={12} /> Eliminar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Vista: cuenta de una mesa (catálogo + carrito) ───────────────────────
  return (
    <div className="flex-1 flex relative overflow-hidden">
      {loading && <Loader />}
      {!isCajaOpen && (
        <div className="absolute inset-0 z-50 backdrop-blur-md bg-[#121212]/60 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#2a2a2a] text-center max-w-sm">
            <Lock size={28} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-white text-xl font-bold">Caja Cerrada</h2>
          </div>
        </div>
      )}

      <div className="flex-1 p-4 pb-24 md:p-8 md:pb-8 overflow-y-auto">
        <div className="mb-6">
          <button
            onClick={() => setMesaSeleccionada(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft size={16} /> Volver al salón
          </button>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h1 className="text-white text-2xl md:text-3xl font-bold">
              {selectedTable?.name || `Mesa ${mesaSeleccionada}`}
            </h1>
            <span className={`text-xs uppercase px-2.5 py-1 rounded-full ${STATUS_BADGE[selectedTable?.status || "ocupada"]}`}>
              {cartItems.length > 0 ? (selectedTable?.status === "cerrando" ? "cerrando" : "ocupada") : "libre"}
            </span>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white rounded-xl pl-12 pr-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap shrink-0 ${
                  selectedCategory === category ? "bg-[#6B21A8] text-white" : "bg-[#2a2a2a] text-gray-400"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredProducts.map((product) => {
            const recipe = getDrinkRecipe(product);
            const isDrink = recipe.length > 0;
            return (
              <ProductCard
                key={product.id}
                product={product}
                displayPrice={unitPriceMesa(product)}
                priceLabel="Mesa"
                onAddToCart={handleAddToCart}
                availableGlasses={isDrink ? getMaxDrinkUnitsAvailable(product, true) : null}
              />
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-20 right-4 md:hidden z-30">
        <button
          onClick={() => setShowMobileCart(true)}
          className="bg-[#6B21A8] text-white h-14 px-5 rounded-full flex items-center gap-2.5 shadow-xl shadow-[#6B21A8]/40"
        >
          <ShoppingCart size={20} />
          {totalCartItems > 0 && (
            <span className="bg-white text-[#6B21A8] rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
              {totalCartItems}
            </span>
          )}
          <span className="font-medium">${total.toFixed(2)}</span>
        </button>
      </div>

      <CartSidebar
        title={selectedTable?.name || `Mesa ${mesaSeleccionada}`}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleOpenCheckout}
        isMobileOpen={showMobileCart}
        onMobileClose={() => setShowMobileCart(false)}
        checkoutLabel="Cobrar mesa"
      />

      {showPaymentModal && paymentMethods.length > 0 && (
        <PaymentModal
          total={total}
          paymentMethods={paymentMethods}
          onClose={handleClosePayment}
          onConfirm={handleConfirmPayment}
        />
      )}
      {showPaymentModal && paymentMethods.length === 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a] p-8 text-center">
            <p className="text-white text-xl mb-4">No hay métodos de pago</p>
            <button onClick={handleClosePayment} className="bg-[#6B21A8] text-white px-6 py-3 rounded-xl">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
