import crypto from 'crypto'
import { getSql } from '../db/neon'
import { sendSafetyInductionEmail } from '../email/mailer'
import { isValidEmail, normalizeEmail, requireNonEmpty } from './validators'

function getBaseUrl() {
  const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return baseUrl.replace(/\/$/, '')
}

function createAccessToken() {
  return crypto.randomBytes(32).toString('hex')
}

export async function createEmployee({ name, email }) {
  const sql = getSql()
  const safeName = requireNonEmpty(name, 'Name')
  const safeEmail = normalizeEmail(requireNonEmpty(email, 'Email'))

  if (!isValidEmail(safeEmail)) {
    throw new Error('A valid email is required.')
  }

  const rows = await sql`
    INSERT INTO employees (name, email)
    VALUES (${safeName}, ${safeEmail})
    RETURNING id, employee_id, name, email, created_at
  `

  return rows[0]
}

export async function updateEmployee({ id, name, email }) {
  const sql = getSql()
  const numericId = Number(id)

  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new Error('A valid employee is required.')
  }

  const safeName = requireNonEmpty(name, 'Name')
  const safeEmail = normalizeEmail(requireNonEmpty(email, 'Email'))

  if (!isValidEmail(safeEmail)) {
    throw new Error('A valid email is required.')
  }

  const rows = await sql`
    UPDATE employees
    SET name = ${safeName},
        email = ${safeEmail},
        updated_at = NOW()
    WHERE id = ${numericId}
    RETURNING id, employee_id, name, email, created_at, updated_at
  `

  if (!rows[0]) {
    throw new Error('Employee was not found.')
  }

  return rows[0]
}

export async function deleteEmployee({ id }) {
  const sql = getSql()
  const numericId = Number(id)

  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new Error('A valid employee is required.')
  }

  const rows = await sql`
    DELETE FROM employees
    WHERE id = ${numericId}
    RETURNING id, employee_id, name
  `

  if (!rows[0]) {
    throw new Error('Employee was not found.')
  }

  return rows[0]
}

export async function listEmployees({ search = '' } = {}) {
  const sql = getSql()
  const safeSearch = `${search ?? ''}`.trim()

  if (!safeSearch) {
    return sql`
      SELECT id, employee_id, name, email, created_at
      FROM employees
      ORDER BY created_at DESC
      LIMIT 250
    `
  }

  const like = `%${safeSearch}%`
  return sql`
    SELECT id, employee_id, name, email, created_at
    FROM employees
    WHERE employee_id ILIKE ${like}
      OR name ILIKE ${like}
      OR email ILIKE ${like}
    ORDER BY created_at DESC
    LIMIT 250
  `
}

export async function listEmployeesPaginated({ search = '', page = 1, pageSize = 10 } = {}) {
  const sql = getSql()
  const safeSearch = `${search ?? ''}`.trim()
  const safePageSize = Number(pageSize)
  const safePage = Number(page)

  const normalizedPageSize = Number.isFinite(safePageSize) ? safePageSize : 10
  const normalizedPage = Number.isFinite(safePage) ? safePage : 1

  let totalCount = 0

  if (!safeSearch) {
    const countRows = await sql`SELECT COUNT(*)::INT AS count FROM employees`
    totalCount = countRows[0]?.count ?? 0
  } else {
    const like = `%${safeSearch}%`
    const countRows = await sql`
      SELECT COUNT(*)::INT AS count
      FROM employees
      WHERE employee_id ILIKE ${like}
        OR name ILIKE ${like}
        OR email ILIKE ${like}
    `
    totalCount = countRows[0]?.count ?? 0
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / normalizedPageSize))
  const clampedPage = Math.min(Math.max(normalizedPage, 1), totalPages)
  const offset = (clampedPage - 1) * normalizedPageSize

  let rows
  if (!safeSearch) {
    rows = await sql`
      SELECT id, employee_id, name, email, created_at
      FROM employees
      ORDER BY created_at DESC
      LIMIT ${normalizedPageSize}
      OFFSET ${offset}
    `
  } else {
    const like = `%${safeSearch}%`
    rows = await sql`
      SELECT id, employee_id, name, email, created_at
      FROM employees
      WHERE employee_id ILIKE ${like}
        OR name ILIKE ${like}
        OR email ILIKE ${like}
      ORDER BY created_at DESC
      LIMIT ${normalizedPageSize}
      OFFSET ${offset}
    `
  }

  return {
    rows,
    totalCount,
    page: clampedPage,
    pageSize: normalizedPageSize,
    totalPages,
  }
}

