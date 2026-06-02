import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DateRangePicker, createStaticRanges } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { es } from 'date-fns/locale';
import { addDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import SkeletonTable from './SkeletonTable';
import ToastContainer, { addToast } from './Toast';
import ReciboModal from './ReciboModal';

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

interface ReciboResponse {
  data: Recibo[];
  page: number;
  totalPages: number;
  total: number;
}

export default function RecibosTable() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const fmt = (d: Date) => {
    const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [data, setData] = useState<Recibo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [fechaDesde, setFechaDesde] = useState(fmt(firstOfMonth));
  const [fechaHasta, setFechaHasta] = useState(fmt(today));
  const [showPicker, setShowPicker] = useState(false);
  const [applied, setApplied] = useState(1);
  const [revisarRecibo, setRevisarRecibo] = useState<Recibo | null>(null);
  const [vendedores, setVendedores] = useState<{ VENDEDOR: string; NOMBRE: string }[]>([]);
  const [vendedorSel, setVendedorSel] = useState('');
  const [buscar, setBuscar] = useState('');
  const [detallesOpen, setDetallesOpen] = useState<Set<number>>(new Set());
  const pickerRef = useRef<HTMLDivElement>(null);

  const fechaDesdeRef = useRef(fechaDesde);
  const fechaHastaRef = useRef(fechaHasta);
  const vendedorRef = useRef(vendedorSel);
  const buscarRef = useRef(buscar);
  const pageRef = useRef(page);
  fechaDesdeRef.current = fechaDesde;
  fechaHastaRef.current = fechaHasta;
  vendedorRef.current = vendedorSel;
  buscarRef.current = buscar;
  pageRef.current = page;

  const yearActual = new Date().getFullYear();

  const [selectionRange, setSelectionRange] = useState({
    startDate: new Date(`${yearActual}-05-01`),
    endDate: new Date(`${yearActual}-09-20`),
    key: 'selection',
  });

  const staticRanges = useMemo(() => createStaticRanges([
    {
      label: 'Hoy',
      range: () => ({ startDate: new Date(), endDate: new Date() }),
    },
    {
      label: 'Últm. 7 Días',
      range: () => ({ startDate: addDays(new Date(), -6), endDate: new Date() }),
    },
    {
      label: 'Últm. 30 Días',
      range: () => ({ startDate: addDays(new Date(), -29), endDate: new Date() }),
    },
    {
      label: 'Este Mes',
      range: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() }),
    },
    {
      label: 'Mes Anterior',
      range: () => ({
        startDate: startOfMonth(subMonths(new Date(), 1)),
        endDate: endOfMonth(subMonths(new Date(), 1)),
      }),
    },
  ]), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fd = fechaDesdeRef.current;
      const fh = fechaHastaRef.current;
      const v = vendedorRef.current;
      const b = buscarRef.current;
      const p = pageRef.current;

      const params = new URLSearchParams();
      params.set('page', String(p));
      if (fd) params.set('fecha_desde', fd);
      if (fh) params.set('fecha_hasta', fh);
      if (v) params.set('vendedor', v);
      if (b) params.set('buscar', b);

      const res = await fetch(`/api/recibos?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar datos');
      const json: ReciboResponse = await res.json();
      setData(json.data);
      setPage(json.page);
      setTotalPages(json.totalPages);
      setTotal(json.total);
    } catch { addToast('Error al cargar recibos', 'error'); }
    finally { setLoading(false); }
  }, [applied]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch('/api/vendedores').then(r => r.ok ? r.json() : { vendedores: [] }).then(j => setVendedores(j.vendedores ?? [])).catch(() => {});
  }, []);

  const lastSigRef = useRef('');
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const check = await fetch('/api/recibos/check');
        if (!check.ok) return;
        const { maxId, total } = await check.json();
        const sig = `${maxId}-${total}`;
        if (sig === lastSigRef.current) return;
        lastSigRef.current = sig;
        const fd = fechaDesdeRef.current;
        const fh = fechaHastaRef.current;
        const v = vendedorRef.current;
        const b = buscarRef.current;
        const p = pageRef.current;
        const params = new URLSearchParams();
        params.set('page', String(p));
        if (fd) params.set('fecha_desde', fd);
        if (fh) params.set('fecha_hasta', fh);
        if (v) params.set('vendedor', v);
        if (b) params.set('buscar', b);
        const res = await fetch(`/api/recibos?${params.toString()}`);
        if (!res.ok) return;
        const json: ReciboResponse = await res.json();
        setData(json.data);
        setPage(json.page);
        setTotalPages(json.totalPages);
        setTotal(json.total);
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    }
    if (showPicker) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  function handleRangeChange(rangesByKey: Record<string, { startDate?: Date; endDate?: Date }>) {
    const { startDate, endDate } = rangesByKey.selection;
    if (startDate && endDate) {
      setSelectionRange(prev => ({ ...prev, startDate, endDate }));
      setFechaDesde(fmt(startDate));
      setFechaHasta(fmt(endDate));
    }
  }

  function formatDateRange(): string {
    const d1 = new Date(fechaDesde + 'T00:00:00');
    const d2 = new Date(fechaHasta + 'T00:00:00');
    return d1.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' - ' + d2.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function handleFilter() { setPage(1); setApplied(n => n + 1); }

  async function exportXLSX() {
    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.set('fecha_desde', fechaDesde);
      if (fechaHasta) params.set('fecha_hasta', fechaHasta);
      if (vendedorSel) params.set('vendedor', vendedorSel);
      if (buscar) params.set('buscar', buscar);
      const res = await fetch(`/api/recibos?export=csv&${params.toString()}`);
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'recibos.xlsx'; a.click();
      URL.revokeObjectURL(url);
      addToast('Exportado correctamente', 'success');
    } catch { addToast('Error al exportar', 'error'); }
  }

  function formatMoney(n: number | null | undefined): string {
    if (n == null || isNaN(Number(n))) return '0.00';
    return Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(d: string | null | undefined): string {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  return (
    <div>
      <ToastContainer />

      <div className="mb-4 flex flex-wrap items-end gap-3 justify-between">
        <div className="flex-1 min-w-[200px] max-w-md">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Buscar</label>
          <input
            type="text" value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Recibo o cliente..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="relative" ref={pickerRef}>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Rango</label>
            <input
              type="text" readOnly
              value={formatDateRange()}
              onClick={() => setShowPicker(!showPicker)}
              className="mt-1 w-60 cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {showPicker && (
              <div className="absolute left-0 top-full z-50 mt-1 shadow-xl rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden dark-picker">
                <DateRangePicker
                  ranges={[selectionRange]}
                  onChange={handleRangeChange}
                  locale={es}
                  months={1}
                  direction="vertical"
                  staticRanges={staticRanges}
                  inputRanges={[]}
                  minDate={new Date(`${yearActual}-05-01`)}
                  maxDate={new Date(`${yearActual}-09-20`)}
                  moveRangeOnFirstSelection={false}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Vendedor</label>
            <select
              value={vendedorSel} onChange={(e) => setVendedorSel(e.target.value)}
              className="mt-1 w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos</option>
              {vendedores.map((v) => <option key={v.VENDEDOR} value={v.NOMBRE}>{v.VENDEDOR} - {v.NOMBRE}</option>)}
            </select>
          </div>

          <button onClick={handleFilter} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Filtrar</button>
          <button onClick={exportXLSX} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Exportar</button>
        </div>
      </div>

      <div className="mb-4">
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 inline-block">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Recibos</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-0.5">{data.length}</p>
        </div>
      </div>

      {loading ? (
        <SkeletonTable columns={7} rows={10} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Detalles', 'NUM. REC.', 'CLIENTE', 'NOMBRE', 'FECHA', 'VENDEDOR', 'TOTAL', 'ACCIONES'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {data.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">Sin resultados</td></tr>
                ) : (
                  data.flatMap((r) => {
                    const open = detallesOpen.has(r.id);
                    let items: Record<string, string>[] = [];
                    const parseLine = (line: string) => {
                      const parts = line.replace(/^\[|\]$/g, '').split(';').map(s => s.trim());
                      return {
                        FACTURA: parts[0] ?? '',
                        'VALOR FACTURA': parts[1] ?? '',
                        'VALOR N/C': parts[2] ?? '',
                        RETENCION: parts[3] ?? '',
                        DESCUENTO: parts[4] ?? '',
                        'VALOR RECIBIDO': parts[5] ?? '',
                        SALDO: parts[6] ?? '',
                        TIPO: parts[7] ?? '',
                      } as Record<string, string>;
                    };

                    if (open && r.order_list) {
                      try {
                        const parsed = JSON.parse(r.order_list);
                        const rawItems = Array.isArray(parsed) ? parsed : [parsed];
                        items = rawItems.map((entry: string) => parseLine(String(entry)));
                      } catch {
                        const text = r.order_list;
                        if (text.includes('],[')) {
                          items = text.split('],[').map(parseLine);
                        } else if (text.includes('[') && text.includes(']')) {
                          items = [parseLine(text)];
                        } else if (text.includes(';')) {
                          items = text.split(',').map(parseLine);
                        } else { items = []; }
                      }
                    }
                    return [
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2.5 text-sm">
                          <button
                            onClick={() => setDetallesOpen(p => { const n = new Set(p); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-xs font-medium">{open ? 'Cerrar' : 'Ver'}</span>
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-gray-900 dark:text-white">{r.recibo}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">{r.cod_cliente}</td>
                        <td className="max-w-40 truncate px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400" title={r.name_cliente}>{r.name_cliente}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">{formatDate(r.fecha_recibo)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">{r.ruta}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-900 dark:text-white">{formatMoney(r.order_total)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                          <button onClick={() => setRevisarRecibo(r)} className="rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600">Revisar</button>
                        </td>
                      </tr>,
                      ...(open && items.length > 0 ? items.map((item, i) => (
                        <tr key={`${r.id}-details-${i}`} className="bg-gray-50 dark:bg-gray-800/30">
                          <td colSpan={8} className="px-6 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
                              {['FACTURA', 'VALOR FACTURA', 'VALOR N/C', 'RETENCION', 'DESCUENTO', 'VALOR RECIBIDO', 'SALDO', 'TIPO'].map((col) => (
                                <div key={col}>
                                  <p className="font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{col}</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-medium">{item[col] || <span className="text-gray-300 dark:text-gray-600">—</span>}</p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )) : [])
                    ];
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Pagina {page} de {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600 dark:text-gray-300">Anterior</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button key={p} onClick={() => setPage(p)} className={`rounded-lg px-3 py-1.5 text-sm ${p === page ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{p}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600 dark:text-gray-300">Siguiente</button>
          </div>
        </div>
      )}

      {revisarRecibo && (
        <ReciboModal
          recibo={revisarRecibo}
          onClose={() => setRevisarRecibo(null)}
          onSave={async (id, comment) => {
            try {
              const res = await fetch(`/api/recibos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment }),
              });
              if (!res.ok) { addToast('Error al guardar', 'error'); return; }
              addToast('Comentario actualizado', 'success');
              setRevisarRecibo(null);
              setPage(1);
              setApplied(n => n + 1);
            } catch { addToast('Error de conexión', 'error'); }
          }}
        />
      )}
    </div>
  );
}
