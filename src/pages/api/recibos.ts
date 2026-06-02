import type { APIRoute } from 'astro';
import { query } from '../../lib/db';
import type { RowDataPacket } from 'mysql2/promise';
import * as XLSX from 'xlsx';

interface ReciboRow extends RowDataPacket {
  id: number;
  recibo: string;
  cod_cliente: string;
  name_cliente: string;
  fecha_recibo: string;
  ruta: string;
  order_total: string;
  order_list: string;
  comment: string;
  status: string;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user as { role: string } | undefined;
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const vendedor = url.searchParams.get('vendedor') || '';
  const fechaDesde = url.searchParams.get('fecha_desde') || '';
  const fechaHasta = url.searchParams.get('fecha_hasta') || '';
  const buscar = url.searchParams.get('buscar') || '';
  const exportCsv = url.searchParams.get('export') === 'csv';
  const limit = exportCsv ? 10000 : 20;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (fechaDesde) { conditions.push('DATE(fecha_recibo) >= ?'); params.push(fechaDesde); }
  if (fechaHasta) { conditions.push('DATE(fecha_recibo) <= ?'); params.push(fechaHasta); }
  if (vendedor) { conditions.push('ruta = ?'); params.push(vendedor); }
  if (buscar) { conditions.push('(recibo LIKE ? OR name_cliente LIKE ?)'); params.push(`%${buscar}%`, `%${buscar}%`); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  if (exportCsv) {
    const rows = await query<ReciboRow[]>(
      `SELECT id, recibo, cod_cliente, name_cliente, fecha_recibo, ruta, order_total, order_list
       FROM tbl_order_recibo ${where} ORDER BY fecha_recibo DESC LIMIT ?`,
      [...params, limit]
    );
    const data = rows.map((r) => ({
      'NUM. REC.': r.recibo,
      Cliente: r.cod_cliente,
      Nombre: r.name_cliente,
      Fecha: r.fecha_recibo,
      Vendedor: r.ruta,
      Total: Number(r.order_total),
      Detalles: r.order_list ?? '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Recibos');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=recibos.xlsx',
      },
    });
  }

  const countRows = await query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM tbl_order_recibo ${where}`, params);
  const total = Number(countRows[0].total);
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  const rows = await query<ReciboRow[]>(
    `SELECT id, recibo, cod_cliente, name_cliente, fecha_recibo, ruta, order_total, order_list
     FROM tbl_order_recibo ${where} ORDER BY fecha_recibo DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return new Response(
    JSON.stringify({
      data: rows.map((r) => ({ ...r, order_total: Number(r.order_total) })),
      page, totalPages, total,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
