'use client'

import { jsPDF } from 'jspdf'

async function tryLoadLogoDataUrl() {
  try {
    const res = await fetch('/logo.png')
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function formatActivityDate(iso) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

function scoreDisplay(row) {
  if (row.kind !== 'attempt') return '—'
  if (row.trainingType === 'general_training') {
    return row.quizScore != null ? String(row.quizScore) : '—'
  }
  return row.quizScore != null ? `${row.quizScore} / 5` : '—'
}

function activityLabel(row) {
  return row.kind === 'attempt' ? 'Quiz submission' : 'In progress'
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {{ periodLabel: string, summaryLines: Array<[string, string | number]> }} meta
 */
export async function exportTrainingReportsExcel(rows, { periodLabel, summaryLines } = {}) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  const gen = new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  const detailHeader = [
    'Activity date',
    'Activity type',
    'Training',
    'Outcome',
    'Name',
    'Email',
    'Employee ID',
    'Recipient',
    'Attempt',
    'Score',
    'Assignment ID',
    'Assignment status',
  ]

  const detailBody = rows.map((r) => [
    formatActivityDate(r.sortDate),
    activityLabel(r),
    r.trainingTitle ?? '',
    r.outcomeLabel ?? '',
    r.name ?? '',
    r.email ?? '',
    r.employeeCode ?? '',
    r.recipientType === 'employee' ? 'Employee' : 'External',
    r.attemptNumber ?? '',
    scoreDisplay(r),
    r.assignmentId ?? '',
    r.assignmentStatus ?? '',
  ])

  const ws0 = XLSX.utils.aoa_to_sheet([
    ['Petrogas E&P — Training & induction activity report'],
    ['Generated', gen],
    ['Activity period (filters)', periodLabel ?? '—'],
    [],
    ...(summaryLines?.length
      ? [['Summary (current filters)'], ...summaryLines.map(([a, b]) => [a, b]), []]
      : []),
    detailHeader,
    ...detailBody,
  ])
  ws0['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 22 },
    { wch: 12 },
    { wch: 22 },
    { wch: 28 },
    { wch: 12 },
    { wch: 10 },
    { wch: 8 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, ws0, 'Activity detail')

  const safeName = `training-reports-${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, safeName)
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {{ periodLabel: string, summaryLines: Array<[string, string | number]> }} meta
 */
export async function exportTrainingReportsPdf(rows, { periodLabel, summaryLines } = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
  const margin = 40
  const pageW = 842
  let y = margin

  const logo = await tryLoadLogoDataUrl()
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', margin, y - 6, 32, 32)
    } catch {
      // ignore
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text('Training & induction — activity report', margin + (logo ? 42 : 0), y + 10)
  y += 38

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(71, 85, 105)
  doc.text(`Generated: ${new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`, margin, y)
  y += 14
  doc.text(`Activity period: ${periodLabel ?? '—'}`, margin, y)
  y += 10
  doc.text(`Rows exported: ${rows.length}`, margin, y)
  y += 22

  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y, pageW - margin, y)
  y += 16

  if (summaryLines?.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('Summary', margin, y)
    y += 14
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(30, 41, 59)
    for (const [label, value] of summaryLines) {
      doc.text(String(label), margin, y)
      doc.setFont('helvetica', 'bold')
      doc.text(String(value), pageW - margin - 120, y)
      doc.setFont('helvetica', 'normal')
      y += 13
      if (y > 520) {
        doc.addPage()
        y = margin
      }
    }
    y += 10
  }

  const colX = [margin, margin + 108, margin + 200, margin + 318, margin + 388, margin + 458, margin + 528, margin + 598]
  const headers = ['Date', 'Type', 'Training', 'Outcome', 'Name', 'Score', 'Asgmt']

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(51, 65, 85)
  headers.forEach((h, i) => doc.text(h, colX[i], y))
  y += 12
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y - 4, pageW - margin, y - 4)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(30, 41, 59)

  const truncate = (s, max) => {
    const t = `${s ?? ''}`
    return t.length <= max ? t : `${t.slice(0, max - 1)}…`
  }

  for (const r of rows) {
    if (y > 555) {
      doc.addPage()
      y = margin
    }
    const line = [
      truncate(formatActivityDate(r.sortDate), 18),
      truncate(activityLabel(r), 12),
      truncate(r.trainingTitle, 22),
      truncate(r.outcomeLabel, 10),
      truncate(r.name, 18),
      truncate(scoreDisplay(r), 8),
      String(r.assignmentId ?? ''),
    ]
    line.forEach((cell, i) => doc.text(cell, colX[i], y))
    y += 11
  }

  doc.save(`training-reports-${new Date().toISOString().slice(0, 10)}.pdf`)
}
