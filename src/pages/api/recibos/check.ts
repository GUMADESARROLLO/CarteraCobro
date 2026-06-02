import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import type { RowDataPacket } from 'mysql2/promise';

export const GET: APIRoute = async () => {
  try {
    const rows = await query<RowDataPacket[]>('SELECT MAX(id) as max_id, COUNT(*) as total FROM tbl_order_recibo');
    return new Response(JSON.stringify({
      maxId: Number(rows[0]?.max_id ?? 0),
      total: Number(rows[0]?.total ?? 0),
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ maxId: 0, total: 0 }), { status: 500 });
  }
};
