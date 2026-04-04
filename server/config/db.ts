import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

import { types } from 'pg';
const { Pool } = pg;

// Force TIMESTAMP (1114) and TIMESTAMPTZ (1184) to be treated as UTC
types.setTypeParser(1114, (str) => str + 'Z');
types.setTypeParser(1184, (str) => str); 

let pool: pg.Pool | null = null;

const connectDB = async () => {
  if (pool) return pool;

  try {
    // For Vercel/Supabase, we use the connection string (DATABASE_URL)
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    const client = await pool.connect();
    console.log('Connected to the Supabase PostgreSQL database.');
    client.release();

    return pool;
  } catch (error) {
    console.error('Error connecting to Supabase database:', error);
    // Don't exit process in production/Vercel, just log it
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    return null;
  }
};

// Wrapper to mimic the previous SQLite/MySQL API for minimal changes in controllers
export const getDB = async () => {
  if (!pool) {
    await connectDB();
  }

  const convertParams = (sql: string) => {
    // Postgres uses $1, $2 instead of ?
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  };

  const cleanParams = (params: any[]) => {
    return params.map(p => p === undefined ? null : p);
  };

  return {
    get: async (sql: string, params: any[] = []) => {
      const pgSql = convertParams(sql);
      const safeParams = cleanParams(params);
      try {
        if (process.env.NODE_ENV !== 'production') {
           console.log('DB QUERY (get):', pgSql, 'PARAMS:', safeParams);
        }
        const res = await pool!.query(pgSql, safeParams);
        return res.rows[0];
      } catch (err: any) {
        console.error('Database Error (get):', err.message, 'SQL:', pgSql, 'PARAMS:', safeParams);
        throw err;
      }
    },
    all: async (sql: string, params: any[] = []) => {
      const pgSql = convertParams(sql);
      const safeParams = cleanParams(params);
      try {
        const res = await pool!.query(pgSql, safeParams);
        return res.rows;
      } catch (err: any) {
        console.error('Database Error (all):', err.message, 'SQL:', pgSql);
        throw err;
      }
    },
    run: async (sql: string, params: any[] = []) => {
      let pgSql = sql;
      
      // If it's an INSERT and doesn't have RETURNING, we add it to get the ID
      if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
         pgSql += ' RETURNING id';
      } else if (pgSql.trim().toUpperCase().startsWith('UPDATE') && !pgSql.toUpperCase().includes('RETURNING')) {
         // Also add RETURNING id for updates just in case
         pgSql += ' RETURNING id';
      }

      const finalSql = convertParams(pgSql);
      const safeParams = cleanParams(params);
      try {
        const res = await pool!.query(finalSql, safeParams);
        
        return {
          lastID: res.rows[0]?.id,
          changes: res.rowCount
        };
      } catch (err: any) {
        console.error('Database Error (run):', err.message, 'SQL:', finalSql);
        throw err;
      }
    },
    exec: async (sql: string) => {
      try {
        await pool!.query(sql);
      } catch (err: any) {
        console.error('Database Error (exec):', err.message, 'SQL:', sql);
        throw err;
      }
    }
  };
};

export default connectDB;
