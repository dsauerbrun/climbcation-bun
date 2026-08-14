import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { notifyAdmin } from "../admin.service/notify-admin.js"

interface Request {
  locationId: number
  accommodations: unknown
  accommodationNotes: string
  closestAccommodation: string
  userId?: string
}

export interface CreateAccommodationEditResponse extends ServiceResponseError {}

export const createAccommodationEdit = async ({ locationId, accommodations, accommodationNotes, closestAccommodation, userId }: Request): Promise<CreateAccommodationEditResponse> => {
  try {
    await db.insertInto('locationEdits')
      .values({
        locationId,
        editType: 'accommodation',
        edit: JSON.stringify({ accommodations, accommodationNotes, closestAccommodation }),
        userId,
      })
      .executeTakeFirstOrThrow()

    notifyAdmin({ editType: 'accommodation', locationId })
    return {}
  } catch (err) {
    const error = err as Error
    console.error('Error creating accommodation edit', err)
    return { error: error.message }
  }
}
