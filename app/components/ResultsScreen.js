'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  Home,
  PlayArrow,
  EmojiEvents,
  TrendingUp,
  Assessment,
  Visibility,
  Close
} from '@mui/icons-material'
import AnimatedBackground from './AnimatedBackground'
import { getTrainingData } from '../../data/trainingData'
import { useLanguage } from '../contexts/LanguageContext'
// Removed canvas-confetti to avoid SSR issues - using CSS animations instead

export default function ResultsScreen({ results, onNextVideo, onBackToHome }) {
  const { language, t } = useLanguage()
  const trainingData = getTrainingData(language)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)

  // Get the most recent result (current video)
  const currentResult = results[results.length - 1]
  const currentVideo = currentResult ? {
    title: currentResult.videoIndex === 0 ? t('firefightingTitle') : t('cprTitle'),
    index: currentResult.videoIndex + 1
  } : null

  const score = currentResult ? currentResult.score : 0
  const totalQuestions = currentResult ? currentResult.totalQuestions : 0
  const scorePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
  const isPerfectScore = scorePercentage === 100
  const isExcellentScore = scorePercentage >= 90
  const isGoodScore = scorePercentage >= 70

  useEffect(() => {
    // Trigger confetti animation
    const timer = setTimeout(() => {
      setShowConfetti(true)
      triggerConfetti()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const triggerConfetti = () => {
    // Simple CSS-based confetti effect
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  const getScoreColor = () => {
    if (isPerfectScore) return 'success'
    if (isExcellentScore) return 'primary'
    if (isGoodScore) return 'warning'
    return 'error'
  }

  const getScoreMessage = () => {
    if (isPerfectScore) return t('perfect')
    if (isExcellentScore) return t('excellent')
    if (isGoodScore) return t('goodWork')
    return t('keepPracticing')
  }

  const getScoreIcon = () => {
    if (isPerfectScore) return <EmojiEvents sx={{ fontSize: 60, color: 'gold' }} />
    if (isExcellentScore) return <TrendingUp sx={{ fontSize: 60, color: 'primary.main' }} />
    return <Assessment sx={{ fontSize: 60, color: 'warning.main' }} />
  }

  const isLastVideo = currentResult && currentResult.videoIndex === 1 // 0-based index, so 1 means second video
  const allModulesCompleted = results.length >= trainingData.videos.length

  return (
    <Box sx={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '1rem',
      overflow: 'auto'
    }}>
      <AnimatedBackground />
      <Container maxWidth="lg" sx={{ py: 2, position: 'relative', zIndex: 2, width: '100%' }}>
      {showConfetti && (
        <Box className="confetti-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <Box
              key={i}
              className="confetti-piece"
              sx={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </Box>
      )}
      <Box 
        sx={{ 
          mb: 4, 
          textAlign: 'center',
          animation: 'slideInUp 0.8s ease-out',
        }}
      >
        {/* <Button
          startIcon={<Home />}
          onClick={onBackToHome}
          variant="outlined"
          sx={{ 
            mb: 3,
            backdropFilter: 'blur(15px)',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            color: '#0f172a',
            fontWeight: 600,
            borderRadius: '12px',
            padding: '12px 24px',
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(139, 92, 246, 0.25)',
              transform: 'translateY(-3px)',
              border: '2px solid rgba(139, 92, 246, 0.5)',
              boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)',
              textShadow: '0 1px 3px rgba(255, 255, 255, 0.7)',
            }
          }}
        >
          Back to Home
        </Button> */}

        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          className="gradient-text"
          sx={{ 
            fontWeight: 700,
            mb: 1,
            fontSize: '2rem',
            animation: 'pulse 2s infinite',
            direction: language === 'ar' ? 'rtl' : 'ltr'
          }}
        >
          {currentVideo ? `${currentVideo.title} ${t('trainingComplete')}` : t('trainingComplete')}
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            opacity: 0.9,
            fontWeight: 400,
            direction: language === 'ar' ? 'rtl' : 'ltr'
          }}
        >
          {currentVideo ? `${t('congratulations')} ${currentVideo.title}!` : t('congratulationsFinish')}
        </Typography>
      </Box>

      {/* Overall Score Card */}
      <Card 
        sx={{ 
          mb: 2, 
          textAlign: 'center',
          animation: 'fadeInScale 0.8s ease-out 0.2s both',
        }}
      >
        <CardContent sx={{ py: 3 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 2,
              animation: 'float 3s ease-in-out infinite',
            }}
          >
            {getScoreIcon()}
          </Box>
          
          <Typography 
            variant="h3" 
            component="div" 
            className="gradient-text"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: '2.5rem',
              animation: 'pulse 2s infinite',
            }}
          >
            {scorePercentage}%
          </Typography>
          
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              mb: 1,
            }}
          >
            {getScoreMessage()}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              opacity: 0.8,
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}
          >
            {t('youAnswered')} {score} {t('outOf')} {totalQuestions} {t('questionsCorrectly')}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={scorePercentage}
            sx={{ 
              height: 12, 
              borderRadius: 6, 
              mb: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '& .MuiLinearProgress-bar': {
                background: getScoreColor() === 'success'
                  ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                  : getScoreColor() === 'warning'
                    ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
                    : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                borderRadius: 6,
              }
            }}
          />

          <Chip
            label={`${score}/${totalQuestions} ${t('correct')}`}
            size="medium"
            sx={{ 
              fontSize: '1rem',
              fontWeight: 600,
              background: getScoreColor() === 'success'
                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                : getScoreColor() === 'warning'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          />
        </CardContent>
      </Card>

      {/* Detailed Results - Commented Out */}
      {/* <Grid container spacing={2} sx={{ mb: 2 }}>
        {results.map((result, index) => {
          const videoTitle = `Video ${result.videoIndex + 1}: Training Module ${result.videoIndex + 1}`
          const videoScore = Math.round((result.score / result.totalQuestions) * 100)
          
          return (
            <Grid 
              item 
              xs={12} 
              md={6} 
              key={result.videoId}
              sx={{
                animation: `slideInUp 0.6s ease-out ${0.4 + index * 0.1}s both`,
              }}
            >
              <Card
                sx={{
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography 
                      variant="body2" 
                      component="h3"
                      sx={{ fontWeight: 600 }}
                    >
                      {videoTitle}
                    </Typography>
                    <Chip
                      label={`${videoScore}%`}
                      sx={{
                      
                        background: videoScore >= 80 
                          ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                          : videoScore >= 60
                          ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                          : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                        color: 'white',
                        fontWeight: 600,
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 2, opacity: 0.8 }}
                  >
                    {result.score} out of {result.totalQuestions} questions correct
                  </Typography>
                  
                  <LinearProgress
                    variant="determinate"
                    value={videoScore}
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        background: videoScore >= 80 
                          ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                          : videoScore >= 60
                          ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
                          : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                        borderRadius: 5,
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid> */}

      {/* Performance Summary */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 2,
          animation: 'slideInUp 0.6s ease-out 0.8s both',
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontWeight: 600,
            mb: 1,
            direction: language === 'ar' ? 'rtl' : 'ltr'
          }}
        >
          <Assessment />
          {t('performanceSummary')}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box 
              sx={{ 
                textAlign: 'center',
                animation: 'slideInLeft 0.6s ease-out 1s both',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                // minHeight: '120px'
              }}
            >
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
                  borderRadius: '8px',
                  padding: '15px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 6px 20px rgba(227, 27, 35, 0.3)',
                  width: '100%',
                  maxWidth: '200px',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    borderRadius: '8px'
                  }
                }}
              >
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'white',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                    filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
                    background: 'linear-gradient(45deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    animation: 'shimmer 2s ease-in-out infinite',
                    letterSpacing: '-0.02em',
                    position: 'relative',
                    zIndex: 1,
                    mb: 0.5,
                    fontSize: '2rem'
                  }}
                >
                  {results.length}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 500,
                    textShadow: '0 1px 5px rgba(0, 0, 0, 0.3)',
                    filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.2))',
                    opacity: 0.95,
                    position: 'relative',
                    zIndex: 1,
                    fontSize: '0.8rem'
                  }}
                >
                  {t('modulesCompleted')}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box 
              sx={{ 
                textAlign: 'center',
                animation: 'slideInUp 0.6s ease-out 1.1s both',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
            >
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  borderRadius: '8px',
                  padding: '15px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                  width: '100%',
                  maxWidth: '200px',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    borderRadius: '8px'
                  }
                }}
              >
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'white',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                    filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
                    background: 'linear-gradient(45deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    animation: 'shimmer 2s ease-in-out infinite',
                    letterSpacing: '-0.02em',
                    position: 'relative',
                    zIndex: 1,
                    mb: 0.5,
                    fontSize: '2rem'
                  }}
                >
                  {score}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 500,
                    textShadow: '0 1px 5px rgba(0, 0, 0, 0.3)',
                    filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.2))',
                    opacity: 0.95,
                    position: 'relative',
                    zIndex: 1,
                    fontSize: '0.8rem'
                  }}
                >
                  {t('questionsCorrect')}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box 
              sx={{ 
                textAlign: 'center',
                animation: 'slideInRight 0.6s ease-out 1.2s both',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}
            >
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #333092 0%, #e31b23 100%)',
                  borderRadius: '8px',
                  padding: '15px 20px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 6px 20px rgba(51, 48, 146, 0.3)',
                  width: '100%',
                  maxWidth: '200px',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    borderRadius: '8px'
                  }
                }}
              >
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'white',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                    filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
                    background: 'linear-gradient(45deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    animation: 'shimmer 2s ease-in-out infinite',
                    letterSpacing: '-0.02em',
                    position: 'relative',
                    zIndex: 1,
                    mb: 0.5,
                    fontSize: '2rem'
                  }}
                >
                  {totalQuestions}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 500,
                    textShadow: '0 1px 5px rgba(0, 0, 0, 0.3)',
                    filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.2))',
                    opacity: 0.95,
                    position: 'relative',
                    zIndex: 1,
                    fontSize: '0.8rem'
                  }}
                >
                  {t('totalQuestions')}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 1.5,
          animation: 'slideInUp 0.6s ease-out 1.4s both',
          mt: 1,
        }}
      >
        {!isLastVideo && (
           <Button
             variant="outlined"
             size="medium"
             onClick={onNextVideo}
             startIcon={<PlayArrow />}
             className="crystal-button crystal-button-primary"
             sx={{ 
               minWidth: 180,
               fontSize: '1rem',
               padding: '12px 24px',
               borderRadius: '12px',
               fontWeight: 700,
             }}
           >
             {t('nextTraining')}
           </Button>
        )}
        
        <Button
          variant="outlined"
          size="medium"
          onClick={() => setShowAnswers(true)}
          startIcon={<Visibility />}
          className="crystal-button crystal-button-secondary"
          sx={{ 
            minWidth: 180,
            fontSize: '1rem',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 700,
          }}
        >
          {t('showCorrectAnswers')}
        </Button>
        
        {(!isLastVideo || !allModulesCompleted) && (
          <Button
            variant="outlined"
            size="medium"
            onClick={onBackToHome}
            startIcon={<Home />}
            className="crystal-button crystal-button-secondary"
            sx={{ 
              minWidth: 180,
              fontSize: '1rem',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 700,
            }}
          >
            {isLastVideo ? t('completeTraining') : t('backToHome')}
          </Button>
        )}
      </Box>

      {isPerfectScore && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            {t('perfectScore')}
          </Typography>
        </Alert>
      )}

      {isExcellentScore && !isPerfectScore && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            {t('excellentPerformance')}
          </Typography>
        </Alert>
      )}

      {!isExcellentScore && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            {t('goodEffort')}
          </Typography>
        </Alert>
      )}

      {/* Correct Answers Modal */}
      {showAnswers && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: { xs: 1, sm: 2 },
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
          onClick={() => setShowAnswers(false)}
        >
          <Card
            sx={{
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '100%',
              animation: 'fadeInScale 0.3s ease-out',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'linear-gradient(135deg, #c41e3a 0%, #2a2a7a 100%)',
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid #e0e0e0'
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                {t('correctAnswersReview')}
              </Typography>
              <Button
                onClick={() => setShowAnswers(false)}
                startIcon={<Close />}
                sx={{ 
                  minWidth: 'auto',
                  background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
                  color: 'white',
                  fontWeight: 600,
                  borderRadius: '8px',
                  padding: '8px 16px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #c41e3a 0%, #2a2a7a 100%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(227, 27, 35, 0.3)'
                  }
                }}
              >
                {t('close')}
              </Button>
            </Box>
            
            <Box sx={{ p: 2 }}>
              {results.map((result, resultIndex) => {
                const quiz = trainingData.quizzes.find(q => q.videoId === result.videoIndex + 1)
                if (!quiz) return null
                
                const moduleTitle = result.videoIndex === 0 ? t('firefightingTitle') : t('cprTitle')
                const moduleScore = Math.round((result.score / result.totalQuestions) * 100)
                
                return (
                  <Box key={result.videoId} sx={{ mb: 4 }}>
                    {/* Module Header */}
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        mb: 3,
                        position: 'relative',
                        overflow: 'hidden',
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                          {t('module')} {result.videoIndex + 1}: {moduleTitle}
                        </Typography>
                        <Chip
                          label={`${moduleScore}%`}
                          sx={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontWeight: 600,
                            border: '1px solid rgba(255, 255, 255, 0.3)'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 1, position: 'relative', zIndex: 1, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                        {result.score} {t('outOf')} {result.totalQuestions} {t('questionsCorrectly')}
                      </Typography>
                    </Box>
                    
                    {/* Questions for this module */}
                    {quiz.questions.map((question, index) => {
                      const userAnswer = result.answers ? result.answers[index] : null
                      const userAnswerIndex = userAnswer ? userAnswer.charCodeAt(0) - 65 : -1
                      const isCorrect = userAnswerIndex === question.correctAnswer
                      
                      return (
                        <Card key={question.id} sx={{ mb: 2, p: 2 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                            {t('question')} {index + 1}: {question.question}
                          </Typography>
                          
                          <Box sx={{ mb: 2 }}>
                            {question.options.map((option, optionIndex) => {
                              const alphabetLabel = String.fromCharCode(65 + optionIndex)
                              const isCorrectOption = optionIndex === question.correctAnswer
                              const isUserOption = optionIndex === userAnswerIndex
                              
                              return (
                                <Box
                                  key={optionIndex}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 1.5,
                                    mb: 1,
                                    borderRadius: '8px',
                                    backgroundColor: isCorrectOption 
                                      ? 'rgba(16, 185, 129, 0.1)' 
                                      : isUserOption && !isCorrect
                                      ? 'rgba(239, 68, 68, 0.1)'
                                      : 'rgba(243, 244, 246, 0.5)',
                                    border: isCorrectOption 
                                      ? '2px solid #10b981'
                                      : isUserOption && !isCorrect
                                      ? '2px solid #ef4444'
                                      : '1px solid #e5e7eb'
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: '50%',
                                      background: isCorrectOption 
                                        ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                        : isUserOption && !isCorrect
                                        ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
                                        : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontWeight: 700,
                                      fontSize: '0.8rem'
                                    }}
                                  >
                                    {alphabetLabel}
                                  </Box>
                                  <Typography variant="body1" sx={{ flex: 1, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                                    {option}
                                  </Typography>
                                  {isCorrectOption && (
                                    <CheckCircle sx={{ color: '#10b981' }} />
                                  )}
                                  {isUserOption && !isCorrect && (
                                    <Cancel sx={{ color: '#ef4444' }} />
                                  )}
                                </Box>
                              )
                            })}
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {t('yourAnswer')} 
                            </Typography>
                            {userAnswer ? (
                              <Chip
                                label={userAnswer}
                                sx={{
                                  backgroundColor: isCorrect ? '#10b981' : '#ef4444',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            ) : (
                              <Chip
                                label={t('notAnswered')}
                                sx={{
                                  backgroundColor: '#6b7280',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 600, ml: language === 'ar' ? 0 : 1, mr: language === 'ar' ? 1 : 0 }}>
                              {t('correctAnswer')} 
                            </Typography>
                            <Chip
                              label={String.fromCharCode(65 + question.correctAnswer)}
                              sx={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                fontWeight: 600
                              }}
                            />
                          </Box>
                        </Card>
                      )
                    })}
                  </Box>
                )
              })}
            </Box>
          </Card>
        </Box>
      )}
      </Container>
    </Box>
  )
}
