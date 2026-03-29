import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"

interface SubsectionDescription {
  desc: string
}

interface Subsection {
  title: string
  subsectionDescriptions: SubsectionDescription[]
}

interface Request {
  id: number
  section: {
    title: string
    body: string
    subsections: Record<string, Subsection>
  }
}

export interface UpdateInfoSectionResponse extends ServiceResponseError {}

export const updateInfoSection = async ({ id, section }: Request): Promise<UpdateInfoSectionResponse> => {
  try {
    const metadata: Record<string, { desc: string }[]> = {}
    for (const subsection of Object.values(section.subsections)) {
      if (subsection.title) {
        metadata[subsection.title] = subsection.subsectionDescriptions
          .filter(d => d.desc)
          .map(d => ({ desc: d.desc }))
      }
    }

    await db.updateTable('infoSections')
      .set({ title: section.title, body: section.body, metadata: JSON.stringify(metadata) })
      .where('id', '=', id)
      .executeTakeFirstOrThrow()

    return {}
  } catch (err) {
    const error = err as Error
    console.error('Error updating info section', err)
    return { error: error.message }
  }
}
