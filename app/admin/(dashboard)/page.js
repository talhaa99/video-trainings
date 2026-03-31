import { Box, Card, CardContent, Stack, Typography } from '@mui/material'

const summaryCards = [
  { label: 'Employees', value: '--', hint: 'Will connect in Phase 2' },
  { label: 'Open Inductions', value: '--', hint: 'Will connect in Phase 2' },
  { label: 'Training Records', value: '--', hint: 'Will connect in Phase 2' },
  { label: 'Pending Certificates', value: '--', hint: 'Will connect in Phase 2' },
]

const surfaceCardSx = {
  borderRadius: 2.5,
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
}

export default function AdminDashboardPage() {
  return (
    <Box sx={{ width: '100%', maxWidth: 1320, mx: 'auto' }}>
      <Stack spacing={{ xs: 2.25, md: 3 }}>
        <Box sx={{ maxWidth: 760 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
            Dashboard Overview
          </Typography>
          <Typography sx={{ color: '#64748b', mt: 0.75, lineHeight: 1.6 }}>
            Foundation shell is active. Data modules are intentionally placeholders in this phase.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: { xs: 1.5, sm: 2, md: 2.5 },
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          {summaryCards.map((card) => (
            <Card
              key={card.label}
              elevation={0}
              sx={{
                ...surfaceCardSx,
                height: '100%',
                minHeight: { xs: 142, md: 156 },
                display: 'flex',
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
          ))}
        </Box>

        <Card
          elevation={0}
          sx={{
            ...surfaceCardSx,
          }}
        >
          <CardContent sx={{ p: { xs: 2.25, sm: 2.75, md: 3.25 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              Next Modules (Planned)
            </Typography>
            <Typography sx={{ color: '#64748b', lineHeight: 1.7, maxWidth: 900 }}>
              Employees, inductions, assignments, records, certificates, and reports will be wired to real data in
              upcoming phases.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
