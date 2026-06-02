import type { APIRoute } from 'astro';
import { execute } from '../../../lib/db';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user as { role: string } | undefined;
  if (!user || user.role !== 'Admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = Number(params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID invalido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { estado, resolucion } = body as { estado?: string; resolucion?: string };

    if (!estado || !['Aprobado', 'Rechazado'].includes(estado)) {
      return new Response(JSON.stringify({ error: 'Estado invalido. Use Aprobado o Rechazado' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    await execute(
      'UPDATE solicitudes SET estado = ?, resolucion = ? WHERE id = ?',
      [estado, resolucion || null, id]
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Error al actualizar solicitud' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