async function upsertExternalRecipient({ name, email }) {
  const sql = getSql()
  const safeName = requireNonEmpty(name, 'Name')
  const safeEmail = normalizeEmail(requireNonEmpty(email, 'Email'))

  if (!isValidEmail(safeEmail)) {
    throw new Error('A valid email is required.')
  }

  const rows = await sql`
    INSERT INTO induction_recipients (name, email)
    VALUES (${safeName}, ${safeEmail})
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = NOW()
    RETURNING id, name, email
  `

  return rows[0]
}

async function getEmployeeById(employeeDbId) {
  const sql = getSql()
  const numericId = Number(employeeDbId)

  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new Error('A valid employee selection is required.')
  }

  const rows = await sql`
    SELECT id, employee_id, name, email
    FROM employees
    WHERE id = ${numericId}
    LIMIT 1
  `

  if (!rows[0]) {
    throw new Error('Employee was not found.')
  }

  return rows[0]
}

async function insertAssignmentRecord({ recipientType, employeeDbId, externalRecipientId, token }) {
  const sql = getSql()

  if (recipientType === 'employee') {
    const rows = await sql`
      INSERT INTO training_assignments (
        recipient_type,
        employee_id,
        training_type,
        access_token,
        status
      )
      VALUES (
        'employee',
        ${employeeDbId},
        'safety_induction',
        ${token},
        'sent'
      )
      RETURNING id, created_at
    `

    return rows[0]
  }

  const rows = await sql`
    INSERT INTO training_assignments (
      recipient_type,
      external_recipient_id,
      training_type,
      access_token,
      status
    )
    VALUES (
      'external',
      ${externalRecipientId},
      'safety_induction',
      ${token},
      'sent'
    )
    RETURNING id, created_at
  `

  return rows[0]
}

async function addAssignmentEvent({ assignmentId, eventType, payload = null }) {
  const sql = getSql()
  const rows = await sql`
    INSERT INTO assignment_activity_logs (assignment_id, event_type, event_payload)
    VALUES (${assignmentId}, ${eventType}, ${payload ? JSON.stringify(payload) : null}::jsonb)
    RETURNING id, created_at
  `
  return rows[0]
}

async function markAssignmentEmailSent({ assignmentId }) {
  const sql = getSql()
  await sql`
    UPDATE training_assignments
    SET email_sent_at = NOW(),
        status = 'sent'
    WHERE id = ${assignmentId}
  `
}

async function markAssignmentEmailFailed({ assignmentId }) {
  const sql = getSql()
  await sql`
    UPDATE training_assignments
    SET status = 'email_failed'
    WHERE id = ${assignmentId}
  `
}

async function addEmailLog({ assignmentId, recipientEmail, subject, status, errorMessage = null, provider = 'smtp', sentAt = null }) {
  const sql = getSql()
  await sql`
    INSERT INTO email_logs (
      assignment_id,
      recipient_email,
      subject,
      provider,
      status,
      error_message,
      sent_at
    )
    VALUES (
      ${assignmentId},
      ${recipientEmail},
      ${subject},
      ${provider},
      ${status},
      ${errorMessage},
      ${sentAt}
    )
  `
}

export async function createAndSendSafetyInductionAssignment(input) {
  const recipientType = `${input.recipientType ?? ''}`.trim()

  if (recipientType !== 'employee' && recipientType !== 'external') {
    throw new Error('Recipient type must be employee or external.')
  }

  let recipient
  let employeeDbId = null
  let externalRecipientId = null

  if (recipientType === 'employee') {
    const employee = await getEmployeeById(input.employeeDbId)
    recipient = {
      name: employee.name,
      email: employee.email,
      employee_id: employee.employee_id,
    }
    employeeDbId = employee.id
  } else {
    const external = await upsertExternalRecipient({
      name: input.externalName,
      email: input.externalEmail,
    })
    recipient = {
      name: external.name,
      email: external.email,
      employee_id: null,
    }
    externalRecipientId = external.id
  }

  const token = createAccessToken()
  const assignment = await insertAssignmentRecord({
    recipientType,
    employeeDbId,
    externalRecipientId,
    token,
  })

  const linkUrl = `${getBaseUrl()}/?assignment=${token}`

  try {
    const emailResult = await sendSafetyInductionEmail({
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      linkUrl,
    })

    await markAssignmentEmailSent({ assignmentId: assignment.id })
    await addEmailLog({
      assignmentId: assignment.id,
      recipientEmail: recipient.email,
      subject: emailResult.subject,
      status: 'sent',
      provider: emailResult.provider,
      sentAt: new Date(),
    })
  } catch (error) {
    await markAssignmentEmailFailed({ assignmentId: assignment.id })
    await addEmailLog({
      assignmentId: assignment.id,
      recipientEmail: recipient.email,
      subject: 'Petrogas E&P Safety Induction Assignment',
      status: 'failed',
      provider: 'smtp',
      errorMessage: error.message,
      sentAt: null,
    })
    throw error
  }

  return {
    assignmentId: assignment.id,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    token,
    linkUrl,
    recipientType,
  }
}

