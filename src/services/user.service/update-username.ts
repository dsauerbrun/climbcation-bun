import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { updateRecord } from "../../lib/db-records.js"

export interface UpdateUsernameResponse extends ServiceResponseError {
}

export interface UpdateUsernameRequest {
  userId: string
  newUsername: string
}

export const updateUsername = async ({userId, newUsername}: UpdateUsernameRequest): Promise<UpdateUsernameResponse> => {
  try {
    await updateRecord(db, 'users', userId, { username: newUsername })

    return { }
  } catch (err) {
    const error = err as Error
    console.error('Error updating username', err)
    if (error.message.includes('duplicate key value violates unique constraint')) {
      return { error: 'Username already exists' }
    }
    return { error: error.message }
  }

}
