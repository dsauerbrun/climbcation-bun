import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { applyAccommodationEdit, applyFoodOptionsEdit, applyGettingInEdit, AccommodationEdit, FoodOptionsEdit, GettingInEdit } from "./location-edit-helpers.js"

interface ClimbingTypeInput {
  id: number
  gradeId?: number
}

interface SectionInput {
  title: string
  body: string
}

interface Request {
  name: string
  rating: number
  soloFriendly: boolean
  country: string
  airport: string
  userId: string
  submitterEmail: string
  climbingTypes: ClimbingTypeInput[]
  months: { id: number }[]
  sections: SectionInput[]
  accommodations: AccommodationEdit
  foodOptions: FoodOptionsEdit
  gettingIn: GettingInEdit
}

export interface CreateLocationResponse extends ServiceResponseError {
  id?: number
  slug?: string
}

const parameterize = (name: string): string =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export const createLocation = async (params: Request): Promise<CreateLocationResponse> => {
  try {
    const slug = parameterize(params.name)

    const result = await db.transaction().execute(async (trx) => {
      const newLocation = await trx.insertInto('locations')
        .values({
          name: params.name,
          rating: params.rating,
          soloFriendly: params.soloFriendly,
          country: params.country,
          airportCode: params.airport,
          slug,
          userId: params.userId,
          submitterEmail: params.submitterEmail,
        })
        .returning(['id', 'slug'])
        .executeTakeFirstOrThrow()

      const locationId = newLocation.id

      // associate climbing types and grades
      for (const climbType of params.climbingTypes) {
        await trx.insertInto('climbingTypesLocations')
          .values({ locationId, climbingTypeId: climbType.id })
          .execute()
        if (climbType.gradeId != null) {
          await trx.insertInto('gradesLocations')
            .values({ locationId, gradeId: climbType.gradeId })
            .execute()
        }
      }

      // associate seasons
      for (const month of params.months) {
        await trx.insertInto('locationsSeasons')
          .values({ locationId, seasonId: month.id })
          .execute()
      }

      await applyGettingInEdit(trx, locationId, params.gettingIn)
      await applyFoodOptionsEdit(trx, locationId, params.foodOptions)
      await applyAccommodationEdit(trx, locationId, params.accommodations)

      // create info sections
      for (const section of params.sections) {
        if (section.title) {
          await trx.insertInto('infoSections')
            .values({ locationId, title: section.title, body: section.body })
            .execute()
        }
      }

      return newLocation
    })

    return { id: result.id, slug: result.slug }
  } catch (err) {
    const error = err as Error
    console.error('Error creating location', err)
    return { error: error.message }
  }
}
