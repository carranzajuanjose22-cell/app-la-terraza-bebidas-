import { Plus, ShoppingCart, Wine, Beer, Droplets, Layers, Package } from "lucide-react";

const ICON_MAP = { Wine, Beer, Droplets, Layers, Package };

export function ProductCard({ product, onAddToCart }) {
  const Icon = ICON_MAP[product.icon] || Package;
  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between hover:border-[#6B21A8]/50 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#6B21A8]/20 flex items-center justify-center shrink-0">
          <Icon size={22} className="text-[#8B5CF6]" />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-white font-medium text-lg">{product.name}</h3>
            {product.stock <= product.minStock && (
              <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-xs font-medium border border-orange-500/20">
                Stock Bajo
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">{product.category} · {product.stock} en stock</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-[#8B5CF6] font-bold text-xl">${Number(product.price).toFixed(2)}</span>
        <button
          onClick={() => onAddToCart(product)}
          className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-4 h-10 rounded-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#6B21A8]/20"
        >
          <ShoppingCart size={16} />
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
