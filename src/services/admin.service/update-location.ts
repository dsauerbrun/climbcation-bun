import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"

interface Request {
  locationId: number
  fields: {
    name?: string
    slug?: string
    continent?: string
    country?: string
    airportCode?: string
    rating?: number
    soloFriendly?: boolean
    latitude?: number
    longitude?: number
  }
}

export interface UpdateLocationResponse extends ServiceResponseError {}

export const updateLocation = async ({ locationId, fields }: Request): Promise<UpdateLocationResponse> => {
  try {
    const result = await db.updateTable('locations')
      .set(fields)
      .where('id', '=', locationId)
      .executeTakeFirst()

    if (!result.numUpdatedRows) {
      return { error: 'Location not found' }
    }

    return {}
  } catch (err) {
    const error = err as Error
    console.error('Error updating location', err)
    return { error: error.message }
  }
}
