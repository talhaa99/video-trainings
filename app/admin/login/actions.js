'use server'

import { redirect } from 'next/navigation'
import { setAdminSessionCookie, clearAdminSessionCookie } from '../../../lib/auth/admin-session'
import { validateAdminCredentials } from '../../../lib/auth/admin-service'

export async function loginAdmin(_prevState, formData) {
  const email = `${formData.get('email') ?? ''}`.trim()
  const password = `${formData.get('password') ?? ''}`

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const admin = await validateAdminCredentials(email, password)

  if (!admin) {
    return { error: 'Invalid login credentials.' }
  }

  await setAdminSessionCookie({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  })

  redirect('/admin')
}

export async function logoutAdmin() {
  clearAdminSessionCookie()
  redirect('/admin/login')
}
