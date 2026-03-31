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
  Divider,
  IconButton,
  InputAdornment,
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
} from '@mui/material'
import { Add as AddIcon, DeleteOutline as DeleteIcon, EditOutlined as EditIcon, Search as SearchIcon } from '@mui/icons-material'
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createEmployeeAction, deleteEmployeeAction, updateEmployeeAction } from './actions'

const cardSx = {
  borderRadius: 2.5,
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
}

const initialActionState = {
  success: null,
  error: null,
}

const employeeDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatEmployeeDate(value) {
  return employeeDateFormatter.format(new Date(value))
}

function EmployeeSubmitButton({ label, pendingLabel }) {
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
      {pending ? pendingLabel : label}
    </Button>
  )
}

function CreateEmployeeDialog({ open, onClose, onSuccess }) {
  const [state, formAction] = useFormState(createEmployeeAction, initialActionState)
  const [didSubmit, setDidSubmit] = useState(false)

  useEffect(() => {
    if (!open) {
      setDidSubmit(false)
    }
  }, [open])

  useEffect(() => {
    if (open && didSubmit && state?.success) {
      onSuccess(state.success)
      onClose()
    }
  }, [open, didSubmit, state, onClose, onSuccess])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Add Employee</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: '#64748b', mb: 2 }}>
          Enter employee details. Employee ID is generated automatically by the system.
        </Typography>
        <Box component="form" action={formAction} onSubmit={() => setDidSubmit(true)}>
          <Stack spacing={1.5}>
            <TextField name="name" label="Employee Name" required fullWidth />
            <TextField name="email" label="Employee Email" type="email" required fullWidth />
            {state?.error ? <Alert severity="error">{state.error}</Alert> : null}
            <DialogActions sx={{ px: 0, pb: 0, pt: 0.5 }}>
              <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 1.75 }}>
                Cancel
              </Button>
              <EmployeeSubmitButton label="Create Employee" pendingLabel="Creating..." />
            </DialogActions>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

function EditEmployeeDialog({ employee, open, onClose, onSuccess }) {
  const [state, formAction] = useFormState(updateEmployeeAction, initialActionState)
  const [didSubmit, setDidSubmit] = useState(false)

  useEffect(() => {
    if (!open) {
      setDidSubmit(false)
    }
  }, [open])

  useEffect(() => {
    if (open && didSubmit && state?.success) {
      onSuccess(state.success)
      onClose()
    }
  }, [open, didSubmit, state, onClose, onSuccess])

  if (!employee) {
    return null
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Edit Employee</DialogTitle>
      <DialogContent sx={{ pt: 1.25, pb: 1.5 }}>
        <Typography sx={{ color: '#64748b', mb: 1.5 }}>Update employee profile details.</Typography>
        <Box component="form" action={formAction} onSubmit={() => setDidSubmit(true)}>
          <input type="hidden" name="id" value={employee.id} />
          <Stack spacing={1.25}>
            <TextField
              label="Employee ID"
              value={employee.employee_id}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              helperText="System-generated employee identifier"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(148, 163, 184, 0.1)',
                },
                '& .MuiInputBase-input': {
                  color: '#334155',
                  WebkitTextFillColor: '#334155',
                  fontWeight: 600,
                },
                '& .MuiInputLabel-root': {
                  color: '#64748b',
                },
                '& .MuiFormHelperText-root': {
                  color: '#94a3b8',
                  mt: 0.5,
                },
              }}
            />
            <TextField name="name" label="Employee Name" required defaultValue={employee.name} fullWidth />
            <TextField
              name="email"
              label="Employee Email"
              type="email"
              required
              defaultValue={employee.email}
              fullWidth
            />
            {state?.error ? <Alert severity="error">{state.error}</Alert> : null}
            <DialogActions sx={{ px: 0, pb: 0, pt: 0.25, justifyContent: 'flex-end', gap: 1 }}>
              <Button
                onClick={onClose}
                variant="outlined"
                sx={{
                  borderRadius: 1.75,
                  minHeight: 40,
                  borderColor: 'rgba(148, 163, 184, 0.38)',
                  color: '#475569',
                }}
              >
                Cancel
              </Button>
              <EmployeeSubmitButton label="Save Changes" pendingLabel="Saving..." />
            </DialogActions>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

