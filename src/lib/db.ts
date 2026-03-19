import postgres from 'postgres'

let cachedDB: postgres.Sql | null = null;

export default function getDB() {
  if (cachedDB) return cachedDB;

  const db = postgres({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),
  });

  cachedDB = db;
  return cachedDB;
}