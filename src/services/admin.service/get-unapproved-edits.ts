import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"

export interface UnapprovedEdit {
  id: number
  locationId: number
  locationName: string
  editType: string
  edit: unknown
  createdAt: Date
}

export interface GetUnapprovedEditsResponse extends ServiceResponseError {
  edits?: UnapprovedEdit[]
}

export const getUnapprovedEdits = async (): Promise<GetUnapprovedEditsResponse> => {
  try {
    const rows = await db.selectFrom('locationEdits')
      .innerJoin('locations', 'locations.id', 'locationEdits.locationId')
      .select([
        'locationEdits.id',
        'locationEdits.locationId',
        'locationEdits.editType',
        'locationEdits.edit',
        'locationEdits.createdAt',
        'locations.name as locationName',
      ])
      .where('locationEdits.approved', 'is', false)
      .orderBy('locationEdits.createdAt', 'asc')
      .execute()

    const edits: UnapprovedEdit[] = rows.map(row => ({
      id: row.id,
      locationId: row.locationId,
      locationName: row.locationName,
      editType: row.editType,
      edit: row.edit,
      createdAt: row.createdAt,
    }))

    return { edits }
  } catch (err) {
    const error = err as Error
    console.error('Error fetching unapproved edits', err)
    return { error: error.message }
  }
}
