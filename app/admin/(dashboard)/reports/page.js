import { listAssignments } from '../../../../lib/admin/phase2a-service'
import SafetyInductionReports from './safety-induction-reports'

export default async function AdminReportsPage() {
  const appBaseUrl = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const allAssignments = await listAssignments({ limit: 500 })
  const reportAssignments = allAssignments.filter(
    (a) => a.training_type === 'safety_induction' || a.training_type === 'general_training'
  )

  const assignmentsWithLinks = reportAssignments.map((assignment) => {
    const isEmployee = assignment.recipient_type === 'employee'
    return {
      ...assignment,
      linkUrl: `${appBaseUrl}/?assignment=${assignment.access_token}`,
    }
  })

  return <SafetyInductionReports assignments={assignmentsWithLinks} />
}
