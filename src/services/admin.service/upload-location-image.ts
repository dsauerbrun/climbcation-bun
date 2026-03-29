import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

interface Request {
  locationId: number
  file: Express.Multer.File
}

export interface UploadLocationImageResponse extends ServiceResponseError {
  url?: string
}

export const uploadLocationImage = async ({ locationId, file }: Request): Promise<UploadLocationImageResponse> => {
  try {
    const ext = file.originalname.split('.').pop()
    const key = `locations/home_thumbs/${locationId}/photo.${ext}`

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }))

    await db.updateTable('locations')
      .set({
        homeThumbFileName: file.originalname,
        homeThumbContentType: file.mimetype,
        homeThumbFileSize: file.size,
        homeThumbUpdatedAt: new Date(),
      })
      .where('id', '=', locationId)
      .executeTakeFirstOrThrow()

    const url = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    return { url }
  } catch (err) {
    const error = err as Error
    console.error('Error uploading location image', err)
    return { error: error.message }
  }
}
