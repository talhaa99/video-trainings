import { NextResponse } from 'next/server'
import { resolveAssignmentAccessByToken } from '../../../../lib/admin/phase2a-service'

export async function GET(request) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ valid: false, reason: 'invalid' }, { status: 400 })
  }

  try {
    const result = await resolveAssignmentAccessByToken(token)

    if (!result.valid) {
      return NextResponse.json(result, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      assignmentId: result.assignment.id,
      trainingType: result.assignment.training_type,
    })
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        reason: 'invalid',
        error: error instanceof Error ? error.message : 'Failed to resolve assignment.',
      },
      { status: 500 }
    )
  }
}
