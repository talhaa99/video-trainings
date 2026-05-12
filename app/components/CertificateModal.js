'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { Box, Button, Dialog, DialogContent, Stack, Typography } from '@mui/material'

function sanitizeFilePart(value) {
  return `${value ?? ''}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatDate(value) {
  if (!value) return new Date().toLocaleDateString('en-GB')
  return new Date(value).toLocaleDateString('en-GB')
}

function normalizeRecipientName(value) {
  const raw = `${value ?? ''}`.trim()
  if (!raw) return 'Participant'
  return raw
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function CertificateBody({ certificateRef, safeData }) {
  return (
    <Box
      ref={certificateRef}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '297 / 210',
        borderRadius: 1.75,
        border: '2px solid rgba(51, 48, 146, 0.28)',
        background:
          'radial-gradient(circle at 14% 16%, rgba(227, 27, 35, 0.14), transparent 36%), radial-gradient(circle at 88% 14%, rgba(51, 48, 146, 0.16), transparent 40%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        overflow: 'hidden',
        p: { xs: 1.4, md: 2.25 },
      }}
    >
      <Box sx={{ position: 'absolute', inset: 9, border: '1.5px solid rgba(15, 23, 42, 0.2)', borderRadius: 1.2, pointerEvents: 'none' }} />

      <Stack sx={{ height: '100%', position: 'relative', zIndex: 1, py: { xs: 0.4, md: 0.9 } }} justifyContent="space-between">
        <Stack spacing={0.6} alignItems="center" textAlign="center">
          <Image src="/logo.png" alt="Petrogas E&P" width={160} height={70} style={{ width: 'auto', height: 'clamp(36px, 7vw, 62px)', objectFit: 'contain' }} />
          <Typography sx={{ color: '#1e293b', fontWeight: 800, letterSpacing: '0.08em', fontSize: '0.9rem' }}>PETROGAS E&amp;P</Typography>
        </Stack>

        <Stack spacing={0.95} alignItems="center" textAlign="center" sx={{ px: { xs: 1.2, md: 3 } }}>
          <Typography sx={{ fontWeight: 900, letterSpacing: '0.14em', color: '#111827', fontSize: { xs: '1.35rem', md: '2.05rem' }, textTransform: 'uppercase', lineHeight: 1.1 }}>
            Certificate of Completion
          </Typography>
          <Typography sx={{ color: '#64748b', mt: 0.2, fontSize: { xs: '0.8rem', md: '0.92rem' } }}>
            This certificate is proudly presented to
          </Typography>
          <Typography
            sx={{
              fontWeight: 900,
              color: '#1e293b',
              borderBottom: '2px solid rgba(51, 48, 146, 0.25)',
              pb: 0.35,
              px: 1.5,
              mt: 0.5,
              mb: 0.55,
              lineHeight: 1.12,
              letterSpacing: '0.02em',
              fontSize: '2.8rem',
            }}
          >
            {safeData.recipientName}
          </Typography>
          <Typography sx={{ color: '#334155', fontSize: { xs: '0.84rem', md: '0.95rem' }, mt: 0.25 }}>
            Successfully completed the <strong>{safeData.moduleLabel}</strong>
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: { xs: '0.75rem', md: '0.82rem' } }}>
            in recognition of demonstrated competency and successful assessment completion
          </Typography>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" spacing={2.2}>
          <Box sx={{ border: '1px solid rgba(148, 163, 184, 0.35)', borderRadius: 1.2, backgroundColor: 'rgba(255, 255, 255, 0.78)', px: { xs: 1.1, md: 1.6 }, py: { xs: 0.75, md: 0.95 }, minWidth: { xs: 230, md: 320 } }}>
            <Stack spacing={0.3}>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.73rem', md: '0.8rem' } }}><strong style={{ color: '#334155' }}>Training:</strong> {safeData.moduleLabel}</Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.73rem', md: '0.8rem' } }}><strong style={{ color: '#334155' }}>Score:</strong> {safeData.scoreText}</Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.73rem', md: '0.8rem' } }}><strong style={{ color: '#334155' }}>Completion Date:</strong> {formatDate(safeData.completedAt)}</Typography>
              {safeData.attemptNumber != null ? (
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.73rem', md: '0.8rem' } }}><strong style={{ color: '#334155' }}>Attempt Number:</strong> {safeData.attemptNumber}</Typography>
              ) : null}
            </Stack>
          </Box>
          <Stack sx={{ minWidth: { xs: 160, md: 210 }, textAlign: 'center', pb: 0.15 }} spacing={0.45}>
            <Typography sx={{ color: '#64748b', fontSize: { xs: '0.7rem', md: '0.78rem' }, letterSpacing: '0.06em' }}>ISSUED BY</Typography>
            <Box sx={{ borderTop: '1.5px solid rgba(51, 65, 85, 0.58)' }} />
            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 700, fontSize: { xs: '0.72rem', md: '0.82rem' } }}>Petrogas E&amp;P Training Authority</Typography>
            <Typography sx={{ color: '#94a3b8', fontSize: { xs: '0.62rem', md: '0.7rem' } }}>Authorized certificate issuance</Typography>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

export default function CertificateModal({
  open,
  onClose,
  certificateData,
  autoDownload = false,
  onAutoDownloadComplete,
  directDownloadSignal = 0,
}) {
  const certificateRef = useRef(null)
  const hiddenCertificateRef = useRef(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const safeData = useMemo(
    () => ({
      recipientName: normalizeRecipientName(certificateData?.recipientName),
      moduleLabel: certificateData?.moduleLabel || 'Training Module',
      scoreText: certificateData?.scoreText || 'N/A',
      completedAt: certificateData?.completedAt || new Date().toISOString(),
      attemptNumber: certificateData?.attemptNumber ?? null,
    }),
    [certificateData]
  )

  const handleDownload = async ({ useHiddenSource = false } = {}) => {
    const sourceRef = useHiddenSource ? hiddenCertificateRef.current : certificateRef.current
    if (!sourceRef || isDownloading) return
    try {
      setIsDownloading(true)
      const canvas = await html2canvas(sourceRef, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imageData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = 297
      const pageHeight = 210
      const imgProps = pdf.getImageProperties(imageData)
      const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height)
      const renderWidth = imgProps.width * ratio
      const renderHeight = imgProps.height * ratio
      const x = (pageWidth - renderWidth) / 2
      const y = (pageHeight - renderHeight) / 2
      pdf.addImage(imageData, 'PNG', x, y, renderWidth, renderHeight)
      const fileName = `certificate-${sanitizeFilePart(safeData.recipientName)}-${sanitizeFilePart(safeData.moduleLabel)}.pdf`
      pdf.save(fileName || 'certificate.pdf')
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    if (!open || !autoDownload) return
    let cancelled = false
    const run = async () => {
      await handleDownload()
      if (!cancelled && typeof onAutoDownloadComplete === 'function') onAutoDownloadComplete()
    }
    run()
    return () => {
      cancelled = true
    }
  }, [open, autoDownload])

  useEffect(() => {
    if (!directDownloadSignal) return
    handleDownload({ useHiddenSource: true })
  }, [directDownloadSignal])

  return (
    <>
      <Box sx={{ position: 'fixed', left: '-10000px', top: '-10000px', width: '1120px', pointerEvents: 'none' }}>
        <CertificateBody certificateRef={hiddenCertificateRef} safeData={safeData} />
      </Box>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogContent sx={{ p: { xs: 1, sm: 1.25 }, background: 'rgba(248, 250, 252, 0.95)' }}>
          <Stack spacing={1.5}>
            <CertificateBody certificateRef={certificateRef} safeData={safeData} />
            <Stack direction="row" justifyContent="flex-end" spacing={1.2}>
              <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 1.75 }}>
                Close
              </Button>
              <Button
                variant="contained"
                onClick={handleDownload}
                disabled={isDownloading}
                sx={{ borderRadius: 1.75, fontWeight: 700, background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)' }}
              >
                {isDownloading ? 'Downloading...' : 'Download Certificate'}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  )
}
