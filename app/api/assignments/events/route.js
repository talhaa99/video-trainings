import { NextResponse } from 'next/server'
import { trackAssignmentEventByToken } from '../../../../lib/admin/phase2a-service'

export async function POST(request) {
  try {
    const body = await request.json()
    const token = body?.token
    const eventType = body?.eventType
    const payload = body?.payload || {}

    if (!token || !eventType) {
      return NextResponse.json({ ok: false, error: 'Token and eventType are required.' }, { status: 400 })
    }

    await trackAssignmentEventByToken({ token, eventType, payload })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to track assignment event.' },
      { status: 400 }
    )
  }
}
