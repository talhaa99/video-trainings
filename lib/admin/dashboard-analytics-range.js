/** Pure date helpers for dashboard analytics (safe for client + server). */

export function getCurrentUtcYear() {
  return new Date().getUTCFullYear()
}

/** Half-open interval [Jan 1 00:00 UTC, Jan 1 next year 00:00 UTC). */
export function getUtcYearBounds(year) {
  const y = Number(year)
  if (!Number.isFinite(y)) {
    const now = getCurrentUtcYear()
    return { from: new Date(Date.UTC(now, 0, 1)), to: new Date(Date.UTC(now + 1, 0, 1)) }
  }
  return {
    from: new Date(Date.UTC(y, 0, 1)),
    to: new Date(Date.UTC(y + 1, 0, 1)),
  }
}

export function getUtcQuarterBounds(year, quarter) {
  const y = Number(year)
  const q = Number(quarter)
  if (!Number.isFinite(y) || !Number.isFinite(q) || q < 1 || q > 4) {
    return getUtcYearBounds(year)
  }
  const m0 = (q - 1) * 3
  return {
    from: new Date(Date.UTC(y, m0, 1)),
    to: new Date(Date.UTC(y, m0 + 3, 1)),
  }
}

/** month1based: 1 = January */
export function getUtcMonthBounds(year, month1based) {
  const y = Number(year)
  const m = Number(month1based)
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return getUtcYearBounds(year)
  }
  const m0 = m - 1
  return {
    from: new Date(Date.UTC(y, m0, 1)),
    to: new Date(Date.UTC(y, m0 + 1, 1)),
  }
}

/** YYYY-MM-DD strings interpreted as UTC calendar days; end is inclusive → half-open [from, to). */
export function getUtcCustomDayRangeBounds(startYmd, endYmd) {
  const parse = (s) => {
    const parts = `${s}`.trim().split('-').map((x) => Number(x))
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null
    const [yy, mm, dd] = parts
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null
    return new Date(Date.UTC(yy, mm - 1, dd))
  }
  const from = parse(startYmd)
  const endInclusive = parse(endYmd)
  if (!from || !endInclusive || from.getTime() > endInclusive.getTime()) {
    return null
  }
  const to = new Date(endInclusive.getTime() + 86400000)
  return { from, to }
}

function monthLabelUtc(year, monthIndex0) {
  return new Date(Date.UTC(year, monthIndex0, 1)).toLocaleString('en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function fillMonthlySeries({ from, to, rows }) {
  const map = new Map()
  for (const r of rows || []) {
    const key = r.monthKey
    if (key) map.set(key, Number(r.count) || 0)
  }
  const out = []
  const start = new Date(from)
  const end = new Date(to)
  let y = start.getUTCFullYear()
  let m = start.getUTCMonth()
  while (Date.UTC(y, m, 1) < end.getTime()) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}`
    out.push({
      monthKey: key,
      label: monthLabelUtc(y, m),
      count: map.get(key) ?? 0,
    })
    m += 1
    if (m > 11) {
      m = 0
      y += 1
    }
  }
  return out
}
