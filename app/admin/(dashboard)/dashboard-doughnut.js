'use client'

import { memo, useMemo } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = {
  completed: '#0d9488',
  pending: '#94a3b8',
}

function pct(part, whole) {
  if (!whole) return 0
  return Math.round((part / whole) * 1000) / 10
}

function DashboardDoughnutComponent({
  title,
  subtitle,
  bucket,
  footnote,
  completedLegendLabel = 'Completed',
  pendingLegendLabel = 'Open / pending',
  ratePillLabel = 'Completion rate',
  openPillLabel = 'Open',
  doneCountPillLabel,
}) {
  const { total, completed, pending } = bucket || { total: 0, completed: 0, pending: 0 }
  const donePillLabel = doneCountPillLabel ?? completedLegendLabel

  const data = useMemo(
    () => [
      { name: completedLegendLabel, value: completed, fill: COLORS.completed },
      { name: pendingLegendLabel, value: pending, fill: COLORS.pending },
    ],
    [completed, pending, completedLegendLabel, pendingLegendLabel],
  )

  const completionRate = pct(completed, total)

  return (
    <Stack spacing={1.25} sx={{ height: '100%' }}>
      <Box>
        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{title}</Typography>
        {subtitle ? (
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25, lineHeight: 1.45 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ width: '100%', height: { xs: 240, sm: 260 }, minHeight: 220, position: 'relative' }}>
        {total === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              border: '1px dashed rgba(148, 163, 184, 0.45)',
              bgcolor: 'rgba(248, 250, 252, 0.6)',
            }}
          >
            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
              No assignments in this period
            </Typography>
          </Box>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="46%"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                  isAnimationActive={total < 500}
                  label={false}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}`, `${name}`]}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  formatter={(value, entry) => (
                    <span style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>
                      {value}: {entry.payload?.value ?? ''}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: { xs: '36%', sm: '38%' },
                pointerEvents: 'none',
                transform: 'translateY(-50%)',
              }}
            >
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.35rem', sm: '1.5rem' }, lineHeight: 1.1 }}>
                {total}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, mt: 0.25 }}>
                Total
              </Typography>
            </Stack>
          </>
        )}
      </Box>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 0.5 }}>
        <StatPill label={ratePillLabel} value={`${completionRate}%`} />
        <StatPill label={openPillLabel} value={String(pending)} />
        <StatPill label={donePillLabel} value={String(completed)} />
      </Stack>
      {footnote ? (
        <Typography variant="caption" sx={{ color: '#94a3b8', lineHeight: 1.45 }}>
          {footnote}
        </Typography>
      ) : null}
    </Stack>
  )
}

function StatPill({ label, value }) {
  return (
    <Box
      sx={{
        px: 1.25,
        py: 0.65,
        borderRadius: 999,
        bgcolor: 'rgba(241, 245, 249, 0.95)',
        border: '1px solid rgba(148, 163, 184, 0.25)',
      }}
    >
      <Typography component="span" variant="caption" sx={{ color: '#64748b', fontWeight: 600, mr: 0.5 }}>
        {label}
      </Typography>
      <Typography component="span" variant="caption" sx={{ color: '#0f172a', fontWeight: 800 }}>
        {value}
      </Typography>
    </Box>
  )
}

export default memo(DashboardDoughnutComponent)
