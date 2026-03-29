import { DateTime } from "luxon"
import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { DESTINATION_CATEGORY_NAME, Post } from "./types.js"

interface Request {
  threadId: string
  userId: string
  content: string
}

export interface PostCommentResponse extends ServiceResponseError {
  post?: Post
}

export const postComment = async ({ threadId, userId, content }: Request): Promise<PostCommentResponse> => {
  try {
    // spam guard: no more than 5 posts in the last 30 seconds
    const thirtySecondsAgo = DateTime.now().minus({ seconds: 30 }).toJSDate()
    const recentPosts = await db.selectFrom('posts')
      .select('id')
      .where('userId', '=', userId)
      .where('createdAt', '>=', thirtySecondsAgo)
      .execute()

    if (recentPosts.length > 5) {
      return { error: 'You cannot post more than 5 comments within 30 seconds. Please wait and try again.' }
    }

    let forumThreadId = threadId
    if (isNaN(Number(threadId))) {
      // threadId is a location slug — find or create the destination thread
      const destinationCategory = await db.selectFrom('categories')
        .select('id')
        .where('name', '=', DESTINATION_CATEGORY_NAME)
        .executeTakeFirstOrThrow()

      const existingThread = await db.selectFrom('forumThreads')
        .select('id')
        .where('subject', '=', threadId)
        .where('categoryId', '=', destinationCategory.id)
        .executeTakeFirst()

      if (existingThread) {
        forumThreadId = String(existingThread.id)
      } else {
        const newThread = await db.insertInto('forumThreads')
          .values({ subject: threadId, userId: '1', categoryId: destinationCategory.id })
          .returning('id')
          .executeTakeFirstOrThrow()
        forumThreadId = String(newThread.id)
      }
    }

    const dbPost = await db.insertInto('posts')
      .values({ content, userId, forumThreadId })
      .returningAll()
      .executeTakeFirstOrThrow()

    const post: Post = {
      id: Number(dbPost.id),
      userId: Number(dbPost.userId),
      forumThreadId: Number(dbPost.forumThreadId),
      content: dbPost.content,
      createdAt: DateTime.fromJSDate(dbPost.createdAt),
      updatedAt: DateTime.fromJSDate(dbPost.updatedAt),
      deleted: dbPost.deleted,
      username: null,
    }

    return { post }
  } catch (err) {
    const error = err as Error
    console.error('Error posting comment', err)
    return { error: error.message }
  }
}