export async function listAssignments({ limit = 300 } = {}) {
  const sql = getSql()
  const safeLimitRaw = Number(limit)
  const safeLimit = Number.isFinite(safeLimitRaw) ? Math.min(Math.max(Math.floor(safeLimitRaw), 1), 1000) : 300

  try {
    return await sql`
      SELECT
        a.id,
        a.recipient_type,
        a.training_type,
        a.access_token,
        a.email_sent_at,
        a.status,
        a.created_at,
        a.opened_at,
        a.started_at,
        a.quiz_submitted_at,
        a.completed_at,
        a.quiz_score,
        a.quiz_passed,
        COALESCE(qa.quiz_attempts_count, 0) AS quiz_attempts_count,
        qa.quiz_attempts,
        qa.latest_attempt_at,
        qa.latest_attempt_number,
        qa.latest_attempt_score,
        qa.latest_attempt_passed,
        e.name AS employee_name,
        e.email AS employee_email,
        e.employee_id AS employee_code,
        r.name AS external_name,
        r.email AS external_email
      FROM training_assignments a
      LEFT JOIN employees e ON e.id = a.employee_id
      LEFT JOIN induction_recipients r ON r.id = a.external_recipient_id
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::INT AS quiz_attempts_count,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'attemptNumber', seq.attempt_number,
                  'submittedAt', seq.submitted_at,
                  'quizPassed', seq.quiz_passed,
                  'quizScore', seq.quiz_score
                )
                ORDER BY seq.submitted_at ASC
              )
              FROM (
                SELECT
                  l.created_at AS submitted_at,
                  COALESCE((l.event_payload->>'attemptNumber')::INT, ROW_NUMBER() OVER (ORDER BY l.created_at ASC)) AS attempt_number,
                  (l.event_payload->>'quizPassed')::BOOLEAN AS quiz_passed,
                  (l.event_payload->>'quizScore')::INT AS quiz_score
                FROM assignment_activity_logs l
                WHERE l.assignment_id = a.id
                  AND l.event_type = 'quiz_submitted'
                ORDER BY l.created_at ASC
              ) seq
            ),
            '[]'::json
          ) AS quiz_attempts,
          (
            SELECT l.created_at
            FROM assignment_activity_logs l
            WHERE l.assignment_id = a.id
              AND l.event_type = 'quiz_submitted'
            ORDER BY l.created_at DESC
            LIMIT 1
          ) AS latest_attempt_at,
          (
            SELECT COALESCE((l.event_payload->>'attemptNumber')::INT, 1)
            FROM assignment_activity_logs l
            WHERE l.assignment_id = a.id
              AND l.event_type = 'quiz_submitted'
            ORDER BY l.created_at DESC
            LIMIT 1
          ) AS latest_attempt_number,
          (
            SELECT (l.event_payload->>'quizScore')::INT
            FROM assignment_activity_logs l
            WHERE l.assignment_id = a.id
              AND l.event_type = 'quiz_submitted'
            ORDER BY l.created_at DESC
            LIMIT 1
          ) AS latest_attempt_score,
          (
            SELECT (l.event_payload->>'quizPassed')::BOOLEAN
            FROM assignment_activity_logs l
            WHERE l.assignment_id = a.id
              AND l.event_type = 'quiz_submitted'
            ORDER BY l.created_at DESC
            LIMIT 1
          ) AS latest_attempt_passed
      ) qa ON TRUE
      ORDER BY a.created_at DESC
      LIMIT ${safeLimit}
    `
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const isMissingTrackingSchema =
      message.includes('column a.opened_at does not exist') ||
      message.includes('relation "assignment_activity_logs" does not exist')

    if (!isMissingTrackingSchema) {
      throw error
    }

    const rows = await sql`
      SELECT
        a.id,
        a.recipient_type,
        a.training_type,
        a.access_token,
        a.email_sent_at,
        a.status,
        a.created_at,
        0::INT AS quiz_attempts_count,
        '[]'::json AS quiz_attempts,
        NULL::TIMESTAMPTZ AS latest_attempt_at,
        NULL::INT AS latest_attempt_number,
        NULL::INT AS latest_attempt_score,
        NULL::BOOLEAN AS latest_attempt_passed,
        e.name AS employee_name,
        e.email AS employee_email,
        e.employee_id AS employee_code,
        r.name AS external_name,
        r.email AS external_email
      FROM training_assignments a
      LEFT JOIN employees e ON e.id = a.employee_id
      LEFT JOIN induction_recipients r ON r.id = a.external_recipient_id
      ORDER BY a.created_at DESC
      LIMIT ${safeLimit}
    `

    return rows.map((row) => ({
      ...row,
      opened_at: null,
      started_at: null,
      quiz_submitted_at: null,
      completed_at: null,
      quiz_score: null,
      quiz_passed: null,
    }))
  }
}

