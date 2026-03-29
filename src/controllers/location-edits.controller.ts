import { rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint, TypedRequestBody, TypedResponse } from "../lib/models.js"
import { approveLocationEdit, ApproveLocationEditResponse } from "../services/location.service/index.js"

const locationEditsRoutes: ControllerEndpoint[] = [
  {
    routePath: '/api/locations/:locationId/edits/:editId/approve',
    method: 'put',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestBody<{password: string}>, res: TypedResponse<ApproveLocationEditResponse>) => {
      const locationId = parseInt(req.params.locationId)
      const editId = parseInt(req.params.editId)
      const { password } = req.body

      if (!password) {
        res.status(400).send('Missing password')
        return
      }

      const { error } = await approveLocationEdit({ locationId, editId, password })
      if (error === 'Unauthorized') {
        res.status(401).send('Unauthorized')
        return
      }
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({})
    }
  },
]

export default locationEditsRoutes
