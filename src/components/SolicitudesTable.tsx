import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DateRangePicker, createStaticRanges } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { es } from 'date-fns/locale';
import { addDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import Swal from 'sweetalert2';
import SkeletonTable from './SkeletonTable';
import ToastContainer, { addToast } from './Toast';
import SolicitudModal from './SolicitudModal';

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
  resolucion: string | null;
  saldo_actual: number;
  limite_actual: number;
  disponible_actual: number;
}

interface SolicitudResponse {
  data: Solicitud[];
  page: number;
  totalPages: number;
  total: number;
}

const ESTADOS = ['', 'Pendiente', 'Aprobado', 'Rechazado'];
const ESTADO_LABELS: Record<string, string> = {
  '': 'Todos',
  'Pendiente': 'Pendiente',
  'Aprobado': 'Aprobado',
  'Rechazado': 'Rechazado',
};

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  Aprobado: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  Rechazado: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export default function SolicitudesTable() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [data, setData] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [estado, setEstado] = useState('');
  const [ruta, setRuta] = useState('');
  const [fechaDesde, setFechaDesde] = useState(fmt(firstOfMonth));
  const [fechaHasta, setFechaHasta] = useState(fmt(today));
  const [showPicker, setShowPicker] = useState(false);
  const [applied, setApplied] = useState(1);
  const [revisarSolicitud, setRevisarSolicitud] = useState<Solicitud | null>(null);
  const [vendedores, setVendedores] = useState<{ VENDEDOR: string; NOMBRE: string }[]>([]);
  const [vendedorSel, setVendedorSel] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  const estadoRef = useRef(estado);
  const rutaRef = useRef(ruta);
  const fechaDesdeRef = useRef(fechaDesde);
  const fechaHastaRef = useRef(fechaHasta);
  const vendedorRef = useRef(vendedorSel);
  estadoRef.current = estado;
  rutaRef.current = ruta;
  fechaDesdeRef.current = fechaDesde;
  fechaHastaRef.current = fechaHasta;
  vendedorRef.current = vendedorSel;

  const yearActual = new Date().getFullYear();

  const [selectionRange, setSelectionRange] = useState({
    startDate: firstOfMonth,
    endDate: today,
    key: 'selection',
  });

  const staticRanges = createStaticRanges([
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
  ]);

  const pageRef = useRef(page);
  pageRef.current = page;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = pageRef.current;
      const e = estadoRef.current;
      const r = rutaRef.current;
      const fd = fechaDesdeRef.current;
      const fh = fechaHastaRef.current;
      const v = vendedorRef.current;

      const params = new URLSearchParams();
      params.set('page', String(p));
      if (e) params.set('estado', e);
      if (r) params.set('ruta', r);
      if (fd) params.set('fecha_desde', fd);
      if (fh) params.set('fecha_hasta', fh);
      if (v) params.set('vendedor', v);

      const res = await fetch(`/api/solicitudes?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          addToast('No tiene permisos para ver solicitudes', 'error');
          return;
        }
        throw new Error('Error al cargar datos');
      }

      const json: SolicitudResponse = await res.json();
      setData(json.data);
      setPage(json.page);
      setTotalPages(json.totalPages);
      setTotal(json.total);
    } catch {
      addToast('Error al cargar solicitudes', 'error');
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const lastSigRef = useRef('');

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const check = await fetch('/api/solicitudes/check');
        if (!check.ok) return;
        const { maxId, total } = await check.json();
        const sig = `${maxId}-${total}`;
        if (sig === lastSigRef.current) return;
        lastSigRef.current = sig;

        const p = pageRef.current;
        const e = estadoRef.current;
        const r = rutaRef.current;
        const fd = fechaDesdeRef.current;
        const fh = fechaHastaRef.current;

        const params = new URLSearchParams();
        params.set('page', String(p));
        if (e) params.set('estado', e);
        if (r) params.set('ruta', r);
        if (fd) params.set('fecha_desde', fd);
        if (fh) params.set('fecha_hasta', fh);

        const res = await fetch(`/api/solicitudes?${params.toString()}`);
        if (!res.ok) return;
        const json: SolicitudResponse = await res.json();
        setData(json.data);
        setPage(json.page);
        setTotalPages(json.totalPages);
        setTotal(json.total);
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch('/api/vendedores')
      .then(r => r.ok ? r.json() : { vendedores: [] })
      .then(j => setVendedores(j.vendedores ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
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
    if (!fechaDesde || !fechaHasta) return 'Seleccionar rango...';
    const d1 = new Date(fechaDesde + 'T00:00:00');
    const d2 = new Date(fechaHasta + 'T00:00:00');
    return d1.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' - '
      + d2.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function handleFilter() {
    setPage(1);
    setApplied(n => n + 1);
  }

  async function exportCSV() {
    try {
      const params = new URLSearchParams();
      if (estado) params.set('estado', estado);
      if (ruta) params.set('ruta', ruta);
      if (fechaDesde) params.set('fecha_desde', fechaDesde);
      if (fechaHasta) params.set('fecha_hasta', fechaHasta);
      if (vendedorSel) params.set('vendedor', vendedorSel);

      const res = await fetch(`/api/solicitudes?export=csv&${params.toString()}`);
      if (!res.ok) throw new Error('Error al exportar');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'solicitudes.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      addToast('Exportado correctamente', 'success');
    } catch {
      addToast('Error al exportar', 'error');
    }
  }

  async function confirmAction(id: number, nuevoEstado: 'Aprobado' | 'Rechazado'): Promise<boolean> {
    const result = await Swal.fire({
      title: nuevoEstado === 'Aprobado' ? 'Aprobar solicitud' : 'Rechazar solicitud',
      icon: nuevoEstado === 'Aprobado' ? 'success' : 'warning',
      input: 'textarea',
      inputPlaceholder: nuevoEstado === 'Aprobado' ? 'Motivo (opcional)' : 'Motivo del rechazo',
      showCancelButton: true,
      confirmButtonText: nuevoEstado === 'Aprobado' ? 'Sí, aprobar' : 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: nuevoEstado === 'Aprobado' ? '#22c55e' : '#ef4444',
      showLoaderOnConfirm: true,
      allowOutsideClick: false,
      preConfirm: async (inputValue) => {
        if (nuevoEstado === 'Rechazado' && !inputValue?.trim()) {
          Swal.showValidationMessage('Debe ingresar un motivo para rechazar');
          return false;
        }
        try {
          const res = await fetch(`/api/solicitudes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado, resolucion: inputValue?.trim() || null }),
          });
          if (!res.ok) {
            const err = await res.json();
            Swal.showValidationMessage(err.error || 'Error al actualizar');
            return false;
          }
          return true;
        } catch {
          Swal.showValidationMessage('Error de conexión');
          return false;
        }
      },
    });

    if (!result.isConfirmed) return false;

    addToast(`Solicitud ${nuevoEstado.toLowerCase()} exitosamente`, 'success');
    setPage(1);
    setApplied(n => n + 1);
    return true;
  }

  function formatMoney(n: number): string {
    return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  }

  return (
    <div>
      <style>{`
        .dark .dark-picker .rdrCalendarWrapper,
        .dark .dark-picker .rdrDateRangePickerWrapper,
        .dark .dark-picker .rdrDefinedRangesWrapper,
        .dark .dark-picker .rdrDateDisplayWrapper,
        .dark .dark-picker .rdrMonthAndYearWrapper,
        .dark .dark-picker .rdrMonth {
          background: #1f2937;
        }
        .dark .dark-picker .rdrDateDisplayItem {
          background: #374151;
          border-color: #4b5563;
        }
        .dark .dark-picker .rdrDateDisplayItem input {
          color: #e5e7eb;
        }
        .dark .dark-picker .rdrDateDisplayItemActive {
          background: #2563eb;
          border-color: #2563eb;
        }
        .dark .dark-picker .rdrDayNumber span {
          color: #e5e7eb;
        }
        .dark .dark-picker .rdrDayPassive .rdrDayNumber span {
          color: #6b7280;
        }
        .dark .dark-picker .rdrDayToday .rdrDayNumber span:after {
          background: #3b82f6;
        }
        .dark .dark-picker .rdrMonthPicker select,
        .dark .dark-picker .rdrYearPicker select,
        .dark .dark-picker .rdrMonthAndYearPickers select {
          color: #e5e7eb;
          background: #374151;
        }
        .dark .dark-picker .rdrWeekDay {
          color: #9ca3af;
        }
        .dark .dark-picker .rdrNextPrevButton {
          background: #374151;
        }
        .dark .dark-picker .rdrNextPrevButton:hover {
          background: #4b5563;
        }
        .dark .dark-picker .rdrStaticRange {
          background: #1f2937;
          border-color: #374151;
        }
        .dark .dark-picker .rdrStaticRange:hover {
          background: #374151;
        }
        .dark .dark-picker .rdrStaticRangeLabel {
          color: #e5e7eb;
        }
        .dark .dark-picker .rdrStaticRangeSelected {
          background: #2563eb20;
        }
        .dark .dark-picker .rdrInputRange {
          color: #e5e7eb;
        }
        .dark .dark-picker .rdrInputRangeInput {
          background: #374151;
          color: #e5e7eb;
          border-color: #4b5563;
        }
        .dark .dark-picker .rdrMonthName {
          color: #e5e7eb;
        }
        .dark .dark-picker .rdrDateDisplay {
          color: #e5e7eb;
        }
        .dark .dark-picker .rdrDayHovered .rdrDayNumber span {
          color: #60a5fa;
        }
        .dark .dark-picker .rdrDayDisabled {
          opacity: 0.3;
        }
      `}</style>
      <ToastContainer />

      <div className="mb-4 flex flex-wrap items-end gap-3 justify-between">
        <div className="flex-1 min-w-[200px] max-w-md">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Buscar</label>
          <input
            type="text"
            value={ruta}
            onChange={(e) => { setRuta(e.target.value); }}
            placeholder="Ruta..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="relative" ref={pickerRef}>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Rango</label>
            <input
              type="text"
              readOnly
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
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Estado</label>
            <select
              value={estado}
              onChange={(e) => { setEstado(e.target.value); }}
              className="mt-1 w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>{ESTADO_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Vendedor</label>
            <select
              value={vendedorSel}
              onChange={(e) => { setVendedorSel(e.target.value); }}
              className="mt-1 w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos</option>
              {vendedores.map((v) => (
                <option key={v.VENDEDOR} value={v.VENDEDOR}>{v.VENDEDOR} - {v.NOMBRE}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleFilter}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Filtrar
          </button>

          <button
            onClick={exportCSV}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Exportar
          </button>
        </div>
      </div>

      {useMemo(() => {
        const counts = { Pendiente: 0, Aprobado: 0, Rechazado: 0 };
        data.forEach((s) => { if (s.estado in counts) counts[s.estado as keyof typeof counts]++; });
        return (
          <div className="mb-4 grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: data.length, bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
              { label: 'Pendientes', value: counts.Pendiente, bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
              { label: 'Aprobados', value: counts.Aprobado, bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300' },
              { label: 'Rechazados', value: counts.Rechazado, bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300' },
            ].map(({ label, value, bg, text }) => (
              <div key={label} className={`rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 ${bg}`}>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${text}`}>{value}</p>
              </div>
            ))}
          </div>
        );
      }, [data])}

      {loading ? (
        <SkeletonTable columns={11} rows={10} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {['Codigo', 'Ruta', 'Cliente', 'Cod.Cliente', 'Monto', 'Fecha', 'Estado', 'Motivo', 'Saldo Actual', 'Limite Actual', 'Disponible Actual', 'Acciones'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-sm text-gray-400">
                      Sin resultados
                    </td>
                  </tr>
                ) : (
                  data.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-gray-900 dark:text-white">{s.codigo}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">{s.ruta}</td>
                      <td className="max-w-40 truncate px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400" title={s.cliente}>{s.cliente}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">{s.cod_cliente}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-900 dark:text-white">{formatMoney(s.monto)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">{formatDate(s.fecha)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COLORS[s.estado] ?? 'bg-gray-100 text-gray-700'}`}>
                          {s.estado}
                        </span>
                      </td>
                      <td className="max-w-32 truncate px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400" title={s.motivo ?? ''}>{s.motivo ?? '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">{formatMoney(s.saldo_actual)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">{formatMoney(s.limite_actual)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">{formatMoney(s.disponible_actual)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm">
                        <button
                          onClick={() => setRevisarSolicitud(s)}
                          className="rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600"
                        >
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Pagina {page} de {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) { p = i + 1; }
              else if (page <= 3) { p = i + 1; }
              else if (page >= totalPages - 2) { p = totalPages - 4 + i; }
              else { p = page - 2 + i; }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {revisarSolicitud && (
        <SolicitudModal
          solicitud={revisarSolicitud}
          onClose={() => setRevisarSolicitud(null)}
          onAprobar={async (id) => {
            const ok = await confirmAction(id, 'Aprobado');
            if (ok) setRevisarSolicitud(null);
          }}
          onRechazar={async (id) => {
            const ok = await confirmAction(id, 'Rechazado');
            if (ok) setRevisarSolicitud(null);
          }}
        />
      )}
    </div>
  );
}
