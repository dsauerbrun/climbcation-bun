import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"

interface Request {
  locationId: number
  transportations: unknown
  bestTransportationCost: string
  bestTransportationId: number
  gettingInNotes: string
  walkingDistance: boolean
}

export interface CreateGettingInEditResponse extends ServiceResponseError {}

export const createGettingInEdit = async ({ locationId, transportations, bestTransportationCost, bestTransportationId, gettingInNotes, walkingDistance }: Request): Promise<CreateGettingInEditResponse> => {
  try {
    await db.insertInto('locationEdits')
      .values({
        locationId,
        editType: 'getting_in',
        edit: JSON.stringify({ transportations, bestTransportationCost, bestTransportationId, gettingInNotes, walkingDistance }),
      })
      .executeTakeFirstOrThrow()

    return {}
  } catch (err) {
    const error = err as Error
    console.error('Error creating getting in edit', err)
    return { error: error.message }
  }
}
