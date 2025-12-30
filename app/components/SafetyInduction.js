'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material'
import {
  ArrowBack,
  PlayArrow,
  Pause,
  Fullscreen,
  FullscreenExit,
  VolumeUp,
  VolumeOff
} from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'

// Convert MM:SS or MM:SS.mmm to seconds (supports milliseconds)
const timeToSeconds = (timeString) => {
  const parts = timeString.split(':')
  const minutes = parseInt(parts[0])
  const secondsAndMs = parseFloat(parts[1]) // This handles both SS and SS.mmm
  return minutes * 60 + secondsAndMs
}

// Questions configuration
const questions = [
  {
    id: 1,
    pauseTime: '3:19',
    correctAnswer: 'B',
    correctSkip: '3:19', // Start correct answer segment
    correctEnd: '3:42', // End of correct answer segment
    wrongSkip: '3:43', // Start wrong answer segment
    wrongEnd: '3:56', // End of wrong answer segment
  },
  {
    id: 2,
    pauseTime: '4:16',
    correctAnswer: 'B',
    wrongSkip: '4:17', // Start wrong answer segment
    wrongEnd: '4:33', // End of wrong answer segment
    correctSkip: '4:34', // Start correct answer segment
    correctEnd: '4:45', // End of correct answer segment
  },
  {
    id: 3,
    pauseTime: '4:58',
    correctAnswer: 'A',
    wrongSkip: '4:58', // Start wrong answer segment
    wrongEnd: '5:08', // End of wrong answer segment
    correctSkip: '5:09', // Start correct answer segment
    correctEnd: '5:18', // End of correct answer segment
  },
  {
    id: 4,
    pauseTime: '5:55',
    correctAnswer: 'A',
    wrongSkip: '5:55', // Start wrong answer segment
    wrongEnd: '6:00', // End of wrong answer segment
    correctSkip: '6:00', // Start correct answer segment
    correctEnd: '6:09', // End of correct answer segment
  }
]

