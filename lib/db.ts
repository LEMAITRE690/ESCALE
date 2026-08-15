import { Pool } from "pg";

// Un seul pool de connexions réutilisé sur tous les appels
// (évite d'ouvrir une nouvelle connexion à chaque requête serverless)
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}

// Petit helper pour exécuter une requête avec typage générique
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows;
}
