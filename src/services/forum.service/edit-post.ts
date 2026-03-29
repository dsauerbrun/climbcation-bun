import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"

interface Request {
  postId: string
  userId: string
  newContent: string
}

export interface EditPostResponse extends ServiceResponseError {}

export const editPost = async ({ postId, userId, newContent }: Request): Promise<EditPostResponse> => {
  try {
    const post = await db.selectFrom('posts')
      .select(['id', 'userId'])
      .where('id', '=', postId)
      .executeTakeFirst()

    if (!post) {
      return { error: 'Post not found' }
    }

    if (post.userId !== userId) {
      return { error: 'You do not have permissions to edit this comment.' }
    }

    await db.updateTable('posts')
      .set({ content: newContent })
      .where('id', '=', postId)
      .executeTakeFirstOrThrow()

    return {}
  } catch (err) {
    const error = err as Error
    console.error('Error editing post', err)
    return { error: error.message }
  }
}
