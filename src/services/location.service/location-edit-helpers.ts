import { Transaction } from "kysely"
import { DB } from "kysely-codegen"
import {
  updateLocation,
  insertAccommodationLocationDetail,
  updateAccommodationLocationDetail,
  deleteAccommodationLocationDetail,
  insertFoodOptionLocationDetail,
  updateFoodOptionLocationDetail,
  deleteFoodOptionLocationDetail,
  insertPrimaryTransportation,
  updatePrimaryTransportation,
  updateInfoSection,
  deleteInfoSection,
} from "./record-ops.js"

export interface AccommodationDetail {
  id: number
  cost: string
}

export interface FoodOptionDetail {
  id: number
  cost: string
}

export interface AccommodationEdit {
  accommodations: AccommodationDetail[]
  accommodationNotes: string
  closestAccommodation: string
}

export interface FoodOptionsEdit {
  foodOptionDetails: FoodOptionDetail[]
  commonExpensesNotes: string
  savingMoneyTips: string
}

export interface GettingInEdit {
  transportations: number[]
  bestTransportationCost: string
  bestTransportationId: number
  gettingInNotes: string
  walkingDistance: boolean
}

export interface MiscEdit {
  id: number
  title: string
  body: string
}

export const applyAccommodationEdit = async (trx: Transaction<DB>, locationId: number, edit: AccommodationEdit, whodunnit?: string | null) => {
  const existing = await trx.selectFrom('accommodationLocationDetails')
    .select(['id', 'accommodationId', 'cost'])
    .where('locationId', '=', locationId)
    .execute()

  const newIds = edit.accommodations.map(a => a.id)

  const toDelete = existing.filter(e => !newIds.includes(e.accommodationId))
  for (const record of toDelete) {
    await deleteAccommodationLocationDetail(trx, record.id, whodunnit)
  }

  const toUpdate = existing.filter(e => newIds.includes(e.accommodationId))
  for (const record of toUpdate) {
    const newAccom = edit.accommodations.find(a => a.id === record.accommodationId)
    if (newAccom && newAccom.cost !== record.cost) {
      await updateAccommodationLocationDetail(trx, record.id, { cost: newAccom.cost }, whodunnit)
    }
  }

  const existingIds = existing.map(e => e.accommodationId)
  const toAdd = edit.accommodations.filter(a => !existingIds.includes(a.id))
  for (const newAccom of toAdd) {
    await insertAccommodationLocationDetail(trx, { locationId, accommodationId: newAccom.id, cost: newAccom.cost }, whodunnit)
  }

  await updateLocation(trx, locationId, { accommodationNotes: edit.accommodationNotes, closestAccommodation: edit.closestAccommodation }, whodunnit)
}

export const applyFoodOptionsEdit = async (trx: Transaction<DB>, locationId: number, edit: FoodOptionsEdit, whodunnit?: string | null) => {
  const existing = await trx.selectFrom('foodOptionLocationDetails')
    .select(['id', 'foodOptionId', 'cost'])
    .where('locationId', '=', locationId)
    .execute()

  const newIds = edit.foodOptionDetails.map(f => f.id)

  const toDelete = existing.filter(e => !newIds.includes(e.foodOptionId))
  for (const record of toDelete) {
    await deleteFoodOptionLocationDetail(trx, record.id, whodunnit)
  }

  const toUpdate = existing.filter(e => newIds.includes(e.foodOptionId))
  for (const record of toUpdate) {
    const newFood = edit.foodOptionDetails.find(f => f.id === record.foodOptionId)
    if (newFood && newFood.cost !== record.cost) {
      await updateFoodOptionLocationDetail(trx, record.id, { cost: newFood.cost }, whodunnit)
    }
  }

  const existingIds = existing.map(e => e.foodOptionId)
  const toAdd = edit.foodOptionDetails.filter(f => !existingIds.includes(f.id))
  for (const newFood of toAdd) {
    await insertFoodOptionLocationDetail(trx, { locationId, foodOptionId: newFood.id, cost: newFood.cost }, whodunnit)
  }

  await updateLocation(trx, locationId, { commonExpensesNotes: edit.commonExpensesNotes, savingMoneyTips: edit.savingMoneyTips }, whodunnit)
}

export const applyGettingInEdit = async (trx: Transaction<DB>, locationId: number, edit: GettingInEdit, whodunnit?: string | null) => {
  const existing = await trx.selectFrom('locationsTransportations')
    .select('transportationId')
    .where('locationId', '=', locationId)
    .execute()

  const existingIds = existing.map(e => e.transportationId)
  const newIds = edit.transportations

  const toDelete = existingIds.filter(id => !newIds.includes(id))
  for (const id of toDelete) {
    await trx.deleteFrom('locationsTransportations')
      .where('locationId', '=', locationId)
      .where('transportationId', '=', id)
      .execute()
  }

  const toAdd = newIds.filter(id => !existingIds.includes(id))
  for (const id of toAdd) {
    await trx.insertInto('locationsTransportations')
      .values({ locationId, transportationId: id })
      .execute()
  }

  if (edit.bestTransportationId != null) {
    const primaryTransport = await trx.selectFrom('primaryTransportations')
      .select(['id', 'transportationId'])
      .where('locationId', '=', locationId)
      .executeTakeFirst()

    if (primaryTransport) {
      await updatePrimaryTransportation(trx, primaryTransport.id, { transportationId: edit.bestTransportationId, cost: edit.bestTransportationCost ?? '-1' }, whodunnit)
    } else {
      await insertPrimaryTransportation(trx, { locationId, transportationId: edit.bestTransportationId, cost: edit.bestTransportationCost ?? '-1' }, whodunnit)
    }
  }

  await updateLocation(trx, locationId, { gettingInNotes: edit.gettingInNotes, walkingDistance: edit.walkingDistance }, whodunnit)
}

export const applyMiscEdit = async (trx: Transaction<DB>, edit: MiscEdit, whodunnit?: string | null) => {
  if (!edit.title && !edit.body) {
    await deleteInfoSection(trx, edit.id, whodunnit)
  } else {
    await updateInfoSection(trx, edit.id, { title: edit.title, body: edit.body }, whodunnit)
  }
}
