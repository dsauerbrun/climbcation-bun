import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { notifyAdmin } from "../admin.service/notify-admin.js"
import { insertRecord } from "../../lib/db-records.js"

interface Request {
  locationId: number
  foodOptionDetails: unknown
  commonExpensesNotes: string
  savingMoneyTips: string
  userId?: string
}

export interface CreateFoodOptionsEditResponse extends ServiceResponseError {}

export const createFoodOptionsEdit = async ({ locationId, foodOptionDetails, commonExpensesNotes, savingMoneyTips, userId }: Request): Promise<CreateFoodOptionsEditResponse> => {
  try {
    await insertRecord(db, 'locationEdits', {
      locationId,
      editType: 'food_options',
      edit: JSON.stringify({ foodOptionDetails, commonExpensesNotes, savingMoneyTips }),
      userId,
    })

    notifyAdmin({ editType: 'food_options', locationId })
    return {}
  } catch (err) {
    const error = err as Error
    console.error('Error creating food options edit', err)
    return { error: error.message }
  }
}
