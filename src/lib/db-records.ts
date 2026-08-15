import { Insertable, Updateable } from 'kysely'
import { DB } from 'kysely-codegen'
import { DbOrTrx } from './tracked-models.js'

/**
 * Tables the generated schema says carry both timestamp columns.
 *
 * Derived from DB rather than hand-listed so `bun run codegen` keeps it honest:
 * add or drop a timestamp column and this set follows automatically. Calling the
 * helpers below on a table without the columns is a compile error rather than a
 * broken insert at runtime, which is what the join tables and infoSections need.
 */
export type TimestampedTable = {
  [K in keyof DB]: 'createdAt' extends keyof DB[K]
    ? ('updatedAt' extends keyof DB[K] ? K : never)
    : never
}[keyof DB]

/**
 * Insert a row, stamping createdAt/updatedAt. Rails set these automatically via
 * ActiveRecord; nothing carried that across, so every insert has to come through
 * here instead of calling insertInto directly.
 *
 * Caller values are spread last so a backfill can pass explicit timestamps.
 */
export const insertRecord = async <T extends TimestampedTable>(
  dbOrTrx: DbOrTrx,
  table: T,
  values: Insertable<DB[T]>,
) => {
  const now = new Date()
  // the generic table name defeats kysely's inference here; the cast is contained
  // to this line and the exported signature above stays fully typed.
  return await (dbOrTrx.insertInto(table) as any)
    .values({ createdAt: now, updatedAt: now, ...values })
    .returningAll()
    .executeTakeFirstOrThrow()
}

/**
 * Update a row by id, touching updatedAt the way ActiveRecord did on save.
 *
 * createdAt is omitted from the accepted values, so clobbering it on an update is
 * a compile error rather than something we have to remember not to do. Timestamps
 * are spread last here so updatedAt always wins.
 */
export const updateRecord = async <T extends TimestampedTable>(
  dbOrTrx: DbOrTrx,
  table: T,
  id: number | string,
  values: Omit<Updateable<DB[T]>, 'createdAt'>,
) => {
  return await (dbOrTrx.updateTable(table) as any)
    .set({ ...values, updatedAt: new Date() })
    .where('id', '=', id)
    .executeTakeFirst()
}
