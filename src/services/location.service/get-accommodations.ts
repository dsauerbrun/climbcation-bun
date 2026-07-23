import db from "../../db/index.js";
import { getIconUrls } from "./get-icon-urls.js";
import { Accommodation } from "./types.js";

interface GetAccommodationsArgs {
  locationId: number;
}
interface GetAccommodationsResponse {
  accommodations: Accommodation[]
}

export const getAccommodations = async ({ locationId }: GetAccommodationsArgs): Promise<GetAccommodationsResponse> => {
  const dbAccommodations = await db.selectFrom('accommodationLocationDetails')
    .where('accommodationLocationDetails.locationId', '=', locationId)
    .innerJoin('accommodations', 'accommodations.id', 'accommodationLocationDetails.accommodationId')
    .selectAll('accommodations')
    .select(['accommodationLocationDetails.cost', 'accommodationLocationDetails.id as accommodationLocationDetailId'])
    .execute()

  const accommodations: Accommodation[] = dbAccommodations.map(accommodation => {
    const { id, cost, accommodationLocationDetailId, name, iconFileName } = accommodation
    const { iconUrl } = getIconUrls('accommodation', id, iconFileName)
    return {
      id: accommodationLocationDetailId,
      cost,
      name,
      url: iconUrl,
    }
  })
  return { accommodations };
}