function DeleteEmployeeDialog({ employee, open, onClose, onSuccess }) {
  const [state, formAction] = useFormState(deleteEmployeeAction, initialActionState)
  const [didSubmit, setDidSubmit] = useState(false)

  useEffect(() => {
    if (!open) {
      setDidSubmit(false)
    }
  }, [open])

  useEffect(() => {
    if (open && didSubmit && state?.success) {
      onSuccess(state.success)
      onClose()
    }
  }, [open, didSubmit, state, onClose, onSuccess])

  if (!employee) {
    return null
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>Delete Employee</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: '#475569', mb: 1 }}>
          You are about to delete <strong>{employee.name}</strong> ({employee.employee_id}).
        </Typography>
        <Typography sx={{ color: '#64748b', mb: 2 }}>
          This action cannot be undone. Any linked assignments will also be removed.
        </Typography>

        <Box component="form" action={formAction} onSubmit={() => setDidSubmit(true)}>
          <input type="hidden" name="id" value={employee.id} />
          {state?.error ? <Alert severity="error" sx={{ mb: 1.5 }}>{state.error}</Alert> : null}
          <DialogActions sx={{ px: 0, pb: 0 }}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 1.75 }}>
              Cancel
            </Button>
            <EmployeeSubmitButton label="Delete Employee" pendingLabel="Deleting..." />
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default function EmployeesManager({
  employees,
  query,
  page,
  pageSize,
  totalCount,
  totalPages,
  pageSizeOptions,
}) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(query)
  const [createOpen, setCreateOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState(null)
  const [deleteEmployee, setDeleteEmployee] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const rows = useMemo(() => employees ?? [], [employees])

  useEffect(() => {
    if (!feedback) return undefined

    const timer = setTimeout(() => {
      setFeedback(null)
    }, 3500)

    return () => clearTimeout(timer)
  }, [feedback])

  const handleSuccess = (message) => {
    setFeedback({ type: 'success', message })
    router.refresh()
  }

  useEffect(() => {
    setSearchValue(query)
  }, [query])

  const buildEmployeesUrl = ({ nextPage, nextPageSize, nextQuery }) => {
    const params = new URLSearchParams()
    const safeQuery = `${nextQuery ?? ''}`.trim()

    if (safeQuery) params.set('q', safeQuery)
    if (nextPage > 1) params.set('page', String(nextPage))
    if (nextPageSize !== 10) params.set('pageSize', String(nextPageSize))

    const search = params.toString()
    return search ? `/admin/employees?${search}` : '/admin/employees'
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    router.push(
      buildEmployeesUrl({
        nextPage: 1,
        nextPageSize: pageSize,
        nextQuery: searchValue,
      })
    )
  }

  const handleRowsPerPageChange = (event) => {
    const nextPageSize = Number(event.target.value)
    router.push(
      buildEmployeesUrl({
        nextPage: 1,
        nextPageSize,
        nextQuery: query,
      })
    )
  }

  const handlePageChange = (nextPage) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages)
    router.push(
      buildEmployeesUrl({
        nextPage: safePage,
        nextPageSize: pageSize,
        nextQuery: query,
      })
    )
  }

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalCount)
  const pageButtons = useMemo(() => {
    const maxButtons = 5
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }
    const start = Math.max(1, Math.min(page - 2, totalPages - maxButtons + 1))
    return Array.from({ length: maxButtons }, (_, index) => start + index)
  }, [page, totalPages])

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.01em' }}>
            Employees
          </Typography>
          <Typography sx={{ color: '#64748b', mt: 0.35 }}>
            Manage employee records and auto-generated employee IDs.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
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
          Add Employee
        </Button>
      </Stack>

      {feedback ? <Alert severity={feedback.type}>{feedback.message}</Alert> : null}

      <Card elevation={0} sx={cardSx}>
        <CardContent sx={{ p: { xs: 1.75, md: 2.25 } }}>
          <Stack spacing={1.1}>
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 0,
              }}
            >
              <TextField
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                fullWidth
                placeholder="Search by employee ID, name, or email"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.2)' }} />

            <TableContainer>
              <Table
                size="small"
                sx={{
                  '& .MuiTableCell-root': {
                    py: 0.95,
                    borderBottomColor: 'rgba(148, 163, 184, 0.24)',
                  },
                  '& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root': {
                    borderBottom: 'none',
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155', py: 1.2 }}>Employee ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155', py: 1.2 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155', py: 1.2 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155', py: 1.2 }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#334155', width: 120, py: 1.2 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography sx={{ color: '#64748b', py: 1 }}>No employees found.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((employee) => (
                      <TableRow
                        key={employee.id}
                        hover
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(148, 163, 184, 0.07)',
                          },
                        }}
                      >
                        <TableCell>{employee.employee_id}</TableCell>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{formatEmployeeDate(employee.created_at)}</TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Edit Employee" arrow>
                              <IconButton
                                size="small"
                                onClick={() => setEditEmployee(employee)}
                                sx={{
                                  color: '#475569',
                                  borderRadius: 1.25,
                                  p: 0.85,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    backgroundColor: 'rgba(51, 48, 146, 0.1)',
                                    color: '#312e81',
                                  },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Employee" arrow>
                              <IconButton
                                size="small"
                                onClick={() => setDeleteEmployee(employee)}
                                sx={{
                                  color: '#dc2626',
                                  borderRadius: 1.25,
                                  p: 0.85,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                    color: '#b91c1c',
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.18)' }} />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={0.75}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Stack direction="row" spacing={0.85} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Rows per page
                </Typography>
                <Select
                  size="small"
                  value={String(pageSize)}
                  onChange={handleRowsPerPageChange}
                  sx={{
                    minWidth: 82,
                    borderRadius: 1.5,
                    '& .MuiSelect-select': {
                      color: '#334155',
                      pr: 3.5,
                    },
                    '& .MuiSelect-icon': {
                      color: '#64748b',
                    },
                    '&:hover .MuiSelect-icon': {
                      color: '#334155',
                    },
                    '&.Mui-focused .MuiSelect-icon': {
                      color: '#333092',
                    },
                  }}
                >
                  {pageSizeOptions.map((option) => (
                    <MenuItem key={option} value={String(option)}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Showing {rangeStart}-{rangeEnd} of {totalCount} employees
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                <IconButton
                  size="small"
                  disabled={page <= 1}
                  aria-label="Previous page"
                  aria-disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 1.25,
                    border: '1px solid rgba(148, 163, 184, 0.32)',
                    color: '#475569',
                    '&:hover': {
                      backgroundColor: 'rgba(51, 48, 146, 0.07)',
                      borderColor: 'rgba(51, 48, 146, 0.3)',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                      color: '#94a3b8',
                      borderColor: 'rgba(148, 163, 184, 0.26)',
                      backgroundColor: 'transparent',
                      cursor: 'default',
                      pointerEvents: 'none',
                    },
                    '&.Mui-disabled .MuiSvgIcon-root': {
                      color: '#94a3b8',
                    },
                  }}
                >
                  <ChevronLeftIcon sx={{ fontSize: 18 }} />
                </IconButton>
                {pageButtons.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    size="small"
                    variant={pageNumber === page ? 'contained' : 'outlined'}
                    onClick={() => handlePageChange(pageNumber)}
                    sx={{
                      borderRadius: 1.25,
                      minWidth: 30,
                      height: 30,
                      px: 0.8,
                      fontSize: 12,
                      fontWeight: 600,
                      borderColor: 'rgba(148, 163, 184, 0.32)',
                      color: '#475569',
                      ...(pageNumber === page
                        ? {
                            background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
                            boxShadow: '0 5px 10px rgba(51, 48, 146, 0.2)',
                            color: '#fff',
                          }
                        : null),
                    }}
                  >
                    {pageNumber}
                  </Button>
                ))}
                <IconButton
                  size="small"
                  disabled={page >= totalPages}
                  aria-label="Next page"
                  aria-disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 1.25,
                    border: '1px solid rgba(148, 163, 184, 0.32)',
                    color: '#475569',
                    '&:hover': {
                      backgroundColor: 'rgba(51, 48, 146, 0.07)',
                      borderColor: 'rgba(51, 48, 146, 0.3)',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                      color: '#94a3b8',
                      borderColor: 'rgba(148, 163, 184, 0.26)',
                      backgroundColor: 'transparent',
                      cursor: 'default',
                      pointerEvents: 'none',
                    },
                    '&.Mui-disabled .MuiSvgIcon-root': {
                      color: '#94a3b8',
                    },
                  }}
                >
                  <ChevronRightIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {createOpen ? (
        <CreateEmployeeDialog open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={handleSuccess} />
      ) : null}
      {editEmployee ? (
        <EditEmployeeDialog
          employee={editEmployee}
          open={Boolean(editEmployee)}
          onClose={() => setEditEmployee(null)}
          onSuccess={handleSuccess}
        />
      ) : null}
      {deleteEmployee ? (
        <DeleteEmployeeDialog
          employee={deleteEmployee}
          open={Boolean(deleteEmployee)}
          onClose={() => setDeleteEmployee(null)}
          onSuccess={handleSuccess}
        />
      ) : null}
    </Stack>
  )
}
