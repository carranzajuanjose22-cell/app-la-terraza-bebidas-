import { Plus, ShoppingCart, Wine, Beer, Droplets, Layers, Package } from "lucide-react";

const ICON_MAP = { Wine, Beer, Droplets, Layers, Package };

export function ProductCard({ product, onAddToCart, availableGlasses = null }) {
  const Icon = ICON_MAP[product.icon] || Package;
  const isDrinkGlass = !!product.bottleProductId
    || (Array.isArray(product.drinkBottleItems) && product.drinkBottleItems.length > 0);
  const lowStock = !isDrinkGlass && product.stock <= product.minStock;
  const noBottleOpen = isDrinkGlass && availableGlasses !== null && availableGlasses <= 0;
  const bottleCount = product.drinkBottleItems?.length
    || (product.bottleProductId ? 1 : 0);

  return (
    <div className={`bg-[#1e1e1e] border rounded-xl p-3 md:p-4 flex items-center justify-between transition-colors duration-300 ${
      noBottleOpen ? "border-orange-500/30 opacity-80" : "border-[#2a2a2a] hover:border-[#6B21A8]/50"
    }`}>
      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[#6B21A8]/20 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-[#8B5CF6]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="text-white font-medium text-base md:text-lg leading-tight truncate">{product.name}</h3>
            {isDrinkGlass && (
              <span className="bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded text-xs font-medium border border-purple-500/20 shrink-0">
                Trago{bottleCount > 1 ? ` · ${bottleCount} bot.` : ""}
              </span>
            )}
            {noBottleOpen && (
              <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-xs font-medium border border-orange-500/20 shrink-0">
                Sin botella abierta
              </span>
            )}
            {lowStock && (
              <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-xs font-medium border border-orange-500/20 shrink-0">
                Stock Bajo
              </span>
            )}
          </div>
          <p className="text-gray-400 text-xs md:text-sm">
            {product.category}
            {isDrinkGlass
              ? (availableGlasses !== null
                ? ` · ${availableGlasses} disponible${availableGlasses === 1 ? "" : "s"}`
                : " · Desde barra")
              : ` · ${product.stock} en stock`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 md:gap-6 ml-2 shrink-0">
        <span className="text-[#8B5CF6] font-bold text-base md:text-xl">${Number(product.price).toFixed(2)}</span>
        <button
          onClick={() => onAddToCart(product)}
          className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-3 md:px-4 h-9 md:h-10 rounded-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#6B21A8]/20"
        >
          <ShoppingCart size={15} />
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
