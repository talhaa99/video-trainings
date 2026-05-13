'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

function normalizeSourceList(val) {
  if (Array.isArray(val)) return val.filter((x) => typeof x === 'string' && x.length > 0)
  if (typeof val === 'string' && val.length > 0) return [val]
  return []
}

export default function AdminVideoPreviewDialog({ open, title, sources, onClose }) {
  const [lang, setLang] = useState('en')
  const [indexEn, setIndexEn] = useState(0)
  const [indexAr, setIndexAr] = useState(0)

  const listEn = useMemo(() => normalizeSourceList(sources?.en), [sources?.en])
  const listAr = useMemo(() => normalizeSourceList(sources?.ar), [sources?.ar])

  useEffect(() => {
    if (!open) return
    setLang('en')
    setIndexEn(0)
    setIndexAr(0)
  }, [open, sources?.en, sources?.ar])

  const activeList = lang === 'ar' ? listAr : listEn
  const activeIndex = lang === 'ar' ? indexAr : indexEn
  const activeSrc = activeList[activeIndex] ?? ''
  const showLanguageToggle = listEn.length > 0 && listAr.length > 0

  const handleVideoError = useCallback(() => {
    if (lang === 'ar') {
      setIndexAr((i) => (i + 1 < listAr.length ? i + 1 : i))
    } else {
      setIndexEn((i) => (i + 1 < listEn.length ? i + 1 : i))
    }
  }, [lang, listAr.length, listEn.length])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="admin-video-preview-title"
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 2.5,
          border: '1px solid rgba(148, 163, 184, 0.28)',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.96) 100%)',
          boxShadow: '0 24px 48px rgba(15, 23, 42, 0.12)',
        },
      }}
    >
      <DialogTitle
        id="admin-video-preview-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pr: 1,
          py: 1.5,
          fontWeight: 800,
          fontSize: '1.05rem',
          color: '#1e293b',
          borderBottom: '1px solid rgba(148, 163, 184, 0.22)',
        }}
      >
        <Box component="span" sx={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
          {title}
        </Box>
        <IconButton aria-label="Close preview" onClick={onClose} size="small" sx={{ color: '#64748b' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 1.5, sm: 2 }, pt: 2, pb: 1.5 }}>
        {showLanguageToggle ? (
          <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Language
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={lang}
              onChange={(_, value) => value && setLang(value)}
              aria-label="Preview language"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  borderColor: 'rgba(148, 163, 184, 0.45)',
                  color: '#64748b',
                },
                '& .Mui-selected': {
                  color: '#1e293b',
                  backgroundColor: 'rgba(51, 48, 146, 0.1)',
                },
              }}
            >
              <ToggleButton value="en" aria-label="English">
                English
              </ToggleButton>
              <ToggleButton value="ar" aria-label="Arabic">
                العربية
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        ) : null}

        <Box
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: '#0f172a',
            border: '1px solid rgba(15, 23, 42, 0.35)',
            lineHeight: 0,
          }}
        >
          {activeSrc ? (
            <Box
              component="video"
              key={`${lang}-${activeIndex}-${activeSrc}`}
              controls
              playsInline
              preload="metadata"
              src={activeSrc}
              onError={handleVideoError}
              sx={{
                width: '100%',
                display: 'block',
                maxHeight: { xs: '52vh', sm: '56vh' },
              }}
            />
          ) : null}
        </Box>
        <Typography variant="caption" sx={{ display: 'block', mt: 1.25, color: '#64748b', lineHeight: 1.45 }}>
          Video preview only — playback controls only; no quiz or timestamps.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderRadius: 1.75, minHeight: 40, borderColor: 'rgba(148, 163, 184, 0.38)', color: '#475569', fontWeight: 600 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
