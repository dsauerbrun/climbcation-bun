import { Request } from "express"
import { rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint, TypedRequestBody, TypedResponse } from "../lib/models.js"
import { FullLocation, LocationName, getAllLocationNames, getLocation, changeLocationEmail, createInfoSection, CreateInfoSectionResponse, createSectionEdit, createAccommodationEdit, createGettingInEdit, createFoodOptionsEdit, createLocation, CreateLocationResponse } from '../services/location.service/index.js'

const locationRoutes: ControllerEndpoint[] = [
  {
    routePath: '/api/location/:locationSlug',
    method: 'get',
    middlewares: [rateLimiter],
    executionFunction: async (req: Request<{locationSlug: string}>, res: TypedResponse<{location: FullLocation}>) => {
      const { locationSlug } = req.params

      const { location, error } = await getLocation({ locationSlug })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({ location })
    }
  },
  {
    routePath: '/api/location/name/all',
    method: 'get',
    middlewares: [rateLimiter],
    executionFunction: async (_req: Request, res: TypedResponse<LocationName[]>) => {
      const { names, error } = await getAllLocationNames()
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json(names)
    }
  },
  {
    routePath: '/api/locations/:id/email',
    method: 'post',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestBody<{email: string}>, res: TypedResponse<{}>) => {
      const locationId = parseInt(req.params.id)
      const { email } = req.body
      if (!email) {
        res.status(400).send('Missing email')
        return
      }

      const { error } = await changeLocationEmail({ locationId, email })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({})
    }
  },
  {
    routePath: '/api/locations/:locationId/sections',
    method: 'post',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestBody<{section: {title: string, body: string}}>, res: TypedResponse<CreateInfoSectionResponse>) => {
      const locationId = parseInt(req.params.locationId)
      const { section } = req.body
      if (!section) {
        res.status(400).send('Missing section')
        return
      }

      const { id, error } = await createInfoSection({ locationId, section })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({ id })
    }
  },
  {
    routePath: '/api/locations/:locationId/sections/:id',
    method: 'post',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestBody<{section: Record<string, unknown>}>, res: TypedResponse<{}>) => {
      const locationId = parseInt(req.params.locationId)
      const sectionId = parseInt(req.params.id)
      const { section } = req.body
      if (!section) {
        res.status(400).send('Missing section')
        return
      }

      const { error } = await createSectionEdit({ locationId, sectionId, section, userId: req.user?.userId })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({})
    }
  },
  {
    routePath: '/api/locations/:id/accommodations',
    method: 'post',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestBody<{location: {accommodations: unknown, accommodationNotes: string, closestAccommodation: string}}>, res: TypedResponse<{}>) => {
      const locationId = parseInt(req.params.id)
      const { location } = req.body
      if (!location) {
        res.status(400).send('Missing location')
        return
      }

      const { accommodations, accommodationNotes, closestAccommodation } = location
      const { error } = await createAccommodationEdit({ locationId, accommodations, accommodationNotes, closestAccommodation, userId: req.user?.userId })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({})
    }
  },
  {
    routePath: '/api/locations/:id/gettingin',
    method: 'post',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestBody<{location: {transportations: unknown, bestTransportationCost: string, bestTransportationId: number, gettingInNotes: string, walkingDistance: boolean}}>, res: TypedResponse<{}>) => {
      const locationId = parseInt(req.params.id)
      const { location } = req.body
      if (!location) {
        res.status(400).send('Missing location')
        return
      }

      const { transportations, bestTransportationCost, bestTransportationId, gettingInNotes, walkingDistance } = location
      const { error } = await createGettingInEdit({ locationId, transportations, bestTransportationCost, bestTransportationId, gettingInNotes, walkingDistance, userId: req.user?.userId })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({})
    }
  },
  {
    routePath: '/api/locations/:id/foodoptions',
    method: 'post',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestBody<{location: {foodOptionDetails: unknown, commonExpensesNotes: string, savingMoneyTips: string}}>, res: TypedResponse<{}>) => {
      const locationId = parseInt(req.params.id)
      const { location } = req.body
      if (!location) {
        res.status(400).send('Missing location')
        return
      }

      const { foodOptionDetails, commonExpensesNotes, savingMoneyTips } = location
      const { error } = await createFoodOptionsEdit({ locationId, foodOptionDetails, commonExpensesNotes, savingMoneyTips, userId: req.user?.userId })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({})
    }
  },
  {
    routePath: '/api/locations/submit_new_location',
    method: 'post',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestBody<{
      name: string,
      rating: number,
      soloFriendly: boolean,
      country: string,
      airport: string,
      climbingTypes: {id: number, gradeId?: number}[],
      months: {id: number}[],
      sections: {title: string, body: string}[],
      accommodations: {accommodations: {id: number, cost: string}[], accommodationNotes: string, closestAccommodation: string},
      foodOptions: {foodOptionDetails: {id: number, cost: string}[], commonExpensesNotes: string, savingMoneyTips: string},
      gettingIn: {transportations: number[], bestTransportationCost: string, bestTransportationId: number, gettingInNotes: string, walkingDistance: boolean},
    }>, res: TypedResponse<CreateLocationResponse>) => {
      const { name, rating, soloFriendly, country, airport, climbingTypes, months, sections, accommodations, foodOptions, gettingIn } = req.body
      if (!name || !country) {
        res.status(400).send('Missing required fields')
        return
      }

      const { id, slug, error } = await createLocation({
        name,
        rating,
        soloFriendly,
        country,
        airport,
        climbingTypes,
        months,
        sections,
        accommodations,
        foodOptions,
        gettingIn,
        userId: req.user?.userId,
        submitterEmail: req.user?.email,
      })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({ id, slug })
    }
  },
]

export default locationRoutes