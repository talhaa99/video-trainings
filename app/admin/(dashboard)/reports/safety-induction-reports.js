'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material'
import {
  Assessment as AssessmentIcon,
  ContentCopy as ContentCopyIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material'
import {
  TrainingModuleFilter,
  generalTrainingFilterKindFromAttempt,
  matchesTrainingModuleFilter,
  titleGeneralTrainingFromAttempt,
  titleGeneralTrainingProgram,
  titleSafetyInduction,
} from '../../../../lib/admin/training-module-display'
import { exportTrainingReportsExcel, exportTrainingReportsPdf } from './training-reports-export'

const cardSx = {
  borderRadius: 2.5,
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
}

function formatTimestamp(dateValue) {
  if (!dateValue) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
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
    const isEmployee = a.recipient_type === 'employee'
    const name = isEmployee ? a.employee_name : a.external_name
    const email = isEmployee ? a.employee_email : a.external_email
    const employeeCode = isEmployee ? a.employee_code : null
    const attempts = normalizeAttempts(a.quiz_attempts)

    for (const att of attempts) {
      const passed = att?.quizPassed === true
      const failed = att?.quizPassed === false
      const trainingTitle =
        trainingType === 'safety_induction' ? titleSafetyInduction() : titleGeneralTrainingFromAttempt(att)
      const moduleFilterKind =
        trainingType === 'safety_induction'
          ? TrainingModuleFilter.SAFETY_INDUCTION
          : generalTrainingFilterKindFromAttempt(att)
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
        trainingTitle,
        trainingType,
        moduleFilterKind,
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
      const trainingTitle =
        trainingType === 'safety_induction' ? titleSafetyInduction() : titleGeneralTrainingProgram()
      const moduleFilterKind =
        trainingType === 'safety_induction'
          ? TrainingModuleFilter.SAFETY_INDUCTION
          : TrainingModuleFilter.PROGRAM
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
        outcomeLabel: 'In progress',
        trainingTitle,
        trainingType,
        moduleFilterKind,
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

function parseDayStart(s) {
  if (!s) return null
  const t = new Date(`${s}T00:00:00`).getTime()
  return Number.isNaN(t) ? null : t
}

function parseDayEnd(s) {
  if (!s) return null
  const t = new Date(`${s}T23:59:59.999`).getTime()
  return Number.isNaN(t) ? null : t
}

function rowInDateRange(row, fromStr, toStr) {
  if (!fromStr && !toStr) return true
  const t = row.sortDate ? new Date(row.sortDate).getTime() : NaN
  if (!Number.isFinite(t)) return false
  const start = parseDayStart(fromStr) ?? -Infinity
  const end = parseDayEnd(toStr) ?? Infinity
  return t >= start && t <= end
}

function applyDatePreset(preset) {
  const to = new Date()
  const toStr = to.toISOString().slice(0, 10)
  if (preset === 'all') return { from: '', to: '' }
  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30
  const from = new Date(to)
  from.setDate(from.getDate() - days)
  return { from: from.toISOString().slice(0, 10), to: toStr }
}

function formatPeriodLabel(fromStr, toStr) {
  if (!fromStr && !toStr) return 'All dates'
  if (fromStr && toStr) return `${fromStr} → ${toStr} (inclusive)`
  if (fromStr) return `From ${fromStr}`
  return `Through ${toStr}`
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

function scoreCell(row) {
  if (row.kind !== 'attempt') return '—'
  if (row.trainingType === 'general_training') {
    return row.quizScore != null ? String(row.quizScore) : '—'
  }
  return row.quizScore != null ? `${row.quizScore} / 5` : '—'
}

function buildSummaryLines(rows) {
  const passed = rows.filter((r) => r.outcome === 'passed').length
  const failed = rows.filter((r) => r.outcome === 'failed').length
  const opened = rows.filter((r) => r.outcome === 'opened').length
  const submitted = rows.filter((r) => r.outcome === 'submitted').length
  return [
    ['Total rows', rows.length],
    ['Passed', passed],
    ['Failed', failed],
    ['Submitted (pending scoring)', submitted],
    ['In progress (opened, no quiz yet)', opened],
  ]
}

export default function SafetyInductionReports({ assignments }) {
  const [datePreset, setDatePreset] = useState('30d')
  const [dateFrom, setDateFrom] = useState(() => applyDatePreset('30d').from)
  const [dateTo, setDateTo] = useState(() => applyDatePreset('30d').to)
  const [outcomeFilter, setOutcomeFilter] = useState('all')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [moduleTypeFilter, setModuleTypeFilter] = useState(TrainingModuleFilter.ALL)
  const [sortOrder, setSortOrder] = useState('newest')
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [exportKind, setExportKind] = useState(null)

  const allRows = useMemo(() => buildReportRows(assignments), [assignments])

  const filteredSorted = useMemo(() => {
    let list = allRows.filter((r) => rowInDateRange(r, dateFrom, dateTo))

    if (outcomeFilter !== 'all') {
      list = list.filter((r) => r.outcome === outcomeFilter)
    }

    if (userTypeFilter === 'employee') {
      list = list.filter((r) => r.recipientType === 'employee')
    } else if (userTypeFilter === 'non-employee') {
      list = list.filter((r) => r.recipientType !== 'employee')
    }

    if (moduleTypeFilter !== TrainingModuleFilter.ALL) {
      list = list.filter((r) => matchesTrainingModuleFilter(r, moduleTypeFilter))
    }

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((r) => {
        const n = `${r.name}`.toLowerCase()
        const e = `${r.email}`.toLowerCase()
        const employeeId = `${r.employeeCode ?? ''}`.toLowerCase()
        const title = `${r.trainingTitle ?? ''}`.toLowerCase()
        return n.includes(q) || e.includes(q) || employeeId.includes(q) || title.includes(q)
      })
    }

    const dir = sortOrder === 'newest' ? -1 : 1
    return [...list].sort((a, b) => {
      const ta = a.sortDate ? new Date(a.sortDate).getTime() : 0
      const tb = b.sortDate ? new Date(b.sortDate).getTime() : 0
      if (ta === tb) return a.key.localeCompare(b.key)
      return (ta - tb) * dir
    })
  }, [allRows, dateFrom, dateTo, outcomeFilter, userTypeFilter, moduleTypeFilter, search, sortOrder])

  const summaryLines = useMemo(() => buildSummaryLines(filteredSorted), [filteredSorted])

  const periodLabel = formatPeriodLabel(dateFrom, dateTo)

  useEffect(() => {
    setPage(0)
  }, [filteredSorted.length, dateFrom, dateTo, outcomeFilter, userTypeFilter, moduleTypeFilter, search, sortOrder])

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage
    return filteredSorted.slice(start, start + rowsPerPage)
  }, [filteredSorted, page, rowsPerPage])

  async function handleCopy(key, link) {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(key)
      setTimeout(() => setCopiedId(null), 1200)
    } catch (_error) {
      setCopiedId(null)
    }
  }

  function handlePeriodSelect(value) {
    if (value === 'custom') {
      setDatePreset(null)
      return
    }
    setDatePreset(value)
    const { from, to } = applyDatePreset(value)
    setDateFrom(from)
    setDateTo(to)
  }

  function resetFilters() {
    setOutcomeFilter('all')
    setUserTypeFilter('all')
    setModuleTypeFilter(TrainingModuleFilter.ALL)
    setSearch('')
    setSortOrder('newest')
    setDatePreset('30d')
    const d = applyDatePreset('30d')
    setDateFrom(d.from)
    setDateTo(d.to)
  }

  async function runExport(kind) {
    if (filteredSorted.length === 0 || exportKind) return
    setExportKind(kind)
    try {
      const meta = { periodLabel, summaryLines }
      if (kind === 'excel') {
        await exportTrainingReportsExcel(filteredSorted, meta)
      } else {
        await exportTrainingReportsPdf(filteredSorted, meta)
      }
    } finally {
      setExportKind(null)
    }
  }

  const hasActiveFilters =
    outcomeFilter !== 'all' ||
    userTypeFilter !== 'all' ||
    moduleTypeFilter !== TrainingModuleFilter.ALL ||
    Boolean(search.trim()) ||
    datePreset !== '30d'

  const periodSelectValue = ['7d', '30d', '90d', 'all'].includes(datePreset) ? datePreset : 'custom'

  return (
    <Stack spacing={2.5}>
      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }} justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
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
                flexShrink: 0,
              }}
            >
              <AssessmentIcon sx={{ color: '#312e81', fontSize: 26 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Training Activity Report
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
            <Button
              variant="contained"
              startIcon={
                exportKind === 'excel' ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <DescriptionIcon />
                )
              }
              disabled={exportKind !== null || filteredSorted.length === 0}
              onClick={() => void runExport('excel')}
              sx={{
                borderRadius: 1.75,
                minHeight: 40,
                px: 2,
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
              }}
            >
              {exportKind === 'excel' ? 'Exporting…' : 'Excel'}
            </Button>
            <Button
              variant="outlined"
              startIcon={
                exportKind === 'pdf' ? (
                  <CircularProgress size={18} sx={{ color: '#334155' }} />
                ) : (
                  <PictureAsPdfIcon />
                )
              }
              disabled={exportKind !== null || filteredSorted.length === 0}
              onClick={() => void runExport('pdf')}
              sx={{ borderRadius: 1.75, fontWeight: 700, textTransform: 'none', borderColor: 'rgba(148, 163, 184, 0.45)', color: '#334155' }}
            >
              {exportKind === 'pdf' ? 'Exporting…' : 'PDF'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Card elevation={0} sx={cardSx}>
        <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'flex-end' }} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
              <InputLabel id="reports-period-label">Quick period</InputLabel>
              <Select
                labelId="reports-period-label"
                label="Quick period"
                value={periodSelectValue}
                onChange={(e) => handlePeriodSelect(e.target.value)}
                sx={{ borderRadius: 1.75 }}
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
                <MenuItem value="all">All time</MenuItem>
                <MenuItem value="custom">Custom (use dates below)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="From"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setDatePreset(null)
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: { xs: '100%', sm: 158 }, '& .MuiOutlinedInput-root': { borderRadius: 1.75 } }}
            />
            <TextField
              size="small"
              label="To"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setDatePreset(null)
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: { xs: '100%', sm: 158 }, '& .MuiOutlinedInput-root': { borderRadius: 1.75 } }}
            />

            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
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
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="opened">In progress</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
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
              <InputLabel id="reports-module-type-label">Training</InputLabel>
              <Select
                labelId="reports-module-type-label"
                label="Training"
                value={moduleTypeFilter}
                onChange={(e) => setModuleTypeFilter(e.target.value)}
                sx={{ borderRadius: 1.75 }}
              >
                <MenuItem value={TrainingModuleFilter.ALL}>All</MenuItem>
                <MenuItem value={TrainingModuleFilter.SAFETY_INDUCTION}>Safety Induction</MenuItem>
                <MenuItem value={TrainingModuleFilter.FIRE}>Firefighter training</MenuItem>
                <MenuItem value={TrainingModuleFilter.CPR}>CPR training</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
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
              label="Search"
              placeholder="Name, email, employee ID, or training"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flexGrow: 1, minWidth: { xs: '100%', md: 220 }, '& .MuiOutlinedInput-root': { borderRadius: 1.75 } }}
            />

            {hasActiveFilters ? (
              <Button variant="outlined" onClick={resetFilters} sx={{ borderRadius: 1.75, fontWeight: 700, textTransform: 'none', alignSelf: { xs: 'stretch', lg: 'center' } }}>
                Reset filters
              </Button>
            ) : null}

            <Typography variant="body2" sx={{ color: '#64748b', alignSelf: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {periodLabel} · {filteredSorted.length} row{filteredSorted.length === 1 ? '' : 's'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ ...cardSx, width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
        <CardContent sx={{ p: { xs: 1.75, md: 2.25 }, pt: { xs: 1.5, md: 2 } }}>
          <TableContainer
            sx={{
              width: '100%',
              maxWidth: '100%',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              mx: { xs: -0.5, sm: 0 },
              px: { xs: 0.5, sm: 0 },
            }}
          >
            <Table
              size="small"
              sx={{
                minWidth: 980,
                tableLayout: 'auto',
                '& .MuiTableCell-root': {
                  py: 0.9,
                  verticalAlign: 'middle',
                  borderBottomColor: 'rgba(148, 163, 184, 0.24)',
                  whiteSpace: 'nowrap',
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Activity</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Training</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Outcome</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Recipient</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Employee ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }} align="right">
                    Attempt
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }} align="right">
                    Score
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Assignment</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155', width: 64 }} align="right">
                    Link
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <Typography sx={{ color: '#64748b', py: 2, fontWeight: 600 }}>
                        No rows match your filters or date range. Try &quot;All time&quot;, reset filters, or widen the date window.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedRows.map((row) => (
                    <TableRow key={row.key} hover sx={{ '&:hover': { backgroundColor: 'rgba(148, 163, 184, 0.07)' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {formatTimestamp(row.sortDate)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                          {row.kind === 'attempt' ? 'Quiz submission' : 'Opened / started'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220, whiteSpace: 'normal' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {row.trainingTitle}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          {row.recipientType === 'employee' ? 'Employee' : 'External'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={row.outcomeLabel} sx={{ fontWeight: 700, borderRadius: 1.5, ...outcomeChipSx(row.outcome) }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</TableCell>
                      <TableCell sx={{ color: '#475569', maxWidth: 200 }} title={row.email}>
                        <Typography variant="body2" noWrap>
                          {row.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>{row.employeeCode ?? '—'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {row.attemptNumber ?? '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {scoreCell(row)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                          #{row.assignmentId}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                          {row.assignmentStatus || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {row.linkUrl ? (
                          <Tooltip title={copiedId === row.key ? 'Copied' : 'Copy assignment link'} arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(row.key, row.linkUrl)}
                              sx={{
                                borderRadius: 1.25,
                                p: 0.8,
                                color: '#475569',
                                '&:hover': { color: '#312e81', backgroundColor: 'rgba(51, 48, 146, 0.08)' },
                              }}
                            >
                              <ContentCopyIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            rowsPerPageOptions={[10, 25, 50, 100]}
            count={filteredSorted.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_e, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
            sx={{
              borderTop: '1px solid rgba(148, 163, 184, 0.28)',
              '& .MuiTablePagination-toolbar': { px: 0.5, py: 0.75 },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontWeight: 600, color: '#64748b' },
            }}
          />
        </CardContent>
      </Card>
    </Stack>
  )
}