export default function SafetyInduction({ onBack }) {
  const { language, t } = useLanguage()
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [answeredQuestions, setAnsweredQuestions] = useState([])
  const [questionResults, setQuestionResults] = useState({}) // Track correct/incorrect answers: { questionId: true/false }
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [isInAnswerSegment, setIsInAnswerSegment] = useState(false)
  const [segmentEndTime, setSegmentEndTime] = useState(null)
  const [wasCorrectAnswer, setWasCorrectAnswer] = useState(null)
  const [currentQuestionData, setCurrentQuestionData] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const pauseTimeoutRef = useRef(null)
  const videoContainerRef = useRef(null)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration)
      // Start video from the beginning
      videoElement.currentTime = 0
      setCurrentTime(0)
      // Sync muted state
      setIsMuted(videoElement.muted)
      // Auto-play the video when metadata is loaded
      videoElement.play().then(() => {
        setIsPlaying(true)
      }).catch((error) => {
        console.log('Autoplay failed:', error)
        setIsPlaying(false)
      })
    }

    const handleTimeUpdate = () => {
      const current = videoElement.currentTime
      setCurrentTime(current)

      // If we're in an answer segment, check if we've reached the end
      if (isInAnswerSegment && segmentEndTime !== null && currentQuestionData) {
        if (current >= segmentEndTime - 0.1) {
          const wrongEndTime = timeToSeconds(currentQuestionData.wrongEnd)
          const correctEndTime = timeToSeconds(currentQuestionData.correctEnd)

          // If correct answer was selected and wrong segment comes after correct segment, skip it
          // (e.g., Q1: correct 3:19-3:42, wrong 3:42-3:55, skip 3:42-3:55)
          if (wasCorrectAnswer && wrongEndTime > correctEndTime) {
            videoElement.currentTime = wrongEndTime
          }
          // If wrong answer was selected and correct segment extends beyond wrong segment, skip remainder
          // (e.g., Q2: wrong 4:17-4:33, correct 4:17-4:44, skip 4:33-4:44)
          else if (!wasCorrectAnswer && correctEndTime > wrongEndTime) {
            videoElement.currentTime = correctEndTime
          }

          // Segment ended, continue playing normally
          setIsInAnswerSegment(false)
          setSegmentEndTime(null)
          setWasCorrectAnswer(null)
          setCurrentQuestionData(null)
        }
      }

      // Check if we need to pause for a question
      if (!currentQuestion && !isProcessingAnswer && !isInAnswerSegment) {
        const questionToShow = questions.find((q, index) => {
          // Check if we haven't answered this question yet
          if (answeredQuestions.includes(q.id)) return false

          const pauseTime = timeToSeconds(q.pauseTime)
          // Pause at the question time
          return current >= pauseTime - 0.1 && current < pauseTime + 0.5
        })

        if (questionToShow) {
          videoElement.pause()
          setIsPlaying(false)
          setCurrentQuestion(questionToShow)
        }
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setVideoCompleted(true)
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('ended', handleEnded)

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('ended', handleEnded)
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [currentQuestion, answeredQuestions, isProcessingAnswer, isInAnswerSegment, segmentEndTime, wasCorrectAnswer, currentQuestionData])

  const handleAnswer = (answer) => {
    if (!currentQuestion || isProcessingAnswer) return

    setIsProcessingAnswer(true)
    const videoElement = videoRef.current
    if (!videoElement) return

    const isCorrect = answer === currentQuestion.correctAnswer
    const questionId = currentQuestion.id
    
    // Mark question as answered
    setAnsweredQuestions(prev => [...prev, questionId])
    // Track the result (correct/incorrect)
    setQuestionResults(prev => ({ ...prev, [questionId]: isCorrect }))

    // Determine which segment to play and where it ends
    let skipTo
    let endTime

    if (isCorrect) {
      skipTo = timeToSeconds(currentQuestion.correctSkip)
      endTime = timeToSeconds(currentQuestion.correctEnd)
    } else {
      skipTo = timeToSeconds(currentQuestion.wrongSkip)
      endTime = timeToSeconds(currentQuestion.wrongEnd)
    }

    // Hide question overlay
    setCurrentQuestion(null)

    // Set up answer segment tracking
    setIsInAnswerSegment(true)
    setSegmentEndTime(endTime)
    setWasCorrectAnswer(isCorrect)
    setCurrentQuestionData(currentQuestion) // Store question data for skipping wrong segment if needed

    // Skip to the appropriate timestamp
    videoElement.currentTime = skipTo
    videoElement.play()
    setIsPlaying(true)

    // Clear the processing flag after a short delay
    setTimeout(() => {
      setIsProcessingAnswer(false)
    }, 500)
  }

  const handlePlay = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    if (isPlaying) {
      videoElement.pause()
      setIsPlaying(false)
    } else {
      videoElement.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (event) => {
    const videoElement = videoRef.current
    if (!videoElement || duration === 0) return

    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const newTime = (clickX / rect.width) * duration
    videoElement.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleFullscreen = async () => {
    const container = videoContainerRef.current
    if (!container) return

    try {
      if (!isFullscreen) {
        if (container.requestFullscreen) {
          await container.requestFullscreen()
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen()
        } else if (container.mozRequestFullScreen) {
          await container.mozRequestFullScreen()
        } else if (container.msRequestFullscreen) {
          await container.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen()
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen()
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen()
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error)
    }
  }

  const handleMute = () => {
    const videoElement = videoRef.current
    if (!videoElement) return

    videoElement.muted = !videoElement.muted
    setIsMuted(videoElement.muted)
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      )
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Calculate score from question results
  const correctAnswers = Object.values(questionResults).filter(result => result === true).length
  const scorePercentage = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0

  // Restart handler - resets all state and restarts video
  const handleRestart = () => {
    const videoElement = videoRef.current
    if (videoElement) {
      videoElement.currentTime = 0
      videoElement.pause()
    }
    
    // Reset all state
    setCurrentQuestion(null)
    setAnsweredQuestions([])
    setQuestionResults({})
    setIsProcessingAnswer(false)
    setVideoCompleted(false)
    setIsInAnswerSegment(false)
    setSegmentEndTime(null)
    setWasCorrectAnswer(null)
    setCurrentQuestionData(null)
    setCurrentTime(0)
    setIsPlaying(false)
    
    // Start video after a brief delay
    setTimeout(() => {
      if (videoElement) {
        videoElement.currentTime = 0
        videoElement.play().then(() => {
          setIsPlaying(true)
        }).catch((error) => {
          console.log('Restart play failed:', error)
        })
      }
    }, 100)
  }

  // Get score color based on performance
  const getScoreColor = () => {
    if (scorePercentage >= 75) return '#10b981' // Green
    if (scorePercentage >= 50) return '#f59e0b' // Orange
    return '#ef4444' // Red
  }

  const getQuestionText = (questionId) => {
    switch (questionId) {
      case 1:
        return t('safetyInductionQ1')
      case 2:
        return t('safetyInductionQ2')
      case 3:
        return t('safetyInductionQ3')
      case 4:
        return t('safetyInductionQ4')
      default:
        return ''
    }
  }

  const getQuestionOptions = (questionId) => {
    switch (questionId) {
      case 1:
        return {
          A: t('safetyInductionQ1A'),
          B: t('safetyInductionQ1B')
        }
      case 2:
        return {
          A: t('safetyInductionQ2A'),
          B: t('safetyInductionQ2B')
        }
      case 3:
        return {
          A: t('safetyInductionQ3A'),
          B: t('safetyInductionQ3B')
        }
      case 4:
        return {
          A: t('safetyInductionQ4A'),
          B: t('safetyInductionQ4B')
        }
      default:
        return { A: '', B: '' }
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 3,
          animation: 'slideInUp 0.6s ease-out',
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          variant="outlined"
          className="crystal-button crystal-button-secondary"
          sx={{
            mb: 2,
            borderRadius: '12px',
            padding: '12px 24px',
            fontWeight: 600,
          }}
        >
          {t('backToLanding')}
        </Button>

        <Box
          sx={{
            background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
            borderRadius: '12px',
            padding: '20px 24px',
            mb: 2,
            width: '100%',
            boxShadow: '0 8px 25px rgba(227, 27, 35, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
              animation: 'shimmer 2s infinite',
            }
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              color: 'white',
              margin: 0,
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
              position: 'relative',
              zIndex: 1,
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}
          >
            {t('safetyInductionTitle')}
          </Typography>
        </Box>
      </Box>

      <Card
        sx={{
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeInScale 0.8s ease-out',
        }}
      >
        <Box
          ref={videoContainerRef}
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: 300, md: 600 },
            backgroundColor: '#000'
          }}
        >
          <video
            ref={videoRef}
            src="/safety-enduction/video.mp4"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            playsInline
            controls={false}
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Question Overlay */}
          {currentQuestion && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                padding: { xs: 2, sm: 4 },
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              <Card
                sx={{
                  maxWidth: '800px',
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  animation: 'slideInUp 0.4s ease-out'
                }}
              >
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 3,
                      fontWeight: 700,
                      color: '#1e293b',
                      direction: language === 'ar' ? 'rtl' : 'ltr'
                    }}
                  >
                    {t('question')} {currentQuestion.id}
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      mb: 4,
                      fontWeight: 600,
                      color: '#334155',
                      lineHeight: 1.6,
                      direction: language === 'ar' ? 'rtl' : 'ltr'
                    }}
                  >
                    {getQuestionText(currentQuestion.id)}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(getQuestionOptions(currentQuestion.id)).map(([key, value]) => (
                      <Button
                        key={key}
                        variant="outlined"
                        onClick={() => handleAnswer(key)}
                        className="crystal-button crystal-button-primary"
                        sx={{
                          padding: '16px 24px',
                          borderRadius: '12px',
                          fontSize: '1rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          border: '2px solid rgba(227, 27, 35, 0.3)',
                          background: 'rgba(255, 255, 255, 0.95)',
                          color: '#1e293b',
                          '&:hover': {
                            background: 'linear-gradient(135deg, rgba(227, 27, 35, 0.1) 0%, rgba(51, 48, 146, 0.1) 100%)',
                            border: '2px solid rgba(227, 27, 35, 0.6)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(227, 27, 35, 0.2)',
                          },
                          direction: language === 'ar' ? 'rtl' : 'ltr'
                        }}
                      >
                        <Box
                          sx={{
                            minWidth: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1rem',
                            mr: language === 'ar' ? 0 : 2,
                            ml: language === 'ar' ? 2 : 0,
                          }}
                        >
                          {key}
                        </Box>
                        {value}
                      </Button>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Video Controls - Play/Pause, Mute, and Fullscreen */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 5
            }}
          >
            <Button
              onClick={handlePlay}
              sx={{
                color: 'white',
                minWidth: 'auto',
                padding: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)'
                }
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                onClick={handleMute}
                sx={{
                  color: 'white',
                  minWidth: 'auto',
                  padding: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </Button>

              <Button
                onClick={handleFullscreen}
                sx={{
                  color: 'white',
                  minWidth: 'auto',
                  padding: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </Button>
            </Box>
          </Box>
        </Box>
      </Card>

      {videoCompleted && (
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
        >
          <Card
            sx={{
              maxWidth: '600px',
              width: '100%',
              animation: 'fadeInScale 0.3s ease-out',
              p: 3,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(227, 27, 35, 0.2)',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
              {t('safetyInductionComplete')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 1, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
              {t('safetyInductionProgress')} {correctAnswers} {t('safetyInductionQuestionsCorrect')} {questions.length} {t('safetyInductionTotalQuestions')}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={scorePercentage}
              sx={{
                height: 10,
                borderRadius: 5,
                mb: 3,
                backgroundColor: 'rgba(227, 27, 35, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: getScoreColor(),
                  borderRadius: 5,
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleRestart}
                startIcon={<PlayArrow />}
                className="crystal-button crystal-button-primary"
                sx={{
                  fontSize: '1rem',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                }}
              >
                {t('safetyInductionRestart')}
              </Button>
              <Button
                variant="outlined"
                onClick={onBack}
                startIcon={<ArrowBack />}
                className="crystal-button crystal-button-secondary"
                sx={{
                  fontSize: '1rem',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                }}
              >
                {t('safetyInductionBackToHome')}
              </Button>
            </Box>
          </Card>
        </Box>
      )}
    </Container>
  )
}

