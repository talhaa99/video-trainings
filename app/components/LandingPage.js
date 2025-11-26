'use client'

import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  ListItemText
} from '@mui/material'
import {
  PlayArrow,
  School,
  Security,
  HealthAndSafety,
  TrendingUp,
  Star,
  Language,
  ArrowBack
} from '@mui/icons-material'
import AnimatedBackground from './AnimatedBackground'
import { useLanguage } from '../contexts/LanguageContext'

export default function LandingPage({ onStartTraining }) {
  const [isHovered, setIsHovered] = useState(false)
  const { language, changeLanguage, t } = useLanguage()
  // Always show language selection first on each visit
  const [showLanguageSelection, setShowLanguageSelection] = useState(true)
  
  // Language selection translations
  const languageSelectionTexts = {
    en: {
      chooseLanguage: "Choose Language",
      english: "English",
      arabic: "Arabic",
      selectLanguage: "Please select your preferred language"
    },
    ar: {
      chooseLanguage: "اختر اللغة",
      english: "الإنجليزية",
      arabic: "العربية",
      selectLanguage: "يرجى اختيار اللغة المفضلة لديك"
    }
  }
  
  const handleLanguageSelect = (lang) => {
    changeLanguage(lang)
    setShowLanguageSelection(false)
  }

  const handleBackToLanguageSelection = () => {
    setShowLanguageSelection(true)
    // Optionally clear the language to force re-selection
    // changeLanguage(null)
  }

  const features = [
    {
      icon: <Security sx={{ fontSize: 32, color: '#e31b23' }} />,
      title: "Firefighting Safety",
      description: "Learn essential firefighting techniques, safety protocols, and emergency response procedures to protect lives and property"
    },
    {
      icon: <HealthAndSafety sx={{ fontSize: 32, color: '#333092' }} />,
      title: "CPR & First Aid",
      description: "Master life-saving CPR techniques, first aid procedures, and emergency medical response skills"
    },
    {
      icon: <TrendingUp sx={{ fontSize: 32, color: '#e31b23' }} />,
      title: "Certified Training",
      description: "Professional certification in firefighting and CPR that meets industry standards and requirements"
    }
  ]

  const stats = [
    { number: "10K+", label: "Trainees Certified" },
    { number: "99%", label: "Success Rate" },
    { number: "24/7", label: "Access Available" }
  ]

  const [languageMenuAnchor, setLanguageMenuAnchor] = useState(null)

  const handleLanguageMenuOpen = (event) => {
    setLanguageMenuAnchor(event.currentTarget)
  }

  const handleLanguageMenuClose = () => {
    setLanguageMenuAnchor(null)
  }

  const handleLanguageSelectFromMenu = (lang) => {
    handleLanguageSelect(lang)
    handleLanguageMenuClose()
  }

  // Language Selection Screen (shown first)
  if (showLanguageSelection) {
    return (
      <Box sx={{
        height: '100%',
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <AnimatedBackground />
        
        <Container 
          maxWidth="sm" 
          sx={{ 
            py: { xs: 2, sm: 4 }, 
            px: { xs: 2, sm: 3, md: 4 },
            position: 'relative', 
            zIndex: 2,
            textAlign: 'center'
          }}
        >
          {/* Logo Section */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 6
            }}
          >
            <Box
              sx={{
                width: { xs: 120, sm: 150 },
                height: { xs: 120, sm: 150 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <img 
                src="/logo.png" 
                alt="Training Center Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          </Box>

          {/* Language Selection Heading - Bilingual */}
          <Box
            sx={{
              mb: 6,
              textAlign: 'center'
            }}
          >
            <Typography
              variant="h3"
              component="h2"
              className="gradient-text"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                direction: 'rtl',
                background: 'linear-gradient(135deg, #e31b23 0%, #2563eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 30px rgba(227, 27, 35, 0.3)',
              }}
            >
              اختر لغتك
            </Typography>
            <Typography
              variant="h3"
              component="h2"
              className="gradient-text"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                direction: 'ltr',
                background: 'linear-gradient(135deg, #e31b23 0%, #2563eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 30px rgba(227, 27, 35, 0.3)',
              }}
            >
              Choose Your Language
            </Typography>
          </Box>

          {/* Language Selection Dropdown Button */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 4
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleLanguageMenuOpen}
              endIcon={<Language />}
              className="crystal-button crystal-button-primary"
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.3rem' },
                padding: { xs: '18px 36px', sm: '22px 44px' },
                borderRadius: '20px',
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
                color: 'white',
                boxShadow: '0 8px 32px rgba(227, 27, 35, 0.4)',
                minWidth: { xs: '250px', sm: '300px' },
                '&:hover': {
                  background: 'linear-gradient(135deg, #c41e3a 0%, #2a2a7a 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(227, 27, 35, 0.5)',
                }
              }}
            >
              Choose Language / اختر اللغة
            </Button>
            <Menu
              anchorEl={languageMenuAnchor}
              open={Boolean(languageMenuAnchor)}
              onClose={handleLanguageMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 250,
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  backgroundColor: 'rgba(227, 27, 35, 0.05)',
                  borderBottom: '1px solid rgba(227, 27, 35, 0.1)',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: '#e31b23',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                  }}
                >
                  Choose Language / اختر اللغة
                </Typography>
              </Box>
              <MenuItem 
                onClick={() => handleLanguageSelectFromMenu('en')}
                selected={language === 'en'}
                sx={{
                  py: 1.5,
                  px: 2,
                  textAlign: 'left',
                  direction: 'ltr',
                  '&:hover': {
                    backgroundColor: 'rgba(227, 27, 35, 0.1)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(227, 27, 35, 0.15)',
                    '&:hover': {
                      backgroundColor: 'rgba(227, 27, 35, 0.2)',
                    }
                  }
                }}
              >
                English
              </MenuItem>
              <MenuItem 
                onClick={() => handleLanguageSelectFromMenu('ar')}
                selected={language === 'ar'}
                sx={{
                  py: 1.5,
                  px: 2,
                  textAlign: 'left',
                  direction: 'ltr',
                  '&:hover': {
                    backgroundColor: 'rgba(227, 27, 35, 0.1)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(227, 27, 35, 0.15)',
                    '&:hover': {
                      backgroundColor: 'rgba(227, 27, 35, 0.2)',
                    }
                  }
                }}
              >
                العربية
              </MenuItem>
            </Menu>
          </Box>
        </Container>
      </Box>
    )
  }

  // Landing Page Screen (after language selection)
  return (
    <Box sx={{
        height:'100%',
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <AnimatedBackground />
      
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, sm: 4 }, 
          px: { xs: 2, sm: 3, md: 4 },
          position: 'relative', 
          zIndex: 2 
        }}
      >
        {/* Back Button to Language Selection */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 16, sm: 24 },
            [language === 'ar' ? 'right' : 'left']: { xs: 16, sm: 24 },
            zIndex: 10
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBackToLanguageSelection}
            className="crystal-button crystal-button-secondary"
            sx={{
              borderRadius: '12px',
              padding: { xs: '8px 16px', sm: '10px 20px' },
              fontWeight: 600,
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(227, 27, 35, 0.3)',
              direction: language === 'ar' ? 'rtl' : 'ltr',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
                border: '1px solid rgba(227, 27, 35, 0.5)',
              }
            }}
          >
            {t('backToLanguage')}
          </Button>
        </Box>

        {/* Header Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 3,
            animation: 'slideInUp 0.8s ease-out'
          }}
        >
          {/* Logo Section */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 4
            }}
          >
            <Box
              sx={{
                width: { xs: 120, sm: 150 },
                height: { xs: 120, sm: 150 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <img 
                src="/logo.png" 
                alt="Training Center Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          </Box>

          <Typography
            variant="h2"
            component="h2"
            className="gradient-text"
            sx={{
              fontWeight: 800,
              fontSize: { xs: language === 'ar' ? '2rem' : '2.5rem', sm: language === 'ar' ? '2.5rem' : '3rem', md: language === 'ar' ? '3.5rem' : '4.5rem' },
              letterSpacing: '-0.02em',
              mb: { xs: 6, sm: 8, md: 10 },
              animation: 'slideInUp 0.8s ease-out 0.2s both',
              lineHeight: { xs: 1.2, sm: 1.3 },
              px: { xs: 2, sm: 0 },
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}
          >
             {t('landingTitle')}
          </Typography>

          {/* <Typography
            variant="h4"
            sx={{
              color: '#0f172a',
              fontWeight: 400,
              mb: 4,
              opacity: 0.9,
              animation: 'slideInUp 0.8s ease-out 0.4s both'
            }}
          >
            Professional Safety & Emergency Response Training
          </Typography> */}

          {/* <Typography
            variant="h6"
            sx={{
              color: '#475569',
              maxWidth: 800,
              mx: 'auto',
              mb: 6,
              lineHeight: 1.6,
              animation: 'slideInUp 0.8s ease-out 0.6s both'
            }}
          >
          Enhance your skills with our comprehensive video training program
          </Typography> */}

          {/* Start Training Button */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 5,
              animation: 'slideInUp 0.8s ease-out 0.8s both',
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={onStartTraining}
              startIcon={<PlayArrow />}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="crystal-button crystal-button-primary"
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.3rem' },
                padding: { xs: '16px 32px', sm: '20px 40px' },
                borderRadius: '20px',
                transform: isHovered ? 'translateY(-5px) scale(1.05)' : 'translateY(0) scale(1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}
            >
              {t('startTraining')}
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        {/* <Box
          sx={{
            mb: 4,
            animation: 'slideInUp 0.8s ease-out 1s both'
          }}
        >
          <Typography
            variant="h4"
            textAlign="center"
            // className="gradient-text"
            sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: '1.8rem'
            }}
          >
            Why Choose Our Training?
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            {features.map((feature, index) => (
              <Card
                key={index}
                sx={{
                  textAlign: 'center',
                  p: 2,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(227, 27, 35, 0.2)',
                  borderRadius: '16px',
                  transition: 'all 0.3s ease',
                  animation: `slideInUp 0.6s ease-out ${1.2 + index * 0.1}s both`,
                  maxWidth: 300,
                  mx: 'auto',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 30px rgba(227, 27, 35, 0.2)',
                    border: '1px solid rgba(227, 27, 35, 0.4)',
                  }
                }}
              >
                <CardContent sx={{ p: 1.5 }}>
                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ fontSize: 32 }}>
                      {feature.icon}
                    </Box>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#1e293b',
                      mb: 1.5,
                      fontSize: '1.1rem'
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#475569',
                      lineHeight: 1.5,
                      fontSize: '0.85rem'
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box> */}

        {/* Stats Section - Strip Design */}
        {/* <Box
          sx={{
            textAlign: 'center',
            animation: 'slideInUp 0.8s ease-out 1.4s both',
            background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
            borderRadius: '12px',
            padding: '30px 20px',
            margin: '40px 0',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(227, 27, 35, 0.3)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              borderRadius: '12px'
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: { xs: 4, md: 8 },
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1,
            alignItems: 'center'
          }}>
            {stats.map((stat, index) => (
              <Box
                key={index}
                sx={{
                  textAlign: 'center',
                  animation: `slideInUp 0.6s ease-out ${1.6 + index * 0.1}s both`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '120px'
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    color: 'white',
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                    filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
                    background: 'linear-gradient(45deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    animation: 'shimmer 2s ease-in-out infinite',
                    letterSpacing: '-0.02em',
                    lineHeight: 1
                  }}
                >
                  {stat.number}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'white',
                    fontWeight: 500,
                    textShadow: '0 1px 5px rgba(0, 0, 0, 0.3)',
                    filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.2))',
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    letterSpacing: '0.5px',
                    opacity: 0.95,
                    lineHeight: 1.2
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box> */}

        {/* Trust Indicators */}
        {/* <Box
          sx={{
            textAlign: 'center',
            mt: 8,
            animation: 'slideInUp 0.8s ease-out 1.8s both'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#475569',
              mb: 3,
              fontWeight: 500
            }}
          >
            Trusted by professionals worldwide
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} sx={{ color: '#fbbf24', fontSize: 30 }} />
            ))}
            <Chip
              label="4.9/5 Rating"
              sx={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                color: 'white',
                fontWeight: 600,
                ml: 2
              }}
            />
          </Box>
        </Box> */}
      </Container>
    </Box>
  )
}
