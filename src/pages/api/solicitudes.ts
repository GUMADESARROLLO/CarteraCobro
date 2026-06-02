import type { APIRoute } from 'astro';
import { query } from '../../lib/db';
import type { RowDataPacket } from 'mysql2/promise';
import * as XLSX from 'xlsx';

interface SolicitudRow extends RowDataPacket {
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

const ALLOWED_ESTADOS = ['Pendiente', 'Aprobado', 'Rechazado'];

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user as { role: string } | undefined;

  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const estado = url.searchParams.get('estado') || '';
  const ruta = url.searchParams.get('ruta') || '';
  const fechaDesde = url.searchParams.get('fecha_desde') || '';
  const fechaHasta = url.searchParams.get('fecha_hasta') || '';
  const exportCsv = url.searchParams.get('export') === 'csv';
  const limit = exportCsv ? 10000 : 20;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (estado && ALLOWED_ESTADOS.includes(estado)) {
    conditions.push('estado = ?');
    params.push(estado);
  }

  if (ruta) {
    conditions.push('ruta LIKE ?');
    params.push(`%${ruta}%`);
  }

  if (fechaDesde) {
    conditions.push('DATE(fecha) >= ?');
    params.push(fechaDesde);
  }

  if (fechaHasta) {
    conditions.push('DATE(fecha) <= ?');
    params.push(fechaHasta);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  if (exportCsv) {
    const rows = await query<SolicitudRow[]>(
      `SELECT id, codigo, ruta, cliente, cod_cliente, monto, fecha, estado, motivo, resolucion,
              saldo_actual, limite_actual, disponible_actual
       FROM solicitudes ${where} ORDER BY fecha DESC LIMIT ?`,
      [...params, limit]
    );

    const data = rows.map((r) => ({
      Codigo: r.codigo,
      Ruta: r.ruta,
      Cliente: r.cliente,
      'Cod.Cliente': r.cod_cliente,
      Monto: Number(r.monto),
      Fecha: r.fecha,
      Estado: r.estado,
      Motivo: r.motivo ?? '',
      Resolucion: r.resolucion ?? '',
      'Saldo Actual': Number(r.saldo_actual),
      'Limite Actual': Number(r.limite_actual),
      'Disponible Actual': Number(r.disponible_actual),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=solicitudes.xlsx',
      },
    });
  }

  const countRows = await query<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM solicitudes ${where}`,
    params
  );
  const total = Number(countRows[0].total);

  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  const rows = await query<SolicitudRow[]>(
    `SELECT id, codigo, ruta, cliente, cod_cliente, monto, fecha, estado, motivo, resolucion,
            saldo_actual, limite_actual, disponible_actual
     FROM solicitudes ${where} ORDER BY fecha DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return new Response(
    JSON.stringify({
      data: rows.map((r) => ({
        ...r,
        monto: Number(r.monto),
        saldo_actual: Number(r.saldo_actual ?? 0),
        limite_actual: Number(r.limite_actual ?? 0),
        disponible_actual: Number(r.disponible_actual ?? 0),
      })),
      page,
      totalPages,
      total,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
