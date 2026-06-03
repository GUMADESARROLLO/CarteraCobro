import type { APIRoute } from 'astro';
import { query } from '../../lib/db';
import { getPresignedUrls } from '../../lib/s3';
import type { RowDataPacket } from 'mysql2/promise';

interface AdjuntoRow extends RowDataPacket {
  id: number;
  id_recibo: number;
  nombre_imagen: string;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user as { role: string } | undefined;
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL(request.url);
  const idRecibo = url.searchParams.get('id_recibo');
  if (!idRecibo) {
    return new Response(JSON.stringify({ error: 'Falta parametro id_recibo' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const rows = await query<AdjuntoRow[]>(
      'SELECT id, id_recibo, nombre_imagen FROM tbl_order_recibo_adjuntos WHERE id_recibo = ?',
      [idRecibo]
    );

    const filenames = rows.map((r) => r.nombre_imagen);
    const imagenes = filenames.length > 0 ? await getPresignedUrls(filenames) : [];

    return new Response(JSON.stringify({ imagenes }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Error al obtener imagenes:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg, imagenes: [] }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
