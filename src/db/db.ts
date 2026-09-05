import { Kysely, PostgresDialect, CamelCasePlugin, DeduplicateJoinsPlugin } from 'kysely';
import { DB } from 'kysely-codegen';
import pg from 'pg';

const { Pool } = pg;

export const connPool = new Pool({
  connectionString: process.env.DATABASE_URL,
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