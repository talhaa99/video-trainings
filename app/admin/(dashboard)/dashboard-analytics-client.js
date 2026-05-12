'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {
  Assessment,
  CalendarToday,
  Description,
  FileDownload,
  MenuBook,
  PeopleAlt,
  School,
  WorkspacePremium,
} from '@mui/icons-material'
import {
  getCurrentUtcYear,
  getUtcCustomDayRangeBounds,
  getUtcMonthBounds,
  getUtcQuarterBounds,
  getUtcYearBounds,
} from '../../../lib/admin/dashboard-analytics-range'
import { exportDashboardExcel, exportDashboardPdf } from './dashboard-analytics-export'
import AnalyticsCharts from './dashboard-analytics-charts'

const FILTER_SESSION_KEY = 'petrogas-admin-dashboard-analytics-filters-v1'

const kpiCardSx = {
  borderRadius: 2,
  border: '1px solid rgba(148, 163, 184, 0.22)',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.96) 100%)',
  boxShadow: '0 1px 0 rgba(15, 23, 42, 0.04)',
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
  '&:hover': {
    borderColor: 'rgba(13, 148, 136, 0.38)',
    boxShadow: '0 8px 22px rgba(15, 23, 42, 0.07)',
    transform: 'translateY(-1px)',
  },
}

const toolbarToggleGroupSx = {
  flexWrap: 'wrap',
  bgcolor: '#ffffff',
  border: '1px solid #94a3b8',
  borderRadius: 2,
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
  '& .MuiToggleButton-root': {
    px: { xs: 1, sm: 1.25 },
    py: 0.65,
    fontSize: '0.8125rem',
    fontWeight: 700,
    textTransform: 'none',
    borderColor: 'transparent',
    '&:not(.Mui-selected)': {
      color: '#1e293b',
    },
    '&:hover': {
      bgcolor: 'rgba(13, 148, 136, 0.1)',
      color: '#0f766e',
    },
    '&.Mui-selected': {
      bgcolor: '#0f766e',
      color: '#ffffff',
      fontWeight: 800,
      '&:hover': {
        bgcolor: '#0d9488',
        color: '#ffffff',
      },
    },
  },
}

const toolbarSelectFormSx = {
  '& .MuiInputLabel-root': {
    color: '#334155',
    fontWeight: 700,
    fontSize: '0.8rem',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#0f766e',
  },
  '& .MuiOutlinedInput-root': {
    bgcolor: '#ffffff',
    fontWeight: 600,
    color: '#0f172a',
    '& fieldset': {
      borderColor: '#94a3b8',
      borderWidth: 1,
    },
    '&:hover fieldset': {
      borderColor: '#64748b',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0f766e',
      borderWidth: 2,
    },
  },
  '& .MuiSelect-icon': {
    color: '#475569',
  },
}

const toolbarExportBtnSx = {
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: 2,
  px: 1.25,
  py: 0.5,
  minHeight: 36,
  color: '#0f766e',
  borderColor: '#0f766e',
  bgcolor: '#ffffff',
  '&:hover': {
    borderColor: '#0d9488',
    bgcolor: 'rgba(13, 148, 136, 0.08)',
    color: '#0d9488',
  },
  '&.Mui-disabled': {
    borderColor: 'rgba(148, 163, 184, 0.5)',
    color: 'rgba(100, 116, 139, 0.7)',
  },
}

const toolbarDateFieldSx = {
  minWidth: { xs: 148, sm: 158 },
  '& .MuiOutlinedInput-root': {
    bgcolor: '#ffffff',
    fontWeight: 600,
    color: '#0f172a',
    '& fieldset': {
      borderColor: '#94a3b8',
      borderWidth: 1,
    },
    '&:hover fieldset': {
      borderColor: '#64748b',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0f766e',
      borderWidth: 2,
    },
  },
  '& .MuiInputLabel-root': {
    color: '#334155',
    fontWeight: 700,
    fontSize: '0.8rem',
  },
  '& input::-webkit-calendar-picker-indicator': {
    cursor: 'pointer',
    opacity: 1,
  },
}

function tryOpenNativeDatePickerFromEvent(e) {
  const root = e.currentTarget
  const input =
    root instanceof HTMLInputElement && root.type === 'date'
      ? root
      : root.querySelector?.('input[type="date"]')
  if (input instanceof HTMLInputElement && typeof input.showPicker === 'function') {
    try {
      input.showPicker()
    } catch {
      // Some browsers restrict showPicker; native control still works via icon/typing.
    }
  }
}

