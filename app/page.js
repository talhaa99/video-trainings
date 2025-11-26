'use client'

import { useState, useEffect } from 'react'
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Button,
  Grid,
  LinearProgress,
  Chip
} from '@mui/material'
import { PlayArrow, Quiz, Assessment, ArrowBack } from '@mui/icons-material'
import VideoPlayer from './components/VideoPlayer'
import QuizComponent from './components/QuizComponent'
import ResultsScreen from './components/ResultsScreen'
import LandingPage from './components/LandingPage'
import AnimatedBackground from './components/AnimatedBackground'
import { getTrainingData } from '../data/trainingData'
import { useLanguage } from './contexts/LanguageContext'

export default function Home() {
  const { language, t } = useLanguage()
  const [currentView, setCurrentView] = useState('landing') // landing, home, video, quiz, results
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [quizResults, setQuizResults] = useState([])
  const [currentQuizAnswers, setCurrentQuizAnswers] = useState({})
  
  // Get training data based on current language
  const trainingData = getTrainingData(language)

  console.log('Current view:', currentView, 'Current video index:', currentVideoIndex)

  const handleStartVideo = (videoIndex) => {
    console.log('Starting video:', videoIndex, trainingData.videos[videoIndex])
    setCurrentVideoIndex(videoIndex)
    setCurrentView('video')
  }

  const handleVideoComplete = () => {
    console.log('Video completed, moving to quiz')
    setCurrentView('quiz')
  }

  const handleQuizComplete = (answers, score) => {
    const currentVideoId = trainingData.videos[currentVideoIndex].id
    const currentQuiz = trainingData.quizzes.find(quiz => quiz.videoId === currentVideoId)
    
    const newResult = {
      videoId: currentVideoId,
      videoIndex: currentVideoIndex,
      answers,
      score,
      totalQuestions: currentQuiz ? currentQuiz.questions.length : 0
    }
    
    setQuizResults([...quizResults, newResult])
    setCurrentQuizAnswers(answers)
    
    // Always show results screen after each video
    setCurrentView('results')
  }

  const handleNextVideo = () => {
    // Move to next video if available
    if (currentVideoIndex < trainingData.videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1)
      setCurrentView('video')
    } else {
      // If no more videos, go back to home
      handleBackToHome()
    }
  }

  const handleBackToHome = () => {
    setCurrentView('home')
    setCurrentVideoIndex(0)
    setQuizResults([])
    setCurrentQuizAnswers({})
  }

  const handleStartTraining = () => {
    setCurrentView('home')
  }

  const getCurrentQuiz = () => {
    return trainingData.quizzes.find(quiz => quiz.videoId === trainingData.videos[currentVideoIndex].id)
  }

  // Update training data when language changes
  useEffect(() => {
    // Reset view when language changes to ensure data is refreshed
    if (currentView !== 'landing') {
      // Keep current view but data will be updated via getTrainingData
    }
  }, [language])

  const renderHomeView = () => (
    <Container maxWidth="lg" sx={{ py: 4, width: '100%' }}>
      <AnimatedBackground />
      <Box 
        sx={{
          mb: 4,
          animation: 'slideInUp 0.6s ease-out',
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => setCurrentView('landing')}
          variant="outlined"
          className="crystal-button crystal-button-secondary"
          sx={{
            mb: 2,
            borderRadius: '12px',
            padding: '12px 24px',
            fontWeight: 600,
          }}
        >
          {t('backToHome')}
        </Button>
      </Box>
      <Box 
        textAlign="center" 
        mb={6}
        sx={{
          animation: 'slideInUp 0.8s ease-out',
          maxWidth: '1200px',
          mx: 'auto',
        }}
      >
        <Typography 
          variant="h4" 
          component="h4" 
          gutterBottom
        //   className="gradient-text"
          sx={{
            color:'black',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            mb: 2,
            direction: language === 'ar' ? 'rtl' : 'ltr'
          }}
        >
           {t('enhanceSkills')}
        </Typography>
        {/* <Typography 
          variant="h5" 
          sx={{ 
            color: '#0f172a',
            maxWidth: 600, 
            mx: 'auto',
            opacity: 0.9,
            fontWeight: 400,
          }}
        >
          Enhance your skills with our comprehensive video training program
        </Typography> */}
      </Box>

      <Grid container spacing={4}>
        {trainingData.videos.map((video, index) => (
          <Grid 
            item 
            xs={12} 
            md={6} 
            key={video.id}
            sx={{
             
             animation: `slideInUp 0.6s ease-out ${index * 0.2}s both`,
            }}
          >
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(227, 27, 35, 0.2)',
                borderRadius: '24px',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(227, 27, 35, 0.05) 0%, rgba(51, 48, 146, 0.05) 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover::before': {
                  opacity: 1,
                },
                '&:hover': {
                  transform: 'translateY(-12px) scale(1.03)',
                  boxShadow: '0 25px 50px rgba(227, 27, 35, 0.25)',
                  border: '1px solid rgba(227, 27, 35, 0.4)',
                }
              }}
            >
              <CardMedia
                component="div"
                onClick={() => handleStartVideo(index)}
                sx={{
                  height: 250,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  borderTopLeftRadius: '24px',
                  borderTopRightRadius: '24px',
                  backgroundColor: '#000',
                  cursor: 'pointer',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(227, 27, 35, 0.7) 0%, rgba(51, 48, 146, 0.7) 100%)',
                    zIndex: 1,
                  }
                }}
              >
                <video
                  src={video.thumbnail}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                  }}
                  muted
                  preload="metadata"
                  poster=""
                />
                <Box
                  onClick={() => handleStartVideo(index)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    zIndex: 2,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(15px)',
                      border: '3px solid rgba(255, 255, 255, 0.4)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
                      '&:hover': {
                        transform: 'scale(1.15) rotate(5deg)',
                        background: 'rgba(255, 255, 255, 0.4)',
                        border: '3px solid rgba(255, 255, 255, 0.6)',
                        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.3)',
                      }
                    }}
                  >
                    <PlayArrow sx={{ fontSize: 50, color: 'white', ml: 0.5 }} />
                  </Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    {t('startTrainingButton')}
                  </Typography>
                </Box>
                {/* <Chip
                  label={video.duration}
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                  sx={{ 
                    position: 'absolute', 
                    bottom: 16, 
                    right: 16,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: 600,
                    borderRadius: '20px',
                    zIndex: 2,
                    cursor: 'default',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      transform: 'scale(1.05)',
                    }
                  }}
                /> */}
              </CardMedia>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                <Typography 
                  variant="h5" 
                  component="h2" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 700,
                    color: '#1e293b',
                    mb: 2,
                  }}
                >
                  {video.title}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    flexGrow: 1,
                    color: '#475569',
                    lineHeight: 1.6,
                    fontSize: '1rem',
                  }}
                >
                  {video.description}
                </Typography>
                <Box mt={3}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={() => handleStartVideo(index)}
                    startIcon={<PlayArrow />}
                    className="crystal-button crystal-button-primary"
                    sx={{
                      fontSize: '1.1rem',
                      padding: '16px 32px',
                      borderRadius: '16px',
                      fontWeight: 700,
                    }}
                  >
                    {t('startTrainingButton')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {quizResults.length > 0 && (
        <Box 
          mt={6}
          sx={{
             animation: 'slideInUp 0.6s ease-out 0.8s both',
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            textAlign="center"
            className="gradient-text"
            sx={{ fontWeight: 600, mb: 3 }}
          >
            {t('trainingProgress')}
          </Typography>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={(quizResults.length / trainingData.videos.length) * 100}
              sx={{ 
                height: 16, 
                borderRadius: 10,
                backgroundColor: 'rgba(227, 27, 35, 0.1)',
                border: '1px solid rgba(227, 27, 35, 0.2)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #e31b23 0%, #333092 100%)',
                  borderRadius: 10,
                  boxShadow: '0 0 20px rgba(227, 27, 35, 0.5)',
                }
              }}
            />
          </Box>
          <Typography 
            variant="h6" 
            textAlign="center" 
            sx={{ 
              fontWeight: 500,
              color: '#e2e8f0',
            }}
          >
            {t('completed')}: {quizResults.length} {t('of')} {trainingData.videos.length} {t('modules')}
          </Typography>
        </Box>
      )}
    </Container>
  )

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onStartTraining={handleStartTraining} />
      case 'home':
        return renderHomeView()
      case 'video':
        return (
          <VideoPlayer
            video={trainingData.videos[currentVideoIndex]}
            onComplete={handleVideoComplete}
            onBack={handleBackToHome}
          />
        )
      case 'quiz':
        return (
          <QuizComponent
            quiz={getCurrentQuiz()}
            onComplete={handleQuizComplete}
            onBack={handleBackToHome}
          />
        )
      case 'results':
        return (
          <ResultsScreen
            results={quizResults}
            onNextVideo={handleNextVideo}
            onBackToHome={handleBackToHome}
          />
        )
      default:
        return <LandingPage onStartTraining={handleStartTraining} />
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      {renderCurrentView()}
    </Box>
  )
}
