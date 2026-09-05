import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import bcrypt from 'bcrypt'
import { generateVerificationToken } from "./generate-verification-token.js";
import { getPasswordDetails } from "./utils.js";
import { insertRecord } from "../../lib/db-records.js";

export interface CreateUserResponse extends ServiceResponseError {
  userId?: string;
}

export interface CreateUserRequest {
  email: string,
  username: string,
  password: string,
  provider?: string,
  uid?: string,
  verified?: boolean,
  refreshToken?: string,
  googleToken?: string
}

export const createUser = async ({email, username, password, provider, uid, verified, refreshToken, googleToken}: CreateUserRequest): Promise<CreateUserResponse> => {
  try {

    const { error, salt, saltedPassword } = getPasswordDetails(password)
    if (error) {
      return { error }
    }

    const newUser = await insertRecord(db, 'users', {
      email,
      username,
      password: saltedPassword,
      passwordSalt: salt,
      provider: provider || 'self',
      uid: uid || null,
      verified,
      googleToken: googleToken || null,
      googleRefreshToken: refreshToken || null,
    })
    
    await generateVerificationToken({ userId: newUser.id })

    return { userId: newUser.id }
  } catch (err) {
    const error = err as Error
    console.error('Error creating user', err)
    return { error: error.message }
  }

}
