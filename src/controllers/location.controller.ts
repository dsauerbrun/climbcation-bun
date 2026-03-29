import { Request } from "express"
import { rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint, TypedRequestBody, TypedResponse } from "../lib/models.js"
import { FullLocation, LocationName, getAllLocationNames, getLocation, changeLocationEmail } from '../services/location.service/index.js'

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
    routePath: '/location/name/all',
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
]

export default locationRoutes