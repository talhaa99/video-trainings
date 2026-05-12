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

function formatPeriod(meta) {
  if (!meta?.from || !meta?.to) return '—'
  try {
    const a = new Date(meta.from).toLocaleString(undefined, { dateStyle: 'medium' })
    const b = new Date(meta.to).toLocaleString(undefined, { dateStyle: 'medium' })
    return `${a} → ${b}`
  } catch {
    return '—'
  }
}

export async function exportDashboardExcel(analytics, { fileBase = 'petrogas-analytics' } = {}) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  const period = formatPeriod(analytics?.meta)
  const gen = analytics?.meta?.generatedAt
    ? new Date(analytics.meta.generatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  const summaryRows = [
    ['Petrogas E&P — Dashboard analytics'],
    ['Generated', gen],
    ['Period', period],
    [],
    ['Metric', 'Value'],
    ['New employees', analytics?.employees?.newInPeriod ?? 0],
    ['Employees (total)', analytics?.employees?.totalRegisteredThroughPeriodEnd ?? 0],
    ['Safety induction — total assignments', analytics?.assignments?.safetyInduction?.total ?? 0],
    ['Safety induction — completed (passed)', analytics?.assignments?.safetyInduction?.completed ?? 0],
    ['Safety induction — open / pending', analytics?.assignments?.safetyInduction?.pending ?? 0],
    ['General training — total assignments', analytics?.assignments?.generalTraining?.total ?? 0],
    ['General training — completed (passed)', analytics?.assignments?.generalTraining?.completed ?? 0],
    ['General training — open / pending', analytics?.assignments?.generalTraining?.pending ?? 0],
    ['Reports submitted', analytics?.activity?.reportsSubmitted ?? 0],
    ['Certificates issued', analytics?.activity?.certificatesIssued ?? 0],
  ]

  const ws0 = XLSX.utils.aoa_to_sheet(summaryRows)
  ws0['!cols'] = [{ wch: 48 }, { wch: 22 }]
  XLSX.utils.book_append_sheet(wb, ws0, 'Summary')

  const monthly = analytics?.employees?.monthly || []
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['Month', 'New registrations'],
    ...monthly.map((m) => [m.label, m.count]),
  ])
  ws1['!cols'] = [{ wch: 18 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Employee trend')

  const f = analytics?.trainingCharts?.fire
  const c = analytics?.trainingCharts?.cpr
  const i = analytics?.assignments?.safetyInduction
  const ws2 = XLSX.utils.aoa_to_sheet([
    ['Training chart', 'Total', 'Completed', 'Pending'],
    ['Fire (general training pool)', f?.total ?? 0, f?.completed ?? 0, f?.pending ?? 0],
    ['CPR (general training pool)', c?.total ?? 0, c?.completed ?? 0, c?.pending ?? 0],
    ['Safety induction', i?.total ?? 0, i?.completed ?? 0, i?.pending ?? 0],
  ])
  ws2['!cols'] = [{ wch: 32 }, { wch: 10 }, { wch: 12 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Training & induction')

  const safeName = `${fileBase}-${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, safeName)
}

export async function exportDashboardPdf(analytics, { fileBase = 'petrogas-analytics' } = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  let y = margin

  const logo = await tryLoadLogoDataUrl()
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', margin, y - 8, 36, 36)
    } catch {
      // ignore invalid image data
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(15, 23, 42)
  doc.text('Petrogas E&P — Analytics report', margin + (logo ? 48 : 0), y + 12)
  y += 44

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`Generated: ${new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`, margin, y)
  y += 16
  doc.text(`Period: ${formatPeriod(analytics?.meta)}`, margin, y)
  y += 28

  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y, 548, y)
  y += 20

  const lines = [
    ['New employees', String(analytics?.employees?.newInPeriod ?? 0)],
    ['Employees (total)', String(analytics?.employees?.totalRegisteredThroughPeriodEnd ?? 0)],
    ['Induction — total', String(analytics?.assignments?.safetyInduction?.total ?? 0)],
    ['Induction — completed', String(analytics?.assignments?.safetyInduction?.completed ?? 0)],
    ['Induction — open / pending', String(analytics?.assignments?.safetyInduction?.pending ?? 0)],
    ['Training — total', String(analytics?.assignments?.generalTraining?.total ?? 0)],
    ['Training — completed', String(analytics?.assignments?.generalTraining?.completed ?? 0)],
    ['Training — open / pending', String(analytics?.assignments?.generalTraining?.pending ?? 0)],
    ['Reports submitted', String(analytics?.activity?.reportsSubmitted ?? 0)],
    ['Certificates issued', String(analytics?.activity?.certificatesIssued ?? 0)],
  ]

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text('Summary', margin, y)
  y += 18

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  for (const [label, value] of lines) {
    doc.text(label, margin, y)
    doc.setFont('helvetica', 'bold')
    doc.text(value, 420, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += 16
    if (y > 720) {
      doc.addPage()
      y = margin
    }
  }

  y += 12
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Charts are summarized numerically above; open the live dashboard for interactive visuals.', margin, y)

  doc.save(`${fileBase}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
