import { getSql } from '../db/neon'
import { fillMonthlySeries } from './dashboard-analytics-range'

export { getCurrentUtcYear, getUtcYearBounds, getUtcQuarterBounds, getUtcMonthBounds, getUtcCustomDayRangeBounds } from './dashboard-analytics-range'

/**
 * Dashboard analytics for a half-open interval [from, to) in absolute time.
 * Assignment metrics use training_assignments.created_at.
 * Activity metrics use assignment_activity_logs.created_at.
 */

function toIso(d) {
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString()
}

function bucketFromRows(rows, trainingType) {
  const row = rows?.find((r) => r.training_type === trainingType)
  const total = Number(row?.total) || 0
  const completed = Number(row?.completed) || 0
  const pending = Math.max(0, total - completed)
  return { total, completed, pending }
}

/** General-training module or safety-induction quiz donut: passed / submitted-not-passed / not submitted (per assignment). */
function moduleTrainingTriplet(total, submitted, passed) {
  const t = Math.max(0, Number(total) || 0)
  const s = Math.min(Math.max(0, Number(submitted) || 0), t)
  const p = Math.min(Math.max(0, Number(passed) || 0), s)
  const failedSubmit = Math.max(0, s - p)
  const notSubmitted = Math.max(0, t - s)
  return {
    kind: 'moduleTriplet',
    total: t,
    submitted: s,
    passed: p,
    failedSubmit,
    notSubmitted,
  }
}

/** Plain JSON-serializable copy for RSC → client props (avoids BigInt / odd driver types breaking Flight). */
export function toFlightSafeDashboardAnalytics(data) {
  if (data == null) return null
  try {
    return JSON.parse(
      JSON.stringify(data, (_, v) => {
        if (typeof v === 'bigint') return Number(v)
        return v
      }),
    )
  } catch {
    return null
  }
}

