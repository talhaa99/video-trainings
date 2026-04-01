import { redirect } from 'next/navigation'
import AdminShell from '../components/admin-shell'
import { getCurrentAdminSession } from '../../../lib/auth/admin-session'

export default async function ProtectedAdminLayout({ children }) {
  const session = await getCurrentAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  return <AdminShell adminName={session.name}>{children}</AdminShell>
}
