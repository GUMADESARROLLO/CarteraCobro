import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: import.meta.env.DB_HOST,
      port: Number(import.meta.env.DB_PORT),
      user: import.meta.env.DB_USER,
      password: import.meta.env.DB_PASSWORD,
      database: import.meta.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

export async function query<T extends mysql.RowDataPacket[]>(
  sql: string,
  params?: unknown[]
): Promise<T> {
  const p = getPool();
  const [rows] = await p.query<T>(sql, params);
  return rows;
}

export async function execute(
  sql: string,
  params?: unknown[]
): Promise<mysql.ResultSetHeader> {
  const p = getPool();
  const [result] = await p.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

export async function initDatabase(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS \`sessions\` (
      \`id\` varchar(64) NOT NULL,
      \`user_id\` int(11) NOT NULL,
      \`data\` json NULL,
      \`expires_at\` datetime NOT NULL,
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      INDEX \`idx_user_id\` (\`user_id\`),
      INDEX \`idx_expires_at\` (\`expires_at\`)
    ) ENGINE=InnoDB
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS \`users_cartera\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`name\` varchar(100) NOT NULL,
      \`email\` varchar(150) NOT NULL UNIQUE,
      \`password\` varchar(255) NOT NULL,
      \`role\` enum('Admin','Cartera') NOT NULL DEFAULT 'Cartera',
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB
  `);
}
