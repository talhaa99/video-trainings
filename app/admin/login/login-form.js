'use client'

import Image from 'next/image'
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useFormState, useFormStatus } from 'react-dom'
import { loginAdmin } from './actions'

const initialState = { error: null }
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 50,
    borderRadius: 1.75,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    '& fieldset': {
      borderColor: 'rgba(148, 163, 184, 0.45)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(100, 116, 139, 0.7)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#333092',
      borderWidth: 1.5,
      boxShadow: '0 0 0 3px rgba(51, 48, 146, 0.08)',
    },
    '& .MuiOutlinedInput-input': {
      color: '#0f172a',
      fontWeight: 500,
      lineHeight: 1.35,
      padding: '13px 14px',
    },
    '& .MuiOutlinedInput-input:-webkit-autofill': {
      WebkitTextFillColor: '#0f172a',
      boxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.96) inset',
      transition: 'background-color 9999s ease-out 0s',
      caretColor: '#0f172a',
      borderRadius: 'inherit',
    },
  },
}

function LoginButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="contained"
      size="large"
      fullWidth
      disabled={pending}
      sx={{
        mt: 1,
        py: 1.35,
        borderRadius: 1.75,
        background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
        fontWeight: 700,
        letterSpacing: '0.01em',
        boxShadow: '0 12px 24px rgba(51, 48, 146, 0.24)',
        '&:hover': {
          background: 'linear-gradient(135deg, #c2151d 0%, #2a2677 100%)',
        },
      }}
    >
      {pending ? 'Signing in...' : 'Sign In'}
    </Button>
  )
}

export default function AdminLoginForm() {
  const [state, formAction] = useFormState(loginAdmin, initialState)

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 476,
        p: { xs: 2.75, sm: 3.5 },
        borderRadius: 2.5,
        border: '1px solid rgba(148, 163, 184, 0.28)',
        backdropFilter: 'blur(14px)',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.92) 100%)',
        boxShadow: '0 24px 48px rgba(51, 48, 146, 0.14)',
      }}
    >
      <Stack spacing={2.4}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.35 }}>
          <Image
            src="/logo.png"
            alt="Petrogas E&P"
            width={36}
            height={36}
            style={{ width: 'clamp(32px, 7vw, 36px)', height: 'clamp(32px, 7vw, 36px)', objectFit: 'contain' }}
            priority
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700 }}>
              Petrogas E&amp;P
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.15 }}>
              Admin Panel
            </Typography>
          </Box>
        </Box>

        <Box sx={{ pt: 0.25 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
            Admin Access
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.75, lineHeight: 1.6 }}>
            Sign in to manage the Petrogas E&amp;P admin panel.
          </Typography>
        </Box>

        <Box component="form" action={formAction}>
          <Stack spacing={2.1}>
            <Box>
              <Typography
                component="label"
                htmlFor="admin-email"
                variant="body2"
                sx={{ color: '#475569', fontWeight: 600, mb: 0.75, display: 'block' }}
              >
                Email
              </Typography>
              <TextField
                id="admin-email"
                name="email"
                type="email"
                required
                fullWidth
                autoComplete="email"
                variant="outlined"
                placeholder="Enter your email"
                sx={fieldSx}
              />
            </Box>

            <Box>
              <Typography
                component="label"
                htmlFor="admin-password"
                variant="body2"
                sx={{ color: '#475569', fontWeight: 600, mb: 0.75, display: 'block' }}
              >
                Password
              </Typography>
              <TextField
                id="admin-password"
                name="password"
                type="password"
                required
                fullWidth
                autoComplete="current-password"
                variant="outlined"
                placeholder="Enter your password"
                sx={fieldSx}
              />
            </Box>
            {state?.error ? (
              <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 500 }}>
                {state.error}
              </Typography>
            ) : null}
            <LoginButton />
          </Stack>
        </Box>
      </Stack>
    </Paper>
  )
}
