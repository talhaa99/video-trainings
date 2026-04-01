import { NextResponse } from 'next/server'
import { summarizeDatabaseUrl } from '../../../../lib/debug/admin-auth-log'
import { countAdmins } from '../../../../lib/auth/admin-service'
import { pingNeonDatabase } from '../../../../lib/db/neon'

/**
 * GET /api/admin/login-debug
 * Returns non-secret diagnostics for live debugging. Enable with ADMIN_LOGIN_DEBUG=1.
 * Remove or keep disabled after you finish troubleshooting.
 */
export async function GET() {
  if (process.env.ADMIN_LOGIN_DEBUG !== '1') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const databaseSummary = summarizeDatabaseUrl()
  const jwtConfigured = Boolean(process.env.ADMIN_JWT_SECRET)
  const ping = await pingNeonDatabase()

  let adminsRowCount = null
  let adminsCountError = null
  try {
    adminsRowCount = await countAdmins()
  } catch (e) {
    adminsCountError = e?.message ?? String(e)
  }

  const body = {
    ok: ping.ok && databaseSummary.configured && jwtConfigured,
    adminsRowCount,
    adminsCountError,
    env: {
      nodeEnv: process.env.NODE_ENV,
      databaseUrlConfigured: databaseSummary.configured,
      databaseHost: databaseSummary.host ?? null,
      databaseName: databaseSummary.database ?? null,
      databaseUrlParseError: Boolean(databaseSummary.parseError),
      adminJwtSecretConfigured: jwtConfigured,
    },
    databasePing: ping,
    hint: 'Server logs use prefix [admin-auth] during sign-in.',
  }

  return NextResponse.json(body)
}
