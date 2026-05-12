import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../../lib/auth/admin-session'
import { getDashboardAnalytics } from '../../../../lib/admin/dashboard-analytics'

function parseDateParam(value, label) {
  if (!value || typeof value !== 'string') {
    return { error: `${label} is required.` }
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return { error: `${label} must be a valid ISO date.` }
  }
  return { date: d }
}

export async function GET(request) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value
  const session = token ? await verifyAdminSessionToken(token) : null
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fromRaw = searchParams.get('from')
  const toRaw = searchParams.get('to')

  const fromParsed = parseDateParam(fromRaw, 'from')
  if (fromParsed.error) {
    return NextResponse.json({ error: fromParsed.error }, { status: 400 })
  }
  const toParsed = parseDateParam(toRaw, 'to')
  if (toParsed.error) {
    return NextResponse.json({ error: toParsed.error }, { status: 400 })
  }

  try {
    const data = await getDashboardAnalytics({ from: fromParsed.date, to: toParsed.date })
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analytics failed.'
    const status = message.includes('Invalid') || message.includes('must have') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
