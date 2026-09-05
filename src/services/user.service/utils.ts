import bcrypt from 'bcrypt';

export const generateVerificationEmailText = (username: string, token: string) => {

  const confirmEmailUserUrl = `${process.env.BASE_URL}/verify?id=${token}`
  const textMessage = `Hello ${username}, thanks for registering on Climbcation! To confirm your registration please click ${confirmEmailUserUrl}`;
  const emailMessage = `<p>Hello ${username}, thanks for registering on Climbcation!</p>
<p>To confirm your registration please <a href="${confirmEmailUserUrl}">click here</a>.</p>`;

    return { textMessage, emailMessage }
}

export const getPasswordDetails = (password: string) => {
  if (password.length < 6) {
      return { error: 'Password must be at least 6 characters' }
    }

  const salt = bcrypt.genSaltSync(10);
  const saltedPassword = bcrypt.hashSync(password, salt);
  return { saltedPassword, salt}
}