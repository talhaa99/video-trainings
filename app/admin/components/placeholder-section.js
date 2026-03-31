import { Box, Card, CardContent, Typography, Button } from '@mui/material'
import { Construction as ConstructionIcon } from '@mui/icons-material'

export default function PlaceholderSection({ title, description }) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: '1px solid rgba(148, 163, 184, 0.28)',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
        boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <ConstructionIcon sx={{ color: '#333092' }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
            {title}
          </Typography>
        </Box>
        <Typography sx={{ color: '#64748b', maxWidth: 780, mb: 2, lineHeight: 1.7 }}>{description}</Typography>
        <Button
          variant="outlined"
          disabled
          sx={{
            borderRadius: 1.75,
            borderColor: 'rgba(148, 163, 184, 0.35)',
            color: '#64748b',
          }}
        >
          Module Not Yet Implemented
        </Button>
      </CardContent>
    </Card>
  )
}
