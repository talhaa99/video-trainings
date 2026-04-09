import { listAssignments, listEmployees } from '../../../../lib/admin/phase2a-service'
import TrainingManager from './training-manager'

export default async function TrainingPage() {
  const employees = await listEmployees()
  const allAssignments = await listAssignments({ limit: 200 })
  const trainingAssignments = allAssignments.filter((assignment) => assignment.training_type === 'general_training')
  const appBaseUrl = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  )
  const assignmentsWithLinks = trainingAssignments.map((assignment) => {
    const isEmployee = assignment.recipient_type === 'employee'
    return {
      ...assignment,
      name: isEmployee ? assignment.employee_name : assignment.external_name,
      email: isEmployee ? assignment.employee_email : assignment.external_email,
      linkUrl: `${appBaseUrl}/?assignment=${assignment.access_token}`,
    }
  })

  return <TrainingManager employees={employees} assignments={assignmentsWithLinks} />
}
