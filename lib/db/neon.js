import { neon } from '@neondatabase/serverless'
import { ADMIN_AUTH_LOG_PREFIX, summarizeDatabaseUrl } from '../debug/admin-auth-log'

let cachedSql = null
let loggedInit = false

export function getSql() {
  if (cachedSql) {
    return cachedSql
  }

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error(`${ADMIN_AUTH_LOG_PREFIX} getSql: DATABASE_URL is not set`)
    throw new Error('DATABASE_URL is not set.')
  }

  if (!loggedInit) {
    loggedInit = true
    const summary = summarizeDatabaseUrl()
    console.info(`${ADMIN_AUTH_LOG_PREFIX} getSql: initializing Neon client`, summary)
  }

  cachedSql = neon(databaseUrl)
  return cachedSql
}

/** Lightweight connectivity check for logs / debug API (does not expose secrets). */
export async function pingNeonDatabase() {
  const started = Date.now()
  try {
    const sql = getSql()
    await sql`SELECT 1 AS ping`
    const ms = Date.now() - started
    console.info(`${ADMIN_AUTH_LOG_PREFIX} pingNeonDatabase: ok`, { ms })
    return { ok: true, ms }
  } catch (error) {
    const ms = Date.now() - started
    console.error(`${ADMIN_AUTH_LOG_PREFIX} pingNeonDatabase: failed`, {
      ms,
      name: error?.name,
      message: error?.message,
    })
    return { ok: false, ms, message: error?.message ?? String(error) }
  }
}
