'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TableRow,
  TextField,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material'
import { Add as AddIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { sendInductionAction } from './actions'

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
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(dateValue))
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
      {pending ? 'Sending...' : 'Send Safety Induction'}
    </Button>
  )
}

function SendInductionDialog({ open, onClose, onSuccess, employees }) {
  const [recipientType, setRecipientType] = useState('employee')
  const [didSubmit, setDidSubmit] = useState(false)
  const [state, formAction] = useFormState(sendInductionAction, initialActionState)

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
      <DialogTitle sx={{ fontWeight: 800 }}>Send Safety Induction</DialogTitle>
      <DialogContent sx={{ pt: 1.25, pb: 1.5 }}>
        <Typography sx={{ color: '#64748b', mb: 1.5 }}>
          Assign Safety Induction to an employee or non-employee recipient.
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

function SendsTable({ title, rows, emptyText }) {
  const [copiedId, setCopiedId] = useState(null)

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
    <Card elevation={0} sx={cardSx}>
      <CardContent sx={{ p: { xs: 1.75, md: 2.25 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.25 }}>
          {title}
        </Typography>
        <TableContainer>
          <Table
            size="small"
            sx={{
              '& .MuiTableCell-root': {
                py: 0.9,
                verticalAlign: 'middle',
                borderBottomColor: 'rgba(148, 163, 184, 0.24)',
              },
              '& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root': {
                borderBottom: 'none',
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Recipient</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Sent</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155', width: 64 }}>Link</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography sx={{ color: '#64748b', py: 1 }}>{emptyText}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(148, 163, 184, 0.07)' } }}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{formatTimestamp(row.created_at)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status}
                        sx={{
                          borderRadius: 1.5,
                          fontWeight: 600,
                          backgroundColor: row.status === 'sent' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.14)',
                        }}
                      />
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
      </CardContent>
    </Card>
  )
}

export default function InductionsManager({ employees, assignments }) {
  const router = useRouter()
  const [sendOpen, setSendOpen] = useState(false)
  const [feedback, setFeedback] = useState(null)

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
            Safety Inductions
          </Typography>
          <Typography sx={{ color: '#64748b', mt: 0.35 }}>
            Send Safety Induction assignments to employees and external recipients.
          </Typography>
        </Box>
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
            alignSelf: { xs: 'flex-start', sm: 'center' },
            whiteSpace: 'nowrap',
          }}
        >
          Send Safety Induction
        </Button>
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

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <SendsTable
          title={`Employee Sends (${employeeSends.length})`}
          rows={employeeSends}
          emptyText="No employee assignments have been sent yet."
        />
        <SendsTable
          title={`Non-Employee Sends (${externalSends.length})`}
          rows={externalSends}
          emptyText="No non-employee assignments have been sent yet."
        />
      </Box>

      {sendOpen ? (
        <SendInductionDialog open={sendOpen} onClose={() => setSendOpen(false)} onSuccess={handleSuccess} employees={employees} />
      ) : null}
    </Stack>
  )
}
