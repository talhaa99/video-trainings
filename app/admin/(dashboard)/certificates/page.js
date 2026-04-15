import { listAssignments } from '../../../../lib/admin/phase2a-service'
import CertificatesManager from './certificates-manager'

export default async function CertificatesPage() {
  const allAssignments = await listAssignments({ limit: 500 })
  const certificateEligibleAssignments = allAssignments.filter(
    (assignment) =>
      assignment.training_type === 'safety_induction' || assignment.training_type === 'general_training'
  )

  return <CertificatesManager assignments={certificateEligibleAssignments} />
}
