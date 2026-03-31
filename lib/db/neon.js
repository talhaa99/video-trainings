import { neon } from '@neondatabase/serverless'

let cachedSql = null

export function getSql() {
  if (cachedSql) {
    return cachedSql
  }

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set.')
  }

  cachedSql = neon(databaseUrl)
  return cachedSql
}
