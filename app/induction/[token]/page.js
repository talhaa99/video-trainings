import { Box, Card, CardContent, Typography } from '@mui/material'
import InductionExperience from './induction-experience'
import { findAssignmentByToken } from '../../../lib/admin/phase2a-service'

export default async function InductionTokenPage({ params }) {
  const assignment = await findAssignmentByToken(params.token)

  if (!assignment || assignment.training_type !== 'safety_induction') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Card
          elevation={0}
          sx={{
            maxWidth: 560,
            width: '100%',
            borderRadius: 2.5,
            border: '1px solid rgba(148, 163, 184, 0.28)',
            background: 'rgba(255,255,255,0.94)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
              Invalid or Expired Link
            </Typography>
            <Typography sx={{ color: '#64748b' }}>
              This Safety Induction link is not valid. Please contact Petrogas E&amp;P administration for a new
              assignment.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  const recipientName = assignment.recipient_type === 'employee' ? assignment.employee_name : assignment.external_name
  return <InductionExperience recipientName={recipientName} />
}
