'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  AppBar,
  Box,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  Button,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  PeopleAlt as PeopleAltIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { logoutAdmin } from '../login/actions'

const drawerWidth = 296
const shellMaxWidth = 1540
const radius = {
  pill: 1.5,
  control: 1.75,
  card: 2.5,
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: <DashboardIcon />, ready: true },
  { href: '/admin/employees', label: 'Employees', icon: <PeopleAltIcon />, ready: true },
  { href: '/admin/training', label: 'Training', icon: <SchoolIcon />, ready: true },
  { href: '/admin/inductions', label: 'Inductions', icon: <MenuBookIcon />, ready: true },
  { href: '/admin/certificates', label: 'Certificates', icon: <WorkspacePremiumIcon />, ready: false },
  { href: '/admin/reports', label: 'Reports', icon: <AssessmentIcon />, ready: false },
]

function isNavItemSelected(pathname, href) {
  if (href === '/admin') {
    return pathname === '/admin'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarContent({ onNavigate }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <Stack sx={{ height: '100%', p: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 1, pt: 0.75, pb: 1.75 }}>
        <Image
          src="/logo.png"
          alt="Petrogas E&P"
          width={40}
          height={40}
          style={{
            width: 'clamp(34px, 7vw, 40px)',
            height: 'clamp(34px, 7vw, 40px)',
            objectFit: 'contain',
            flexShrink: 0,
          }}
          priority
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            Petrogas E&amp;P
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.15 }}>
            Admin Panel
          </Typography>
        </Box>
      </Stack>

      <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 700, px: 1.5, pt: 0.5, pb: 1 }}>
        Navigation
      </Typography>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
        <List sx={{ p: 0 }}>
          {navItems.map((item) => {
            const selected = isNavItemSelected(pathname, item.href)

            return (
              <ListItemButton
                key={item.href}
                selected={selected}
                onClick={() => {
                  router.push(item.href)
                  if (onNavigate) {
                    onNavigate()
                  }
                }}
                sx={{
                  minHeight: 44,
                  mb: 0.75,
                  px: 1.25,
                  borderRadius: radius.control,
                  border: selected ? '1px solid rgba(51, 48, 146, 0.35)' : '1px solid transparent',
                  backgroundColor: selected ? 'rgba(51, 48, 146, 0.12)' : 'transparent',
                  '& .MuiTouchRipple-root': { borderRadius: radius.control },
                  '&:hover': {
                    backgroundColor: selected ? 'rgba(51, 48, 146, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 34,
                    color: selected ? '#312e81' : '#64748b',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: selected ? 700 : 600,
                    color: selected ? '#1e1b4b' : '#334155',
                  }}
                />
                {!item.ready ? (
                  <Chip
                    label="Soon"
                    size="small"
                    sx={{
                      height: 19,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#64748b',
                      backgroundColor: 'rgba(148, 163, 184, 0.18)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      borderRadius: radius.pill,
                    }}
                  />
                ) : null}
              </ListItemButton>
            )
          })}
        </List>
      </Box>

      <Box sx={{ px: 0.5, pt: 1.25 }}>
        <form action={logoutAdmin}>
          <Button
            fullWidth
            type="submit"
            startIcon={<LogoutIcon />}
            variant="outlined"
            sx={{
              justifyContent: 'flex-start',
              minHeight: 42,
              px: 1.5,
              color: '#b91c1c',
              borderRadius: radius.control,
              borderColor: 'rgba(185, 28, 28, 0.25)',
              backgroundColor: 'rgba(185, 28, 28, 0.04)',
            }}
          >
            Logout
          </Button>
        </form>
      </Box>
    </Stack>
  )
}

export default function AdminShell({ adminName, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    []
  )

  const openMobileDrawer = () => setMobileOpen(true)
  const closeMobileDrawer = () => setMobileOpen(false)

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        width: '100%',
        overflowX: 'hidden',
        background:
          'radial-gradient(circle at 15% 15%, rgba(227, 27, 35, 0.12), transparent 35%), radial-gradient(circle at 85% 10%, rgba(51, 48, 146, 0.14), transparent 40%), #f8fafc',
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.78)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.25)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 68, md: 74 }, px: { xs: 0.75, md: 0 } }}>
          <Box sx={{ width: '100%', px: { xs: 1.25, sm: 2, md: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                edge="start"
                aria-label="Open sidebar"
                onClick={openMobileDrawer}
                onTouchStart={openMobileDrawer}
                sx={{
                  mr: 0.5,
                  display: { md: 'none' },
                  color: '#0f172a',
                  border: '1px solid rgba(15, 23, 42, 0.16)',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  pointerEvents: 'auto',
                  zIndex: 1401,
                  '&:hover': {
                    backgroundColor: 'rgba(241, 245, 249, 0.95)',
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ color: '#1e293b', fontWeight: 700 }}>Petrogas E&amp;P Admin Panel</Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {today}
                </Typography>
              </Box>
              <Chip
                label={adminName ?? 'Admin'}
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  backgroundColor: 'rgba(255,255,255,0.75)',
                  borderRadius: radius.pill,
                }}
              />
            </Stack>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeMobileDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            },
          }}
        >
          <SidebarContent onNavigate={closeMobileDrawer} />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid rgba(148, 163, 184, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(14px)',
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '68px', md: '74px' },
          pb: { xs: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: shellMaxWidth,
            mx: 'auto',
            px: { xs: 1.25, sm: 2, md: 3 },
            pt: { xs: 2, md: 3 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
