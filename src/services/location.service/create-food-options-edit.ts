import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { notifyAdmin } from "../admin.service/notify-admin.js"

interface Request {
  locationId: number
  foodOptionDetails: unknown
  commonExpensesNotes: string
  savingMoneyTips: string
}

export interface CreateFoodOptionsEditResponse extends ServiceResponseError {}

export const createFoodOptionsEdit = async ({ locationId, foodOptionDetails, commonExpensesNotes, savingMoneyTips }: Request): Promise<CreateFoodOptionsEditResponse> => {
  try {
    await db.insertInto('locationEdits')
      .values({
        locationId,
        editType: 'food_options',
        edit: JSON.stringify({ foodOptionDetails, commonExpensesNotes, savingMoneyTips }),
      })
      .executeTakeFirstOrThrow()

    notifyAdmin({ editType: 'food_options', locationId })
    return {}
  } catch (err) {
    const error = err as Error
    console.error('Error creating food options edit', err)
    return { error: error.message }
  }
}