function openDatePickerFromRef(ref) {
  const el = ref?.current
  if (el && typeof el.showPicker === 'function') {
    try {
      el.showPicker()
    } catch {
      // ignore
    }
  } else if (el) {
    el.focus()
  }
}

function rangeKey(from, to) {
  return `${from.toISOString()}|${to.toISOString()}`
}

function defaultFilter(year) {
  const now = new Date()
  return {
    mode: 'year',
    calendarYear: year,
    quarter: Math.floor(now.getUTCMonth() / 3) + 1,
    month: now.getUTCMonth() + 1,
    customFrom: '',
    customTo: '',
  }
}

function getRangeFromFilter(filter) {
  const y = Number(filter.calendarYear) || getCurrentUtcYear()
  switch (filter.mode) {
    case 'year': {
      const { from, to } = getUtcYearBounds(y)
      return { from, to, label: `Calendar year ${y} (UTC)` }
    }
    case 'quarter': {
      const q = Number(filter.quarter) || 1
      const { from, to } = getUtcQuarterBounds(y, q)
      return { from, to, label: `Q${q} ${y} (UTC)` }
    }
    case 'month': {
      const m = Number(filter.month) || 1
      const { from, to } = getUtcMonthBounds(y, m)
      return { from, to, label: `Month ${m}/${y} (UTC)` }
    }
    case 'custom': {
      const bounds = getUtcCustomDayRangeBounds(filter.customFrom, filter.customTo)
      if (!bounds) return null
      return { ...bounds, label: 'Custom range (UTC days)' }
    }
    default:
      return { ...getUtcYearBounds(y), label: `Calendar year ${y} (UTC)` }
  }
}

function monthNameUtc(m) {
  return new Date(Date.UTC(2000, m - 1, 1)).toLocaleString('en-GB', { month: 'short' })
}

/** Short label for header "Showing: …" */
function compactPeriodLine(filter) {
  const cy = getCurrentUtcYear()
  if (filter.mode === 'year') {
    if (filter.calendarYear === cy) return `${cy}`
    if (filter.calendarYear === cy - 1) return `${filter.calendarYear}`
    return `${filter.calendarYear}`
  }
  if (filter.mode === 'quarter') return `Q${filter.quarter} ${filter.calendarYear}`
  if (filter.mode === 'month') return `${monthNameUtc(filter.month)} ${filter.calendarYear}`
  if (filter.mode === 'custom' && filter.customFrom && filter.customTo) return `${filter.customFrom} → ${filter.customTo}`
  return '—'
}

function periodToggleGroupValue(filter) {
  const cy = getCurrentUtcYear()
  if (filter.mode === 'custom') return 'custom'
  if (filter.mode === 'quarter') return 'quarter'
  if (filter.mode === 'month') return 'month'
  if (filter.mode === 'year' && filter.calendarYear === cy) return 'year_current'
  if (filter.mode === 'year' && filter.calendarYear === cy - 1) return 'year_prev'
  return null
}

