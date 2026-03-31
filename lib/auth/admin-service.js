import bcrypt from 'bcryptjs'
import { getSql } from '../db/neon'

export async function getAdminByEmail(email) {
  const sql = getSql()
  const normalizedEmail = email.trim().toLowerCase()
  const rows = await sql`
    SELECT id, name, email, password_hash, role
    FROM admins
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `

  return rows[0] ?? null
}

export async function validateAdminCredentials(email, password) {
  const admin = await getAdminByEmail(email)

  if (!admin) {
    return null
  }

  const isValidPassword = await bcrypt.compare(password, admin.password_hash)

  if (!isValidPassword) {
    return null
  }

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  }
}
