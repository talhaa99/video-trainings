/** Sanitized logging for admin login / DB diagnostics (no passwords or secrets). */

export const ADMIN_AUTH_LOG_PREFIX = '[admin-auth]'

/** Normalize login email (trim, Unicode NFKC, lowercase). */
export function normalizeAdminEmailInput(email) {
  return String(email ?? '')
    .trim()
    .normalize('NFKC')
    .toLowerCase()
}

export function maskEmail(email) {
  const s = normalizeAdminEmailInput(email)
  const at = s.indexOf('@')
  if (at < 1) return '(invalid-email)'
  return `${s.slice(0, 1)}***@${s.slice(at + 1)}`
}

export function summarizeDatabaseUrl() {
  const raw = process.env.DATABASE_URL
  if (!raw) return { configured: false }
  try {
    const normalized = raw.replace(/^postgresql:/i, 'https:').replace(/^postgres:/i, 'https:')
    const u = new URL(normalized)
    return {
      configured: true,
      host: u.hostname,
      database: u.pathname ? u.pathname.replace(/^\//, '') || '(default)' : '?',
    }
  } catch {
    return { configured: true, parseError: true }
  }
}
