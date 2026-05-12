'use client'

import { memo, useMemo } from 'react'
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import DashboardDoughnut from './dashboard-doughnut'

const surfaceCardSx = {
  borderRadius: 2.5,
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
}

function DashboardAnalyticsChartsComponent({ analytics }) {
  const fire = analytics?.trainingCharts?.fire
  const cpr = analytics?.trainingCharts?.cpr
  const induction = analytics?.trainingCharts?.induction ?? analytics?.assignments?.safetyInduction
  const monthly = analytics?.employees?.monthly || []

  const employeeRegYAxisMax = useMemo(() => {
    const peak = monthly.reduce((acc, row) => Math.max(acc, Number(row.count) || 0), 0)
    return Math.max(1, peak)
  }, [monthly])

  return (
    <Stack spacing={{ xs: 2.25, md: 3 }}>
      <Box>
        <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.12em' }}>
          Training &amp; induction analytics
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 2, md: 2 },
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, minmax(0, 1fr))',
            },
            mt: 2,
          }}
        >
          <Card elevation={0} sx={{ ...surfaceCardSx, p: 0 }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <DashboardDoughnut title="Fire training" bucket={fire} />
            </CardContent>
          </Card>
          <Card elevation={0} sx={{ ...surfaceCardSx, p: 0 }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <DashboardDoughnut title="CPR training" bucket={cpr} />
            </CardContent>
          </Card>
          <Card elevation={0} sx={{ ...surfaceCardSx, p: 0 }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <DashboardDoughnut title="Safety induction" bucket={induction} />
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box>
        <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.12em' }}>
          Employee registrations
        </Typography>
        <Card elevation={0} sx={{ ...surfaceCardSx, mt: 2 }}>
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Box sx={{ width: '100%', height: 220 }}>
              {monthly.length === 0 ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    border: '1px dashed rgba(148, 163, 184, 0.45)',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                    No months in this range
                  </Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, employeeRegYAxisMax]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      width={36}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid rgba(148, 163, 184, 0.35)',
                        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
                      }}
                    />
                    <Bar dataKey="count" name="New registrations" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  )
}

export default memo(DashboardAnalyticsChartsComponent)
