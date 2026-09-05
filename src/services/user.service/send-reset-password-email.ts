import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { generateVerificationToken } from "./generate-verification-token.js"
import { sendUserEmail } from "./send-user-email.js"

export interface SendResetPasswordEmailResponse extends ServiceResponseError {
}

export interface SendResetPasswordEmailRequest {
  userId: string
}

export const sendResetPasswordEmail = async ({userId}: SendResetPasswordEmailRequest): Promise<SendResetPasswordEmailResponse> => {
  try {
    const { token } = await generateVerificationToken({ userId })

    const user = await db.selectFrom('users')
      .selectAll('users')
      .where('id', '=', userId)
      .executeTakeFirstOrThrow()
  
    const resetPasswordEmailUserUrl = `${process.env.BASE_URL}/resetpass?id=${token}`;
    const textMessage = `Hello ${user.username}, to reset your password please click ${resetPasswordEmailUserUrl}

      If you did not choose to reset your password you can ignore this email.`;
    const emailMessage = `<p>Hello ${user.username}, to reset your password please <a href="${resetPasswordEmailUserUrl}">click here</a>.</p>
<p>If you did not choose to reset your password you can ignore this email.</p>`;

    await sendUserEmail({
      email: user.email,
      text: textMessage,
      html: emailMessage,
      from: "no-reply@climbcation.com",
      subject: "Reset Climbcation Password ",
    });

    return { }
  } catch (err) {
    const error = err as Error
    console.error('Error updating username', err)
    if (error.message.includes('duplicate key value violates unique constraint')) {
      return { error: 'Username already exists' }
    }
    return { error: error.message }
  }

}
