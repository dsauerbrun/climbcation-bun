import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { updateLocation } from "../location.service/record-ops.js"

interface Request {
  locationId: number
}

export interface ApproveLocationResponse extends ServiceResponseError {}

export const approveLocation = async ({ locationId }: Request): Promise<ApproveLocationResponse> => {
  try {
    const result = await updateLocation(db, locationId, { active: true })

    if (!result.numUpdatedRows) {
      return { error: 'Location not found' }
    }

    return {}
  } catch (err) {
    const error = err as Error
    console.error('Error approving location', err)
    return { error: error.message }
  }
}