export async function getDashboardAnalytics({ from, to }) {
  const fromDate = from instanceof Date ? from : new Date(from)
  const toDate = to instanceof Date ? to : new Date(to)

  if (!(fromDate instanceof Date) || Number.isNaN(fromDate.getTime()) || !(toDate instanceof Date) || Number.isNaN(toDate.getTime())) {
    throw new Error('Invalid analytics date range.')
  }
  if (fromDate.getTime() >= toDate.getTime()) {
    throw new Error('Analytics range must have from before to.')
  }

  const sql = getSql()

  const [assignmentRows, employeeTotalRows, employeeNewRows, monthlyRows, inductionAggRows] = await Promise.all([
    sql`
      SELECT
        a.training_type,
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (
          WHERE a.quiz_passed IS TRUE OR a.status = 'completed_passed'
        )::INT AS completed
      FROM training_assignments a
      WHERE a.created_at >= ${fromDate}
        AND a.created_at < ${toDate}
      GROUP BY a.training_type
    `,
    sql`
      SELECT COUNT(*)::INT AS c
      FROM employees e
      WHERE e.created_at < ${toDate}
    `,
    sql`
      SELECT COUNT(*)::INT AS c
      FROM employees e
      WHERE e.created_at >= ${fromDate}
        AND e.created_at < ${toDate}
    `,
    sql`
      SELECT
        to_char(e.created_at AT TIME ZONE 'UTC', 'YYYY-MM') AS month_key,
        COUNT(*)::INT AS count
      FROM employees e
      WHERE e.created_at >= ${fromDate}
        AND e.created_at < ${toDate}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    sql`
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (
          WHERE a.quiz_passed IS TRUE OR a.status IN ('completed_passed')
        )::INT AS passed,
        COUNT(*) FILTER (
          WHERE NOT (a.quiz_passed IS TRUE OR a.status IN ('completed_passed'))
            AND (
              a.quiz_submitted_at IS NOT NULL
              OR a.status IN ('completed_failed')
            )
        )::INT AS failed_submit
      FROM training_assignments a
      WHERE a.training_type = 'safety_induction'
        AND a.created_at >= ${fromDate}
        AND a.created_at < ${toDate}
    `,
  ])

  let activity = { reportsSubmitted: 0, certificatesIssued: 0 }
  try {
    const [act] = await sql`
      SELECT
        COUNT(*) FILTER (
          WHERE l.event_type = 'quiz_submitted'
            AND (l.event_payload->>'source') IS DISTINCT FROM 'module_quiz'
        )::INT AS reports,
        COUNT(*) FILTER (
          WHERE l.event_type = 'quiz_submitted'
            AND (l.event_payload->>'quizPassed')::BOOLEAN IS TRUE
            AND (l.event_payload->>'source') IS DISTINCT FROM 'module_quiz'
        )::INT AS certificates
      FROM assignment_activity_logs l
      INNER JOIN training_assignments a ON a.id = l.assignment_id
      WHERE l.created_at >= ${fromDate}
        AND l.created_at < ${toDate}
    `
    activity = {
      reportsSubmitted: Number(act?.reports) || 0,
      certificatesIssued: Number(act?.certificates) || 0,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (!message.includes('relation "assignment_activity_logs" does not exist')) {
      throw error
    }
  }

  const general = bucketFromRows(assignmentRows, 'general_training')
  const ig = inductionAggRows[0]
  const iTotal = Number(ig?.total) || 0
  const iPassed = Math.min(Math.max(0, Number(ig?.passed) || 0), iTotal)
  const iFailed = Math.min(Math.max(0, Number(ig?.failed_submit) || 0), Math.max(0, iTotal - iPassed))
  const iSubmitted = Math.min(iPassed + iFailed, iTotal)
  const inductionChart = moduleTrainingTriplet(iTotal, iSubmitted, iPassed)
  const induction = {
    total: iTotal,
    completed: iPassed,
    pending: Math.max(0, iTotal - iPassed),
  }

  let trainingCharts = {
    fire: { ...general },
    cpr: { ...general },
    induction: inductionChart,
  }
  try {
    const splitRows = await sql`
      SELECT
        COALESCE(SUM((fire_done)::INT), 0)::INT AS fire_submitted,
        COALESCE(SUM((fire_pass)::INT), 0)::INT AS fire_passed,
        COALESCE(SUM((cpr_done)::INT), 0)::INT AS cpr_submitted,
        COALESCE(SUM((cpr_pass)::INT), 0)::INT AS cpr_passed
      FROM (
        SELECT
          a.id,
          (
            COALESCE(
              BOOL_OR(
                l.event_type = 'quiz_submitted'
                  AND (l.event_payload->>'source') = 'module_quiz'
                  AND (l.event_payload->>'moduleIndex') IN ('0')
              ),
              FALSE
            )
            OR COALESCE(
              BOOL_OR(
                l.event_type = 'module_completed'
                  AND (l.event_payload->>'moduleIndex') IN ('0')
              ),
              FALSE
            )
            OR COALESCE(
              BOOL_OR(
                l.event_type = 'completed'
                  AND COALESCE(
                    NULLIF(TRIM(l.event_payload->>'modulesCompleted'), ''),
                    '2'
                  )::INT >= 1
              ),
              FALSE
            )
          ) AS fire_done,
          (
            COALESCE(
              BOOL_OR(
                l.event_type = 'module_completed'
                  AND (l.event_payload->>'moduleIndex') IN ('0')
              ),
              FALSE
            )
            OR COALESCE(
              BOOL_OR(
                l.event_type = 'quiz_submitted'
                  AND (l.event_payload->>'source') = 'module_quiz'
                  AND (l.event_payload->>'moduleIndex') IN ('0')
                  AND (l.event_payload->>'quizPassed')::BOOLEAN IS TRUE
              ),
              FALSE
            )
            OR COALESCE(
              BOOL_OR(
                l.event_type = 'completed'
                  AND COALESCE(
                    NULLIF(TRIM(l.event_payload->>'modulesCompleted'), ''),
                    '2'
                  )::INT >= 1
              ),
              FALSE
            )
          ) AS fire_pass,
          (
            COALESCE(
              BOOL_OR(
                l.event_type = 'quiz_submitted'
                  AND (l.event_payload->>'source') = 'module_quiz'
                  AND (l.event_payload->>'moduleIndex') IN ('1')
              ),
              FALSE
            )
            OR COALESCE(
              BOOL_OR(
                l.event_type = 'module_completed'
                  AND (l.event_payload->>'moduleIndex') IN ('1')
              ),
              FALSE
            )
            OR COALESCE(
              BOOL_OR(
                l.event_type = 'completed'
                  AND COALESCE(
                    NULLIF(TRIM(l.event_payload->>'modulesCompleted'), ''),
                    '2'
                  )::INT >= 2
              ),
              FALSE
            )
          ) AS cpr_done,
          (
            COALESCE(
              BOOL_OR(
                l.event_type = 'module_completed'
                  AND (l.event_payload->>'moduleIndex') IN ('1')
              ),
              FALSE
            )
            OR COALESCE(
              BOOL_OR(
                l.event_type = 'quiz_submitted'
                  AND (l.event_payload->>'source') = 'module_quiz'
                  AND (l.event_payload->>'moduleIndex') IN ('1')
                  AND (l.event_payload->>'quizPassed')::BOOLEAN IS TRUE
              ),
              FALSE
            )
            OR COALESCE(
              BOOL_OR(
                l.event_type = 'completed'
                  AND COALESCE(
                    NULLIF(TRIM(l.event_payload->>'modulesCompleted'), ''),
                    '2'
                  )::INT >= 2
              ),
              FALSE
            )
          ) AS cpr_pass
        FROM training_assignments a
        LEFT JOIN assignment_activity_logs l ON l.assignment_id = a.id
        WHERE a.training_type = 'general_training'
          AND a.created_at >= ${fromDate}
          AND a.created_at < ${toDate}
        GROUP BY a.id
      ) s
    `
    const sr = splitRows[0]
    /** Same pool as `assignments.generalTraining` — use that total so KPI and donuts never disagree. */
    const gtTotal = general.total
    const fireS = Math.min(Number(sr?.fire_submitted) || 0, gtTotal)
    const fireP = Math.min(Number(sr?.fire_passed) || 0, fireS)
    const cprS = Math.min(Number(sr?.cpr_submitted) || 0, gtTotal)
    const cprP = Math.min(Number(sr?.cpr_passed) || 0, cprS)
    trainingCharts = {
      fire: moduleTrainingTriplet(gtTotal, fireS, fireP),
      cpr: moduleTrainingTriplet(gtTotal, cprS, cprP),
      induction: inductionChart,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (!message.includes('relation "assignment_activity_logs" does not exist')) {
      throw error
    }
    trainingCharts = {
      fire: { ...general },
      cpr: { ...general },
      induction: inductionChart,
    }
  }

  const monthlyRaw = (monthlyRows || []).map((r) => ({
    monthKey: String(r.month_key ?? ''),
    count: Number(r.count) || 0,
  }))

  const monthly = fillMonthlySeries({ from: fromDate, to: toDate, rows: monthlyRaw })

  return {
    meta: {
      from: toIso(fromDate),
      to: toIso(toDate),
      generatedAt: toIso(new Date()),
    },
    assignments: {
      generalTraining: general,
      safetyInduction: induction,
    },
    trainingCharts,
    activity,
    employees: {
      /** Count of employees with created_at strictly before `to` (cumulative, not limited to range start). */
      totalRegisteredThroughPeriodEnd: Number(employeeTotalRows[0]?.c) || 0,
      /** Registrations with created_at in [from, to); equals sum of `monthly[].count`. */
      newInPeriod: Number(employeeNewRows[0]?.c) || 0,
      monthly,
    },
  }
}
