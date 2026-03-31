import nodemailer from 'nodemailer'

let cachedTransporter = null

function getMailConfig() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const secure = process.env.SMTP_SECURE === 'true'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM

  if (!host || !user || !pass || !from) {
    throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM must be configured.')
  }

  return { host, port, secure, user, pass, from }
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter
  }

  const config = getMailConfig()
  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  return cachedTransporter
}

export async function sendSafetyInductionEmail({ recipientName, recipientEmail, linkUrl }) {
  const config = getMailConfig()
  const transporter = getTransporter()
  const subject = 'Petrogas E&P Safety Induction Assignment'
  const safeName = recipientName || 'Participant'

  const html = `
  <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 640px; margin: 0 auto;">
    <h2 style="margin-bottom: 8px;">Petrogas E&P Admin Panel</h2>
    <p style="margin-top: 0;">Hello ${safeName},</p>
    <p>You have been assigned the Safety Induction training.</p>
    <p>Please use the secure link below to start:</p>
    <p style="margin: 24px 0;">
      <a href="${linkUrl}" style="background: linear-gradient(135deg, #e31b23 0%, #333092 100%); color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block; font-weight: 700;">Start Safety Induction</a>
    </p>
    <p>If the button does not work, copy this URL into your browser:</p>
    <p><a href="${linkUrl}">${linkUrl}</a></p>
    <p style="margin-top: 24px;">Best regards,<br/>Petrogas E&P Admin Panel</p>
  </div>
  `

  const text = `Hello ${safeName},

You have been assigned the Safety Induction training.
Use this secure link to start: ${linkUrl}

Best regards,
Petrogas E&P Admin Panel
`

  const result = await transporter.sendMail({
    from: config.from,
    to: recipientEmail,
    subject,
    text,
    html,
  })

  return {
    subject,
    provider: 'smtp',
    messageId: result.messageId,
  }
}
