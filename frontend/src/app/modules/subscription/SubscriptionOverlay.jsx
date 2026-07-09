import { useState, useEffect } from "react";
import { AlertTriangle, Lock, LogOut, X } from "lucide-react";
import { useSubscription } from "./SubscriptionContext.jsx";

export function SubscriptionOverlay({ onLogout, userRole }) {
  const { isExpired, isWarning, daysRemaining } = useSubscription();
  const [warningDismissed, setWarningDismissed] = useState(false);

  // Volver a mostrar el aviso si cambia de fase
  useEffect(() => {
    if (isWarning) setWarningDismissed(false);
  }, [isWarning]);

  // El creator nunca ve restricciones
  if (userRole === "creator") return null;

  // ── Pantalla de bloqueo por suscripción vencida ───────────────────────────
  if (isExpired) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-sm border border-red-500/30 shadow-2xl">
          <div className="p-8 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 bg-red-500/15 rounded-full flex items-center justify-center">
              <Lock size={36} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold mb-2">Suscripción Vencida</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
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

  // ── Banner de advertencia (5 días antes) ─────────────────────────────────
  if (isWarning && !warningDismissed) {
    return (
      <div className="fixed bottom-4 right-4 z-[9990] bg-[#1a1a1a] rounded-xl shadow-2xl border-l-4 border-amber-500 p-4 max-w-sm w-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold text-sm">Aviso de Servicio</h3>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                {daysRemaining === 0
                  ? "El servicio vence hoy."
                  : `El servicio vence en ${daysRemaining} día${daysRemaining !== 1 ? "s" : ""}.`}{" "}
                De no renovarse, se restringirá el acceso a la aplicación.
              </p>
            </div>
          </div>
          <button
            onClick={() => setWarningDismissed(true)}
            className="text-gray-500 hover:text-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
