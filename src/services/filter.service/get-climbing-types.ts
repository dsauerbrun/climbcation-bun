import db from "../../db/index.js"
import { getIconUrls } from "../location.service/index.js"
import { ClimbingType } from "./types.js"

export interface GetClimbingTypesResponse {
  climbingTypes?: ClimbingType[]
  error?: string
}

export const getClimbingTypes = async (): Promise<GetClimbingTypesResponse> => {
  try {
    const dbClimbingTypes = await db.selectFrom('climbingTypes').selectAll('climbingTypes').execute()
    const climbingTypes = dbClimbingTypes.map(type => {
      const { name, iconFileName, id } = type
      const { iconUrl } = getIconUrls('climbingType', id, iconFileName)
      return { climbingType: name, url: iconUrl, id }
    })

    return { climbingTypes }
  } catch (err) {
    const error = err as Error
    console.error('Error fetching grades', err)
    return { error: error.message }
  }

}
