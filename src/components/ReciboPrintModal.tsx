import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Recibo {
  id: number;
  recibo: string;
  cod_cliente: string;
  name_cliente: string;
  fecha_recibo: string;
  ruta: string;
  order_total: string;
  order_list: string;
  status: string;
}

interface Props {
  recibos: Recibo[];
  rutaFiltro: string;
  vendedorFiltro: string;
  onClose: () => void;
}

function formatCurrency(value: number) {
  return 'C$ ' + new Intl.NumberFormat('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatDate(dateStr: string) {
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function parseItems(orderList: string): Record<string, string>[] {
  const parseLine = (line: string) => {
    const parts = line.replace(/^\[|\]$/g, '').split(';').map(s => s.replace(/^[\[\],\s]+|[\[\],\s]+$/g, ''));
    return {
      FACTURA: parts[0] ?? '',
      'VALOR FACTURA': parts[1] ?? '',
      'VALOR N/C': parts[2] ?? '',
      RETENCION: parts[3] ?? '',
      DESCUENTO: parts[4] ?? '',
      'VALOR RECIBIDO': parts[5] ?? '',
      SALDO: parts[6] ?? '',
      TIPO: ((parts[8] || parts[7]) ?? '').toUpperCase(),
    };
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

export default function ReciboPrintModal({ recibos: recibosRaw, rutaFiltro, vendedorFiltro, onClose }: Props) {
  const [nota, setNota] = useState('');
  const recibos = [...recibosRaw].sort((a, b) => b.recibo.localeCompare(a.recibo));

  const allItems: Record<string, string>[] = recibos.flatMap((r) => {
    const items: Record<string, string>[] = r.order_list ? parseItems(r.order_list) : [];
    return items.map((item) => ({ ...item }));
  });
  const granTotal = allItems.reduce((s, i) => s + (parseFloat(i['VALOR RECIBIDO']) || 0), 0);

  function renderCabecera(doc: jsPDF) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RECIBOS PAGADOS:', doc.internal.pageSize.getWidth() / 2, 16, { align: 'center' });

    const fechaStr = new Date().toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('EJECUTIVO:', 14, 26);
    doc.setFont('helvetica', 'normal');
    doc.text(vendedorFiltro || '—', 38, 26);

    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', doc.internal.pageSize.getWidth() - 50, 26, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(fechaStr, doc.internal.pageSize.getWidth() - 14, 26, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text('RUTA:', 14, 33);
    doc.setFont('helvetica', 'normal');
    doc.text(rutaFiltro || '—', 30, 33);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DETALLE DE RECIBOS DE PAGADOS', doc.internal.pageSize.getWidth() / 2, 44, { align: 'center' });
  }

  function generarPDF() {
    try {
      const doc = new jsPDF('p', 'mm', 'letter');
      const pageW = doc.internal.pageSize.getWidth();
      const darkHead: [number, number, number] = [211, 211, 211];
      const whiteText: [number, number, number] = [35, 3, 4];
      const blackHead: [number, number, number] = [211, 211, 211];
      let y = 52;

      renderCabecera(doc);
      let totalRecibidoGeneral = 0;
      let itemCount = 0;

      for (const r of recibos) {
        itemCount++;
        const items = r.order_list ? parseItems(r.order_list) : [];
        const valorRecibido = items.reduce((s, i) => s + (parseFloat(i['VALOR RECIBIDO']) || 0), 0);
        totalRecibidoGeneral += valorRecibido;

        if (y > 245) { doc.addPage(); y = 15; }

        // — Main recibo row (dark head, white body) —
          autoTable(doc, {
          startY: y,
          tableWidth: pageW - 20,
          margin: { left: 10 },
          head: [['Item', 'Fecha', 'No. de Recibo pago', { content: 'Nombre del cliente', colSpan: 2 }, 'Codigo', 'Total C$']],
          headStyles: { fillColor: darkHead, textColor: whiteText, fontStyle: 'bold', fontSize: 11, halign: 'center', cellPadding: 2.5 },
          body: [[
            { content: String(itemCount), styles: { halign: 'center', fontStyle: 'bold', fontSize: 11, cellPadding: 2.5 } },
            formatDate(r.fecha_recibo),
            r.recibo,
            { content: r.name_cliente, colSpan: 2, styles: { fontSize: 11, cellPadding: 2.5 } },
            r.cod_cliente.replace(/[-\s]+$/g, ''),
            r.order_total || '0.00',
          ]],
          bodyStyles: { fontSize: 11, cellPadding: 2.5 },
          columnStyles: {
            0: { cellWidth: 16, halign: 'center' },
            1: { cellWidth: 24, halign: 'center' },
            2: { cellWidth: 34, halign: 'center' },
            3: { cellWidth: 60 },
            4: { cellWidth: 7 },
            5: { cellWidth: 20, halign: 'center' },
            6: { cellWidth: 30, halign: 'right' },
          },
        });
        y = (doc as any).lastAutoTable.finalY + 2;

        // — Detail sub-table (black head, alternating rows) —
        if (items.length > 0) {
          if (y > 250) { doc.addPage(); y = 20; }

          const detailHead = ['FACTURA', 'VALOR FACTURA', 'VALOR N/C', 'RETENCION', 'DESCUENTO', 'VALOR RECIBIDO', 'SALDO', 'TIPO'];

          autoTable(doc, {
            startY: y,
            tableWidth: pageW - 20,
            margin: { left: 10 },
            head: [detailHead],
            headStyles: { fillColor: blackHead, textColor: whiteText, fontStyle: 'bold', fontSize: 8, halign: 'center', cellPadding: 2 },
            body: items.map((item) => detailHead.map((col, ci) => {
              if (ci === 0 || ci === 7) return item[col] || '';
              const num = parseFloat(item[col]);
              return isNaN(num) ? (item[col] || '') : `C$ ${formatCurrency(num)}`;
            })),
            bodyStyles: { fontSize: 8, cellPadding: 2 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: {
              0: { cellWidth: 25, halign: 'center' },
              1: { cellWidth: 30, halign: 'right' },
              2: { cellWidth: 22, halign: 'right' },
              3: { cellWidth: 22, halign: 'right' },
              4: { cellWidth: 22, halign: 'right' },
              5: { cellWidth: 30, halign: 'right' },
              6: { cellWidth: 27, halign: 'right' },
              7: { cellWidth: 18, halign: 'center' },
            },
          });
          y = (doc as any).lastAutoTable.finalY;

          // — Subtotal row for this recibo —
          autoTable(doc, {
            startY: y,
            tableWidth: pageW - 20,
            margin: { left: 10 },
            body: [['', '', '', '', '', { content: `C$ ${formatCurrency(valorRecibido)}`, styles: { fillColor: [211, 211, 211] } }, '', '']],
            bodyStyles: { fontSize: 11, cellPadding: 2.5, halign: 'right' },
            columnStyles: {
              0: { cellWidth: 25 },
              1: { cellWidth: 30 },
              2: { cellWidth: 22 },
              3: { cellWidth: 22 },
              4: { cellWidth: 22 },
              5: { cellWidth: 30 },
              6: { cellWidth: 27 },
              7: { cellWidth: 18 },
            },
          });
          y = (doc as any).lastAutoTable.finalY + 4;
        } else {
          y += 4;
        }
      }

      // — Footer —
      if (y > 225) { doc.addPage(); y = 20; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`TOTAL RECIBIDO C$ ${formatCurrency(totalRecibidoGeneral)}`, pageW - 14, y + 8, { align: 'right' });

      y += 18;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Notas:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(nota || '__________________________________', pageW - 28), 14, y + 5);

      y += 18;
      const firmaY = y + 16;
      doc.setFontSize(9);
      doc.text('_____________________________________', 30, firmaY);
      doc.text('_____________________________________', pageW - 30, firmaY, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text('Entregué Conforme:', 30, firmaY + 5);
      doc.text('Recibí Conforme', pageW - 30, firmaY + 5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text('Ejecutivo de Ventas', 30, firmaY + 10);
      doc.text('Cartera y Cobro', pageW - 30, firmaY + 10, { align: 'right' });

      doc.save('reporte-recibos.pdf');
    } catch (e) { alert('Error al generar PDF: ' + e); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 w-full max-w-5xl rounded-xl border border-zinc-200 dark:border-gray-600 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-xl font-medium text-zinc-900 dark:text-white">Resumen de recibos</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={generarPDF} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 14h12v8H6v-8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Imprimir
            </button>
            <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-zinc-100 dark:hover:bg-gray-700" aria-label="Cerrar">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-200 dark:border-gray-700 text-sm">
            <div className="flex gap-8">
              <div><p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">Ruta</p><p className="font-medium text-zinc-900 dark:text-white">{rutaFiltro || '—'}</p></div>
              <div><p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">Vendedor</p><p className="font-medium text-zinc-900 dark:text-white">{vendedorFiltro || '—'}</p></div>
              <div><p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">Fecha</p><p className="font-medium text-zinc-900 dark:text-white">{new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p></div>
            </div>
            <div className="text-right"><p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">Total General</p><p className="font-bold text-lg text-zinc-900 dark:text-white">{formatCurrency(granTotal)}</p></div>
          </div>

          <div className="space-y-3 mb-6">
            {recibos.length === 0 ? (
              <p className="text-center text-sm text-zinc-400 italic">Sin recibos para mostrar</p>
            ) : (
              recibos.map((r) => {
                const items = r.order_list ? parseItems(r.order_list) : [];
                return (
                  <div key={r.id} className={`border rounded-lg overflow-hidden ${r.status === '4' ? 'bg-red-100 dark:bg-red-900/40 border-zinc-200 dark:border-gray-700' : 'border-zinc-200 dark:border-gray-700'}`}>
                    <div className="bg-zinc-50 dark:bg-gray-700/50 px-4 py-2.5 border-b border-zinc-200 dark:border-gray-700">
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div><p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">Fecha</p><p className="font-medium text-zinc-900 dark:text-white">{formatDate(r.fecha_recibo)}</p></div>
                        <div><p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">No. Recibo</p><p className="font-medium text-zinc-900 dark:text-white">{r.recibo}</p></div>
                        <div><p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">Codigo</p><p className="font-medium text-zinc-900 dark:text-white">{r.cod_cliente.replace(/[-\s]+$/g, '')}</p></div>
                        <div><p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">Cliente</p><p className="font-medium text-zinc-900 dark:text-white break-words" title={r.name_cliente}>{r.name_cliente}</p></div>
                        <div><p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-0.5">Total C$</p><p className="font-medium text-zinc-900 dark:text-white">{r.order_total || '0.00'}</p></div>
                      </div>
                    </div>
                    {items.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead><tr className="bg-zinc-100 dark:bg-gray-700/30">
                            {['FACTURA', 'VALOR FACTURA', 'VALOR N/C', 'RETENCION', 'DESCUENTO', 'VALOR RECIBIDO', 'SALDO', 'TIPO'].map(h => {
                              const numericCols = ['VALOR FACTURA', 'VALOR N/C', 'RETENCION', 'DESCUENTO', 'VALOR RECIBIDO', 'SALDO'];
                              return (
                                <th key={h} className={`whitespace-nowrap px-3 py-1.5 font-semibold uppercase tracking-wider text-zinc-500 dark:text-gray-400${numericCols.includes(h) ? ' text-right' : ' text-left'}`}>{h}</th>
                              );
                            })}
                          </tr></thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-gray-800">
                            {items.map((item, i) => {
                              const numericCols = ['VALOR FACTURA', 'VALOR N/C', 'RETENCION', 'DESCUENTO', 'VALOR RECIBIDO', 'SALDO'];
                              return (
                                <tr key={i}>{['FACTURA', ...numericCols, 'TIPO'].map(col => (
                                  <td key={col} className={`whitespace-nowrap px-3 py-1.5 text-zinc-700 dark:text-gray-300${numericCols.includes(col) ? ' text-right' : ''}`}>
                                    {numericCols.includes(col) ? (item[col] ? formatCurrency(parseFloat(item[col])) : '—') : (item[col] || '—')}
                                  </td>
                                ))}</tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 dark:border-gray-700 space-y-3 shrink-0">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-zinc-600 dark:text-gray-300">Gran Total Recibido C$</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{formatCurrency(granTotal)}</span>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-zinc-400 mb-1 block font-medium">Nota</label>
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2}
              className="w-full rounded-lg border border-zinc-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-zinc-700 dark:text-gray-300 resize-none"
              placeholder="Escribe una nota..." />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="text-sm px-5 py-2 rounded-lg border border-zinc-200 dark:border-gray-600 text-zinc-600 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-gray-700">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
