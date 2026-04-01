'use server'

import { redirect } from 'next/navigation'
import { ADMIN_AUTH_LOG_PREFIX, maskEmail } from '../../../lib/debug/admin-auth-log'
import { pingNeonDatabase } from '../../../lib/db/neon'
import { setAdminSessionCookie, clearAdminSessionCookie } from '../../../lib/auth/admin-session'
import { validateAdminCredentials } from '../../../lib/auth/admin-service'

export async function loginAdmin(_prevState, formData) {
  const email = `${formData.get('email') ?? ''}`.trim()
  const password = `${formData.get('password') ?? ''}`

  console.info(`${ADMIN_AUTH_LOG_PREFIX} loginAdmin: request`, {
    email: maskEmail(email),
    hasPassword: Boolean(password),
    nodeEnv: process.env.NODE_ENV,
  })

  if (!email || !password) {
    console.info(`${ADMIN_AUTH_LOG_PREFIX} loginAdmin: rejected`, { reason: 'missing_fields' })
    return { error: 'Email and password are required.' }
  }

  const ping = await pingNeonDatabase()
  if (!ping.ok) {
    console.error(`${ADMIN_AUTH_LOG_PREFIX} loginAdmin: database ping failed before auth`, ping)
    return {
      error: 'Cannot reach database. Check server logs for [admin-auth] and DATABASE_URL.',
    }
  }

  let admin
  try {
    admin = await validateAdminCredentials(email, password)
  } catch (error) {
    console.error(`${ADMIN_AUTH_LOG_PREFIX} loginAdmin: validateAdminCredentials threw`, {
      name: error?.name,
      message: error?.message,
    })
    return {
      error: 'Sign-in failed (server error). Check server logs for [admin-auth].',
    }
  }

  if (!admin) {
    console.info(`${ADMIN_AUTH_LOG_PREFIX} loginAdmin: rejected`, { reason: 'invalid_credentials' })
    return { error: 'Invalid login credentials.' }
  }

  try {
    await setAdminSessionCookie({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    })
  } catch (error) {
    console.error(`${ADMIN_AUTH_LOG_PREFIX} loginAdmin: setAdminSessionCookie threw`, {
      name: error?.name,
      message: error?.message,
    })
    return {
      error: 'Could not create session. Check ADMIN_JWT_SECRET and server logs for [admin-auth].',
    }
  }

  console.info(`${ADMIN_AUTH_LOG_PREFIX} loginAdmin: success, redirecting`, { adminId: admin.id })
  redirect('/admin')
}

export async function logoutAdmin() {
  clearAdminSessionCookie()
  redirect('/admin/login')
}
