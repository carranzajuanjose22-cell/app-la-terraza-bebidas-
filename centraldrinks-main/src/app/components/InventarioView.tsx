import { useState } from 'react';
import { Search, Plus, Edit2, AlertTriangle } from 'lucide-react';
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

const MOCK_INVENTORY: Product[] = [
  { id: '1', name: 'Vino Tinto Reserva', price: 45.99, cost: 25.00, category: 'Vinos', stock: 15, minStock: 10 },
  { id: '2', name: 'Cerveza Artesanal IPA', price: 8.50, cost: 4.00, category: 'Cervezas', stock: 45, minStock: 20 },
  { id: '3', name: 'Whisky Single Malt', price: 89.99, cost: 50.00, category: 'Espirituosas', stock: 8, minStock: 5 },
  { id: '4', name: 'Champagne Brut', price: 65.00, cost: 35.00, category: 'Vinos', stock: 12, minStock: 10 },
  { id: '5', name: 'Gin Premium', price: 42.50, cost: 20.00, category: 'Espirituosas', stock: 20, minStock: 10 },
  { id: '6', name: 'Cerveza Lager', price: 6.00, cost: 3.00, category: 'Cervezas', stock: 60, minStock: 24 },
  { id: '7', name: 'Ron Añejo', price: 38.00, cost: 18.00, category: 'Espirituosas', stock: 18, minStock: 8 },
  { id: '8', name: 'Vino Blanco Seco', price: 32.00, cost: 15.00, category: 'Vinos', stock: 22, minStock: 10 },
  { id: '9', name: 'Vodka Premium', price: 35.00, cost: 16.00, category: 'Espirituosas', stock: 5, minStock: 6 },
  { id: '10', name: 'Tequila Reposado', price: 52.00, cost: 28.00, category: 'Espirituosas', stock: 7, minStock: 5 },
];

export function InventarioView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory, setInventory] = useState<Product[]>(MOCK_INVENTORY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Product>>({});

  const filteredInventory = inventory.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(p => p.stock <= p.minStock);

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValues(product);
  };

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      price: 0,
      cost: 0,
      category: 'Vinos',
      stock: 0,
      minStock: 5,
    };
    setInventory([newProduct, ...inventory]);
    startEdit(newProduct);
  };

  const saveEdit = () => {
    if (editingId) {
      if (!editValues.name) {
        toast.error('El nombre del producto es obligatorio');
        return;
      }
      setInventory(prev =>
        prev.map(p => p.id === editingId ? { ...p, ...editValues } as Product : p)
      );
      toast.success('Producto guardado');
      setEditingId(null);
      setEditValues({});
    }
  };

  const cancelEdit = () => {
    const editingProduct = inventory.find(p => p.id === editingId);
    if (editingProduct && editingProduct.name === '') {
      setInventory(prev => prev.filter(p => p.id !== editingId));
    }
    setEditingId(null);
    setEditValues({});
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
                const isEditing = editingId === product.id;
                const lowStock = product.stock <= product.minStock;

                return (
                  <tr key={product.id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValues.name || ''}
                          onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                          className="bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#6B21A8] outline-none w-full min-w-[200px]"
                        />
                      ) : (
                        <span className="text-white">{product.name}</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {isEditing ? (
                        <select
                          value={editValues.category || ''}
                          onChange={(e) => setEditValues({ ...editValues, category: e.target.value })}
                          className="bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#6B21A8] outline-none min-w-[140px]"
                        >
                          <option value="Vinos">Vinos</option>
                          <option value="Cervezas">Cervezas</option>
                          <option value="Espirituosas">Espirituosas</option>
                        </select>
                      ) : (
                        <span className="text-gray-400">{product.category}</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.cost || ''}
                          onChange={(e) => setEditValues({ ...editValues, cost: parseFloat(e.target.value) })}
                          className="bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#6B21A8] outline-none w-24"
                        />
                      ) : (
                        <span className="text-gray-400">${product.cost?.toFixed(2) || '0.00'}</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.price || ''}
                          onChange={(e) => setEditValues({ ...editValues, price: parseFloat(e.target.value) })}
                          className="bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#6B21A8] outline-none w-32"
                        />
                      ) : (
                        <span className="text-white">${product.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.stock || ''}
                          onChange={(e) => setEditValues({ ...editValues, stock: parseInt(e.target.value) })}
                          className="bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#6B21A8] outline-none w-24"
                        />
                      ) : (
                        <span className="text-white">{product.stock} unidades</span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.minStock || ''}
                          onChange={(e) => setEditValues({ ...editValues, minStock: parseInt(e.target.value) || 0 })}
                          className="bg-[#1a1a1a] text-white rounded px-3 py-2 border border-[#6B21A8] outline-none w-24"
                        />
                      ) : (
                        <span className="text-gray-400">{product.minStock} unid.</span>
                      )}
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
                      {isEditing ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={saveEdit}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(product)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
