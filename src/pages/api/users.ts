import type { APIRoute } from 'astro';
import { query, execute } from '../../lib/db';
import { hashPassword } from '../../lib/auth';
import type { RowDataPacket } from 'mysql2/promise';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user as { role: string } | undefined;

  if (!user || user.role !== 'Admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = await query<UserRow[]>(
    'SELECT id, name, email, role, created_at FROM users_cartera ORDER BY id DESC'
  );

  return new Response(JSON.stringify({ users: rows }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user as { role: string } | undefined;

  if (!user || user.role !== 'Admin') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 403,
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

    if (!name?.trim() || !email?.trim() || !password) {
      return new Response(JSON.stringify({ error: 'Campos requeridos: name, email, password' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validRole = role === 'Admin' ? 'Admin' : 'Cartera';
    const hash = await hashPassword(password);

    const result = await execute(
      'INSERT INTO users_cartera (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hash, validRole]
    );

    return new Response(
      JSON.stringify({
        id: result.insertId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: validRole,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'errno' in err && (err as { errno: number }).errno === 1062) {
      return new Response(JSON.stringify({ error: 'El email ya esta registrado' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('Create user error:', err);
    return new Response(JSON.stringify({ error: 'Error al crear usuario' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
