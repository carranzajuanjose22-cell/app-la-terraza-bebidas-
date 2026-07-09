import { useState } from "react";
import { ShieldCheck, Calendar, LogOut, RotateCcw, Play, AlertTriangle, CheckCircle } from "lucide-react";
import { useSubscription } from "./SubscriptionContext.jsx";
import { toast } from "sonner";

export function CreatorDashboard({ onLogout }) {
  const {
    isConfigured,
    subscriptionDay,
    nextExpiry,
    isExpired,
    isWarning,
    daysRemaining,
    configure,
    renew,
    fetchStatus,
  } = useSubscription();

  const [selectedDay, setSelectedDay] = useState(subscriptionDay ? String(subscriptionDay) : "");
  const [saving, setSaving] = useState(false);
  const [renewing, setRenewing] = useState(false);

  const handleConfigure = async () => {
    const day = parseInt(selectedDay, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      toast.error("Ingresá un número válido entre 1 y 31");
      return;
    }
    setSaving(true);
    try {
      const status = await configure(day);
      toast.success(`Día de corte configurado: día ${day} de cada mes`);
      setSelectedDay(String(status.subscriptionDay));
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al configurar");
    } finally {
      setSaving(false);
    }
  };

  const handleRenew = async () => {
    if (!isExpired) return;
    setRenewing(true);
    try {
      const status = await renew();
      toast.success(`Suscripción reactivada. Próximo vencimiento: ${formatDate(status.nextExpiry)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al reactivar");
    } finally {
      setRenewing(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const statusColor = isExpired
    ? "text-red-400"
    : isWarning
    ? "text-amber-400"
    : isConfigured
    ? "text-green-400"
    : "text-gray-400";

  const statusLabel = isExpired
    ? "Bloqueado"
    : isWarning
    ? `Aviso (${daysRemaining} día${daysRemaining !== 1 ? "s" : ""})`
    : isConfigured
    ? "Activo"
    : "Sin configurar";

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* Navbar */}
      <nav className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck size={22} className="text-[#8B5CF6]" />
          <span className="text-white text-lg font-bold">Panel de Creador</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] text-gray-300 hover:text-white rounded-xl text-sm transition-all"
        >
          <LogOut size={16} />
          Salir
        </button>
      </nav>

      {/* Contenido */}
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">

        {/* Estado actual */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden">
          <div className="p-5 border-b border-[#2a2a2a]">
            <h2 className="text-white font-semibold text-lg">Estado Actual</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#2a2a2a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">Día de Corte</p>
              <p className="text-white font-medium">
                {isConfigured ? `Día ${subscriptionDay} de cada mes` : "No configurado"}
              </p>
            </div>
            <div className="bg-[#2a2a2a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">Próximo Vencimiento</p>
              <p className="text-white font-medium">{formatDate(nextExpiry)}</p>
            </div>
            <div className="bg-[#2a2a2a] rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">Estado</p>
              <p className={`font-medium ${statusColor}`}>{statusLabel}</p>
            </div>
          </div>
        </div>

        {/* Configurar día de corte */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] overflow-hidden">
          <div className="p-5 border-b border-[#2a2a2a]">
            <h2 className="text-white font-semibold text-lg">Configurar Día de Corte</h2>
            <p className="text-gray-500 text-sm mt-1">
              El sistema bloqueará al cliente a partir de ese día si no se renueva. El aviso se envía 5 días antes.
            </p>
          </div>
          <div className="p-5">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-gray-400 text-sm block mb-2">Día del mes (1–31)</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ej: 10"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full bg-[#2a2a2a] text-white rounded-xl pl-9 pr-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleConfigure}
                disabled={saving}
                className="flex items-center gap-2 bg-[#6B21A8] hover:bg-[#581C87] disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl transition-all shrink-0"
              >
                <Play size={16} />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-2">
              Si el día ya pasó en el mes actual, el próximo vencimiento se calculará para el mes siguiente.
            </p>
          </div>
        </div>

        {/* Reactivación */}
        <div className={`bg-[#1a1a1a] rounded-2xl border overflow-hidden ${isExpired ? "border-red-500/40" : "border-[#2a2a2a]"}`}>
          <div className="p-5 border-b border-[#2a2a2a]">
            <h2 className="text-white font-semibold text-lg">Reactivar Suscripción</h2>
            <p className="text-gray-500 text-sm mt-1">
              {isExpired
                ? "La suscripción está bloqueada. Presioná el botón para levantar la restricción."
                : "Disponible solo cuando la suscripción está vencida."}
            </p>
          </div>
          <div className="p-5">
            <div className={`rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isExpired ? "bg-red-500/10 border border-red-500/20" : "bg-[#2a2a2a]"
            }`}>
              <div className="flex items-center gap-3">
                {isExpired
                  ? <AlertTriangle size={20} className="text-red-400 shrink-0" />
                  : <CheckCircle size={20} className="text-green-400 shrink-0" />}
                <div>
                  <p className={`font-medium text-sm ${isExpired ? "text-red-300" : "text-gray-300"}`}>
                    {isExpired ? "Acceso restringido al cliente" : "Servicio funcionando con normalidad"}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {isExpired
                      ? "Al reactivar, el sistema calculará el próximo vencimiento desde hoy."
                      : "El botón se habilitará cuando la suscripción caduque."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRenew}
                disabled={!isExpired || renewing}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all shrink-0 ${
                  isExpired && !renewing
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-[#333] text-gray-600 cursor-not-allowed"
                }`}
                title={!isExpired ? "Solo disponible cuando la suscripción está vencida" : ""}
              >
                <RotateCcw size={16} />
                {renewing ? "Reactivando..." : "Reactivar Servicio"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
