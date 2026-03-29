import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { applyAccommodationEdit, applyFoodOptionsEdit, applyGettingInEdit, applyMiscEdit, AccommodationEdit, FoodOptionsEdit, GettingInEdit, MiscEdit } from "./location-edit-helpers.js"

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
