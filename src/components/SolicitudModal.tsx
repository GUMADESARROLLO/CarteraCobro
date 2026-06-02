interface Solicitud {
  id: number;
  codigo: string;
  ruta: string;
  cliente: string;
  cod_cliente: string;
  monto: number;
  fecha: string;
  estado: string;
  motivo: string | null;
  saldo_actual: number;
  limite_actual: number;
  disponible_actual: number;
}

interface Props {
  solicitud: Solicitud;
  onClose: () => void;
  onAprobar: (id: number) => void;
  onRechazar: (id: number) => void;
}

const estadoConfig: Record<string, { label: string; classes: string; icon: string }> = {
  Pendiente: {
    label: "Pendiente",
    classes: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700",
    icon: "⏳",
  },
  Aprobado: {
    label: "Aprobado",
    classes: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700",
    icon: "✓",
  },
  Rechazado: {
    label: "Rechazado",
    classes: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700",
    icon: "✕",
  },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function SolicitudModal({ solicitud, onClose, onAprobar, onRechazar }: Props) {
  const estado = estadoConfig[solicitud.estado] ?? { label: solicitud.estado, classes: 'bg-gray-50 text-gray-700 border border-gray-200', icon: '?' };
  const isPendiente = solicitud.estado === "Pendiente";

  const initials = solicitud.cliente
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl border border-zinc-200 dark:border-gray-600 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-100 dark:border-gray-700">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-zinc-400 dark:text-gray-500 mb-1">
              Solicitud de incremento
            </p>
            <h2 className="text-xl font-medium text-zinc-900 dark:text-white">{solicitud.codigo}</h2>
          </div>
          <div className="flex items-center gap-2.5 pt-0.5">
            <span className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 ${estado.classes}`}>
              <span>{estado.icon}</span>
              {estado.label}
            </span>
            <button
              onClick={onClose}
              className="text-zinc-400 dark:text-gray-400 hover:text-zinc-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-gray-700"
              aria-label="Cerrar"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">

          {/* Cliente card */}
          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-gray-700/50 rounded-lg px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 text-blue-700 dark:text-blue-300 text-sm font-medium">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white leading-tight">
                {solicitud.cliente}
              </p>
              <p className="text-xs text-zinc-400 dark:text-gray-400 mt-0.5">
                Cód. {solicitud.cod_cliente} &nbsp;·&nbsp; Ruta {solicitud.ruta}
              </p>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Saldo actual", value: solicitud.saldo_actual },
              { label: "Límite actual", value: solicitud.limite_actual },
              { label: "Disponible", value: solicitud.disponible_actual },
            ].map(({ label, value }) => (
              <div key={label} className="bg-zinc-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5">
                <p className="text-[11px] text-zinc-400 dark:text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-zinc-800 dark:text-white">
                  C$ {formatCurrency(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Tabla de detalles */}
          <div className="border border-zinc-100 dark:border-gray-700 rounded-lg overflow-hidden text-sm">
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-zinc-100 dark:border-gray-700">
              <span className="text-zinc-400 dark:text-gray-400 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3" strokeLinecap="round"/>
                </svg>
                Monto solicitado
              </span>
              <span className="font-medium text-zinc-900 dark:text-white text-base">
                C$ {formatCurrency(solicitud.monto)}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-zinc-100 dark:border-gray-700">
              <span className="text-zinc-400 dark:text-gray-400 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round"/>
                </svg>
                Fecha
              </span>
              <span className="text-zinc-700 dark:text-gray-300">{formatDate(solicitud.fecha)}</span>
            </div>
            <div className="flex justify-between items-start px-4 py-2.5">
              <span className="text-zinc-400 dark:text-gray-400 flex items-center gap-2 pt-0.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round"/>
                </svg>
                Motivo
              </span>
              <span className="text-zinc-700 dark:text-gray-300 text-right max-w-[55%]">
                {solicitud.motivo || <span className="italic text-zinc-300 dark:text-gray-500">Sin motivo</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-gray-700 flex items-center justify-end gap-2">
          {isPendiente ? (
            <>
              <button
                onClick={() => onRechazar(solicitud.id)}
                className="flex items-center gap-1.5 text-sm px-5 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
                Rechazar
              </button>
              <button
                onClick={() => onAprobar(solicitud.id)}
                className="flex items-center gap-1.5 text-sm px-5 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Aprobar
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="text-sm px-5 py-2 rounded-lg border border-zinc-200 dark:border-gray-600 text-zinc-600 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
