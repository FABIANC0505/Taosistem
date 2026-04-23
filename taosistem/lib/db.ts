import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query<T>(sql: string, values: any[] = []): Promise<T> {
  const [results] = await pool.execute(sql, values);
  return results as T;
}

export async function executeCount(sql: string, values: any[] = []): Promise<number> {
    const [results] = await pool.execute(sql, values);
    return (results as any)[0]?.count || 0;
}

export async function getDbConnection() {
  return await pool.getConnection();
}

export default pool;
