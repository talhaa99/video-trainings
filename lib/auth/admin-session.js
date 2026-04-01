import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ADMIN_AUTH_LOG_PREFIX } from '../debug/admin-auth-log'

export const ADMIN_SESSION_COOKIE = 'admin_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET

  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET is not set.')
  }

  return new TextEncoder().encode(secret)
}

export async function createAdminSessionToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret())
}

export async function verifyAdminSessionToken(token) {
  try {
    const verified = await jwtVerify(token, getJwtSecret())
    return verified.payload
  } catch (error) {
    return null
  }
}

export async function setAdminSessionCookie(payload) {
  const secure = process.env.NODE_ENV === 'production'
  console.info(`${ADMIN_AUTH_LOG_PREFIX} setAdminSessionCookie: issuing`, {
    adminId: payload?.id,
    secure,
    sameSite: 'lax',
    path: '/',
  })

  const token = await createAdminSessionToken(payload)

  cookies().set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  console.info(`${ADMIN_AUTH_LOG_PREFIX} setAdminSessionCookie: cookie set`)
}

export function clearAdminSessionCookie() {
  cookies().set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  })
}

export async function getCurrentAdminSession() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value

  if (!token) {
    return null
  }

  return verifyAdminSessionToken(token)
}
