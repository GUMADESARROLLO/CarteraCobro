import bcrypt from 'bcryptjs';
import { query } from './db';
import type { RowDataPacket } from 'mysql2/promise';
import type { SessionUser } from './session';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'Cartera';
  created_at: string;
}

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function loginUser(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const rows = await query<UserRow[]>(
    'SELECT id, name, email, password, role FROM users_cartera WHERE email = ?',
    [email]
  );

  if (rows.length === 0) return null;

  const user = rows[0];
  const valid = await verifyPassword(password, user.password);
  if (!valid) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function getUserById(id: number): Promise<SessionUser | null> {
  const rows = await query<UserRow[]>(
    'SELECT id, name, email, role FROM users_cartera WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;

  return {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
    role: rows[0].role,
  };
}
