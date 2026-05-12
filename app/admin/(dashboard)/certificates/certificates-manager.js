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
  Typography,
} from '@mui/material'
import { WorkspacePremium as WorkspacePremiumIcon, Download as DownloadIcon } from '@mui/icons-material'
import CertificateModal from '../../../components/CertificateModal'

const cardSx = {
  borderRadius: 2.5,
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
}

function formatTimestamp(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
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

function toModuleLabel(trainingType) {
  return trainingType === 'general_training' ? 'Training Module' : 'Safety Induction'
}

function toScoreText(trainingType, scoreValue) {
  if (scoreValue == null) return '—'
  if (trainingType === 'safety_induction') return `${scoreValue}/5`
  return String(scoreValue)
}

function buildCertificateRows(assignments) {
  const rows = []

  for (const assignment of assignments) {
    const attempts = normalizeAttempts(assignment.quiz_attempts)
    const isEmployee = assignment.recipient_type === 'employee'
    const name = isEmployee ? assignment.employee_name : assignment.external_name
    const email = isEmployee ? assignment.employee_email : assignment.external_email
    const employeeCode = isEmployee ? assignment.employee_code : null
    const moduleLabel = toModuleLabel(assignment.training_type)

    const passedAttempts = attempts.filter(
      (attempt) => attempt?.quizPassed === true && attempt?.source !== 'module_quiz',
    )

    if (passedAttempts.length > 0) {
      for (const attempt of passedAttempts) {
        rows.push({
          key: `${assignment.id}-attempt-${attempt?.attemptNumber ?? 1}-${attempt?.submittedAt ?? ''}`,
          assignmentId: assignment.id,
          name: name || '—',
          email: email || '—',
          moduleType: assignment.training_type,
          moduleLabel,
          completionDate: attempt?.submittedAt || assignment.completed_at || assignment.quiz_submitted_at || null,
          sortDate: attempt?.submittedAt || assignment.completed_at || assignment.quiz_submitted_at || null,
          scoreValue: attempt?.quizScore ?? assignment.quiz_score ?? null,
          scoreText: toScoreText(assignment.training_type, attempt?.quizScore ?? assignment.quiz_score ?? null),
          attemptNumber: attempt?.attemptNumber ?? assignment.latest_attempt_number ?? null,
          recipientType: assignment.recipient_type,
          employeeCode,
          statusLabel: 'Certificate Issued',
          recipientNameForCertificate: name || 'Participant',
        })
      }
      continue
    }

    if (assignment.quiz_passed === true && assignment.quiz_submitted_at) {
      rows.push({
        key: `${assignment.id}-fallback`,
        assignmentId: assignment.id,
        name: name || '—',
        email: email || '—',
        moduleType: assignment.training_type,
        moduleLabel,
        completionDate: assignment.quiz_submitted_at || assignment.completed_at,
        sortDate: assignment.quiz_submitted_at || assignment.completed_at,
        scoreValue: assignment.quiz_score ?? null,
        scoreText: toScoreText(assignment.training_type, assignment.quiz_score ?? null),
        attemptNumber: assignment.latest_attempt_number ?? 1,
        recipientType: assignment.recipient_type,
        employeeCode,
        statusLabel: 'Certificate Issued',
        recipientNameForCertificate: name || 'Participant',
      })
    }
  }

  return rows
}

function CertificateCard({ row, onDownload }) {
  return (
    <Card elevation={0} sx={{ ...cardSx, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2.25, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }} noWrap title={row.name}>
              {row.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.35 }} noWrap title={row.email}>
              {row.email}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={row.statusLabel}
            sx={{
              borderRadius: 1.5,
              fontWeight: 700,
              backgroundColor: 'rgba(16, 185, 129, 0.16)',
              color: '#047857',
              flexShrink: 0,
            }}
          />
        </Stack>

        <Stack spacing={0.9} sx={{ mt: 1.6, flexGrow: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Module
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 700 }}>
              {row.moduleLabel}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Completion Date
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
              {formatTimestamp(row.completionDate)}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Score
            </Typography>
            <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
              {row.scoreText}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Attempt Number
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
              {row.attemptNumber ?? '—'}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              User Type
            </Typography>
            <Chip
              size="small"
              label={row.recipientType === 'employee' ? 'Employee' : 'Non-Employee'}
              sx={{ borderRadius: 1.5, fontWeight: 600, backgroundColor: 'rgba(15, 23, 42, 0.06)' }}
            />
          </Stack>
          {row.employeeCode ? (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                Employee ID
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                {row.employeeCode}
              </Typography>
            </Stack>
          ) : null}
        </Stack>

        <Box sx={{ mt: 1.6 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => onDownload(row)}
            sx={{
              borderRadius: 1.75,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
            }}
          >
            Download Certificate
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function CertificatesManager({ assignments }) {
  const [moduleTypeFilter, setModuleTypeFilter] = useState('all')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [search, setSearch] = useState('')
  const [downloadSignal, setDownloadSignal] = useState(0)
  const [downloadCertificateData, setDownloadCertificateData] = useState(null)

  const allRows = useMemo(() => buildCertificateRows(assignments), [assignments])

  const filteredRows = useMemo(() => {
    let rows = allRows
    const q = search.trim().toLowerCase()

    if (moduleTypeFilter !== 'all') {
      rows = rows.filter((row) => row.moduleType === moduleTypeFilter)
    }

    if (userTypeFilter === 'employee') {
      rows = rows.filter((row) => row.recipientType === 'employee')
    } else if (userTypeFilter === 'non-employee') {
      rows = rows.filter((row) => row.recipientType !== 'employee')
    }

    if (q) {
      rows = rows.filter((row) => {
        const n = `${row.name}`.toLowerCase()
        const e = `${row.email}`.toLowerCase()
        return n.includes(q) || e.includes(q)
      })
    }

    const dir = sortOrder === 'newest' ? -1 : 1
    return [...rows].sort((a, b) => {
      const ta = a.sortDate ? new Date(a.sortDate).getTime() : 0
      const tb = b.sortDate ? new Date(b.sortDate).getTime() : 0
      if (ta === tb) return a.key.localeCompare(b.key)
      return (ta - tb) * dir
    })
  }, [allRows, moduleTypeFilter, userTypeFilter, sortOrder, search])

  const handleDownload = (row) => {
    setDownloadCertificateData({
      recipientName: row.recipientNameForCertificate,
      moduleLabel: row.moduleLabel,
      scoreText: row.scoreText,
      completedAt: row.completionDate,
      attemptNumber: row.attemptNumber,
    })
    setDownloadSignal((prev) => prev + 1)
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
              <WorkspacePremiumIcon sx={{ color: '#312e81', fontSize: 26 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Certificates
            </Typography>
          </Stack>
          <Typography sx={{ color: '#64748b', mt: 0.75, lineHeight: 1.6 }}>
            View and download issued certificates for users who passed Safety Induction or Training Module assessments.
          </Typography>
        </Box>
      </Stack>

      <Card elevation={0} sx={cardSx}>
        <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'flex-end' }} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel id="cert-module-type-label">Module Type</InputLabel>
              <Select
                labelId="cert-module-type-label"
                label="Module Type"
                value={moduleTypeFilter}
                onChange={(event) => setModuleTypeFilter(event.target.value)}
                sx={{ borderRadius: 1.75 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="safety_induction">Safety Induction</MenuItem>
                <MenuItem value="general_training">Training Module</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel id="cert-user-type-label">User Type</InputLabel>
              <Select
                labelId="cert-user-type-label"
                label="User Type"
                value={userTypeFilter}
                onChange={(event) => setUserTypeFilter(event.target.value)}
                sx={{ borderRadius: 1.75 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="non-employee">Non-Employee</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel id="cert-sort-order-label">Date Order</InputLabel>
              <Select
                labelId="cert-sort-order-label"
                label="Date Order"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                sx={{ borderRadius: 1.75 }}
              >
                <MenuItem value="newest">Newest first</MenuItem>
                <MenuItem value="oldest">Oldest first</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Search by name or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ flexGrow: 1, minWidth: { xs: '100%', md: 240 }, '& .MuiOutlinedInput-root': { borderRadius: 1.75 } }}
            />

            <Typography variant="body2" sx={{ color: '#64748b', alignSelf: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {filteredRows.length} certificate{filteredRows.length === 1 ? '' : 's'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {filteredRows.length === 0 ? (
        <Card elevation={0} sx={cardSx}>
          <CardContent sx={{ py: 5, textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>No certificates found</Typography>
            <Typography sx={{ color: '#64748b', maxWidth: 480, mx: 'auto' }}>
              Passed users will appear here once their assessment is completed successfully. Adjust your filters to broaden
              the listing.
            </Typography>
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
          {filteredRows.map((row) => (
            <CertificateCard key={row.key} row={row} onDownload={handleDownload} />
          ))}
        </Box>
      )}

      <CertificateModal
        open={false}
        onClose={() => {}}
        directDownloadSignal={downloadSignal}
        certificateData={downloadCertificateData}
      />
    </Stack>
  )
}
