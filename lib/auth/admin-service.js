import bcrypt from 'bcryptjs'
import { getSql } from '../db/neon'
import { ADMIN_AUTH_LOG_PREFIX, maskEmail, normalizeAdminEmailInput } from '../debug/admin-auth-log'

export async function countAdmins() {
  const sql = getSql()
  const rows = await sql`SELECT COUNT(*)::int AS c FROM admins`
  return rows[0]?.c ?? 0
}

export async function getAdminByEmail(email) {
  const sql = getSql()
  const normalizedEmail = normalizeAdminEmailInput(email)
  const rows = await sql`
    SELECT id, name, email, password_hash, role
    FROM admins
    WHERE lower(trim(email::text)) = ${normalizedEmail}
    LIMIT 1
  `

  return rows[0] ?? null
}

export async function validateAdminCredentials(email, password) {
  const masked = maskEmail(email)
  console.info(`${ADMIN_AUTH_LOG_PREFIX} validateAdminCredentials: start`, { email: masked })

  let admin
  try {
    admin = await getAdminByEmail(email)
  } catch (error) {
    console.error(`${ADMIN_AUTH_LOG_PREFIX} validateAdminCredentials: getAdminByEmail failed`, {
      email: masked,
      name: error?.name,
      message: error?.message,
    })
    throw error
  }

  if (!admin) {
    let adminsTableRowCount = null
    try {
      adminsTableRowCount = await countAdmins()
    } catch (e) {
      console.error(`${ADMIN_AUTH_LOG_PREFIX} validateAdminCredentials: countAdmins failed`, {
        message: e?.message,
      })
    }
    console.info(`${ADMIN_AUTH_LOG_PREFIX} validateAdminCredentials: no admin row`, {
      email: masked,
      normalizedEmailLength: normalizeAdminEmailInput(email).length,
      adminsTableRowCount,
      hint:
        adminsTableRowCount === 0
          ? 'admins table is empty — run npm run admin:seed (or migrate) against this DATABASE_URL.'
          : 'row count > 0 but no matching email — check stored email vs login, or re-seed admin.',
    })
    return null
  }

  console.info(`${ADMIN_AUTH_LOG_PREFIX} validateAdminCredentials: admin row found`, {
    email: masked,
    adminId: admin.id,
    role: admin.role,
    hasPasswordHash: Boolean(admin.password_hash),
    passwordHashLength: admin.password_hash ? String(admin.password_hash).length : 0,
  })

  let isValidPassword
  try {
    isValidPassword = await bcrypt.compare(password, admin.password_hash)
  } catch (error) {
    console.error(`${ADMIN_AUTH_LOG_PREFIX} validateAdminCredentials: bcrypt.compare failed`, {
      email: masked,
      name: error?.name,
      message: error?.message,
    })
    throw error
  }

  if (!isValidPassword) {
    console.info(`${ADMIN_AUTH_LOG_PREFIX} validateAdminCredentials: password mismatch`, { email: masked })
    return null
  }

  console.info(`${ADMIN_AUTH_LOG_PREFIX} validateAdminCredentials: success`, {
    email: masked,
    adminId: admin.id,
  })

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  }
}
