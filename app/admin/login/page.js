import { Box } from '@mui/material'
import { redirect } from 'next/navigation'
import AdminLoginForm from './login-form'
import { getCurrentAdminSession } from '../../../lib/auth/admin-session'

export default async function AdminLoginPage() {
  const session = await getCurrentAdminSession()

  if (session) {
    redirect('/admin')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <AdminLoginForm />
    </Box>
  )
}
