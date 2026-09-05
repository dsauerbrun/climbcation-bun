import { Kysely, PostgresDialect, CamelCasePlugin, DeduplicateJoinsPlugin } from 'kysely';
import { DB } from 'kysely-codegen';
import pg from 'pg';

const { Pool } = pg;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

const sslConfig = () => {
  if (!process.env.DATABASE_URL) return false

  const { hostname } = new URL(process.env.DATABASE_URL)
  return LOCAL_HOSTS.has(hostname) ? false : { rejectUnauthorized: false }
}

export const connPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig(),
})

const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: connPool
  }),
  plugins: [
    new CamelCasePlugin(),
    new DeduplicateJoinsPlugin(),
  ],
});

export default db