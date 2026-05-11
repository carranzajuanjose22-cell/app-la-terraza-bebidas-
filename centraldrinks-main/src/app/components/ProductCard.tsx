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
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#6B21A8]/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 transition-all duration-300 cursor-pointer group flex flex-col">
      <div className="aspect-square relative overflow-hidden bg-[#1a1a1a] p-3">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {product.stock <= product.minStock && (
          <div className="absolute top-5 right-5 bg-orange-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
            Stock Bajo
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-white font-medium mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-gray-400 text-sm mb-4">{product.category}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#8B5CF6] font-bold text-xl">${product.price.toFixed(2)}</span>

          <button
            onClick={() => onAddToCart(product)}
            className="bg-[#6B21A8] hover:bg-[#581C87] text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#6B21A8]/20"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
