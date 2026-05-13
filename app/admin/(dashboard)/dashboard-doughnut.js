'use client'

import { memo, useMemo } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = {
  pass: '#0d9488',
  failSubmit: '#f59e0b',
  notSubmitted: '#94a3b8',
  completed: '#0d9488',
  pending: '#94a3b8',
}

function pct(part, whole) {
  if (!whole) return 0
  return Math.round((part / whole) * 1000) / 10
}

/** Recharts default tooltip sits under our absolutely positioned center label; custom surface + z-index keeps it readable on every slice. */
function PieSliceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <Box
      sx={{
        backgroundColor: '#ffffff',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        borderRadius: '10px',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.12)',
        px: 1.25,
        py: 0.75,
        whiteSpace: 'nowrap',
      }}
    >
      <Typography variant="body2" sx={{ m: 0, fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
        {name}
        <Typography component="span" sx={{ color: '#64748b', fontWeight: 600 }}>
          {' : '}
        </Typography>
        <Typography component="span" sx={{ fontWeight: 700, color: '#334155' }}>
          {value}
        </Typography>
      </Typography>
    </Box>
  )
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
  const isModuleTriplet = bucket?.kind === 'moduleTriplet'
  const triplet = isModuleTriplet ? bucket : null
  const legacy = !isModuleTriplet && bucket ? bucket : { total: 0, completed: 0, pending: 0 }
  const { total, completed, pending } = legacy
  const donePillLabel = doneCountPillLabel ?? completedLegendLabel

  const displayTotal = isModuleTriplet ? triplet.total : total

  const data = useMemo(() => {
    if (triplet) {
      const { passed, failedSubmit, notSubmitted, total: t } = triplet
      const rows = [
        { name: 'Passed', value: passed, fill: COLORS.pass },
        { name: 'Submitted, not passed', value: failedSubmit, fill: COLORS.failSubmit },
        { name: 'Not submitted', value: notSubmitted, fill: COLORS.notSubmitted },
      ].filter((r) => r.value > 0)
      if (rows.length > 0) return rows
      if (t > 0) return [{ name: 'Not submitted', value: t, fill: COLORS.notSubmitted }]
      return []
    }
    return [
      { name: completedLegendLabel, value: completed, fill: COLORS.completed },
      { name: pendingLegendLabel, value: pending, fill: COLORS.pending },
    ]
  }, [
    triplet,
    isModuleTriplet,
    completed,
    pending,
    completedLegendLabel,
    pendingLegendLabel,
  ])

  const completionRate = pct(completed, total)
  const submissionRate = triplet ? pct(triplet.submitted, triplet.total) : null
  const passAmongSubmitted =
    triplet && triplet.submitted > 0 ? pct(triplet.passed, triplet.submitted) : null

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
        {displayTotal === 0 ? (
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
                  isAnimationActive={displayTotal < 500}
                  label={false}
                >
                  {data.map((entry, idx) => (
                    <Cell key={`${entry.name}-${idx}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={PieSliceTooltip} isAnimationActive={false} wrapperStyle={{ outline: 'none', zIndex: 10 }} />
                <Legend
                  verticalAlign="bottom"
                  height={isModuleTriplet ? 52 : 32}
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
                zIndex: 0,
                pointerEvents: 'none',
                transform: 'translateY(-50%)',
              }}
            >
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.35rem', sm: '1.5rem' }, lineHeight: 1.1 }}>
                {displayTotal}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, mt: 0.25 }}>
                Total
              </Typography>
            </Stack>
          </>
        )}
      </Box>
      {displayTotal === 0 ? null : isModuleTriplet ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 0.5 }}>
          <StatPill label="Submission rate" value={`${submissionRate ?? 0}%`} />
          <StatPill
            label="Pass rate (of submitted)"
            value={passAmongSubmitted == null ? '—' : `${passAmongSubmitted}%`}
          />
        </Stack>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 0.5 }}>
          <StatPill label={ratePillLabel} value={`${completionRate}%`} />
          <StatPill label={openPillLabel} value={String(pending)} />
          <StatPill label={donePillLabel} value={String(completed)} />
        </Stack>
      )}
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
