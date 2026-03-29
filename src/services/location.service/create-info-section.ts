import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { insertInfoSection } from "./record-ops.js"

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

    const newSection = await insertInfoSection(db, { title: section.title, body: section.body, locationId })
    return { id: newSection.id }
  } catch (err) {
    const error = err as Error
    console.error('Error creating info section', err)
    return { error: error.message }
  }
}
