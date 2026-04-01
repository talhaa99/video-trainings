import { listAssignments, listEmployees } from '../../../../lib/admin/phase2a-service'
import InductionsManager from './inductions-manager'

export default async function InductionsPage() {
  const employees = await listEmployees()
  const assignments = await listAssignments({ limit: 50 })
  const appBaseUrl = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  )
  const assignmentsWithLinks = assignments.map((assignment) => {
    const isEmployee = assignment.recipient_type === 'employee'
    return {
      ...assignment,
      name: isEmployee ? assignment.employee_name : assignment.external_name,
      email: isEmployee ? assignment.employee_email : assignment.external_email,
      linkUrl: `${appBaseUrl}/?assignment=${assignment.access_token}`,
    }
  })

  return <InductionsManager employees={employees} assignments={assignmentsWithLinks} />
}
