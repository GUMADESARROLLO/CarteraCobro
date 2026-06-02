import type { APIRoute } from 'astro';
import { query, execute } from '../../../lib/db';
import { hashPassword } from '../../../lib/auth';
import type { RowDataPacket } from 'mysql2/promise';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  created_at: string;
}

function requireAdmin(locals: App.Locals): Response | null {
  const user = locals.user as { role: string } | undefined;
  if (!user || user.role !== 'Admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

export const GET: APIRoute = async ({ params, locals }) => {
  const auth = requireAdmin(locals);
  if (auth) return auth;

  const id = Number(params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID invalido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = await query<UserRow[]>(
    'SELECT id, name, email, role, created_at FROM users_cartera WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(rows[0]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const auth = requireAdmin(locals);
  if (auth) return auth;

  const id = Number(params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID invalido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { name, email, password, role } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    const existing = await query<UserRow[]>(
      'SELECT id FROM users_cartera WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (name?.trim()) {
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (email?.trim()) {
      updates.push('email = ?');
      values.push(email.trim().toLowerCase());
    }

    if (role === 'Admin' || role === 'Cartera') {
      updates.push('role = ?');
      values.push(role);
    }

    if (password) {
      const hash = await hashPassword(password);
      updates.push('password = ?');
      values.push(hash);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay campos para actualizar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    values.push(id);
    await execute(
      `UPDATE users_cartera SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'errno' in err && (err as { errno: number }).errno === 1062) {
      return new Response(JSON.stringify({ error: 'El email ya esta registrado' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('Update user error:', err);
    return new Response(JSON.stringify({ error: 'Error al actualizar usuario' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const auth = requireAdmin(locals);
  if (auth) return auth;

  const id = Number(params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID invalido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const currentUser = locals.user as { id: number } | undefined;
  if (currentUser && currentUser.id === id) {
    return new Response(JSON.stringify({ error: 'No puedes eliminarte a ti mismo' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await execute('DELETE FROM users_cartera WHERE id = ?', [id]);

  if (result.affectedRows === 0) {
    return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
