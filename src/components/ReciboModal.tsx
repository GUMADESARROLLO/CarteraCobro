interface Recibo {
  id: number;
  recibo: string;
  cod_cliente: string;
  name_cliente: string;
  fecha_recibo: string;
  ruta: string;
  order_total: string;
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

function parseItems(orderList: string): Record<string, string>[] {
  const parseLine = (line: string) => {
    const parts = line.replace(/^\[|\]$/g, '').split(';').map(s => s.replace(/^[\[\],\s]+|[\[\],\s]+$/g, ''));
    return { FACTURA: parts[0] ?? '', 'VALOR FACTURA': parts[1] ?? '', 'VALOR N/C': parts[2] ?? '', RETENCION: parts[3] ?? '', DESCUENTO: parts[4] ?? '', 'VALOR RECIBIDO': parts[5] ?? '', SALDO: parts[6] ?? '', TIPO: ((parts[8] || parts[7]) ?? '').toUpperCase() };
  };
  try {
    const parsed = JSON.parse(orderList);
    return (Array.isArray(parsed) ? parsed : [parsed]).map((entry: string) => parseLine(String(entry)));
  } catch {
    if (orderList.includes('],[')) return orderList.split('],[').map(parseLine);
    if (orderList.includes('[') && orderList.includes(']')) return [parseLine(orderList)];
    if (orderList.includes(';')) return orderList.split(',').map(parseLine);
    return [];
  }
}

function fmtMoney(val: string) {
  const num = parseFloat(val.replace(/,/g, ''));
  return isNaN(num) ? val : `C$ ${formatCurrency(num)}`;
}

export default function ReciboModal({ recibo, onClose, onSave }: Props) {
  const items = recibo.order_list ? parseItems(recibo.order_list) : [];
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
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white leading-tight break-words">{recibo.name_cliente}</p>
              <p className="text-xs text-zinc-400 dark:text-gray-400 mt-0.5">Cód. {recibo.cod_cliente.replace(/[-\s]+$/g, '')} &nbsp;·&nbsp; {recibo.ruta}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5">
              <p className="text-[11px] text-zinc-400 dark:text-gray-400 mb-1">Total</p>
              <p className="text-lg font-bold text-zinc-800 dark:text-white">C$ {recibo.order_total || '0.00'}</p>
            </div>
            <div className="bg-zinc-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5">
              <p className="text-[11px] text-zinc-400 dark:text-gray-400 mb-1">Fecha</p>
              <p className="text-sm font-medium text-zinc-800 dark:text-white">{formatDate(recibo.fecha_recibo)}</p>
            </div>
          </div>

          {items.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-zinc-100 dark:border-gray-700">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-gray-700/30">
                    {['FACTURA', 'VALOR FACTURA', 'VALOR N/C', 'RETENCION', 'DESCUENTO', 'VALOR RECIBIDO', 'SALDO', 'TIPO'].map(h => (
                      <th key={h} className="whitespace-nowrap px-2 py-1.5 text-left font-semibold uppercase tracking-wider text-zinc-500 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-gray-800">
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td className="whitespace-nowrap px-2 py-1.5 text-zinc-700 dark:text-gray-300">{item.FACTURA}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-zinc-700 dark:text-gray-300 text-right">{fmtMoney(item['VALOR FACTURA'])}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-zinc-700 dark:text-gray-300 text-right">{fmtMoney(item['VALOR N/C'])}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-zinc-700 dark:text-gray-300 text-right">{fmtMoney(item['RETENCION'])}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-zinc-700 dark:text-gray-300 text-right">{fmtMoney(item['DESCUENTO'])}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-zinc-700 dark:text-gray-300 text-right">{fmtMoney(item['VALOR RECIBIDO'])}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-zinc-700 dark:text-gray-300 text-right">{fmtMoney(item['SALDO'])}</td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-zinc-700 dark:text-gray-300 text-center">{item.TIPO}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {items.length === 0 && (
            <div className="border border-zinc-100 dark:border-gray-700 rounded-lg px-4 py-3">
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 dark:text-gray-500 mb-2 font-medium">Detalle de Facturas</p>
              <p className="text-sm text-zinc-400 dark:text-gray-500 italic">Sin datos</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 dark:border-gray-700 flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-sm px-5 py-2 rounded-lg border border-zinc-200 dark:border-gray-600 text-zinc-600 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-gray-700 transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
