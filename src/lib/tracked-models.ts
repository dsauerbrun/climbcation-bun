import { Kysely, Transaction } from 'kysely'
import { DB } from 'kysely-codegen'

export type DbOrTrx = Kysely<DB> | Transaction<DB>

export const logVersion = async (
  dbOrTrx: DbOrTrx,
  itemType: string,
  itemId: number,
  event: 'create' | 'update' | 'destroy',
  whodunnit: string | null | undefined,
  object: unknown,
  objectChanges: unknown,
  locationId?: number | null,
): Promise<void> => {
  // versions is append-only and is never updated, so it has a createdAt and no
  // updatedAt. that keeps it outside insertRecord, which stamps both.
  const version = await dbOrTrx.insertInto('versions').values({
    itemType,
    itemId,
    event,
    whodunnit: whodunnit ?? null,
    object: object != null ? JSON.stringify(object) : null,
    objectChanges: objectChanges != null ? JSON.stringify(objectChanges) : null,
    createdAt: new Date(),
  }).returning('id').executeTakeFirstOrThrow()

  if (locationId != null) {
    await dbOrTrx.insertInto('versionAssociations').values({
      versionId: version.id,
      foreignKeyName: 'location_id',
      foreignKeyId: locationId,
    }).execute()
  }
}