export async function resolveAssignmentAccessByToken(token) {
  const sql = getSql()
  const safeToken = `${token ?? ''}`.trim()

  if (!safeToken) {
    return { valid: false, reason: 'invalid' }
  }

  const rows = await sql`
    SELECT
      a.id,
      a.recipient_type,
      a.training_type,
      a.status,
      a.opened_at,
      a.started_at,
      a.quiz_submitted_at,
      a.completed_at,
      a.quiz_score,
      a.quiz_passed,
      e.name AS employee_name,
      e.email AS employee_email,
      e.employee_id AS employee_code,
      r.name AS external_name,
      r.email AS external_email
    FROM training_assignments a
    LEFT JOIN employees e ON e.id = a.employee_id
    LEFT JOIN induction_recipients r ON r.id = a.external_recipient_id
    WHERE a.access_token = ${safeToken}
    LIMIT 1
  `

  const assignment = rows[0]
  if (!assignment) {
    return { valid: false, reason: 'invalid' }
  }

  if (assignment.training_type !== 'safety_induction') {
    return { valid: false, reason: 'invalid' }
  }

  if (assignment.completed_at) {
    return { valid: false, reason: 'completed' }
  }

  if (!assignment.opened_at) {
    await sql`
      UPDATE training_assignments
      SET opened_at = NOW(),
          status = CASE WHEN status = 'sent' THEN 'opened' ELSE status END
      WHERE id = ${assignment.id}
    `
    await addAssignmentEvent({ assignmentId: assignment.id, eventType: 'opened' })
    assignment.opened_at = new Date().toISOString()
  }

  return { valid: true, assignment }
}

export async function trackAssignmentEventByToken({ token, eventType, payload = {} }) {
  const sql = getSql()
  const safeToken = `${token ?? ''}`.trim()
  if (!safeToken) {
    throw new Error('Token is required.')
  }

  const rows = await sql`
    SELECT id, started_at, quiz_submitted_at, completed_at
    FROM training_assignments
    WHERE access_token = ${safeToken}
    LIMIT 1
  `
  const assignment = rows[0]

  if (!assignment) {
    throw new Error('Assignment not found.')
  }

  if (eventType === 'started') {
    if (!assignment.started_at) {
      await sql`
        UPDATE training_assignments
        SET started_at = NOW(),
            status = CASE WHEN status IN ('sent', 'opened') THEN 'started' ELSE status END
        WHERE id = ${assignment.id}
      `
      await addAssignmentEvent({ assignmentId: assignment.id, eventType: 'started' })
    }

    return { ok: true }
  }

  if (eventType === 'quiz_submitted') {
    const quizScore = Number(payload.quizScore)
    const quizPassed = Boolean(payload.quizPassed)
    const attemptRows = await sql`
      SELECT COUNT(*)::INT AS count
      FROM assignment_activity_logs
      WHERE assignment_id = ${assignment.id}
        AND event_type = 'quiz_submitted'
    `
    const attemptNumber = (attemptRows[0]?.count ?? 0) + 1

    await sql`
      UPDATE training_assignments
      SET quiz_submitted_at = NOW(),
          completed_at = NOW(),
          quiz_score = ${Number.isFinite(quizScore) ? quizScore : null},
          quiz_passed = ${quizPassed},
          status = ${quizPassed ? 'completed_passed' : 'completed_failed'}
      WHERE id = ${assignment.id}
    `
    await addAssignmentEvent({
      assignmentId: assignment.id,
      eventType: 'quiz_submitted',
      payload: {
        attemptNumber,
        quizScore: Number.isFinite(quizScore) ? quizScore : null,
        quizPassed,
      },
    })

    return { ok: true }
  }

  throw new Error('Unsupported event type.')
}

export async function findAssignmentByToken(token) {
  const sql = getSql()
  const safeToken = `${token ?? ''}`.trim()

  if (!safeToken) {
    return null
  }

  const rows = await sql`
    SELECT
      a.id,
      a.recipient_type,
      a.training_type,
      a.status,
      a.created_at,
      e.name AS employee_name,
      e.email AS employee_email,
      e.employee_id AS employee_code,
      r.name AS external_name,
      r.email AS external_email
    FROM training_assignments a
    LEFT JOIN employees e ON e.id = a.employee_id
    LEFT JOIN induction_recipients r ON r.id = a.external_recipient_id
    WHERE a.access_token = ${safeToken}
    LIMIT 1
  `

  return rows[0] ?? null
}
