import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

export async function getMssqlPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect({
      server: import.meta.env.DB_SQLSRV_HOST || process.env.DB_SQLSRV_HOST,
      port: Number(import.meta.env.DB_SQLSRV_PORT || process.env.DB_SQLSRV_PORT),
      database: import.meta.env.DB_SQLSRV_DATABASE || process.env.DB_SQLSRV_DATABASE,
      user: import.meta.env.DB_SQLSRV_USERNAME || process.env.DB_SQLSRV_USERNAME,
      password: import.meta.env.DB_SQLSRV_PASSWORD || process.env.DB_SQLSRV_PASSWORD,
      options: { encrypt: false, trustServerCertificate: true },
    });
  }
  return pool;
}
