import { Request } from "express"
import { rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint, TypedRequestBody, TypedResponse } from "../lib/models.js"
import { approveLocationEdit, ApproveLocationEditResponse } from "../services/location.service/index.js"
import { getUnapprovedEdits, GetUnapprovedEditsResponse, approveLocation, ApproveLocationResponse, updateLocation, UpdateLocationResponse } from "../services/admin.service/index.js"

const checkAdminPassword = (req: Request): boolean => {
  return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD
}

const adminRoutes: ControllerEndpoint[] = [
  {
    routePath: '/api/admin/location-edits',
    method: 'get',
    middlewares: [rateLimiter],
    executionFunction: async (req: Request, res: TypedResponse<GetUnapprovedEditsResponse>) => {
      if (!checkAdminPassword(req)) {
        res.status(401).send('Unauthorized')
        return
      }

      const { edits, error } = await getUnapprovedEdits()
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({ edits })
    }
  },
  {
    routePath: '/api/admin/locations/:locationId/edits/:editId/approve',
    method: 'put',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestBody<{}>, res: TypedResponse<ApproveLocationEditResponse>) => {
      if (!checkAdminPassword(req)) {
        res.status(401).send('Unauthorized')
        return
      }

      const locationId = parseInt(req.params.locationId)
      const editId = parseInt(req.params.editId)

      const { error } = await approveLocationEdit({ locationId, editId })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({})
    }
  },
  {
    routePath: '/api/admin/locations/:id/approve',
    method: 'put',
    middlewares: [rateLimiter],
    executionFunction: async (req: Request, res: TypedResponse<ApproveLocationResponse>) => {
      if (!checkAdminPassword(req)) {
        res.status(401).send('Unauthorized')
        return
      }

      const { error } = await approveLocation({ locationId: parseInt(req.params.id) })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({})
    }
  },
  {
    routePath: '/api/admin/locations/:id',
    method: 'put',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestBody<{name?: string, slug?: string, continent?: string, country?: string, airportCode?: string, rating?: number, soloFriendly?: boolean, latitude?: number, longitude?: number}>, res: TypedResponse<UpdateLocationResponse>) => {
      if (!checkAdminPassword(req)) {
        res.status(401).send('Unauthorized')
        return
      }

      const locationId = parseInt(req.params.id)
      const { name, slug, continent, country, airportCode, rating, soloFriendly, latitude, longitude } = req.body

      const { error } = await updateLocation({ locationId, fields: { name, slug, continent, country, airportCode, rating, soloFriendly, latitude, longitude } })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({})
    }
  },
]

export default adminRoutes
