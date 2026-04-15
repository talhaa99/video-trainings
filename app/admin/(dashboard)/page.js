import Link from 'next/link'
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import { getAdminDashboardStats } from '../../../lib/admin/phase2a-service'

const surfaceCardSx = {
  borderRadius: 2.5,
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats()

  const summaryCards = [
    {
      label: 'Employees',
      value: String(stats.employeeCount),
      hint: 'Total registered employees',
      href: '/admin/employees',
    },
    {
      label: 'Safety Inductions',
      value: String(stats.inductionAssignmentCount),
      hint: 'Total assignments sent (all recipients)',
      href: '/admin/inductions',
    },
    {
      label: 'Training',
      value: String(stats.trainingAssignmentCount),
      hint: 'Total training assignments sent (all recipients)',
      href: '/admin/training',
    },
  ]

  return (
    <Box sx={{ width: '100%', maxWidth: 1320, mx: 'auto' }}>
      <Stack spacing={{ xs: 2.25, md: 3 }}>
        <Box sx={{ maxWidth: 760 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
            Dashboard Overview
          </Typography>
          <Typography sx={{ color: '#64748b', mt: 0.75, lineHeight: 1.6 }}>
            Quick snapshot of live data from your Petrogas E&amp;P admin workspace.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: { xs: 1.5, sm: 2, md: 2.5 },
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {summaryCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Card
                elevation={0}
                sx={{
                  ...surfaceCardSx,
                  height: '100%',
                  minHeight: { xs: 142, md: 156 },
                  display: 'flex',
                  cursor: 'pointer',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 2.5 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 1.2, fontWeight: 600 }}>
                    {card.label}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                    {card.value}
                  </Typography>
                  <Box sx={{ mt: 'auto', pt: 1.4 }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      {card.hint}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Link>
          ))}
        </Box>
      </Stack>
    </Box>
  )
}
