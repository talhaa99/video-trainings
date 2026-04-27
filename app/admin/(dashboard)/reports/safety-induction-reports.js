'use client'

import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material'
import { ContentCopy as ContentCopyIcon, Assessment as AssessmentIcon } from '@mui/icons-material'

const cardSx = {
  borderRadius: 2.5,
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
}

const SAFETY_INDUCTION_TITLE = 'Safety Induction'
const TRAINING_MODULE_TITLE = 'Training Module'

function formatTimestamp(dateValue) {
  if (!dateValue) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateValue))
}

function normalizeAttempts(attemptsValue) {
  if (Array.isArray(attemptsValue)) return attemptsValue
  if (!attemptsValue) return []
  try {
    const parsed = JSON.parse(attemptsValue)
    return Array.isArray(parsed) ? parsed : []
  } catch (_error) {
    return []
  }
}

function buildReportRows(assignments) {
  const rows = []
  for (const a of assignments) {
    const trainingType = a.training_type
    const moduleTitle =
      trainingType === 'general_training' ? TRAINING_MODULE_TITLE : SAFETY_INDUCTION_TITLE
    const isEmployee = a.recipient_type === 'employee'
    const name = isEmployee ? a.employee_name : a.external_name
    const email = isEmployee ? a.employee_email : a.external_email
    const employeeCode = isEmployee ? a.employee_code : null
    const attempts = normalizeAttempts(a.quiz_attempts)

    for (const att of attempts) {
      const passed = att?.quizPassed === true
      const failed = att?.quizPassed === false
      rows.push({
        key: `${a.id}-att-${att?.attemptNumber ?? ''}-${att?.submittedAt ?? ''}`,
        kind: 'attempt',
        assignmentId: a.id,
        name: name || '—',
        email: email || '—',
        employeeCode,
        attemptNumber: att?.attemptNumber ?? null,
        submittedAt: att?.submittedAt ?? null,
        sortDate: att?.submittedAt ?? null,
        quizScore: att?.quizScore,
        outcome: passed ? 'passed' : failed ? 'failed' : 'submitted',
        outcomeLabel: passed ? 'Passed' : failed ? 'Failed' : 'Submitted',
        trainingTitle: moduleTitle,
        trainingType,
        assignmentStatus: a.status,
        openedAt: a.opened_at,
        startedAt: a.started_at,
        linkUrl: a.linkUrl,
        recipientType: a.recipient_type,
      })
    }

    const hasProgress = Boolean(a.opened_at || a.started_at)
    if (hasProgress && attempts.length === 0) {
      const sortDate = a.opened_at || a.started_at || a.created_at
      rows.push({
        key: `${a.id}-opened`,
        kind: 'opened',
        assignmentId: a.id,
        name: name || '—',
        email: email || '—',
        employeeCode,
        attemptNumber: null,
        submittedAt: null,
        sortDate,
        quizScore: null,
        outcome: 'opened',
        outcomeLabel: 'Opened',
        trainingTitle: moduleTitle,
        trainingType,
        assignmentStatus: a.status,
        openedAt: a.opened_at,
        startedAt: a.started_at,
        linkUrl: a.linkUrl,
        recipientType: a.recipient_type,
      })
    }
  }
  return rows
}

function outcomeChipSx(outcome) {
  if (outcome === 'passed') {
    return { backgroundColor: 'rgba(16, 185, 129, 0.16)', color: '#047857' }
  }
  if (outcome === 'failed') {
    return { backgroundColor: 'rgba(239, 68, 68, 0.14)', color: '#b91c1c' }
  }
  if (outcome === 'opened') {
    return { backgroundColor: 'rgba(59, 130, 246, 0.14)', color: '#1d4ed8' }
  }
  return { backgroundColor: 'rgba(148, 163, 184, 0.2)', color: '#475569' }
}

