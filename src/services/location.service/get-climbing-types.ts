import db from "../../db/index.js";
import { getIconUrls } from "./get-icon-urls.js";
import { ClimbingType } from "./types.js";

export const getClimbingTypesForLocation = async ({ locationId }: { locationId: number }): Promise<ClimbingType[]> => {
  const dbClimbingTypes = await db.selectFrom('climbingTypes')
    .innerJoin('climbingTypesLocations', 'climbingTypesLocations.climbingTypeId', 'climbingTypes.id')
    .select(['climbingTypes.id', 'climbingTypes.name', 'climbingTypes.iconFileName'])
    .where('climbingTypesLocations.locationId', '=', locationId)
    .execute()
  const climbingTypes = dbClimbingTypes.map(({ id, name, iconFileName }) => {
    const { iconUrl } = getIconUrls('climbingType', id, iconFileName)
    return { id, name, url: iconUrl }
  })
  return climbingTypes
}

interface GetClimbingTypesResponse {
  [locationId: number]: ClimbingType[]
}
export const getClimbingTypes = async ({ locationIds }: { locationIds: number[] }): Promise<GetClimbingTypesResponse> => {
  if (locationIds.length === 0) {
    return {}
  }
  const dbClimbingTypes = await db.selectFrom('climbingTypes')
    .innerJoin('climbingTypesLocations', 'climbingTypesLocations.climbingTypeId', 'climbingTypes.id')
    .select(['climbingTypes.id', 'climbingTypes.name', 'climbingTypes.iconFileName', 'climbingTypesLocations.locationId'])
    .where('climbingTypesLocations.locationId', 'in', locationIds)
    .execute()

  const climbingTypes = dbClimbingTypes.map(({ id, name, iconFileName, locationId }) => {
    const { iconUrl } = getIconUrls('climbingType', id, iconFileName)
    return { id, name, url: iconUrl, locationId }
  })

  const climbingTypesByLocationId = climbingTypes.reduce((acc, climbingType) => {
    if (!acc[climbingType.locationId]) {
      acc[climbingType.locationId] = []
    }
    acc[climbingType.locationId].push(climbingType)
    return acc
  }, {} as GetClimbingTypesResponse)

  return climbingTypesByLocationId
}