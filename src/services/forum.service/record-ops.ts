import { Insertable, Updateable } from 'kysely'
import { DB } from 'kysely-codegen'
import { DbOrTrx, logVersion } from '../../lib/tracked-models.js'

export const insertPost = async (
  dbOrTrx: DbOrTrx,
  values: Insertable<DB['posts']>,
  whodunnit?: string | null,
) => {
  const result = await dbOrTrx.insertInto('posts')
    .values(values)
    .returningAll()
    .executeTakeFirstOrThrow()
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
  await dbOrTrx.updateTable('posts').set(values).where('id', '=', postId).executeTakeFirstOrThrow()
  if (old) {
    await logVersion(dbOrTrx, 'Post', Number(old.id), 'update', whodunnit, old, values)
  }
}
