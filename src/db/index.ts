import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

export const isDatabaseConfigured = Boolean(process.env.SQL_HOST && process.env.SQL_DB_NAME);

// Function to create or retrieve the connection pool using the Object Method.
export const createPool = (): Pool => {
  if (!isDatabaseConfigured) {
    return new Proxy({} as Pool, {
      get: () => () => ({ rows: [] }),
    });
  }
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
export const pool = createPool();

// Initialize Drizzle with the pool and schema if configured.
let dbInstance: any;
if (isDatabaseConfigured) {
  try {
    dbInstance = drizzle(pool, { schema });
  } catch (err) {
    console.warn('[AI Studio] Cloud SQL connection error, using mock:', err);
  }
}

if (!dbInstance) {
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({})
  };
  dbInstance = new Proxy({}, {
    get: (_, prop) => prop === 'query'
      ? new Proxy({}, { get: () => noOp })
      : () => ({
          from: () => ({
            orderBy: () => Promise.resolve([]),
            limit: () => Promise.resolve([]),
            where: () => Promise.resolve([]),
            then: (resolve: any) => Promise.resolve([]).then(resolve)
          }),
          values: () => ({
            returning: () => Promise.resolve([{ id: 1 }]),
            onConflictDoNothing: () => Promise.resolve([])
          }),
          set: () => ({
            where: () => ({
              returning: () => Promise.resolve([{ id: 1 }])
            })
          }),
          where: () => Promise.resolve([]),
          execute: () => Promise.resolve([])
        })
  });
}

export const db = dbInstance;

