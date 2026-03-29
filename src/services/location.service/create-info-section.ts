import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"

interface Request {
  locationId: number
  section: {
    title: string
    body: string
  }
}

export interface CreateInfoSectionResponse extends ServiceResponseError {
  id?: number
}

export const createInfoSection = async ({ locationId, section }: Request): Promise<CreateInfoSectionResponse> => {
  try {
    if (!section.title) {
      return { error: 'Section title is required' }
    }

    const newSection = await db.insertInto('infoSections')
      .values({ title: section.title, body: section.body, locationId: locationId })
      .returning('id')
      .executeTakeFirstOrThrow()

    return { id: Number(newSection.id) }
  } catch (err) {
    const error = err as Error
    console.error('Error creating info section', err)
    return { error: error.message }
  }
}
