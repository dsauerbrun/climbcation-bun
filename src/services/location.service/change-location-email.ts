import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { updateLocation } from "./record-ops.js"

interface Request {
  locationId: number
  email: string
}

export interface ChangeLocationEmailResponse extends ServiceResponseError {}

export const changeLocationEmail = async ({ locationId, email }: Request): Promise<ChangeLocationEmailResponse> => {
  try {
    await updateLocation(db, locationId, { submitterEmail: email })
    return {}
  } catch (err) {
    const error = err as Error
    console.error('Error changing location email', err)
    return { error: error.message }
  }
}
