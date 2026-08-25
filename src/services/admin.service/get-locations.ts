import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"

export interface AdminLocation {
  id: number
  name: string | null
  slug: string | null
  country: string | null
  continent: string | null
  active: boolean | null
  rating: number | null
  soloFriendly: boolean | null
  submitterEmail: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

interface Request {
  active?: boolean
}

export interface GetLocationsResponse extends ServiceResponseError {
  locations?: AdminLocation[]
}

export const getLocations = async ({ active }: Request): Promise<GetLocationsResponse> => {
  try {
    let query = db.selectFrom('locations')
      .select([
        'id',
        'name',
        'slug',
        'country',
        'continent',
        'active',
        'rating',
        'soloFriendly',
        'submitterEmail',
        'createdAt',
        'updatedAt',
      ])

    if (active === true) {
      query = query.where('active', 'is', true)
    } else if (active === false) {
      // active is nullable in the schema, so `is not true` catches false and null
      // alike. anything that is not live is pending as far as an admin cares.
      query = query.where('active', 'is not', true)
    }

    const locations = await query.orderBy('createdAt', 'asc').execute()

    return { locations }
  } catch (err) {
    const error = err as Error
    console.error('Error fetching locations', err)
    return { error: error.message }
  }
}
