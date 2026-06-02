import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'cartera_cobro',
});

async function seed() {
  const hash = await bcrypt.hash('admin123', 12);

  await pool.execute(
    `INSERT INTO users_cartera (name, email, password, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    ['Admin', 'admin@email.com', hash, 'Admin']
  );

  console.log('Admin creado: admin@email.com / admin123');
  await pool.end();
}

seed().catch(console.error);
