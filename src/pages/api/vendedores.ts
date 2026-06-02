import type { APIRoute } from 'astro';
import { getMssqlPool } from '../../lib/db-mssql';

export const GET: APIRoute = async () => {
  try {
    const pool = await getMssqlPool();
    const result = await pool.request().query('SELECT VENDEDOR, NOMBRE FROM PRODUCCION.dbo.vtVS2_Vendedor ORDER BY VENDEDOR');
    return new Response(JSON.stringify({ vendedores: result.recordset }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ vendedores: [] }), { status: 500 });
  }
};
