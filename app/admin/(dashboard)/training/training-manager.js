'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material'
import {
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  PlayCircleOutlined as PlayCircleOutlinedIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { getTrainingData } from '../../../../data/trainingData'
import AdminVideoPreviewDialog from '../admin-video-preview-dialog'
import { sendTrainingAction } from './actions'

const cardSx = {
  borderRadius: 2.5,
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
}

const initialActionState = {
  success: null,
  error: null,
  link: null,
}

function formatTimestamp(dateValue) {
  if (!dateValue) return '-'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateValue))
}

function toReadableStatus(status, row) {
  if (row.latest_attempt_passed === true) return 'Passed'
  if (row.latest_attempt_passed === false) return 'Failed'
  if (row.quiz_submitted_at && row.quiz_passed === true) return 'Passed'
  if (row.quiz_submitted_at && row.quiz_passed === false) return 'Failed'
  if (!row.started_at && !row.quiz_submitted_at) return 'Not Started'

  switch (status) {
    case 'completed_passed':
      return 'Passed'
    case 'completed_failed':
      return 'Failed'
    case 'completed':
      return 'Completed'
    case 'started':
      return 'Started'
    case 'opened':
      return 'Opened'
    case 'sent':
      return 'Sent'
    default:
      return status || 'Sent'
  }
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

function QuizAttemptsDialog({ open, row, onClose }) {
  const attempts = normalizeAttempts(row?.quiz_attempts)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Quiz Attempt History</DialogTitle>
      <DialogContent sx={{ pt: 1.25 }}>
        <Typography sx={{ color: '#64748b', mb: 1.5 }}>
          {row?.name || '-'} ({row?.email || '-'})
        </Typography>
        {attempts.length === 0 ? (
          <Typography sx={{ color: '#64748b' }}>No quiz attempts recorded yet.</Typography>
        ) : (
          <Stack spacing={1.1}>
            {attempts.map((attempt, index) => {
              const attemptNumber = attempt?.attemptNumber ?? index + 1
              const statusLabel =
                attempt?.quizPassed === true ? 'Passed' : attempt?.quizPassed === false ? 'Failed' : 'Submitted'

              return (
                <Card key={`${attemptNumber}-${attempt?.submittedAt || index}`} elevation={0} sx={{ border: '1px solid rgba(148, 163, 184, 0.28)', borderRadius: 2 }}>
                  <CardContent sx={{ py: 1.1, '&:last-child': { pb: 1.1 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>Attempt {attemptNumber}</Typography>
                      <Box
                        component="span"
                        sx={{
                          px: 1.2,
                          py: 0.35,
                          borderRadius: 1.5,
                          fontWeight: 600,
                          fontSize: 12,
                          backgroundColor:
                            attempt?.quizPassed === true
                              ? 'rgba(16, 185, 129, 0.16)'
                              : attempt?.quizPassed === false
                                ? 'rgba(239, 68, 68, 0.14)'
                                : 'rgba(59, 130, 246, 0.14)',
                        }}
                      >
                        {statusLabel}
                      </Box>
                    </Stack>
                    <Typography variant="body2" sx={{ color: '#475569', mt: 0.4 }}>
                      Submitted: {formatTimestamp(attempt?.submittedAt)}
                    </Typography>
                    {attempt?.source === 'module_quiz' && attempt?.moduleIndex != null && Number.isFinite(Number(attempt.moduleIndex)) ? (
                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        Training module {Number(attempt.moduleIndex) + 1}
                        {attempt?.totalQuestions != null ? ` · ${attempt.totalQuestions} questions` : ''}
                      </Typography>
                    ) : null}
                    {attempt?.source === 'training_completed' ? (
                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        Full course summary
                      </Typography>
                    ) : null}
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                      Score: {attempt?.quizScore ?? '-'}
                      {attempt?.totalQuestions != null ? ` / ${attempt.totalQuestions}` : ''}
                    </Typography>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 1.75 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function SendSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="contained"
      disabled={pending}
      sx={{
        borderRadius: 1.75,
        minHeight: 40,
        px: 2,
        fontWeight: 700,
        background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
      }}
    >
      {pending ? 'Sending...' : 'Send Start Training'}
    </Button>
  )
}

function SendTrainingDialog({ open, onClose, onSuccess, employees }) {
  const [recipientType, setRecipientType] = useState('employee')
  const [didSubmit, setDidSubmit] = useState(false)
  const [state, formAction] = useFormState(sendTrainingAction, initialActionState)

  useEffect(() => {
    if (!open) {
      setDidSubmit(false)
      setRecipientType('employee')
    }
  }, [open])

  useEffect(() => {
    if (open && didSubmit && state?.success) {
      onSuccess(state.success, state.link)
      onClose()
    }
  }, [open, didSubmit, state, onSuccess, onClose])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Send Start Training</DialogTitle>
      <DialogContent sx={{ pt: 1.25, pb: 1.5 }}>
        <Typography sx={{ color: '#64748b', mb: 1.5 }}>
          Assign Start Training to an employee or non-employee recipient.
        </Typography>
        <Box component="form" action={formAction} onSubmit={() => setDidSubmit(true)}>
          <Stack spacing={1.25}>
            <FormControl fullWidth>
              <InputLabel id="recipient-type-label">Recipient Type</InputLabel>
              <Select
                labelId="recipient-type-label"
                label="Recipient Type"
                name="recipientType"
                value={recipientType}
                onChange={(event) => setRecipientType(event.target.value)}
              >
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="external">Non-Employee</MenuItem>
              </Select>
            </FormControl>

            {recipientType === 'employee' ? (
              <FormControl fullWidth>
                <InputLabel id="employee-select-label">Employee</InputLabel>
                <Select labelId="employee-select-label" label="Employee" name="employeeDbId" required>
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.employee_id} - {employee.name} ({employee.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <>
                <TextField name="externalName" label="Recipient Name" required fullWidth />
                <TextField name="externalEmail" label="Recipient Email" type="email" required fullWidth />
              </>
            )}

            {state?.error ? <Alert severity="error">{state.error}</Alert> : null}

            <DialogActions sx={{ px: 0, pb: 0, pt: 0.25, justifyContent: 'flex-end', gap: 1 }}>
              <Button
                onClick={onClose}
                variant="outlined"
                sx={{ borderRadius: 1.75, minHeight: 40, borderColor: 'rgba(148, 163, 184, 0.38)', color: '#475569' }}
              >
                Cancel
              </Button>
              <SendSubmitButton />
            </DialogActions>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

function SendsTable({ rows, emptyText }) {
  const [copiedId, setCopiedId] = useState(null)
  const [attemptsRow, setAttemptsRow] = useState(null)

  async function copyLink(id, link) {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1200)
    } catch (_error) {
      setCopiedId(null)
    }
  }

  return (
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
              <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Recipient</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Sent</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Opened</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Started</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Quiz Submitted</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Attempts</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Outcome</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155', width: 64 }}>History</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155', width: 64 }}>Link</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <Typography sx={{ color: '#64748b', py: 1 }}>{emptyText}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(148, 163, 184, 0.07)' } }}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{formatTimestamp(row.created_at)}</TableCell>
                  <TableCell>{formatTimestamp(row.opened_at)}</TableCell>
                  <TableCell>{formatTimestamp(row.started_at)}</TableCell>
                  <TableCell>{formatTimestamp(row.latest_attempt_at || row.quiz_submitted_at)}</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        px: 1.2,
                        py: 0.35,
                        borderRadius: 1.5,
                        fontWeight: 600,
                        fontSize: 12,
                        backgroundColor: 'rgba(15, 23, 42, 0.08)',
                      }}
                    >
                      {`${row.quiz_attempts_count ?? 0} attempt${(row.quiz_attempts_count ?? 0) === 1 ? '' : 's'}`}
                    </Box>
                  </TableCell>
                  <TableCell>{toReadableStatus(row.status, row)}</TableCell>
                  <TableCell>
                    <Tooltip title="View attempts" arrow>
                      <span>
                        <IconButton
                          size="small"
                          disabled={!row.quiz_attempts_count}
                          onClick={() => setAttemptsRow(row)}
                          sx={{
                            borderRadius: 1.25,
                            p: 0.8,
                            cursor: row.quiz_attempts_count ? 'pointer' : 'default',
                            color: '#475569',
                            '&:hover': {
                              color: '#312e81',
                              backgroundColor: 'rgba(51, 48, 146, 0.08)',
                            },
                          }}
                        >
                          <TimelineIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={copiedId === row.id ? 'Copied' : 'Copy link'} arrow>
                      <IconButton
                        size="small"
                        onClick={() => copyLink(row.id, row.linkUrl)}
                        sx={{
                          borderRadius: 1.25,
                          p: 0.8,
                          cursor: 'pointer',
                          color: '#475569',
                          '&:hover': {
                            color: '#312e81',
                            backgroundColor: 'rgba(51, 48, 146, 0.08)',
                          },
                        }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {attemptsRow ? <QuizAttemptsDialog open={Boolean(attemptsRow)} row={attemptsRow} onClose={() => setAttemptsRow(null)} /> : null}
    </CardContent>
  )
}

export default function TrainingManager({ employees, assignments }) {
  const router = useRouter()
  const [sendOpen, setSendOpen] = useState(false)
  const [videoPreview, setVideoPreview] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [sendsTab, setSendsTab] = useState(0)

  /** Full URLs from trainingData `videoSources` (e.g. https://video.training.tecshield.net/videos/…); respects NEXT_PUBLIC_VIDEO_DEPLOYED. */
  const trainingVideoUrls = useMemo(() => {
    const d = getTrainingData('en')
    return {
      fire: { en: d.videoSources.fire.en, ar: d.videoSources.fire.ar },
      cpr: { en: d.videoSources.cpr.en, ar: d.videoSources.cpr.ar },
    }
  }, [])

  const employeeSends = useMemo(
    () => assignments.filter((item) => item.recipient_type === 'employee'),
    [assignments]
  )
  const externalSends = useMemo(
    () => assignments.filter((item) => item.recipient_type === 'external'),
    [assignments]
  )

  useEffect(() => {
    if (!feedback) return undefined
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh()
    }, 10000)

    return () => clearInterval(timer)
  }, [router])

  const handleSuccess = (message, link) => {
    setFeedback({
      type: 'success',
      message,
      link,
    })
    router.refresh()
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.01em' }}>
            Start Training
          </Typography>
          <Typography sx={{ color: '#64748b', mt: 0.35 }}>
            Send Start Training assignments to employees and external recipients.
          </Typography>
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          flexWrap="wrap"
          useFlexGap
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          <Button
            variant="outlined"
            size="medium"
            startIcon={<PlayCircleOutlinedIcon />}
            onClick={() =>
              setVideoPreview({
                title: 'Fire training — video preview',
                sources: trainingVideoUrls.fire,
              })
            }
            sx={{
              borderRadius: 1.75,
              minHeight: 40,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'rgba(148, 163, 184, 0.45)',
              color: '#334155',
              whiteSpace: 'nowrap',
            }}
          >
            Preview fire
          </Button>
          <Button
            variant="outlined"
            size="medium"
            startIcon={<PlayCircleOutlinedIcon />}
            onClick={() =>
              setVideoPreview({
                title: 'CPR training — video preview',
                sources: trainingVideoUrls.cpr,
              })
            }
            sx={{
              borderRadius: 1.75,
              minHeight: 40,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'rgba(148, 163, 184, 0.45)',
              color: '#334155',
              whiteSpace: 'nowrap',
            }}
          >
            Preview CPR
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setSendOpen(true)}
            sx={{
              borderRadius: 1.75,
              minHeight: 42,
              px: 2.25,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
              whiteSpace: 'nowrap',
            }}
          >
            Send Start Training
          </Button>
        </Stack>
      </Stack>

      {feedback ? (
        <Alert severity={feedback.type} onClose={() => setFeedback(null)}>
          <Typography sx={{ fontWeight: 600 }}>{feedback.message}</Typography>
          {feedback.link ? (
            <Typography variant="body2" sx={{ mt: 0.25, wordBreak: 'break-all' }}>
              {feedback.link}
            </Typography>
          ) : null}
        </Alert>
      ) : null}

      <Card elevation={0} sx={{ ...cardSx, width: '100%', maxWidth: '100%', minWidth: 0 }}>
        <Box
          sx={{
            borderBottom: '1px solid rgba(148, 163, 184, 0.28)',
            p: 0,
            background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.85) 0%, rgba(255, 255, 255, 0.5) 100%)',
          }}
        >
          <Tabs
            value={sendsTab}
            onChange={(_, next) => setSendsTab(next)}
            variant="fullWidth"
            sx={{
              minHeight: 48,
              '& .MuiTab-root': {
                minHeight: 48,
                py: 1.25,
                px: 2,
                textTransform: 'none',
                fontWeight: 600,
                color: '#64748b',
              },
              '& .Mui-selected': {
                color: '#1e293b',
                fontWeight: 700,
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: 'linear-gradient(90deg, #e31b23 0%, #333092 100%)',
              },
            }}
          >
            <Tab disableRipple label={`Employee (${employeeSends.length})`} />
            <Tab disableRipple label={`Non-Employee (${externalSends.length})`} />
          </Tabs>
        </Box>
        <Box>
          <SendsTable
            rows={sendsTab === 0 ? employeeSends : externalSends}
            emptyText={
              sendsTab === 0
                ? 'No employee training assignments have been sent yet.'
                : 'No non-employee training assignments have been sent yet.'
            }
          />
        </Box>
      </Card>

      {sendOpen ? (
        <SendTrainingDialog open={sendOpen} onClose={() => setSendOpen(false)} onSuccess={handleSuccess} employees={employees} />
      ) : null}

      <AdminVideoPreviewDialog
        open={Boolean(videoPreview)}
        title={videoPreview?.title ?? ''}
        sources={videoPreview?.sources}
        onClose={() => setVideoPreview(null)}
      />
    </Stack>
  )
}
