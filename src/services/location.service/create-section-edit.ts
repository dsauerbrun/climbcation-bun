import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"

interface Request {
  locationId: number
  sectionId: number
  section: Record<string, unknown>
  userId: string
}

export interface CreateSectionEditResponse extends ServiceResponseError {}

export const createSectionEdit = async ({ locationId, sectionId, section, userId }: Request): Promise<CreateSectionEditResponse> => {
  try {
    await db.insertInto('locationEdits')
      .values({
        locationId,
        editType: 'misc',
        edit: JSON.stringify({ ...section, id: sectionId }),
        userId,
      })
      .executeTakeFirstOrThrow()

    return {}
  } catch (err) {
    const error = err as Error
    console.error('Error creating section edit', err)
    return { error: error.message }
  }
}
