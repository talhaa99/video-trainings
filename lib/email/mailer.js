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
    <p style="margin-top: 24px;">Best regards,<br/>Petrogas E&P Admin</p>
  </div>
  `

  const text = `Hello ${safeName},

You have been assigned the Safety Induction training.
Use this secure link to start: ${linkUrl}

Best regards,
Petrogas E&P Admin
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

export async function sendTrainingStartEmail({ recipientName, recipientEmail, linkUrl }) {
  const config = getMailConfig()
  const transporter = getTransporter()
  const subject = 'Petrogas E&P Start Training Assignment'
  const safeName = recipientName || 'Participant'

  const html = `
  <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 640px; margin: 0 auto;">
    <h2 style="margin-bottom: 8px;">Petrogas E&P Training Portal</h2>
    <p style="margin-top: 0;">Hello ${safeName},</p>
    <p>You have been assigned the Start Training module.</p>
    <p>Please use the secure link below to begin:</p>
    <p style="margin: 24px 0;">
      <a href="${linkUrl}" style="background: linear-gradient(135deg, #e31b23 0%, #333092 100%); color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; display: inline-block; font-weight: 700;">Start Training</a>
    </p>
    <p>If the button does not work, copy this URL into your browser:</p>
    <p><a href="${linkUrl}">${linkUrl}</a></p>
    <p style="margin-top: 24px;">Best regards,<br/>Petrogas E&P Admin</p>
  </div>
  `

  const text = `Hello ${safeName},

You have been assigned the Start Training module.
Use this secure link to begin: ${linkUrl}

Best regards,
Petrogas E&P Admin
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

export async function sendAssignmentCompletionReportEmail({
  recipientName,
  recipientEmail,
  trainingType,
  completedAt,
  quizScore = null,
  scoreText = null,
  quizPassed = null,
  extraSummary = null,
}) {
  const config = getMailConfig()
  const transporter = getTransporter()
  const safeName = recipientName || 'Participant'
  const isSafetyInduction = trainingType === 'safety_induction'
  const trainingLabel = isSafetyInduction ? 'Safety Induction' : 'Training'
  const subject = `Petrogas E&P ${trainingLabel} Completion Report`
  const completionDateText = completedAt ? new Date(completedAt).toUTCString() : 'N/A'
  const quizOutcomeText =
    quizPassed === true ? 'Passed' : quizPassed === false ? 'Failed' : 'Completed'
  const resolvedScoreText = scoreText || (Number.isFinite(Number(quizScore)) ? `${quizScore}` : 'N/A')
  const summaryText = extraSummary ? `\nAdditional summary: ${extraSummary}` : ''

  const html = `
  <div style="font-family: Arial, sans-serif; background: #f1f5f9; color: #0f172a; line-height: 1.6; max-width: 680px; margin: 0 auto; padding: 24px;">
    <div style="border-radius: 14px; overflow: hidden; box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12); border: 1px solid rgba(148, 163, 184, 0.25);">
      <div style="background: linear-gradient(135deg, #e31b23 0%, #333092 100%); padding: 16px 20px;">
        <h2 style="margin: 0; color: #ffffff; font-size: 22px;">Petrogas E&P Completion Report</h2>
      </div>
      <div style="background: #ffffff; padding: 20px;">
        <p style="margin-top: 0;">Hello ${safeName},</p>
        <p>Your ${trainingLabel} assignment has been completed successfully.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e2e8f0;">
          <tr><td style="padding: 10px; background: #f8fafc; width: 40%;"><strong>Training</strong></td><td style="padding: 10px;">${trainingLabel}</td></tr>
          <tr><td style="padding: 10px; background: #f8fafc;"><strong>Completed At (UTC)</strong></td><td style="padding: 10px;">${completionDateText}</td></tr>
          <tr><td style="padding: 10px; background: #f8fafc;"><strong>Outcome</strong></td><td style="padding: 10px;">${quizOutcomeText}</td></tr>
          <tr><td style="padding: 10px; background: #f8fafc;"><strong>Score</strong></td><td style="padding: 10px;">${resolvedScoreText}</td></tr>
          ${extraSummary ? `<tr><td style="padding: 10px; background: #f8fafc;"><strong>Summary</strong></td><td style="padding: 10px;">${extraSummary}</td></tr>` : ''}
        </table>
        <p style="margin-bottom: 0;">Best regards,<br/>Petrogas E&P Admin</p>
      </div>
    </div>
  </div>
  `

  const text = `Hello ${safeName},

Your ${trainingLabel} assignment has been completed successfully.

Training: ${trainingLabel}
Completed At (UTC): ${completionDateText}
Outcome: ${quizOutcomeText}
Score: ${resolvedScoreText}${summaryText}

Best regards,
Petrogas E&P Admin
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
