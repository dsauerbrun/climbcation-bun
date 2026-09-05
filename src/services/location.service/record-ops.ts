import { Insertable, Updateable } from 'kysely'
import { DB } from 'kysely-codegen'
import { DbOrTrx, logVersion } from '../../lib/tracked-models.js'
import { insertRecord, updateRecord } from '../../lib/db-records.js'

// ---- Location ----

export const insertLocation = async (
  dbOrTrx: DbOrTrx,
  values: Insertable<DB['locations']>,
  whodunnit?: string | null,
) => {
  const result = await insertRecord(dbOrTrx, 'locations', values)
  await logVersion(dbOrTrx, 'Location', result.id, 'create', whodunnit, null, result)
  return result
}

export const updateLocation = async (
  dbOrTrx: DbOrTrx,
  locationId: number,
  values: Updateable<DB['locations']>,
  whodunnit?: string | null,
) => {
  const old = await dbOrTrx.selectFrom('locations').selectAll().where('id', '=', locationId).executeTakeFirst()
  const result = await updateRecord(dbOrTrx, 'locations', locationId, values)
  if (old) {
    await logVersion(dbOrTrx, 'Location', locationId, 'update', whodunnit, old, values)
  }
  return result
}

// ---- InfoSection ----

export const insertInfoSection = async (
  dbOrTrx: DbOrTrx,
  values: Insertable<DB['infoSections']>,
  whodunnit?: string | null,
) => {
  const result = await dbOrTrx.insertInto('infoSections')
    .values(values)
    .returningAll()
    .executeTakeFirstOrThrow()
  await logVersion(dbOrTrx, 'InfoSection', result.id, 'create', whodunnit, null, result, result.locationId)
  return result
}

export const updateInfoSection = async (
  dbOrTrx: DbOrTrx,
  id: number,
  values: Updateable<DB['infoSections']>,
  whodunnit?: string | null,
) => {
  const old = await dbOrTrx.selectFrom('infoSections').selectAll().where('id', '=', id).executeTakeFirst()
  await dbOrTrx.updateTable('infoSections').set(values).where('id', '=', id).execute()
  if (old) {
    await logVersion(dbOrTrx, 'InfoSection', id, 'update', whodunnit, old, values, old.locationId)
  }
}

export const deleteInfoSection = async (
  dbOrTrx: DbOrTrx,
  id: number,
  whodunnit?: string | null,
) => {
  const old = await dbOrTrx.selectFrom('infoSections').selectAll().where('id', '=', id).executeTakeFirst()
  await dbOrTrx.deleteFrom('infoSections').where('id', '=', id).execute()
  if (old) {
    await logVersion(dbOrTrx, 'InfoSection', id, 'destroy', whodunnit, old, null, old.locationId)
  }
}

// ---- AccommodationLocationDetail ----

export const insertAccommodationLocationDetail = async (
  dbOrTrx: DbOrTrx,
  values: Insertable<DB['accommodationLocationDetails']>,
  whodunnit?: string | null,
) => {
  const result = await insertRecord(dbOrTrx, 'accommodationLocationDetails', values)
  await logVersion(dbOrTrx, 'AccommodationLocationDetail', result.id, 'create', whodunnit, null, result, result.locationId)
  return result
}

export const updateAccommodationLocationDetail = async (
  dbOrTrx: DbOrTrx,
  id: number,
  values: Updateable<DB['accommodationLocationDetails']>,
  whodunnit?: string | null,
) => {
  const old = await dbOrTrx.selectFrom('accommodationLocationDetails').selectAll().where('id', '=', id).executeTakeFirst()
  await updateRecord(dbOrTrx, 'accommodationLocationDetails', id, values)
  if (old) {
    await logVersion(dbOrTrx, 'AccommodationLocationDetail', id, 'update', whodunnit, old, values, old.locationId)
  }
}

export const deleteAccommodationLocationDetail = async (
  dbOrTrx: DbOrTrx,
  id: number,
  whodunnit?: string | null,
) => {
  const old = await dbOrTrx.selectFrom('accommodationLocationDetails').selectAll().where('id', '=', id).executeTakeFirst()
  await dbOrTrx.deleteFrom('accommodationLocationDetails').where('id', '=', id).execute()
  if (old) {
    await logVersion(dbOrTrx, 'AccommodationLocationDetail', id, 'destroy', whodunnit, old, null, old.locationId)
  }
}

// ---- FoodOptionLocationDetail ----

export const insertFoodOptionLocationDetail = async (
  dbOrTrx: DbOrTrx,
  values: Insertable<DB['foodOptionLocationDetails']>,
  whodunnit?: string | null,
) => {
  const result = await insertRecord(dbOrTrx, 'foodOptionLocationDetails', values)
  await logVersion(dbOrTrx, 'FoodOptionLocationDetail', result.id, 'create', whodunnit, null, result, result.locationId)
  return result
}

export const updateFoodOptionLocationDetail = async (
  dbOrTrx: DbOrTrx,
  id: number,
  values: Updateable<DB['foodOptionLocationDetails']>,
  whodunnit?: string | null,
) => {
  const old = await dbOrTrx.selectFrom('foodOptionLocationDetails').selectAll().where('id', '=', id).executeTakeFirst()
  await updateRecord(dbOrTrx, 'foodOptionLocationDetails', id, values)
  if (old) {
    await logVersion(dbOrTrx, 'FoodOptionLocationDetail', id, 'update', whodunnit, old, values, old.locationId)
  }
}

export const deleteFoodOptionLocationDetail = async (
  dbOrTrx: DbOrTrx,
  id: number,
  whodunnit?: string | null,
) => {
  const old = await dbOrTrx.selectFrom('foodOptionLocationDetails').selectAll().where('id', '=', id).executeTakeFirst()
  await dbOrTrx.deleteFrom('foodOptionLocationDetails').where('id', '=', id).execute()
  if (old) {
    await logVersion(dbOrTrx, 'FoodOptionLocationDetail', id, 'destroy', whodunnit, old, null, old.locationId)
  }
}

// ---- PrimaryTransportation ----

export const insertPrimaryTransportation = async (
  dbOrTrx: DbOrTrx,
  values: Insertable<DB['primaryTransportations']>,
  whodunnit?: string | null,
) => {
  const result = await insertRecord(dbOrTrx, 'primaryTransportations', values)
  await logVersion(dbOrTrx, 'PrimaryTransportation', result.id, 'create', whodunnit, null, result, result.locationId)
  return result
}

export const updatePrimaryTransportation = async (
  dbOrTrx: DbOrTrx,
  id: number,
  values: Updateable<DB['primaryTransportations']>,
  whodunnit?: string | null,
) => {
  const old = await dbOrTrx.selectFrom('primaryTransportations').selectAll().where('id', '=', id).executeTakeFirst()
  await updateRecord(dbOrTrx, 'primaryTransportations', id, values)
  if (old) {
    await logVersion(dbOrTrx, 'PrimaryTransportation', id, 'update', whodunnit, old, values, old.locationId)
  }
}