function ReportCard({ row, copiedId, onCopy }) {
  return (
    <Card elevation={0} sx={{ ...cardSx, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2.25, display: 'flex', flexDirection: 'column', flexGrow: 1, '&:last-child': { pb: 2.25 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem', lineHeight: 1.25 }} noWrap title={row.name}>
              {row.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.35 }} noWrap title={row.email}>
              {row.email}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} alignItems="flex-start" flexShrink={0}>
            <Chip size="small" label={row.outcomeLabel} sx={{ borderRadius: 1.5, fontWeight: 700, ...outcomeChipSx(row.outcome) }} />
            {row.linkUrl ? (
              <Tooltip title={copiedId === row.key ? 'Copied' : 'Copy assignment link'} arrow>
                <IconButton
                  size="small"
                  onClick={() => onCopy(row.key, row.linkUrl)}
                  sx={{
                    borderRadius: 1.25,
                    color: '#475569',
                    '&:hover': { color: '#312e81', backgroundColor: 'rgba(51, 48, 146, 0.08)' },
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        </Stack>

        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          {row.trainingTitle}
        </Typography>

        <Stack spacing={0.85} sx={{ mt: 1.5, flexGrow: 1 }}>
          {row.kind === 'attempt' ? (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Attempt
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {row.attemptNumber ?? '—'}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Submitted
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {formatTimestamp(row.submittedAt)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Score
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {row.trainingType === 'general_training'
                    ? row.quizScore != null
                      ? String(row.quizScore)
                      : '—'
                    : row.quizScore != null
                      ? `${row.quizScore} / 5`
                      : '—'}
                </Typography>
              </Stack>
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.55 }}>
                {row.trainingType === 'general_training'
                  ? 'Link opened or training started; no quiz completion recorded yet.'
                  : 'Link opened or induction started; no quiz submission recorded yet.'}
              </Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Opened
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {formatTimestamp(row.openedAt)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Started
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                  {formatTimestamp(row.startedAt)}
                </Typography>
              </Stack>
            </>
          )}
          {row.employeeCode ? (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                Employee ID
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }} noWrap>
                {row.employeeCode}
              </Typography>
            </Stack>
          ) : null}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Recipient
            </Typography>
            <Chip
              size="small"
              label={row.recipientType === 'employee' ? 'Employee' : 'External'}
              sx={{ borderRadius: 1.5, fontWeight: 600, backgroundColor: 'rgba(15, 23, 42, 0.06)' }}
            />
          </Stack>
          <Typography variant="caption" sx={{ color: '#94a3b8', pt: 0.5 }}>
            Assignment #{row.assignmentId} · Status: {row.assignmentStatus || '—'}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function SafetyInductionReports({ assignments }) {
  const [outcomeFilter, setOutcomeFilter] = useState('all')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [moduleTypeFilter, setModuleTypeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const allRows = useMemo(() => buildReportRows(assignments), [assignments])

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = allRows

    if (outcomeFilter !== 'all') {
      list = list.filter((r) => r.outcome === outcomeFilter)
    }

    if (userTypeFilter === 'employee') {
      list = list.filter((r) => r.recipientType === 'employee')
    } else if (userTypeFilter === 'non-employee') {
      list = list.filter((r) => r.recipientType !== 'employee')
    }

    if (moduleTypeFilter !== 'all') {
      list = list.filter((r) => r.trainingType === moduleTypeFilter)
    }

    if (q) {
      list = list.filter((r) => {
        const n = `${r.name}`.toLowerCase()
        const e = `${r.email}`.toLowerCase()
        const employeeId = `${r.employeeCode ?? ''}`.toLowerCase()
        return n.includes(q) || e.includes(q) || employeeId.includes(q)
      })
    }

    const dir = sortOrder === 'newest' ? -1 : 1
    return [...list].sort((a, b) => {
      const ta = a.sortDate ? new Date(a.sortDate).getTime() : 0
      const tb = b.sortDate ? new Date(b.sortDate).getTime() : 0
      if (ta === tb) return a.key.localeCompare(b.key)
      return (ta - tb) * dir
    })
  }, [allRows, outcomeFilter, userTypeFilter, moduleTypeFilter, search, sortOrder])

  async function handleCopy(key, link) {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(key)
      setTimeout(() => setCopiedId(null), 1200)
    } catch (_error) {
      setCopiedId(null)
    }
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }} justifyContent="space-between">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 0.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(227, 27, 35, 0.12) 0%, rgba(51, 48, 146, 0.14) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
              }}
            >
              <AssessmentIcon sx={{ color: '#312e81', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Induction &amp; Training Reports
              </Typography>
            </Box>
          </Stack>
          <Typography sx={{ color: '#64748b', mt: 0.75, width: '100%', lineHeight: 1.6 }}>
            Quiz attempt history and open progress for Safety Induction and Training Module assignments. Each card is one
            submission or one in-progress recipient who has not yet submitted a quiz (where applicable).
          </Typography>
        </Box>
      </Stack>

      <Card elevation={0} sx={cardSx}>
        <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', lg: 'flex-end' }}
            flexWrap="wrap"
          >
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel id="reports-outcome-label">Outcome</InputLabel>
              <Select
                labelId="reports-outcome-label"
                label="Outcome"
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                sx={{ borderRadius: 1.75 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="passed">Passed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="opened">Opened</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel id="reports-user-type-label">User type</InputLabel>
              <Select
                labelId="reports-user-type-label"
                label="User type"
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
                sx={{ borderRadius: 1.75 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="non-employee">Non-Employee</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel id="reports-module-type-label">Module type</InputLabel>
              <Select
                labelId="reports-module-type-label"
                label="Module type"
                value={moduleTypeFilter}
                onChange={(e) => setModuleTypeFilter(e.target.value)}
                sx={{ borderRadius: 1.75 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="safety_induction">Safety Induction</MenuItem>
                <MenuItem value="general_training">Training Module</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel id="reports-sort-label">Date order</InputLabel>
              <Select
                labelId="reports-sort-label"
                label="Date order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                sx={{ borderRadius: 1.75 }}
              >
                <MenuItem value="newest">Newest first</MenuItem>
                <MenuItem value="oldest">Oldest first</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Search name, email, or employee ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flexGrow: 1, minWidth: { xs: '100%', md: 240 }, '& .MuiOutlinedInput-root': { borderRadius: 1.75 } }}
            />
            <Typography variant="body2" sx={{ color: '#64748b', alignSelf: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {filteredSorted.length} report{filteredSorted.length === 1 ? '' : 's'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {filteredSorted.length === 0 ? (
        <Card elevation={0} sx={cardSx}>
          <CardContent sx={{ py: 5, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>No reports match your filters</Typography>
            <Typography sx={{ color: '#64748b', maxWidth: 480, mx: 'auto' }}>
              Try clearing the search or setting Outcome to &quot;All&quot;. Opened-only rows appear when a recipient has opened or
              started the induction but has no quiz attempts logged yet.
            </Typography>
            {outcomeFilter !== 'all' || userTypeFilter !== 'all' || moduleTypeFilter !== 'all' || search.trim() ? (
              <Button
                variant="outlined"
                sx={{ mt: 2, borderRadius: 1.75, fontWeight: 700 }}
                onClick={() => {
                  setOutcomeFilter('all')
                  setUserTypeFilter('all')
                  setModuleTypeFilter('all')
                  setSearch('')
                }}
              >
                Reset filters
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {filteredSorted.map((row) => (
            <ReportCard key={row.key} row={row} copiedId={copiedId} onCopy={handleCopy} />
          ))}
        </Box>
      )}
    </Stack>
  )
}
