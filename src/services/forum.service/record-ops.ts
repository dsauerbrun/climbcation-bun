import { Insertable, Updateable } from 'kysely'
import { DB } from 'kysely-codegen'
import { DbOrTrx, logVersion } from '../../lib/tracked-models.js'
import { insertRecord, updateRecord } from '../../lib/db-records.js'

export const insertPost = async (
  dbOrTrx: DbOrTrx,
  values: Insertable<DB['posts']>,
  whodunnit?: string | null,
) => {
  const result = await insertRecord(dbOrTrx, 'posts', values)
  await logVersion(dbOrTrx, 'Post', Number(result.id), 'create', whodunnit, null, result)
  return result
}

export const updatePost = async (
  dbOrTrx: DbOrTrx,
  postId: string,
  values: Updateable<DB['posts']>,
  whodunnit?: string | null,
) => {
  const old = await dbOrTrx.selectFrom('posts').selectAll().where('id', '=', postId).executeTakeFirst()
  await updateRecord(dbOrTrx, 'posts', postId, values)
  if (old) {
    await logVersion(dbOrTrx, 'Post', Number(old.id), 'update', whodunnit, old, values)
  }
}
