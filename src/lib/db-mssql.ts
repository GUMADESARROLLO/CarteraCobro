import sql from 'mssql';
import './env';

let pool: sql.ConnectionPool | null = null;

export async function getMssqlPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect({
      server: process.env.DB_SQLSRV_HOST!,
      port: Number(process.env.DB_SQLSRV_PORT),
      database: process.env.DB_SQLSRV_DATABASE,
      user: process.env.DB_SQLSRV_USERNAME,
      password: process.env.DB_SQLSRV_PASSWORD,
      options: { encrypt: false, trustServerCertificate: true },
    } as sql.config);
  }
  return pool;
}
