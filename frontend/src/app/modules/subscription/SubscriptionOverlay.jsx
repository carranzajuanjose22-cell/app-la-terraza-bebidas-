import { useState, useEffect } from "react";
import { AlertTriangle, Lock, LogOut, X, Clock } from "lucide-react";
import { useSubscription } from "./SubscriptionContext.jsx";

export function SubscriptionOverlay({ onLogout, userRole }) {
  const { isExpired, isWarning, daysRemaining, nextExpiry } = useSubscription();
  const [warningDismissed, setWarningDismissed] = useState(false);

  // Volver a mostrar el aviso completo si cambia la fase o los días restantes
  useEffect(() => {
    if (isWarning) setWarningDismissed(false);
  }, [isWarning, daysRemaining]);

  // El creator nunca ve restricciones
  if (userRole === "creator") return null;

  const urgent = typeof daysRemaining === "number" && daysRemaining <= 2;
  const expiryLabel = nextExpiry
    ? new Date(nextExpiry).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  // ── Pantalla de bloqueo por suscripción vencida ───────────────────────────
  if (isExpired) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
        <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-red-500/40 shadow-2xl shadow-red-900/30">
          <div className="p-8 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
              <Lock size={36} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold mb-2">Suscripción Vencida</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                El período de uso de la aplicación ha finalizado. Contactate con los desarrolladores para reactivar el servicio.
              </p>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#333] text-white py-3 rounded-xl transition-all"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Advertencia de vencimiento próximo ────────────────────────────────────
  if (!isWarning) return null;

  const dayText =
    daysRemaining === 0
      ? "vence HOY"
      : daysRemaining === 1
        ? "vence MAÑANA"
        : `vence en ${daysRemaining} días`;

  // Banner completo (antes de dismiss)
  if (!warningDismissed) {
    return (
      <div className="fixed inset-x-0 top-0 z-[9990] pointer-events-none">
        <div
          className={`pointer-events-auto mx-auto w-full border-b shadow-2xl ${
            urgent
              ? "bg-gradient-to-r from-red-950 via-red-800 to-red-950 border-red-500/60"
              : "bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950 border-amber-500/50"
          }`}
        >
          <div className="max-w-5xl mx-auto px-4 py-3 md:py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-5">
            <div
              className={`shrink-0 self-center sm:self-auto flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl border ${
                urgent
                  ? "bg-red-500/25 border-red-400/40 text-red-300 animate-pulse"
                  : "bg-amber-500/25 border-amber-400/40 text-amber-300"
              }`}
            >
              {urgent ? <AlertTriangle size={28} /> : <Clock size={28} />}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p
                className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${
                  urgent ? "text-red-300" : "text-amber-300"
                }`}
              >
                Aviso importante · Renovación de suscripción
              </p>
              <h3 className="text-white text-lg md:text-2xl font-bold leading-tight">
                Tu acceso {dayText}
              </h3>
              <p className="text-white/80 text-sm mt-1 leading-snug">
                {expiryLabel ? `Fecha límite: ${expiryLabel}. ` : ""}
                Si no se renueva a tiempo, la aplicación se bloqueará y no podrás operar.
                Contactá a los desarrolladores para pagar la suscripción.
              </p>
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-3 shrink-0">
              <div
                className={`rounded-xl px-4 py-2 text-center border min-w-[5.5rem] ${
                  urgent
                    ? "bg-red-500/30 border-red-400/50"
                    : "bg-amber-500/30 border-amber-400/50"
                }`}
              >
                <p className="text-white text-3xl md:text-4xl font-black leading-none tabular-nums">
                  {daysRemaining ?? "—"}
                </p>
                <p className={`text-[10px] font-semibold uppercase tracking-wide mt-1 ${
                  urgent ? "text-red-200" : "text-amber-200"
                }`}>
                  {daysRemaining === 1 ? "día" : "días"}
                </p>
              </div>
              <button
                onClick={() => setWarningDismissed(true)}
                className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Minimizar aviso"
                aria-label="Minimizar aviso"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Barra persistente después de minimizar (sigue visible) ────────────────
  return (
    <div className="fixed inset-x-0 top-0 z-[9990]">
      <button
        type="button"
        onClick={() => setWarningDismissed(false)}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold border-b shadow-lg transition-colors ${
          urgent
            ? "bg-red-700 hover:bg-red-600 text-white border-red-500 animate-pulse"
            : "bg-amber-700 hover:bg-amber-600 text-white border-amber-500"
        }`}
      >
        <AlertTriangle size={16} className="shrink-0" />
        <span>
          Suscripción {dayText}
          {expiryLabel ? ` · ${expiryLabel}` : ""}. Tocá para ver el aviso completo.
        </span>
      </button>
    </div>
  );
}