export default function DashboardAnalyticsClient({ initialYear, initialAnalytics, initialRangeKey }) {
  const baseYear = initialYear ?? getCurrentUtcYear()
  const [filter, setFilter] = useState(() => defaultFilter(baseYear))
  const [sessionReady, setSessionReady] = useState(false)
  const [analytics, setAnalytics] = useState(initialAnalytics)
  const [loading, setLoading] = useState(false)
  const [exportKind, setExportKind] = useState(null)
  const [error, setError] = useState(null)
  const lastOkKeyRef = useRef(initialAnalytics && initialRangeKey ? initialRangeKey : '')
  const abortRef = useRef(null)
  const customFromInputRef = useRef(null)
  const customToInputRef = useRef(null)
  const initialAnalyticsRef = useRef(initialAnalytics)
  initialAnalyticsRef.current = initialAnalytics

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FILTER_SESSION_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          const allowed = new Set(['year', 'quarter', 'month', 'custom'])
          const mode = allowed.has(parsed.mode) ? parsed.mode : 'year'
          const def = defaultFilter(baseYear)
          setFilter({
            ...def,
            mode,
            calendarYear: Number.isFinite(Number(parsed.calendarYear)) ? Number(parsed.calendarYear) : def.calendarYear,
            quarter: Number.isFinite(Number(parsed.quarter)) ? Math.min(4, Math.max(1, Number(parsed.quarter))) : def.quarter,
            month: Number.isFinite(Number(parsed.month)) ? Math.min(12, Math.max(1, Number(parsed.month))) : def.month,
            customFrom: typeof parsed.customFrom === 'string' ? parsed.customFrom : '',
            customTo: typeof parsed.customTo === 'string' ? parsed.customTo : '',
          })
        }
      }
    } catch {
      // ignore
    }
    setSessionReady(true)
  }, [baseYear])

  useEffect(() => {
    try {
      sessionStorage.setItem(FILTER_SESSION_KEY, JSON.stringify(filter))
    } catch {
      // ignore
    }
  }, [filter])

  const loadRange = useCallback(async (from, to) => {
    const key = rangeKey(from, to)
    if (key === lastOkKeyRef.current) {
      return
    }
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const ac = new AbortController()
    abortRef.current = ac
    setLoading(true)
    setError(null)
    try {
      const url = `/api/admin/analytics?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`
      const res = await fetch(url, { signal: ac.signal })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to load analytics.')
      }
      if (ac.signal.aborted) {
        return
      }
      setAnalytics(data)
      lastOkKeyRef.current = key
    } catch (e) {
      if (e?.name === 'AbortError') {
        return
      }
      lastOkKeyRef.current = ''
      setError(e instanceof Error ? e.message : 'Unable to load analytics.')
    } finally {
      if (!ac.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  const serializedFilter = useMemo(() => JSON.stringify(filter), [filter])

  useEffect(() => {
    if (!sessionReady) return

    const parsed = JSON.parse(serializedFilter)
    const range = getRangeFromFilter(parsed)
    if (!range) {
      setError('Choose a valid custom UTC date range (start ≤ end).')
      return
    }

    const key = rangeKey(range.from, range.to)
    if (key === initialRangeKey && initialAnalyticsRef.current) {
      setAnalytics(initialAnalyticsRef.current)
      lastOkKeyRef.current = key
      setError(null)
      return
    }

    if (parsed.mode === 'custom') {
      if (!parsed.customFrom || !parsed.customTo) {
        return
      }
      const t = setTimeout(() => {
        void loadRange(range.from, range.to)
      }, 450)
      return () => clearTimeout(t)
    }

    void loadRange(range.from, range.to)
    return undefined
  }, [sessionReady, serializedFilter, initialRangeKey, loadRange])

  const yearOptions = useMemo(() => {
    const y = getCurrentUtcYear()
    return Array.from({ length: 8 }, (_, i) => y - i)
  }, [])

  const exportBusy = loading || !analytics
  const exportLocked = exportBusy || exportKind !== null

  async function handleExportExcel() {
    if (!analytics || exportKind) return
    setExportKind('excel')
    try {
      await exportDashboardExcel(analytics)
    } finally {
      setExportKind(null)
    }
  }

  async function handleExportPdf() {
    if (!analytics || exportKind) return
    setExportKind('pdf')
    try {
      await exportDashboardPdf(analytics)
    } finally {
      setExportKind(null)
    }
  }
  const cy = getCurrentUtcYear()

  const onPeriodSegment = useCallback((_, value) => {
    if (value == null) return
    if (value === 'year_current') {
      setFilter((f) => ({ ...f, mode: 'year', calendarYear: cy }))
      return
    }
    if (value === 'year_prev') {
      setFilter((f) => ({ ...f, mode: 'year', calendarYear: cy - 1 }))
      return
    }
    if (value === 'quarter') {
      setFilter((f) => ({
        ...f,
        mode: 'quarter',
        calendarYear: cy,
        quarter: Math.floor(new Date().getUTCMonth() / 3) + 1,
      }))
      return
    }
    if (value === 'month') {
      setFilter((f) => ({
        ...f,
        mode: 'month',
        calendarYear: cy,
        month: new Date().getUTCMonth() + 1,
      }))
      return
    }
    if (value === 'custom') {
      setFilter((f) => ({ ...f, mode: 'custom' }))
    }
  }, [cy])

  const showingLine = useMemo(() => compactPeriodLine(filter), [filter])
  const toggleGroupValue = useMemo(() => periodToggleGroupValue(filter), [filter])

  return (
    <Box sx={{ width: '100%', maxWidth: 1320, mx: 'auto' }}>
      <Stack spacing={{ xs: 1.75, md: 2.25 }}>
        {/* Executive header + toolbar */}
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={{ xs: 1.75, lg: 2 }}
          alignItems={{ lg: 'flex-start' }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '1.65rem' } }}>
              Dashboard overview
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.65,
                color: '#475569',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              Showing: {showingLine} • UTC
            </Typography>
          </Box>

          <Stack
            direction="row"
            flexWrap="wrap"
            spacing={1}
            useFlexGap
            alignItems="center"
            justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}
            sx={{
              rowGap: 1,
              columnGap: 1,
              flexShrink: 0,
              width: { xs: '100%', lg: 'auto' },
              minWidth: { lg: 320 },
              alignSelf: { xs: 'stretch', lg: 'flex-end' },
            }}
          >
              <ToggleButtonGroup
                exclusive
                size="small"
                value={toggleGroupValue}
                onChange={onPeriodSegment}
                aria-label="Period preset"
                sx={toolbarToggleGroupSx}
              >
                <ToggleButton value="year_current">This year</ToggleButton>
                <ToggleButton value="year_prev">Last year</ToggleButton>
                <ToggleButton value="quarter">Quarter</ToggleButton>
                <ToggleButton value="month">Month</ToggleButton>
                <ToggleButton value="custom">Custom</ToggleButton>
              </ToggleButtonGroup>

              {filter.mode !== 'custom' ? (
                <FormControl size="small" sx={{ ...toolbarSelectFormSx, minWidth: 120, maxWidth: { xs: '100%', sm: 150 } }}>
                  <InputLabel id="dash-year-label">Year</InputLabel>
                  <Select
                    labelId="dash-year-label"
                    label="Year"
                    value={filter.calendarYear}
                    onChange={(e) => setFilter((f) => ({ ...f, calendarYear: Number(e.target.value) }))}
                  >
                    {yearOptions.map((yy) => (
                      <MenuItem key={yy} value={yy}>
                        {yy}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}

              {filter.mode === 'quarter' ? (
                <FormControl size="small" sx={{ ...toolbarSelectFormSx, minWidth: 104, maxWidth: { xs: '100%', sm: 128 } }}>
                  <InputLabel id="dash-q-label">Q</InputLabel>
                  <Select
                    labelId="dash-q-label"
                    label="Q"
                    value={filter.quarter}
                    onChange={(e) => setFilter((f) => ({ ...f, quarter: Number(e.target.value) }))}
                  >
                    {[1, 2, 3, 4].map((q) => (
                      <MenuItem key={q} value={q}>
                        Q{q}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}

              {filter.mode === 'month' ? (
                <FormControl size="small" sx={{ ...toolbarSelectFormSx, minWidth: 132, maxWidth: { xs: '100%', sm: 170 } }}>
                  <InputLabel id="dash-m-label">Month</InputLabel>
                  <Select
                    labelId="dash-m-label"
                    label="Month"
                    value={filter.month}
                    onChange={(e) => setFilter((f) => ({ ...f, month: Number(e.target.value) }))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <MenuItem key={m} value={m}>
                        {new Date(Date.UTC(2000, m - 1, 1)).toLocaleString('en-GB', { month: 'long' })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}

              {filter.mode === 'custom' ? (
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <TextField
                    type="date"
                    size="small"
                    label="Start (UTC)"
                    InputLabelProps={{ shrink: true }}
                    inputRef={customFromInputRef}
                    value={filter.customFrom || ''}
                    onChange={(e) => setFilter((f) => ({ ...f, customFrom: e.target.value }))}
                    onClick={tryOpenNativeDatePickerFromEvent}
                    inputProps={{ 'aria-label': 'Start date UTC' }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            edge="end"
                            aria-label="Open calendar for start date"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation()
                              openDatePickerFromRef(customFromInputRef)
                            }}
                          >
                            <CalendarToday sx={{ fontSize: 18, color: '#475569' }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={toolbarDateFieldSx}
                  />
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                    to
                  </Typography>
                  <TextField
                    type="date"
                    size="small"
                    label="End (UTC)"
                    InputLabelProps={{ shrink: true }}
                    inputRef={customToInputRef}
                    value={filter.customTo || ''}
                    onChange={(e) => setFilter((f) => ({ ...f, customTo: e.target.value }))}
                    onClick={tryOpenNativeDatePickerFromEvent}
                    inputProps={{ 'aria-label': 'End date UTC' }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            edge="end"
                            aria-label="Open calendar for end date"
                            tabIndex={-1}
                            onClick={(e) => {
                              e.stopPropagation()
                              openDatePickerFromRef(customToInputRef)
                            }}
                          >
                            <CalendarToday sx={{ fontSize: 18, color: '#475569' }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={toolbarDateFieldSx}
                  />
                </Stack>
              ) : null}

              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{ ml: { xs: 0, lg: 'auto' }, flexWrap: 'nowrap' }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    exportKind === 'excel' ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <FileDownload sx={{ fontSize: 18, color: 'inherit' }} />
                    )
                  }
                  disabled={exportLocked}
                  onClick={() => void handleExportExcel()}
                  sx={toolbarExportBtnSx}
                >
                  {exportKind === 'excel' ? 'Exporting…' : 'Excel'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={
                    exportKind === 'pdf' ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Description sx={{ fontSize: 18, color: 'inherit' }} />
                    )
                  }
                  disabled={exportLocked}
                  onClick={() => void handleExportPdf()}
                  sx={toolbarExportBtnSx}
                >
                  {exportKind === 'pdf' ? 'Exporting…' : 'PDF'}
                </Button>
              </Stack>
          </Stack>
        </Stack>

        {error ? (
          <Alert severity="error" onClose={() => setError(null)} sx={{ py: 0.5 }}>
            {error}
          </Alert>
        ) : null}

        {/* KPI strip */}
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 1, sm: 1.25 },
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              lg: 'repeat(5, minmax(0, 1fr))',
            },
            opacity: loading ? 0.72 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          <KpiTile
            label="Reports"
            value={fmtCount(analytics?.activity?.reportsSubmitted)}
            hint="Submitted"
            icon={<Assessment sx={{ fontSize: 18 }} />}
            href="/admin/reports"
          />
          <KpiTile
            label="Certificates"
            value={fmtCount(analytics?.activity?.certificatesIssued)}
            hint="Passed"
            icon={<WorkspacePremium sx={{ fontSize: 18 }} />}
            href="/admin/certificates"
          />
          <KpiTile
            label="Inductions"
            value={fmtCount(analytics?.assignments?.safetyInduction?.total)}
            hint="Assignments"
            icon={<MenuBook sx={{ fontSize: 18 }} />}
            href="/admin/inductions"
          />
          <KpiTile
            label="Training"
            value={fmtCount(analytics?.assignments?.generalTraining?.total)}
            hint="Assignments"
            icon={<School sx={{ fontSize: 18 }} />}
            href="/admin/training"
          />
          <KpiTile
            label="Employees"
            value={fmtCount(analytics?.employees?.newInPeriod)}
            hint={
              analytics?.employees?.totalRegisteredThroughPeriodEnd != null &&
              Number(analytics.employees.totalRegisteredThroughPeriodEnd) !== Number(analytics.employees.newInPeriod)
                ? `${analytics.employees.totalRegisteredThroughPeriodEnd} total`
                : undefined
            }
            icon={<PeopleAlt sx={{ fontSize: 18 }} />}
            href="/admin/employees"
          />
        </Box>

        {loading && !analytics ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={280} sx={{ borderRadius: 2 }} />
          </Stack>
        ) : analytics ? (
          <AnalyticsCharts analytics={analytics} />
        ) : (
          <Alert severity="info">No analytics loaded. Adjust filters or retry.</Alert>
        )}
      </Stack>
    </Box>
  )
}

function fmtCount(v) {
  if (v == null) return '—'
  return String(v)
}

function KpiTile({ label, value, hint, icon, href }) {
  const inner = (
    <Stack direction="row" spacing={1.15} alignItems="flex-start" sx={{ minWidth: 0 }}>
      <Box
        sx={{
          color: '#0d9488',
          mt: 0.1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 1.5,
          bgcolor: 'rgba(13, 148, 136, 0.08)',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.02em', display: 'block', lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.35rem' }, lineHeight: 1.15, mt: 0.2 }}>
          {value}
        </Typography>
        {hint ? (
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.35, lineHeight: 1.35, fontWeight: 500 }}>
            {hint}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  )

  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Box sx={{ ...kpiCardSx, height: '100%', px: 1.35, py: 1.15, cursor: 'pointer' }}>{inner}</Box>
    </Link>
  )
}
