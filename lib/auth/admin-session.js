import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

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
  const token = await createAdminSessionToken(payload)

  cookies().set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
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
