'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  LinearProgress,
  Chip,
  Alert,
  IconButton
} from '@mui/material'
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Quiz
} from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'

export default function QuizComponent({ quiz, onComplete, onBack }) {
  const { language, t } = useLanguage()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30) // 30 seconds per question
  const [isTimerActive, setIsTimerActive] = useState(true)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100

  useEffect(() => {
    if (!isTimerActive) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false)
          handleNextQuestion()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isTimerActive, currentQuestionIndex])

  useEffect(() => {
    setSelectedAnswer(answers[currentQuestionIndex] || '')
  }, [currentQuestionIndex, answers])

  const handleAnswerChange = (event) => {
    setSelectedAnswer(event.target.value)
  }

  const handleNextQuestion = () => {
    const newAnswers = {
      ...answers,
      [currentQuestionIndex]: selectedAnswer
    }
    setAnswers(newAnswers)

    if (isLastQuestion) {
      calculateScore(newAnswers)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer('')
      setTimeLeft(30)
      setIsTimerActive(true)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setTimeLeft(30)
      setIsTimerActive(true)
    }
  }

  const calculateScore = (finalAnswers) => {
    let score = 0
    const results = quiz.questions.map((question, index) => {
      const userAnswer = finalAnswers[index] // Keep as alphabetic label (A, B, C, D)
      const userAnswerIndex = userAnswer ? userAnswer.charCodeAt(0) - 65 : -1 // Convert A,B,C,D to 0,1,2,3
      const isCorrect = userAnswerIndex === question.correctAnswer
      if (isCorrect) score++
      
      return {
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswerIndex,
        correctAnswer: question.correctAnswer,
        isCorrect,
        options: question.options
      }
    })

    onComplete(finalAnswers, score)
  }

  const getTimerColor = () => {
    if (timeLeft > 20) return 'primary'
    if (timeLeft > 10) return 'warning'
    return 'error'
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentQuestion) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {t('noQuestionsAvailable')}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      <Box 
        sx={{ 
          mb: { xs: 2, sm: 3 },
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
            padding: { xs: '8px 16px', sm: '12px 24px' },
            fontWeight: 600,
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}
        >
          {t('backToHome')}
        </Button>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1, sm: 2 },
          mb: 2 
        }}>
          {/* Quiz Assessment Strip - Centered */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
              borderRadius: '12px',
              padding: { xs: '12px 16px', sm: '15px 25px' },
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 25px rgba(227, 27, 35, 0.3)',
              width: '100%',
              maxWidth: { xs: '100%', sm: '300px' },
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
            <Typography 
              variant="h4" 
              component="h1"
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
                fontSize: { xs: '1.2rem', sm: '1.5rem' },
                textAlign: 'center',
                direction: language === 'ar' ? 'rtl' : 'ltr'
              }}
            >
              {t('quizAssessment')}
            </Typography>
          </Box>
          
          {/* Question and Timer Chips - Both at End */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: { xs: 'center', sm: language === 'ar' ? 'flex-start' : 'flex-end' },
            gap: { xs: 1, sm: 2 },
            width: '100%',
            maxWidth: { xs: '100%', sm: '500px' },
            marginLeft: { xs: 0, sm: language === 'ar' ? 0 : 'auto' },
            marginRight: { xs: 0, sm: language === 'ar' ? 'auto' : 0 },
            flexDirection: { xs: 'row', sm: language === 'ar' ? 'row-reverse' : 'row' },
            flexWrap: 'wrap'
          }}>
            <Chip
              icon={<Quiz />}
              label={`${t('question')} ${currentQuestionIndex + 1} ${t('of')} ${quiz.questions.length}`}
              sx={{
                background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
                color: 'white',
                fontWeight: 600,
                boxShadow: '0 6px 20px rgba(227, 27, 35, 0.4)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: { 
                  xs: language === 'ar' ? '0.7rem' : '0.8rem', 
                  sm: language === 'ar' ? '0.85rem' : '0.9rem',
                  md: language === 'ar' ? '0.9rem' : '1rem'
                },
                height: { 
                  xs: language === 'ar' ? '28px' : '32px', 
                  sm: language === 'ar' ? '32px' : '36px',
                  md: '36px'
                },
                padding: { 
                  xs: language === 'ar' ? '4px 8px' : '4px 12px', 
                  sm: language === 'ar' ? '4px 10px' : '4px 16px'
                },
                maxWidth: { xs: language === 'ar' ? '140px' : '160px', sm: '100%' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                '& .MuiChip-label': {
                  padding: { xs: language === 'ar' ? '0 4px' : '0 8px', sm: '0 8px' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%'
                },
                '& .MuiChip-icon': {
                  marginLeft: language === 'ar' ? { xs: '4px', sm: '8px' } : 0,
                  marginRight: language === 'ar' ? 0 : { xs: '4px', sm: '8px' }
                }
              }}
            />
            <Chip
              label={formatTime(timeLeft)}
              sx={{
                background: getTimerColor() === 'error' 
                  ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                  : getTimerColor() === 'warning'
                  ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                  : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                fontWeight: 600,
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                height: { xs: '32px', sm: '36px' },
                minWidth: { xs: '60px', sm: '70px' }
              }}
            />
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ 
            height: 12, 
            borderRadius: 6, 
            mb: 3,
            backgroundColor: 'rgba(227, 27, 35, 0.1)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #e31b23 0%, #333092 100%)',
              borderRadius: 6,
            }
          }}
        />
      </Box>

      <Card 
        sx={{ 
          mb: { xs: 2, sm: 4 },
          animation: 'fadeInScale 0.6s ease-out',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Typography 
            variant="h5" 
            component="h2" 
            gutterBottom 
            sx={{ 
              mb: { xs: 2, sm: 4 },
              fontWeight: 600,
              color: '#0f172a',
              fontSize: { xs: '1.1rem', sm: '1.5rem' },
              lineHeight: { xs: 1.4, sm: 1.2 },
              direction: language === 'ar' ? 'rtl' : 'ltr'
            }}
          >
            {currentQuestion.question}
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={selectedAnswer}
              onChange={handleAnswerChange}
              sx={{ gap: { xs: 1, sm: 2 } }}
            >
              {currentQuestion.options.map((option, index) => {
                const alphabetLabel = String.fromCharCode(65 + index) // A, B, C, D
                return (
                  <Card
                    key={index}
                    sx={{
                      border: selectedAnswer === alphabetLabel ? 2 : 1,
                      borderColor: selectedAnswer === alphabetLabel 
                        ? 'primary.main' 
                        : 'rgba(255, 255, 255, 0.2)',
                      background: selectedAnswer === alphabetLabel 
                        ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)'
                        : 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: `slideInLeft 0.4s ease-out ${index * 0.1}s both`,
                      '&:hover': {
                        borderColor: 'primary.main',
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                        transform: { xs: 'none', sm: 'translateY(-2px)' },
                        boxShadow: { xs: 'none', sm: '0 8px 25px rgba(37, 99, 235, 0.2)' },
                      }
                    }}
                  >
                    <FormControlLabel
                      value={alphabetLabel}
                      control={
                        <Radio 
                          sx={{
                            '& .MuiSvgIcon-root': {
                              fontSize: 0, // Hide the default radio icon
                            },
                            '&:before': {
                              content: `"${alphabetLabel}"`,
                              width: { xs: 20, sm: 24 },
                              height: { xs: 20, sm: 24 },
                              borderRadius: '50%',
                              background: selectedAnswer === alphabetLabel 
                                ? 'linear-gradient(135deg, #e31b23 0%, #333092 100%)'
                                : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: selectedAnswer === alphabetLabel ? 'white' : '#64748b',
                              fontWeight: 700,
                              fontSize: { xs: '0.8rem', sm: '0.9rem' },
                              border: selectedAnswer === alphabetLabel 
                                ? '2px solid #e31b23' 
                                : '2px solid #e2e8f0',
                              transition: 'all 0.3s ease',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }
                          }}
                        />
                      }
                      label={
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500, 
                            ml: language === 'ar' ? 0 : 1,
                            mr: language === 'ar' ? 1 : 0,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            direction: language === 'ar' ? 'rtl' : 'ltr'
                          }}
                        >
                          {option}
                        </Typography>
                      }
                      sx={{
                        width: '100%',
                        m: 0,
                        p: { xs: 1.5, sm: 2 },
                        '& .MuiFormControlLabel-label': {
                          width: '100%'
                        }
                      }}
                    />
                  </Card>
                )
              })}
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Button
          variant="outlined"
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          startIcon={<ArrowBack />}
          className="crystal-button crystal-button-secondary"
          sx={{
            opacity: currentQuestionIndex === 0 ? 0.5 : 1,
            width: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.9rem', sm: '1rem' },
            padding: { xs: '10px 20px', sm: '12px 24px' }
          }}
        >
          {t('previous')}
        </Button>

        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 0.5, sm: 1 },
          order: { xs: -1, sm: 0 }
        }}>
          {quiz.questions.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: { xs: 8, sm: 12 },
                height: { xs: 8, sm: 12 },
                borderRadius: '50%',
                backgroundColor: answers[index] !== undefined ? '#e31b23' : 'grey.300',
                border: currentQuestionIndex === index ? 2 : 0,
                borderColor: '#333092'
              }}
            />
          ))}
        </Box>

        <Button
          variant="contained"
          onClick={handleNextQuestion}
          disabled={selectedAnswer === ''}
          endIcon={isLastQuestion ? <CheckCircle /> : <ArrowForward />}
          size="large"
          className="crystal-button crystal-button-primary"
          sx={{
            opacity: selectedAnswer === '' ? 0.5 : 1,
            width: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.9rem', sm: '1rem' },
            padding: { xs: '10px 20px', sm: '12px 24px' }
          }}
        >
          {isLastQuestion ? t('completeQuiz') : t('nextQuestion')}
        </Button>
      </Box>

      {timeLeft <= 10 && timeLeft > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {t('timeRunningOut')} {timeLeft} {t('secondsRemaining')}
        </Alert>
      )}
    </Container>
  )
}
