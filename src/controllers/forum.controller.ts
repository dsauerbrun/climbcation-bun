import { rateLimiter } from "../lib/middlewares/index.js"
import { isAuthenticated } from "../lib/middlewares/authenticate.middleware.js"
import { ControllerEndpoint, TypedRequestBody, TypedRequestQuery, TypedResponse } from "../lib/models.js"
import { GetThreadResponse, getThread, EditPostResponse, editPost, PostCommentResponse, postComment } from "../services/forum.service/index.js"

const forumRoutes: ControllerEndpoint[] = [
  {
    routePath: '/api/threads/:id',
    method: 'get',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestQuery<{destinationSlug?: string}>, res: TypedResponse<GetThreadResponse>) => {

      let destinationSlug = null
      const threadId = Number(req.params.id)
      if (isNaN(threadId)) {
        destinationSlug = req.params.id
      }

      const thread = await getThread({ threadId, destinationSlug })
      if (thread?.error) {
        res.status(400).send(thread.error)
        return
      }

      res.json(thread)
    }
  },
  {
    routePath: '/api/threads/:id/posts',
    method: 'post',
    middlewares: [rateLimiter, isAuthenticated],
    executionFunction: async (req: TypedRequestBody<{content: string}>, res: TypedResponse<PostCommentResponse>) => {
      if (!req.user.verified) {
        res.status(400).send('You must verify your account before you can post a comment. Please check your email for your verification link.')
        return
      }

      const { content } = req.body
      if (!content) {
        res.status(400).send('Missing content')
        return
      }

      const { post, error } = await postComment({ threadId: req.params.id, userId: req.user.userId, content })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({ post })
    }
  },
  {
    routePath: '/api/posts/:id',
    method: 'post',
    middlewares: [rateLimiter, isAuthenticated],
    executionFunction: async (req: TypedRequestBody<{newContent: string}>, res: TypedResponse<EditPostResponse>) => {
      const postId = req.params.id
      const { newContent } = req.body
      if (!newContent) {
        res.status(400).send('Missing newContent')
        return
      }

      const { error } = await editPost({ postId, userId: req.user.userId, newContent })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({})
    }
  },
]

export default forumRoutes