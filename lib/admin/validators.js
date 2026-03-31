export function normalizeEmail(email) {
  return `${email ?? ''}`.trim().toLowerCase()
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))
}

export function requireNonEmpty(value, fieldName) {
  const trimmed = `${value ?? ''}`.trim()
  if (!trimmed) {
    throw new Error(`${fieldName} is required.`)
  }
  return trimmed
}
