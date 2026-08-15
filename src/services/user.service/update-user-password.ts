import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { getPasswordDetails } from "./utils.js"
import { updateRecord } from "../../lib/db-records.js"

export interface UpdateUserPasswordResponse extends ServiceResponseError {
}

export interface UpdateUserPasswordRequest {
  userId: string
  newUserPassword: string
}

export const updateUserPassword = async ({userId, newUserPassword}: UpdateUserPasswordRequest): Promise<UpdateUserPasswordResponse> => {
  try {

    const { error, salt, saltedPassword } = getPasswordDetails(newUserPassword)
    if (error) {
      return { error }
    }

    await updateRecord(db, 'users', userId, {
      password: saltedPassword,
      passwordSalt: salt,
      verifyToken: null,
    })

    return { }
  } catch (err) {
    const error = err as Error
    console.error('Error updating userPassword', err)
    if (error.message.includes('duplicate key value violates unique constraint')) {
      return { error: 'UserPassword already exists' }
    }
    return { error: error.message }
  }

}
