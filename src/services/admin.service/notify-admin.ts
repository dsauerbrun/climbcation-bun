import nodemailer from "nodemailer"
import db from "../../db/index.js"

interface Request {
  editType: string
  locationId: number
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export const notifyAdmin = async ({ editType, locationId }: Request): Promise<void> => {
  try {
    const location = await db.selectFrom('locations')
      .select('name')
      .where('id', '=', locationId)
      .executeTakeFirst()

    const message = editType === 'new'
      ? `New location created: ${locationId} ${location?.name}`
      : `Changing ${editType} for location id ${locationId} ${location?.name}`

    await transporter.sendMail({
      from: 'no-reply@climbcation.com',
      to: process.env.EMAIL_USER,
      subject: message,
      text: message,
    })
  } catch (err) {
    console.error('Error sending admin notification email', err)
  }
}
