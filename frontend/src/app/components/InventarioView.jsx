import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, AlertTriangle, X, Package, Wine, Beer, Droplets, Layers } from "lucide-react";
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

const EMPTY_PRODUCT = { name: "", price: "", cost: "", category: "Vinos", stock: "", minStock: "", icon: "Package" };

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
  const lowStockItems = inventory.filter((p) => p.stock <= p.minStock);

  const handleAddProduct = () => {
    setProductModal({ isOpen: true, item: { ...EMPTY_PRODUCT, category: categories[0] || "General" }, isNew: true });
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
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        ...productModal.item,
        price: parseFloat(productModal.item.price) || 0,
        cost: parseFloat(productModal.item.cost) || 0,
        stock: parseInt(productModal.item.stock, 10) || 0,
        minStock: parseInt(productModal.item.minStock, 10) || 0,
      };

      const originalProduct = inventory.find(p => p.id === productModal.item.id);
      const oldStock = originalProduct ? Number(originalProduct.stock) : 0;

      if (productModal.isNew) {
        await api.post("/products", payload);
        toast.success("Producto creado exitosamente");
      } else {
        await api.put(`/products/${productModal.item.id}`, payload);
        toast.success("Producto actualizado exitosamente");
        
        // Si el stock fue modificado manualmente, registramos el evento
        if (oldStock !== payload.stock) {
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

  const allCategories = categories.length > 0 ? categories : ["Vinos", "Cervezas", "Espirituosas"];


  return (
    <div className="flex-1 p-8 overflow-y-auto relative">
      {loading && <Loader />}
      <div className="mb-8">
        <h1 className="text-white text-4xl mb-2">Gestión de Inventario</h1>
        <p className="text-gray-400">Controlá tu stock y productos</p>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-orange-500 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="text-orange-500 font-bold mb-2">Alerta de Stock Bajo</h3>
              <p className="text-orange-400 text-sm mb-3">{lowStockItems.length} productos en su límite mínimo o por debajo.</p>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <span key={item.id} className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm">
                    {item.name}: {item.stock} unidades
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#2a2a2a] text-white rounded-xl pl-12 pr-4 py-4 border border-[#333] focus:border-[#6B21A8] outline-none" />
        </div>
        <button onClick={handleAddProduct} className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-6 py-4 rounded-xl flex items-center gap-2 transition-all">
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      <div className="flex gap-3 flex-wrap mb-6">
        {["Todos", ...allCategories].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2 rounded-lg text-sm transition-all ${
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
                const lowStock = product.stock <= product.minStock;
                return (
                  <tr key={product.id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors">
                    <td className="p-4"><span className="text-white">{product.name}</span></td>
                    <td className="p-4"><span className="text-gray-400">{product.category}</span></td>
                    <td className="p-4"><span className="text-gray-400">${Number(product.cost || 0).toFixed(2)}</span></td>
                    <td className="p-4"><span className="text-white">${Number(product.price).toFixed(2)}</span></td>
                    <td className="p-4"><span className="text-white">{product.stock} unidades</span></td>
                    <td className="p-4"><span className="text-gray-400">{product.minStock} unid.</span></td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${lowStock ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"}`}>
                        {lowStock ? "Stock Bajo" : "Stock OK"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => setProductModal({ isOpen: true, item: { ...product, price: String(product.price), cost: String(product.cost ?? ""), stock: String(product.stock), minStock: String(product.minStock), icon: product.icon || "Package" }, isNew: false })}
                          className="text-gray-400 hover:text-white transition-colors p-1"
                          title="Editar producto"
                        >
                          <Edit2 size={18} />
                        </button>
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
                { label: "Nombre del producto", field: "name", type: "text", placeholder: "Ej. Vino Tinto" },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="text-gray-400 text-sm block mb-2">{label}</label>
                  <input type={type} value={productModal.item[field]} onChange={(e) => setProductModal((prev) => ({ ...prev, item: { ...prev.item, [field]: e.target.value } }))} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none" placeholder={placeholder} />
                </div>
              ))}
              {/* Selector de ícono */}
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
                    placeholder="0"
                    className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none"
                  />
                </div>
              ))}
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4 shrink-0">
              <button onClick={() => setProductModal({ isOpen: false, item: null, isNew: false })} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSaveProduct} disabled={submitting} className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-all">{submitting ? "Guardando..." : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
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
