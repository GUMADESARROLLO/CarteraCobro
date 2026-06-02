interface Recibo {
  id: number;
  recibo: string;
  cod_cliente: string;
  name_cliente: string;
  fecha_recibo: string;
  ruta: string;
  order_total: number;
  order_list: string;
}

interface Props {
  recibo: Recibo;
  onClose: () => void;
  onSave: (id: number, comment: string) => Promise<void>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ReciboModal({ recibo, onClose, onSave }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl border border-zinc-200 dark:border-gray-600 shadow-xl overflow-hidden">
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-100 dark:border-gray-700">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-zinc-400 dark:text-gray-500 mb-1">Recibo</p>
            <h2 className="text-xl font-medium text-zinc-900 dark:text-white">{recibo.recibo}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 dark:text-gray-400 hover:text-zinc-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-gray-700" aria-label="Cerrar">
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-gray-700/50 rounded-lg px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0 text-blue-700 dark:text-blue-300 text-sm font-medium">
              {recibo.name_cliente.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white leading-tight">{recibo.name_cliente}</p>
              <p className="text-xs text-zinc-400 dark:text-gray-400 mt-0.5">Cód. {recibo.cod_cliente} &nbsp;·&nbsp; {recibo.ruta}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5">
              <p className="text-[11px] text-zinc-400 dark:text-gray-400 mb-1">Total</p>
              <p className="text-lg font-bold text-zinc-800 dark:text-white">C$ {formatCurrency(recibo.order_total)}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5">
              <p className="text-[11px] text-zinc-400 dark:text-gray-400 mb-1">Fecha</p>
              <p className="text-sm font-medium text-zinc-800 dark:text-white">{formatDate(recibo.fecha_recibo)}</p>
            </div>
          </div>

          <div className="border border-zinc-100 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-4 py-3">
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 dark:text-gray-500 mb-2 font-medium">Order List</p>
              <p className="text-sm text-zinc-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {recibo.order_list || <span className="italic text-zinc-300 dark:text-gray-500">Sin datos</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 dark:border-gray-700 flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-sm px-5 py-2 rounded-lg border border-zinc-200 dark:border-gray-600 text-zinc-600 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-gray-700 transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
