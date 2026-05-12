import { Plus } from 'lucide-react';

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

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between hover:border-[#6B21A8]/50 transition-colors duration-300 group">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-white font-medium text-lg">{product.name}</h3>
            {product.stock <= product.minStock && (
              <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-xs font-medium border border-orange-500/20">
                Stock Bajo
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">{product.category}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <span className="text-[#8B5CF6] font-bold text-xl">${product.price.toFixed(2)}</span>
        <button
          onClick={() => onAddToCart(product)}
          className="bg-[#6B21A8] hover:bg-[#581C87] text-white w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#6B21A8]/20"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}
