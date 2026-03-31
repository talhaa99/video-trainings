'use client'

import { useRouter } from 'next/navigation'
import { Box, Typography } from '@mui/material'
import SafetyInduction from '../../components/SafetyInduction'

export default function InductionExperience({ recipientName }) {
  const router = useRouter()

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: 1.5 }}>
        <Typography sx={{ color: '#64748b', fontWeight: 500 }}>Assigned to: {recipientName || 'Participant'}</Typography>
      </Box>
      <SafetyInduction onBack={() => router.push('/')} />
    </Box>
  )
}
