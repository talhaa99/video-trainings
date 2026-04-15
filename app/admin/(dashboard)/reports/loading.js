import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material'

const cardSx = {
  borderRadius: 2.5,
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
}

export default function ReportsLoading() {
  return (
    <Stack spacing={2.5}>
      <Box>
        <Skeleton variant="text" width={320} height={44} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="min(100%, 560px)" height={22} />
        <Skeleton variant="text" width="min(100%, 420px)" height={22} />
      </Box>
      <Card elevation={0} sx={cardSx}>
        <CardContent sx={{ p: 2.25 }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
            <Skeleton variant="rounded" height={40} sx={{ minWidth: { sm: 200 }, borderRadius: 1.75 }} />
            <Skeleton variant="rounded" height={40} sx={{ minWidth: { sm: 200 }, borderRadius: 1.75 }} />
            <Skeleton variant="rounded" height={40} sx={{ minWidth: { sm: 200 }, borderRadius: 1.75 }} />
            <Skeleton variant="rounded" height={40} sx={{ minWidth: { sm: 200 }, borderRadius: 1.75 }} />
            <Skeleton variant="rounded" height={40} sx={{ flexGrow: 1, borderRadius: 1.75 }} />
          </Stack>
        </CardContent>
      </Card>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} elevation={0} sx={cardSx}>
            <CardContent sx={{ p: 2.25 }}>
              <Skeleton variant="text" width="70%" height={28} />
              <Skeleton variant="text" width="55%" height={20} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="40%" height={16} sx={{ mt: 2 }} />
              <Skeleton variant="text" width="100%" height={18} sx={{ mt: 1.5 }} />
              <Skeleton variant="text" width="100%" height={18} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="80%" height={18} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  )
}
