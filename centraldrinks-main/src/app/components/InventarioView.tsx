import { useState } from 'react';
import { Search, Plus, Edit2, AlertTriangle, X, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
  minStock: number;
}

const MOCK_INVENTORY: Product[] = [];

export function InventarioView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory, setInventory] = useState<Product[]>(MOCK_INVENTORY);
  const [productModal, setProductModal] = useState<{isOpen: boolean, item: Product | null}>({isOpen: false, item: null});

  const filteredInventory = inventory.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(p => p.stock <= p.minStock);

  const startEdit = (product: Product) => {
    setProductModal({
      isOpen: true,
      item: product
    });
  };

  const handleAddProduct = () => {
    setProductModal({
      isOpen: true,
      item: {
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        price: 0,
        cost: 0,
        category: 'Vinos',
        stock: 0,
        minStock: 5,
      }
    });
  };

  const handleSaveProduct = () => {
    if (!productModal.item?.name) {
      toast.error('El nombre del producto es obligatorio');
      return;
    }
    if (inventory.some(p => p.id === productModal.item!.id)) {
      setInventory(prev => prev.map(p => p.id === productModal.item!.id ? productModal.item! : p));
      toast.success('Producto actualizado exitosamente');
    }
    else {
      setInventory([productModal.item!, ...inventory]);
      toast.success('Producto creado exitosamente');
    }
    setProductModal({isOpen: false, item: null});
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-white text-4xl mb-2">Gestión de Inventario</h1>
        <p className="text-gray-400">Controla tu stock y productos</p>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-orange-500 flex-shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="text-orange-500 font-bold mb-2">Alerta de Stock Bajo</h3>
              <p className="text-orange-400 text-sm mb-3">
                {lowStockItems.length} productos se encuentran en su límite mínimo configurado o por debajo.
              </p>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.map(item => (
                  <span key={item.id} className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm">
                    {item.name}: {item.stock} unidades
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
        <button onClick={handleAddProduct} className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-6 py-4 rounded-xl flex items-center gap-2 transition-all">
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left text-gray-400 p-4 whitespace-nowrap">Producto</th>
                <th className="text-left text-gray-400 p-4 whitespace-nowrap">Categoría</th>
                <th className="text-left text-gray-400 p-4 whitespace-nowrap">Costo</th>
                <th className="text-left text-gray-400 p-4 whitespace-nowrap">Precio</th>
                <th className="text-left text-gray-400 p-4 whitespace-nowrap">Stock</th>
                <th className="text-left text-gray-400 p-4 whitespace-nowrap">Min. Stock</th>
                <th className="text-left text-gray-400 p-4 whitespace-nowrap">Estado</th>
                <th className="text-center text-gray-400 p-4 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(product => {
                const lowStock = product.stock <= product.minStock;

                return (
                  <tr key={product.id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-white">{product.name}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-gray-400">{product.category}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-gray-400">${product.cost?.toFixed(2) || '0.00'}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-white">${product.price.toFixed(2)}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-white">{product.stock} unidades</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-gray-400">{product.minStock} unid.</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        lowStock
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {lowStock ? 'Stock Bajo' : 'Stock OK'}
                      </span>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => startEdit(product)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
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
                {inventory.some(p => p.id === productModal.item!.id) ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => setProductModal({isOpen: false, item: null})} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Nombre del producto</label>
                <input
                  type="text"
                  value={productModal.item.name}
                  onChange={(e) => setProductModal(prev => ({...prev, item: prev.item ? {...prev.item, name: e.target.value} : null}))}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                  placeholder="Ej. Vino Tinto"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Categoría</label>
                <select
                  value={productModal.item.category}
                  onChange={(e) => setProductModal(prev => ({...prev, item: prev.item ? {...prev.item, category: e.target.value} : null}))}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                >
                  <option value="Vinos">Vinos</option>
                  <option value="Cervezas">Cervezas</option>
                  <option value="Espirituosas">Espirituosas</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Costo ($)</label>
                  <input
                    type="number"
                    value={productModal.item.cost}
                    onChange={(e) => setProductModal(prev => ({...prev, item: prev.item ? {...prev.item, cost: Number(e.target.value)} : null}))}
                    className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Precio ($)</label>
                  <input
                    type="number"
                    value={productModal.item.price}
                    onChange={(e) => setProductModal(prev => ({...prev, item: prev.item ? {...prev.item, price: Number(e.target.value)} : null}))}
                    className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Stock Actual</label>
                  <input
                    type="number"
                    value={productModal.item.stock}
                    onChange={(e) => setProductModal(prev => ({...prev, item: prev.item ? {...prev.item, stock: Number(e.target.value)} : null}))}
                    className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Stock Mínimo</label>
                  <input
                    type="number"
                    value={productModal.item.minStock}
                    onChange={(e) => setProductModal(prev => ({...prev, item: prev.item ? {...prev.item, minStock: Number(e.target.value)} : null}))}
                    className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4 shrink-0">
              <button onClick={() => setProductModal({isOpen: false, item: null})} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">
                Cancelar
              </button>
              <button onClick={handleSaveProduct} className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] text-white py-4 rounded-xl transition-all">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
