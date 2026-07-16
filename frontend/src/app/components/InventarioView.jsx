import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, AlertTriangle, X, Package, Wine, Beer, Droplets, Layers, Tag } from "lucide-react";
import { Loader } from "./Loader.jsx";
import { toast } from "sonner";
import api from "../../services/api.js";

const ICON_OPTIONS = [
  { key: "Wine",    Icon: Wine,    label: "Copa de vino"   },
  { key: "Beer",    Icon: Beer,    label: "Jarra de cerveza" },
  { key: "Droplets",Icon: Droplets,label: "Gotita / Bebida" },
  { key: "Layers",  Icon: Layers,  label: "Combo / Promo"  },
  { key: "Package", Icon: Package, label: "Genérico"       },
];

const EMPTY_PRODUCT = {
  name: "",
  price: "",
  cost: "",
  category: "Vinos",
  stock: "",
  minStock: "",
  icon: "Package",
  isDrinkGlass: false,
  drinkBottleItems: [],
};

const EMPTY_PROMO = { name: "", cost: "", price: "", stock: "", minStock: "", items: [] };

export function InventarioView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productModal, setProductModal] = useState({ isOpen: false, item: null, isNew: false });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, product: null });
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAllLowStock, setShowAllLowStock] = useState(false);

  // Estado del modal de promoción
  const [promoModal, setPromoModal] = useState({ open: false, editId: null });
  const [promoForm, setPromoForm] = useState(EMPTY_PROMO);
  const [addingItem, setAddingItem] = useState(false);
  const [promoItemSelect, setPromoItemSelect] = useState({ productId: "", quantity: "1" });
  const [submittingPromo, setSubmittingPromo] = useState(false);
  const [loadingPromoItems, setLoadingPromoItems] = useState(false);

  async function fetchData() {
    try {
      const [pRes, cRes] = await Promise.all([api.get("/products"), api.get("/categories")]);
      setInventory(pRes.data);
      setCategories(cRes.data.map((c) => c.name));
    } catch { toast.error("Error al cargar datos"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

  const filteredInventory = inventory.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  // Los vasos de trago no tienen stock propio; no entran en alerta de stock bajo.
  const isDrinkProduct = (p) =>
    !!p.bottleProductId || (Array.isArray(p.drinkBottleItems) && p.drinkBottleItems.length > 0);

  const lowStockItems = inventory.filter((p) => !isDrinkProduct(p) && p.stock <= p.minStock);

  // Botellas fuente: productos normales (no promo, no vaso/trago).
  const bottleSourceProducts = inventory.filter((p) => !p.isPromotion && !isDrinkProduct(p));

  const handleAddProduct = () => {
    setProductModal({ isOpen: true, item: { ...EMPTY_PRODUCT, drinkBottleItems: [], category: categories[0] || "General" }, isNew: true });
  };

  const openEditProductModal = (product) => {
    const drinkItems = (product.drinkBottleItems || []).map((i) => ({
      bottleProductId: String(i.bottleProductId),
      glassesUsed: String(i.glassesUsed ?? 1),
      glassesPerBottle: String(i.glassesPerBottle ?? ""),
    }));
    const legacyDrink = !drinkItems.length && product.bottleProductId
      ? [{
          bottleProductId: String(product.bottleProductId),
          glassesUsed: "1",
          glassesPerBottle: String(product.glassesPerBottle ?? ""),
        }]
      : drinkItems;

    setProductModal({
      isOpen: true,
      isNew: false,
      item: {
        ...product,
        price: String(product.price),
        cost: String(product.cost ?? ""),
        stock: String(product.stock),
        minStock: String(product.minStock),
        icon: product.icon || "Package",
        isDrinkGlass: legacyDrink.length > 0,
        drinkBottleItems: legacyDrink,
      },
    });
  };

  const handleDeleteProduct = async () => {
    if (!deleteModal.product || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteModal.product.id}`);
      toast.success(`"${deleteModal.product.name}" eliminado`);
      setDeleteModal({ isOpen: false, product: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al eliminar el producto");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!productModal.item?.name) { toast.error("El nombre del producto es obligatorio"); return; }
    const isDrinkGlass = !!productModal.item.isDrinkGlass;
    const drinkBottleItems = isDrinkGlass
      ? (productModal.item.drinkBottleItems || []).map((i) => ({
          bottleProductId: Number(i.bottleProductId),
          glassesUsed: Number(i.glassesUsed) || 1,
          glassesPerBottle: Number(i.glassesPerBottle) || 0,
        }))
      : [];

    if (isDrinkGlass) {
      if (drinkBottleItems.length === 0) {
        toast.error("Agregá al menos una botella al trago");
        return;
      }
      for (const ing of drinkBottleItems) {
        if (!ing.bottleProductId) {
          toast.error("Seleccioná todas las botellas del trago");
          return;
        }
        if (ing.glassesUsed <= 0) {
          toast.error("Cada botella debe indicar cuánto usa el trago (mayor a 0)");
          return;
        }
        if (ing.glassesPerBottle <= 0) {
          toast.error("Cada botella necesita el rendimiento (cuántas porciones salen de una botella)");
          return;
        }
      }
      const ids = drinkBottleItems.map((i) => i.bottleProductId);
      if (new Set(ids).size !== ids.length) {
        toast.error("No repetir la misma botella en el trago");
        return;
      }
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        name: productModal.item.name,
        price: parseFloat(productModal.item.price) || 0,
        cost: parseFloat(productModal.item.cost) || 0,
        category: productModal.item.category,
        icon: productModal.item.icon || "Package",
        stock: isDrinkGlass ? 0 : (parseInt(productModal.item.stock, 10) || 0),
        minStock: isDrinkGlass ? 0 : (parseInt(productModal.item.minStock, 10) || 0),
        drinkBottleItems: isDrinkGlass ? drinkBottleItems : [],
        bottleProductId: null,
        glassesPerBottle: null,
      };

      const originalProduct = inventory.find(p => p.id === productModal.item.id);
      const oldStock = originalProduct ? Number(originalProduct.stock) : 0;

      if (productModal.isNew) {
        await api.post("/products", payload);
        toast.success("Producto creado exitosamente");
      } else {
        await api.put(`/products/${productModal.item.id}`, payload);
        toast.success("Producto actualizado exitosamente");
        if (!isDrinkGlass && oldStock !== payload.stock) {
          await api.post("/stats/stock-modifications", {
            productId: productModal.item.id,
            productName: productModal.item.name,
            oldStock,
            newStock: payload.stock
          }).catch(() => {});
        }
      }
      setProductModal({ isOpen: false, item: null, isNew: false });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Promociones ──────────────────────────────────────────────────────────────

  const nonPromoProducts = inventory.filter((p) => !p.isPromotion);

  const promoItems = promoForm.items ?? [];

  // Stock calculado automáticamente = mínimo de (stock_componente / cantidad_requerida)
  const calcPromoStock =
    promoItems.length === 0
      ? 0
      : Math.min(
          ...promoItems.map((item) => {
            const prod = nonPromoProducts.find((p) => p.id === item.productId);
            return prod ? Math.floor(prod.stock / item.quantity) : 0;
          })
        );

  // Nombre del producto que limita el stock de la promo
  const bottleneckItem =
    promoItems.length === 0
      ? null
      : promoItems.reduce((worst, item) => {
          const prod = nonPromoProducts.find((p) => p.id === item.productId);
          const available = prod ? Math.floor(prod.stock / item.quantity) : 0;
          if (!worst) return { ...item, available };
          const worstProd = nonPromoProducts.find((p) => p.id === worst.productId);
          const worstAvail = worstProd ? Math.floor(worstProd.stock / worst.quantity) : 0;
          return available < worstAvail ? { ...item, available } : worst;
        }, null);

  const openPromoModal = () => {
    setPromoForm(EMPTY_PROMO);
    setAddingItem(false);
    setPromoItemSelect({ productId: "", quantity: "1" });
    setPromoModal({ open: true, editId: null });
  };

  const openEditPromoModal = async (product) => {
    if (promoModal.open || loadingPromoItems) return; // evitar doble apertura

    // Abrir el modal inmediatamente con los datos que ya tenemos en memoria
    setPromoForm({
      name: product.name,
      cost: String(product.cost ?? ""),
      price: String(product.price ?? ""),
      minStock: String(product.minStock ?? ""),
      items: null, // null = cargando
    });
    setAddingItem(false);
    setPromoItemSelect({ productId: "", quantity: "1" });
    setPromoModal({ open: true, editId: product.id });

    // Cargar los items de la promo en segundo plano
    setLoadingPromoItems(true);
    try {
      const res = await api.get(`/products/${product.id}`);
      const data = res.data;
      setPromoForm((prev) => ({
        ...prev,
        items: (data.promotionItems || []).map((item) => {
          const prod = inventory.find((p) => p.id === item.productId);
          return {
            productId: item.productId,
            productName: prod?.name || `Producto #${item.productId}`,
            quantity: item.quantity,
          };
        }),
      }));
    } catch {
      toast.error("Error al cargar los productos de la promoción");
      setPromoForm((prev) => ({ ...prev, items: [] }));
    } finally {
      setLoadingPromoItems(false);
    }
  };

  const closePromoModal = () => {
    setPromoModal({ open: false, editId: null });
  };

  const handleAddPromoItem = () => {
    if (promoForm.items === null) return;
    const pid = Number(promoItemSelect.productId);
    const qty = parseInt(promoItemSelect.quantity, 10) || 1;
    if (!pid) { toast.error("Seleccioná un producto"); return; }
    if (promoItems.some((i) => i.productId === pid)) {
      toast.error("Ese producto ya fue agregado");
      return;
    }
    const product = nonPromoProducts.find((p) => p.id === pid);
    setPromoForm((prev) => ({
      ...prev,
      items: [...(prev.items ?? []), { productId: pid, productName: product?.name || "", quantity: qty }],
    }));
    setPromoItemSelect({ productId: "", quantity: "1" });
    setAddingItem(false);
  };

  const handleRemovePromoItem = (index) => {
    setPromoForm((prev) => ({ ...prev, items: (prev.items ?? []).filter((_, i) => i !== index) }));
  };

  const handleSavePromo = async () => {
    if (!promoForm.name.trim()) { toast.error("El nombre de la promoción es obligatorio"); return; }
    if (promoForm.items === null) { toast.error("Los productos aún están cargando, esperá un momento"); return; }
    if (promoForm.items.length === 0) { toast.error("Agregá al menos un producto a la promoción"); return; }
    if (submittingPromo) return;
    setSubmittingPromo(true);
    try {
      const payload = {
        name: promoForm.name.trim(),
        category: "Promocion",
        icon: "Layers",
        isPromotion: true,
        cost: parseFloat(promoForm.cost) || 0,
        price: parseFloat(promoForm.price) || 0,
        stock: calcPromoStock,
        minStock: parseInt(promoForm.minStock, 10) || 0,
        promotionItems: promoItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };

      if (promoModal.editId) {
        console.log("[guardarPromo] payload enviado:", JSON.stringify(payload, null, 2));
        await api.put(`/products/${promoModal.editId}`, payload);
        toast.success("Promoción actualizada exitosamente");
      } else {
        await api.post("/products", payload);
        toast.success("Promoción creada exitosamente");
      }
      closePromoModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al guardar la promoción");
    } finally {
      setSubmittingPromo(false);
    }
  };

  const allCategories = categories.length > 0 ? categories : ["Vinos", "Cervezas", "Espirituosas"];

  return (
    <div className="flex-1 p-4 pb-20 md:p-8 overflow-y-auto relative">
      {loading && <Loader />}
      <div className="mb-6 md:mb-8">
        <h1 className="text-white text-2xl md:text-4xl mb-1 md:mb-2">Gestión de Inventario</h1>
        <p className="text-gray-400 text-sm">Controlá tu stock y productos</p>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-orange-500 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="text-orange-500 font-bold mb-2">Alerta de Stock Bajo</h3>
              <p className="text-orange-400 text-sm mb-3">{lowStockItems.length} producto{lowStockItems.length !== 1 ? "s" : ""} en su límite mínimo o por debajo.</p>
              <div className="flex flex-wrap gap-2">
                {(showAllLowStock ? lowStockItems : lowStockItems.slice(0, 4)).map((item) => (
                  <span key={item.id} className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm">
                    {item.name}: {item.stock} unidades
                  </span>
                ))}
              </div>
              {lowStockItems.length > 4 && (
                <button
                  onClick={() => setShowAllLowStock((v) => !v)}
                  className="mt-3 text-orange-400 hover:text-orange-300 text-sm underline underline-offset-2 transition-colors"
                >
                  {showAllLowStock ? "Ver menos" : `Ver ${lowStockItems.length - 4} más`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#2a2a2a] text-white rounded-xl pl-12 pr-4 py-3 md:py-4 border border-[#333] focus:border-[#6B21A8] outline-none" />
        </div>
        <button onClick={openPromoModal} className="bg-[#1e3a5f] hover:bg-[#1a3254] text-white px-5 py-3 md:py-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm md:text-base shrink-0">
          <Tag size={18} /> Nueva Promoción
        </button>
        <button onClick={handleAddProduct} className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-5 py-3 md:py-4 rounded-xl flex items-center justify-center gap-2 transition-all text-sm md:text-base shrink-0">
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-0 md:flex-wrap mb-6 scrollbar-hide">
        {["Todos", ...allCategories].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 md:px-5 py-2 rounded-lg text-sm transition-all whitespace-nowrap shrink-0 ${
              selectedCategory === cat
                ? "bg-[#6B21A8] text-white"
                : "bg-[#2a2a2a] text-gray-400 hover:bg-[#333]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left text-gray-400 p-4">Producto</th>
                <th className="text-left text-gray-400 p-4">Categoría</th>
                <th className="text-left text-gray-400 p-4">Costo</th>
                <th className="text-left text-gray-400 p-4">Precio</th>
                <th className="text-left text-gray-400 p-4">Stock</th>
                <th className="text-left text-gray-400 p-4">Min. Stock</th>
                <th className="text-left text-gray-400 p-4">Estado</th>
                <th className="text-center text-gray-400 p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((product) => {
                const drinkItems = product.drinkBottleItems?.length
                  ? product.drinkBottleItems
                  : (product.bottleProductId
                    ? [{ bottleProductId: product.bottleProductId, glassesUsed: 1, glassesPerBottle: product.glassesPerBottle }]
                    : []);
                const isDrinkGlass = drinkItems.length > 0;
                const lowStock = !isDrinkGlass && product.stock <= product.minStock;
                const bottleSummary = drinkItems.map((ing) => {
                  const bottleName = inventory.find((p) => p.id === ing.bottleProductId)?.name || `#${ing.bottleProductId}`;
                  return `${bottleName}×${ing.glassesUsed}`;
                }).join(" + ");
                return (
                  <tr key={product.id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {product.isPromotion && <Tag size={14} className="text-blue-400 shrink-0" />}
                        {isDrinkGlass && <Wine size={14} className="text-purple-400 shrink-0" />}
                        <span className="text-white">{product.name}</span>
                        {isDrinkGlass && (
                          <span className="bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded text-xs border border-purple-500/20" title={bottleSummary}>
                            Trago · {drinkItems.length} botella{drinkItems.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4"><span className="text-gray-400">{product.category}</span></td>
                    <td className="p-4"><span className="text-gray-400">${Number(product.cost || 0).toFixed(2)}</span></td>
                    <td className="p-4"><span className="text-white">${Number(product.price).toFixed(2)}</span></td>
                    <td className="p-4">
                      <span className="text-white">
                        {isDrinkGlass ? "Desde barra" : `${product.stock} unidades`}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-400">
                        {isDrinkGlass ? "—" : `${product.minStock} unid.`}
                      </span>
                    </td>
                    <td className="p-4">
                      {isDrinkGlass ? (
                        <span className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-300">
                          Vaso de trago
                        </span>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-sm ${lowStock ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"}`}>
                          {lowStock ? "Stock Bajo" : "Stock OK"}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {product.isPromotion ? (
                          <button
                            onClick={() => openEditPromoModal(product)}
                            disabled={promoModal.open || loadingPromoItems}
                            className="text-gray-400 hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors p-1"
                            title="Editar promoción"
                          >
                            <Edit2 size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => openEditProductModal(product)}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                            title="Editar producto"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, product })}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Eliminar producto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Nuevo Producto ──────────────────────────────────────────── */}
      {productModal.isOpen && productModal.item && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a] max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between shrink-0">
              <h2 className="text-white text-2xl flex items-center gap-2">
                <Package size={24} className="text-[#8B5CF6]" />
                {productModal.isNew ? "Nuevo Producto" : "Editar Producto"}
              </h2>
              <button onClick={() => setProductModal({ isOpen: false, item: null, isNew: false })} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {[
                { label: "Nombre del producto", field: "name", type: "text", placeholder: "Ej. Vaso de Fernet" },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="text-gray-400 text-sm block mb-2">{label}</label>
                  <input type={type} value={productModal.item[field]} onChange={(e) => setProductModal((prev) => ({ ...prev, item: { ...prev.item, [field]: e.target.value } }))} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none" placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label className="text-gray-400 text-sm block mb-2">Ícono del producto</label>
                <div className="flex gap-2">
                  {ICON_OPTIONS.map(({ key, Icon, label }) => {
                    const selected = (productModal.item.icon || "Package") === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        title={label}
                        onClick={() => setProductModal((prev) => ({ ...prev, item: { ...prev.item, icon: key } }))}
                        className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                          selected
                            ? "bg-[#6B21A8]/30 border-[#6B21A8] text-[#8B5CF6]"
                            : "bg-[#2a2a2a] border-[#333] text-gray-400 hover:border-[#555]"
                        }`}
                      >
                        <Icon size={20} />
                        <span className="text-xs leading-tight text-center">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-2">Categoría</label>
                <select value={productModal.item.category} onChange={(e) => setProductModal((prev) => ({ ...prev, item: { ...prev.item, category: e.target.value } }))} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none">
                  {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#2a2a2a] border border-[#333] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!productModal.item.isDrinkGlass}
                  onChange={(e) => setProductModal((prev) => ({
                    ...prev,
                    item: {
                      ...prev.item,
                      isDrinkGlass: e.target.checked,
                      drinkBottleItems: e.target.checked
                        ? (prev.item.drinkBottleItems?.length
                          ? prev.item.drinkBottleItems
                          : [{ bottleProductId: "", glassesUsed: "1", glassesPerBottle: "" }])
                        : [],
                      stock: e.target.checked ? "0" : prev.item.stock,
                      minStock: e.target.checked ? "0" : prev.item.minStock,
                    },
                  }))}
                  className="w-4 h-4 accent-[#6B21A8]"
                />
                <div>
                  <p className="text-white text-sm font-medium">Es vaso / trago de barra</p>
                  <p className="text-gray-500 text-xs">Se prepara con una o más botellas abiertas en la barra</p>
                </div>
              </label>

              {productModal.item.isDrinkGlass ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-400 text-sm">Botellas del trago</label>
                      <button
                        type="button"
                        onClick={() => setProductModal((prev) => ({
                          ...prev,
                          item: {
                            ...prev.item,
                            drinkBottleItems: [
                              ...(prev.item.drinkBottleItems || []),
                              { bottleProductId: "", glassesUsed: "1", glassesPerBottle: "" },
                            ],
                          },
                        }))}
                        className="text-xs bg-[#6B21A8] hover:bg-[#581C87] text-white px-2.5 py-1 rounded-lg flex items-center gap-1"
                      >
                        <Plus size={12} /> Agregar botella
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(productModal.item.drinkBottleItems || []).map((ing, idx) => (
                        <div key={idx} className="bg-[#2a2a2a] rounded-xl p-3 border border-[#333] space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-400 text-xs">Botella {idx + 1}</span>
                            {(productModal.item.drinkBottleItems || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => setProductModal((prev) => ({
                                  ...prev,
                                  item: {
                                    ...prev.item,
                                    drinkBottleItems: prev.item.drinkBottleItems.filter((_, i) => i !== idx),
                                  },
                                }))}
                                className="text-gray-500 hover:text-red-400 p-1"
                                title="Quitar botella"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          <select
                            value={ing.bottleProductId || ""}
                            onChange={(e) => setProductModal((prev) => ({
                              ...prev,
                              item: {
                                ...prev.item,
                                drinkBottleItems: prev.item.drinkBottleItems.map((row, i) =>
                                  i === idx ? { ...row, bottleProductId: e.target.value } : row
                                ),
                              },
                            }))}
                            className="w-full bg-[#1a1a1a] text-white rounded-lg px-3 py-2.5 border border-[#444] focus:border-[#6B21A8] outline-none text-sm"
                          >
                            <option value="">Seleccioná la botella...</option>
                            {bottleSourceProducts
                              .filter((p) => p.id !== productModal.item.id)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (Stock: {p.stock})
                                </option>
                              ))}
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-gray-500 text-xs block mb-1">Usa por trago</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={ing.glassesUsed}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "") || "";
                                  setProductModal((prev) => ({
                                    ...prev,
                                    item: {
                                      ...prev.item,
                                      drinkBottleItems: prev.item.drinkBottleItems.map((row, i) =>
                                        i === idx ? { ...row, glassesUsed: val } : row
                                      ),
                                    },
                                  }));
                                }}
                                onFocus={(e) => e.target.select()}
                                placeholder="1"
                                className="w-full bg-[#1a1a1a] text-white rounded-lg px-3 py-2 border border-[#444] focus:border-[#6B21A8] outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-gray-500 text-xs block mb-1">Rendimiento botella</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={ing.glassesPerBottle}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "") || "";
                                  setProductModal((prev) => ({
                                    ...prev,
                                    item: {
                                      ...prev.item,
                                      drinkBottleItems: prev.item.drinkBottleItems.map((row, i) =>
                                        i === idx ? { ...row, glassesPerBottle: val } : row
                                      ),
                                    },
                                  }));
                                }}
                                onFocus={(e) => e.target.select()}
                                placeholder="Ej. 20"
                                className="w-full bg-[#1a1a1a] text-white rounded-lg px-3 py-2 border border-[#444] focus:border-[#6B21A8] outline-none text-sm"
                              />
                            </div>
                          </div>
                          <p className="text-gray-600 text-[11px]">
                            Por cada trago vendido se descuentan {ing.glassesUsed || "?"} porción(es) de esta botella. Al llegar a {ing.glassesPerBottle || "?"} se vacía.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm block mb-2">Costo estimado ($)</label>
                      <div className="w-full bg-[#1f1f1f] text-gray-300 rounded-xl px-4 py-3 border border-[#2a2a2a] cursor-not-allowed">
                        {(() => {
                          const items = productModal.item.drinkBottleItems || [];
                          let total = 0;
                          let ok = false;
                          for (const ing of items) {
                            const bottle = bottleSourceProducts.find((p) => String(p.id) === String(ing.bottleProductId));
                            const gpb = Number(ing.glassesPerBottle) || 0;
                            const used = Number(ing.glassesUsed) || 0;
                            if (!bottle || gpb <= 0 || used <= 0) continue;
                            total += (Number(bottle.cost) || 0) / gpb * used;
                            ok = true;
                          }
                          return ok ? `$${total.toFixed(2)}` : "—";
                        })()}
                      </div>
                      <p className="text-gray-500 text-xs mt-1">Suma del costo proporcional de cada botella</p>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm block mb-2">Precio ($)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={productModal.item.price}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, "").replace(/^0+(?=\d)/, "");
                          setProductModal((prev) => ({ ...prev, item: { ...prev.item, price: val } }));
                        }}
                        onFocus={(e) => e.target.select()}
                        placeholder="0"
                        className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                  {[{ label: "Costo ($)", field: "cost" }, { label: "Precio ($)", field: "price" }].map(({ label, field }) => (
                    <div key={field}>
                      <label className="text-gray-400 text-sm block mb-2">{label}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={productModal.item[field]}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, "").replace(/^0+(?=\d)/, "");
                          setProductModal((prev) => ({ ...prev, item: { ...prev.item, [field]: val } }));
                        }}
                        onFocus={(e) => e.target.select()}
                        placeholder="0"
                        className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none"
                      />
                    </div>
                  ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  {[{ label: "Stock Actual", field: "stock" }, { label: "Stock Mínimo", field: "minStock" }].map(({ label, field }) => (
                    <div key={field}>
                      <label className="text-gray-400 text-sm block mb-2">{label}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={productModal.item[field]}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
                          setProductModal((prev) => ({ ...prev, item: { ...prev.item, [field]: val } }));
                        }}
                        onFocus={(e) => e.target.select()}
                        placeholder="0"
                        className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none"
                      />
                    </div>
                  ))}
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4 shrink-0">
              <button onClick={() => setProductModal({ isOpen: false, item: null, isNew: false })} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSaveProduct} disabled={submitting} className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-all">{submitting ? "Guardando..." : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Nueva / Editar Promoción ───────────────────────────────── */}
      {promoModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg border border-[#2a2a2a] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between shrink-0">
              <h2 className="text-white text-2xl flex items-center gap-2">
                <Tag size={22} className="text-blue-400" />
                {promoModal.editId ? "Editar Promoción" : "Nueva Promoción"}
              </h2>
              <button onClick={closePromoModal} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">

              {/* Nombre */}
              <div>
                <label className="text-gray-400 text-sm block mb-2">Nombre de la promoción</label>
                <input
                  type="text"
                  placeholder="Ej. Promo Cerveza + Shot"
                  value={promoForm.name}
                  onChange={(e) => setPromoForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-blue-500 outline-none"
                />
              </div>

              {/* Categoría fija */}
              <div>
                <label className="text-gray-400 text-sm block mb-2">Categoría</label>
                <div className="w-full bg-[#2a2a2a]/60 text-gray-500 rounded-xl px-4 py-3 border border-[#333] flex items-center gap-2 cursor-not-allowed select-none">
                  <Layers size={16} className="text-blue-400" />
                  Promocion
                </div>
              </div>

              {/* Productos de la promo */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-medium text-sm">Productos que conforman la promoción</p>
                    <p className="text-gray-500 text-xs mt-0.5">Seleccioná los productos que incluye esta promoción</p>
                  </div>
                  {!addingItem && (
                    <button
                      onClick={() => { setAddingItem(true); setPromoItemSelect({ productId: nonPromoProducts[0]?.id?.toString() || "", quantity: "1" }); }}
                      className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-all shrink-0 ml-3"
                    >
                      <Plus size={14} /> Agregar
                    </button>
                  )}
                </div>

                {/* Formulario inline para agregar producto */}
                {addingItem && (
                  <div className="bg-[#2a2a2a] rounded-xl p-4 mb-3 space-y-3">
                    {/* Select con stock visible */}
                    <select
                      value={promoItemSelect.productId}
                      onChange={(e) => setPromoItemSelect((p) => ({ ...p, productId: e.target.value }))}
                      className="w-full bg-[#333] text-white rounded-lg px-3 py-2.5 border border-[#444] focus:border-blue-500 outline-none text-sm"
                    >
                      <option value="">— Seleccioná un producto —</option>
                      {nonPromoProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}{"  ·  "}Stock: {p.stock}
                        </option>
                      ))}
                    </select>

                    {/* Cantidad con +/− y botones de acción */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-400 text-sm shrink-0">Cantidad:</span>
                      <div className="flex items-center rounded-lg border border-[#444] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setPromoItemSelect((p) => ({ ...p, quantity: String(Math.max(1, parseInt(p.quantity || 1) - 1)) }))}
                          className="px-3 py-2 text-gray-300 hover:text-white bg-[#333] hover:bg-[#444] transition-colors text-base leading-none"
                        >
                          −
                        </button>
                        <span className="px-4 py-2 text-white text-sm min-w-[3rem] text-center bg-[#2d2d2d]">
                          {promoItemSelect.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPromoItemSelect((p) => ({ ...p, quantity: String(parseInt(p.quantity || 1) + 1) }))}
                          className="px-3 py-2 text-gray-300 hover:text-white bg-[#333] hover:bg-[#444] transition-colors text-base leading-none"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex-1" />
                      <button
                        onClick={handleAddPromoItem}
                        className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-1 shrink-0"
                      >
                        <Plus size={14} /> Agregar
                      </button>
                      <button
                        onClick={() => setAddingItem(false)}
                        className="bg-[#333] hover:bg-[#444] text-gray-400 hover:text-white p-2 rounded-lg transition-all shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de productos seleccionados */}
                {promoForm.items === null ? (
                  <div className="text-gray-500 text-sm text-center py-4 bg-[#2a2a2a]/40 rounded-xl border border-dashed border-[#333] flex items-center justify-center gap-2">
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full" />
                    Cargando productos...
                  </div>
                ) : promoItems.length === 0 ? (
                  <div className="text-gray-600 text-sm text-center py-4 bg-[#2a2a2a]/40 rounded-xl border border-dashed border-[#333]">
                    Sin productos agregados
                  </div>
                ) : (
                  <div className="space-y-2">
                    {promoItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-[#2a2a2a] rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-gray-500" />
                          <span className="text-white text-sm">{item.productName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm bg-[#333] px-2 py-0.5 rounded-md">x{item.quantity}</span>
                          <button onClick={() => handleRemovePromoItem(i)} className="text-gray-500 hover:text-red-500 transition-colors">
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mensaje de limitación debajo de la lista */}
                {bottleneckItem && promoItems.length > 0 && (
                  <p className="text-gray-500 text-xs mt-2">
                    El stock estará limitado por <span className="text-gray-300">{bottleneckItem.productName}</span> ({bottleneckItem.available} disponibles)
                  </p>
                )}
              </div>

              {/* Costo y Precio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Costo UNITARIO ($)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={promoForm.cost}
                    onChange={(e) => setPromoForm((p) => ({ ...p, cost: e.target.value.replace(/[^0-9.]/g, "").replace(/^0+(?=\d)/, "") }))}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Precio ($)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={promoForm.price}
                    onChange={(e) => setPromoForm((p) => ({ ...p, price: e.target.value.replace(/[^0-9.]/g, "").replace(/^0+(?=\d)/, "") }))}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Stock actual</label>
                  <div className="w-full bg-[#1f1f1f] text-white rounded-xl px-4 py-3 border border-[#2a2a2a] flex items-center justify-between cursor-not-allowed select-none">
                    <span className={`text-lg font-semibold ${calcPromoStock === 0 && promoItems.length > 0 ? "text-red-400" : "text-white"}`}>
                      {calcPromoStock}
                    </span>
                    <span className="text-gray-600 text-xs">auto</span>
                  </div>
                  {calcPromoStock === 0 && promoItems.length > 0 && (
                    <p className="text-red-400 text-xs mt-1">Sin stock suficiente — no se podrá vender</p>
                  )}
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Stock mínimo</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={promoForm.minStock}
                    onChange={(e) => setPromoForm((p) => ({ ...p, minStock: e.target.value.replace(/[^0-9]/g, "") }))}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4 shrink-0">
              <button onClick={closePromoModal} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">
                Cancelar
              </button>
              <button
                onClick={handleSavePromo}
                disabled={submittingPromo}
                className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-all"
              >
                {submittingPromo
                  ? (promoModal.editId ? "Guardando..." : "Creando...")
                  : (promoModal.editId ? "Guardar Cambios" : "Crear Promoción")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar eliminación ──────────────────────────────────── */}
      {deleteModal.isOpen && deleteModal.product && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-sm border border-[#2a2a2a]">
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-white text-xl font-semibold mb-1">Eliminar producto</h2>
                <p className="text-gray-400 text-sm">
                  ¿Estás seguro que querés eliminar{" "}
                  <span className="text-white font-medium">"{deleteModal.product.name}"</span>?
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, product: null })}
                disabled={deleting}
                className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-3 rounded-xl transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl transition-all"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
