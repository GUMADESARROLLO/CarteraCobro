import crypto from 'node:crypto';
import { query, execute } from './db';
import type { RowDataPacket } from 'mysql2/promise';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Cartera';
}

interface SessionRow extends RowDataPacket {
  id: string;
  user_id: number;
  data: string;
  expires_at: string;
}

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function createSession(user: SessionUser): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL);

  await execute(
    `INSERT INTO sessions (id, user_id, data, expires_at)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), data = VALUES(data),
     expires_at = VALUES(expires_at)`,
    [token, user.id, JSON.stringify(user), expiresAt]
  );

  return token;
}

export async function validateSession(token: string): Promise<SessionUser | null> {
  const rows = await query<SessionRow[]>(
    `SELECT id, user_id, data, expires_at FROM sessions
     WHERE id = ? AND expires_at > NOW()`,
    [token]
  );

  if (rows.length === 0) return null;

  const session = rows[0];
  const user: SessionUser = typeof session.data === 'string'
    ? JSON.parse(session.data)
    : session.data;

  return user;
}

export async function destroySession(token: string): Promise<void> {
  await execute('DELETE FROM sessions WHERE id = ?', [token]);
}

export async function cleanupExpiredSessions(): Promise<void> {
  await execute('DELETE FROM sessions WHERE expires_at <= NOW()');
}
