import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { Transaction } from "kysely"
import { DB } from "kysely-codegen"

interface AccommodationDetail {
  id: number
  cost: string
}

interface FoodOptionDetail {
  id: number
  cost: string
}

interface AccommodationEdit {
  accommodations: AccommodationDetail[]
  accommodationNotes: string
  closestAccommodation: string
}

interface FoodOptionsEdit {
  foodOptionDetails: FoodOptionDetail[]
  commonExpensesNotes: string
  savingMoneyTips: string
}

interface GettingInEdit {
  transportations: number[]
  bestTransportationCost: string
  bestTransportationId: number
  gettingInNotes: string
  walkingDistance: boolean
}

interface MiscEdit {
  id: number
  title: string
  body: string
}

const applyAccommodationEdit = async (trx: Transaction<DB>, locationId: number, edit: AccommodationEdit) => {
  const existing = await trx.selectFrom('accommodationLocationDetails')
    .select(['id', 'accommodationId', 'cost'])
    .where('locationId', '=', locationId)
    .execute()

  const newIds = edit.accommodations.map(a => a.id)

  // delete removed
  const toDelete = existing.filter(e => !newIds.includes(e.accommodationId))
  for (const record of toDelete) {
    await trx.deleteFrom('accommodationLocationDetails').where('id', '=', record.id).execute()
  }

  // update changed costs
  const toUpdate = existing.filter(e => newIds.includes(e.accommodationId))
  for (const record of toUpdate) {
    const newAccom = edit.accommodations.find(a => a.id === record.accommodationId)
    if (newAccom && newAccom.cost !== record.cost) {
      await trx.updateTable('accommodationLocationDetails')
        .set({ cost: newAccom.cost })
        .where('id', '=', record.id)
        .execute()
    }
  }

  // add new
  const existingIds = existing.map(e => e.accommodationId)
  const toAdd = edit.accommodations.filter(a => !existingIds.includes(a.id))
  for (const newAccom of toAdd) {
    await trx.insertInto('accommodationLocationDetails')
      .values({ locationId, accommodationId: newAccom.id, cost: newAccom.cost })
      .execute()
  }

  await trx.updateTable('locations')
    .set({ accommodationNotes: edit.accommodationNotes, closestAccommodation: edit.closestAccommodation })
    .where('id', '=', locationId)
    .execute()
}

const applyFoodOptionsEdit = async (trx: Transaction<DB>, locationId: number, edit: FoodOptionsEdit) => {
  const existing = await trx.selectFrom('foodOptionLocationDetails')
    .select(['id', 'foodOptionId', 'cost'])
    .where('locationId', '=', locationId)
    .execute()

  const newIds = edit.foodOptionDetails.map(f => f.id)

  // delete removed
  const toDelete = existing.filter(e => !newIds.includes(e.foodOptionId))
  for (const record of toDelete) {
    await trx.deleteFrom('foodOptionLocationDetails').where('id', '=', record.id).execute()
  }

  // update changed costs
  const toUpdate = existing.filter(e => newIds.includes(e.foodOptionId))
  for (const record of toUpdate) {
    const newFood = edit.foodOptionDetails.find(f => f.id === record.foodOptionId)
    if (newFood && newFood.cost !== record.cost) {
      await trx.updateTable('foodOptionLocationDetails')
        .set({ cost: newFood.cost })
        .where('id', '=', record.id)
        .execute()
    }
  }

  // add new
  const existingIds = existing.map(e => e.foodOptionId)
  const toAdd = edit.foodOptionDetails.filter(f => !existingIds.includes(f.id))
  for (const newFood of toAdd) {
    await trx.insertInto('foodOptionLocationDetails')
      .values({ locationId, foodOptionId: newFood.id, cost: newFood.cost })
      .execute()
  }

  await trx.updateTable('locations')
    .set({ commonExpensesNotes: edit.commonExpensesNotes, savingMoneyTips: edit.savingMoneyTips })
    .where('id', '=', locationId)
    .execute()
}

const applyGettingInEdit = async (trx: Transaction<DB>, locationId: number, edit: GettingInEdit) => {
  const existing = await trx.selectFrom('locationsTransportations')
    .select('transportationId')
    .where('locationId', '=', locationId)
    .execute()

  const existingIds = existing.map(e => e.transportationId)
  const newIds = edit.transportations

  // delete removed
  const toDelete = existingIds.filter(id => !newIds.includes(id))
  for (const id of toDelete) {
    await trx.deleteFrom('locationsTransportations')
      .where('locationId', '=', locationId)
      .where('transportationId', '=', id)
      .execute()
  }

  // add new
  const toAdd = newIds.filter(id => !existingIds.includes(id))
  for (const id of toAdd) {
    await trx.insertInto('locationsTransportations')
      .values({ locationId, transportationId: id })
      .execute()
  }

  // upsert primary transportation
  if (edit.bestTransportationId != null) {
    const primaryTransport = await trx.selectFrom('primaryTransportations')
      .select(['id', 'transportationId'])
      .where('locationId', '=', locationId)
      .executeTakeFirst()

    if (primaryTransport) {
      await trx.updateTable('primaryTransportations')
        .set({ transportationId: edit.bestTransportationId, cost: edit.bestTransportationCost ?? '-1' })
        .where('id', '=', primaryTransport.id)
        .execute()
    } else {
      await trx.insertInto('primaryTransportations')
        .values({ locationId, transportationId: edit.bestTransportationId, cost: edit.bestTransportationCost ?? '-1' })
        .execute()
    }
  }

  await trx.updateTable('locations')
    .set({ gettingInNotes: edit.gettingInNotes, walkingDistance: edit.walkingDistance })
    .where('id', '=', locationId)
    .execute()
}

const applyMiscEdit = async (trx: Transaction<DB>, edit: MiscEdit) => {
  if (!edit.title && !edit.body) {
    await trx.deleteFrom('infoSections').where('id', '=', edit.id).execute()
  } else {
    await trx.updateTable('infoSections')
      .set({ title: edit.title, body: edit.body })
      .where('id', '=', edit.id)
      .execute()
  }
}

interface Request {
  locationId: number
  editId: number
  password: string
}

export interface ApproveLocationEditResponse extends ServiceResponseError {}

export const approveLocationEdit = async ({ locationId, editId, password }: Request): Promise<ApproveLocationEditResponse> => {
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: 'Unauthorized' }
  }

  try {
    const locationEdit = await db.selectFrom('locationEdits')
      .selectAll()
      .where('id', '=', editId)
      .where('locationId', '=', locationId)
      .executeTakeFirst()

    if (!locationEdit) {
      return { error: 'Edit not found' }
    }

    if (locationEdit.approved) {
      return {}
    }

    await db.transaction().execute(async (trx) => {
      const edit = locationEdit.edit as Record<string, any>

      if (locationEdit.editType === 'accommodation') {
        await applyAccommodationEdit(trx, locationId, edit as AccommodationEdit)
      } else if (locationEdit.editType === 'food_options') {
        await applyFoodOptionsEdit(trx, locationId, edit as FoodOptionsEdit)
      } else if (locationEdit.editType === 'getting_in') {
        await applyGettingInEdit(trx, locationId, edit as GettingInEdit)
      } else if (locationEdit.editType === 'misc') {
        await applyMiscEdit(trx, edit as MiscEdit)
      }

      await trx.updateTable('locationEdits')
        .set({ approved: true })
        .where('id', '=', editId)
        .execute()
    })

    return {}
  } catch (err) {
    const error = err as Error
    console.error('Error approving location edit', err)
    return { error: error.message }
  }
}
