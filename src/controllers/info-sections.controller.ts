import { rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint, TypedRequestBody, TypedResponse } from "../lib/models.js"
import { CreateInfoSectionResponse, createInfoSection, UpdateInfoSectionResponse, updateInfoSection } from "../services/location.service/index.js"

const infoSectionsRoutes: ControllerEndpoint[] = [
  {
    routePath: '/api/infosection',
    method: 'post',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestBody<{locationId: string, section: {title: string, body: string}}>, res: TypedResponse<CreateInfoSectionResponse>) => {
      const { locationId: rawLocationId, section } = req.body
      const locationId = parseInt(rawLocationId)
      if (!locationId || !section) {
        res.status(400).send('Missing locationId or section')
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
    routePath: '/api/infosection/:id',
    method: 'post',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestBody<{section: {title: string, body: string, subsections: Record<string, any>}}>, res: TypedResponse<UpdateInfoSectionResponse>) => {
      const { section } = req.body
      if (!section) {
        res.status(400).send('Missing section')
        return
      }

      const { error } = await updateInfoSection({ id: parseInt(req.params.id), section })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({})
    }
  },
]

export default infoSectionsRoutes
