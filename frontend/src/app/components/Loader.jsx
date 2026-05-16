export function Loader({ fullScreen = false }) {
  const wrapClass = fullScreen
    ? "fixed inset-0 z-[9999]"
    : "absolute inset-0 z-50";

  return (
    <div className={`${wrapClass} backdrop-blur-sm bg-[#121212]/60 flex flex-col items-center justify-center gap-5`}>
      {/* Anillos concéntricos animados */}
      <div className="relative w-16 h-16">
        {/* Anillo exterior */}
        <div className="absolute inset-0 rounded-full border-2 border-[#6B21A8]/20" />
        {/* Anillo giratorio exterior */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#8B5CF6] animate-spin" />
        {/* Anillo interior */}
        <div className="absolute inset-[6px] rounded-full border-2 border-[#6B21A8]/20" />
        {/* Anillo giratorio interior (sentido contrario) */}
        <div
          className="absolute inset-[6px] rounded-full border-2 border-transparent border-t-[#A855F7]"
          style={{ animation: "spin 0.7s linear infinite reverse" }}
        />
        {/* Punto central */}
        <div className="absolute inset-[14px] rounded-full bg-[#6B21A8]/40" />
      </div>

      <p className="text-[#8B5CF6] text-sm tracking-widest uppercase font-medium select-none">
        Cargando
        <span className="inline-flex gap-[3px] ml-1">
          <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
        </span>
      </p>
    </div>
  );
}
