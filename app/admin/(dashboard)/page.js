import { getDashboardAnalytics, toFlightSafeDashboardAnalytics } from '../../../lib/admin/dashboard-analytics'
import { getCurrentUtcYear, getUtcYearBounds } from '../../../lib/admin/dashboard-analytics-range'
import DashboardAnalyticsClient from './dashboard-analytics-client'

export default async function AdminDashboardPage() {
  const cy = getCurrentUtcYear()
  const { from, to } = getUtcYearBounds(cy)
  let initialAnalytics = null
  try {
    initialAnalytics = toFlightSafeDashboardAnalytics(await getDashboardAnalytics({ from, to }))
  } catch {
    initialAnalytics = null
  }
  const initialRangeKey = `${from.toISOString()}|${to.toISOString()}`

  return <DashboardAnalyticsClient initialYear={cy} initialAnalytics={initialAnalytics} initialRangeKey={initialRangeKey} />
}
