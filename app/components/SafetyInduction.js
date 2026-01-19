'use client'

import { useState, useRef, useEffect } from 'react'
import confetti from 'canvas-confetti'
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
  VolumeOff,
  Replay10,
  Forward10,
  CheckCircle,
  Cancel
} from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'
import { getSafetyInductionVideoUrl } from '../../data/trainingData'

// Convert MM:SS or MM:SS.mmm to seconds (supports milliseconds)
// Format examples: '3:34' or '3:34.500' (minutes:seconds.milliseconds)
const timeToSeconds = (timeString) => {
  const parts = timeString.split(':')
  const minutes = parseInt(parts[0])
  const secondsAndMs = parseFloat(parts[1]) // This handles both SS and SS.mmm
  return minutes * 60 + secondsAndMs
}

// Questions configuration
// Time format: MM:SS or MM:SS.mmm (e.g., '3:34' or '3:34.500')
// Each question has separate timings for English (en) and Arabic (ar) versions
const questions = [
  {
    id: 1,
    correctAnswer: 'B',
    timings: {
      en: {
        pauseTime: '3:33.500',
        correctSkip: '3:33.600', // Start correct answer segment
        correctEnd: '3:57', // End of correct answer segment (before incorrect segment starts)
        wrongSkip: '3:58', // Start wrong answer segment
        wrongEnd: '4:11', // End of wrong answer segment
      },
      ar: {
        pauseTime: '3:34',
        correctSkip: '3:34.500', // Start correct answer segment
        correctEnd: '3:57', // End of correct answer segment (before incorrect segment starts)
        wrongSkip: '3:58', // Start wrong answer segment
        wrongEnd: '4:11', // End of wrong answer segment
      }
    }
  },
  {
    id: 2,
    correctAnswer: 'B',
    timings: {
      en: {
        pauseTime: '4:31.200',
        wrongSkip: '4:31.300', // Start wrong answer segment
        wrongEnd: '4:48.300', // End of wrong answer segment (before correct segment starts)
        correctSkip: '4:49', // Start correct answer segment
        correctEnd: '5:00', // End of correct answer segment
      },
      ar: {
        pauseTime: '4:32',
        wrongSkip: '4:32', // Start wrong answer segment
        wrongEnd: '4:48.300', // End of wrong answer segment (before correct segment starts)
        correctSkip: '4:49', // Start correct answer segment
        correctEnd: '5:00', // End of correct answer segment
      }
    }
  },
  {
    id: 3,
    correctAnswer: 'A',
    timings: {
      en: {
        pauseTime: '5:13',
        wrongSkip: '5:14', // Start wrong answer segment
        wrongEnd: '5:23', // End of wrong answer segment (before correct segment starts)
        correctSkip: '5:24', // Start correct answer segment
        correctEnd: '5:34', // End of correct answer segment
      },
      ar: {
        pauseTime: '5:13.500',
        wrongSkip: '5:14', // Start wrong answer segment
        wrongEnd: '5:23.600', // End of wrong answer segment (before correct segment starts)
        correctSkip: '5:24', // Start correct answer segment
        correctEnd: '5:34', // End of correct answer segment
      }
    }
  },
  {
    id: 4,
    correctAnswer: 'A',
    timings: {
      en: {
        pauseTime: '6:09',
        wrongSkip: '6:09', // Start wrong answer segment
        wrongEnd: '6:15', // End of wrong answer segment (before correct segment starts)
        correctSkip: '6:15.100', // Start correct answer segment
        correctEnd: '6:24', // End of correct answer segment
      },
      ar: {
        pauseTime: '6:09.200',
        wrongSkip: '6:09.300', // Start wrong answer segment
        wrongEnd: '6:15', // End of wrong answer segment (before correct segment starts)
        correctSkip: '6:15.100', // Start correct answer segment
        correctEnd: '6:24', // End of correct answer segment
      }
    }
  }
]

export default function SafetyInduction({ onBack }) {
  const { language, t } = useLanguage()
  const videoRef = useRef(null)
  const videoUrl = getSafetyInductionVideoUrl(language)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [answeredQuestions, setAnsweredQuestions] = useState([])
  const [questionResults, setQuestionResults] = useState({}) // Track correct/incorrect answers: { questionId: true/false }
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [selectedQuizQuestions, setSelectedQuizQuestions] = useState([])
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizPassed, setQuizPassed] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState(0)
  const [isInAnswerSegment, setIsInAnswerSegment] = useState(false)
  const [segmentEndTime, setSegmentEndTime] = useState(null)
  const [wasCorrectAnswer, setWasCorrectAnswer] = useState(null)
  const [currentQuestionData, setCurrentQuestionData] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const pauseTimeoutRef = useRef(null)
  const videoContainerRef = useRef(null)

  // Helper function to get question timings for current language
  const getQuestionTimings = (question) => {
    return question.timings[language] || question.timings.en // Fallback to English if language not found
  }

  // Helper function to check if there's a question at a specific time
  const checkForQuestionAtTime = (time) => {
    if (currentQuestion || isProcessingAnswer || isInAnswerSegment) return

    const questionToShow = questions.find((q) => {
      if (answeredQuestions.includes(q.id)) return false
      const timings = getQuestionTimings(q)
      const pauseTime = timeToSeconds(timings.pauseTime)
      return time >= pauseTime - 0.1 && time < pauseTime + 0.5
    })

    if (questionToShow) {
      const videoElement = videoRef.current
      if (videoElement) {
        videoElement.pause()
        setIsPlaying(false)
        setCurrentQuestion(questionToShow)
      }
    }
  }

  // Helper function to check if user has skipped past an unanswered question
  // If so, seek back to the question pause time
  const checkForSkippedQuestion = (time) => {
    if (currentQuestion || isProcessingAnswer || isInAnswerSegment) return null

    // Find unanswered questions that come before the current time
    const skippedQuestions = questions
      .filter(q => {
        if (answeredQuestions.includes(q.id)) return false
        const timings = getQuestionTimings(q)
        const pauseTime = timeToSeconds(timings.pauseTime)
        return time > pauseTime + 0.5 // We're past this question's time
      })
      .sort((a, b) => {
        const timingsA = getQuestionTimings(a)
        const timingsB = getQuestionTimings(b)
        return timeToSeconds(timingsB.pauseTime) - timeToSeconds(timingsA.pauseTime) // Sort by time, most recent first
      })

    // If there's a skipped question, return its pause time
    if (skippedQuestions.length > 0) {
      const timings = getQuestionTimings(skippedQuestions[0])
      return timeToSeconds(timings.pauseTime)
    }

    return null
  }

  // Helper function to check if current time is in a segment that should be skipped
  // based on user's previous answers, and skip to appropriate time if needed
  const checkAndSkipSegments = (time, forceCheck = false) => {
    // Allow skip check during manual seeks even if in answer segment
    if (!forceCheck && (isProcessingAnswer || isInAnswerSegment)) {
      return null
    }

    // Check each answered question to see if we're in a segment that should be skipped
    for (const questionId of answeredQuestions) {
      const question = questions.find(q => q.id === questionId)
      if (!question) continue

      const timings = getQuestionTimings(question)
      const wasCorrect = questionResults[questionId]
      const correctStart = timeToSeconds(timings.correctSkip)
      const correctEnd = timeToSeconds(timings.correctEnd)
      const wrongStart = timeToSeconds(timings.wrongSkip)
      const wrongEnd = timeToSeconds(timings.wrongEnd)

      if (wasCorrect) {
        // User answered CORRECTLY - they should see correct segment, skip wrong segment
        // Check if we're in the wrong segment that should be skipped
        if (time >= wrongStart && time < wrongEnd) {
          // We're in wrong segment, skip it
          const skipTime = wrongStart > correctEnd ? wrongEnd : correctStart
          return skipTime
        }
        // Also check if we're in the gap between correct end and wrong start
        if (wrongStart > correctEnd && time >= correctEnd && time < wrongStart) {
          // We're in the gap, skip to wrong end to continue
          return wrongEnd
        }
      } else {
        // User answered INCORRECTLY - they should see wrong segment, skip correct segment
        // Check if we're in the correct segment that should be skipped
        if (time >= correctStart && time < correctEnd) {
          // We're in correct segment, skip it
          const skipTime = wrongStart > correctEnd ? wrongStart : wrongEnd
          return skipTime
        }
        // Also check if we're in the gap between wrong end and correct start
        if (wrongEnd < correctStart && time >= wrongEnd && time < correctStart) {
          // We're in the gap, this is fine - allow it
          return null
        }
        // If wrong comes after correct and we're past correct end but before wrong start
        // (e.g., Q1: correct 3:19-3:42, wrong 3:43-3:56, if at 3:42.5, skip to 3:43)
        if (wrongStart > correctEnd && time >= correctEnd && time < wrongStart) {
          // We're in the gap, skip to wrong start
          return wrongStart
        }
      }
    }

    return null
  }

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
          const timings = getQuestionTimings(currentQuestionData)
          const wrongEndTime = timeToSeconds(timings.wrongEnd)
          const correctEndTime = timeToSeconds(timings.correctEnd)

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

      // Check if we're in a segment that should be skipped based on previous answers
      // This must happen BEFORE checking for questions and must be very aggressive
      if (!isInAnswerSegment && !isProcessingAnswer && !currentQuestion) {
        const skipTo = checkAndSkipSegments(current)
        if (skipTo !== null) {
          // Skip immediately if we're in a segment that should be skipped
          // Use a small threshold (0.1 seconds) to catch even small overlaps
          if (Math.abs(current - skipTo) > 0.1) {
            // Immediately skip to the correct segment - this prevents any playback of skipped content
            videoElement.currentTime = skipTo
            setCurrentTime(skipTo)
            // Don't check for questions at the skipped time, return early
            return
          }
        }
      }

      // Check if we need to pause for a question
      if (!currentQuestion && !isProcessingAnswer && !isInAnswerSegment) {
        const questionToShow = questions.find((q, index) => {
          // Check if we haven't answered this question yet
          if (answeredQuestions.includes(q.id)) return false

          const timings = getQuestionTimings(q)
          const pauseTime = timeToSeconds(timings.pauseTime)
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
      // Show quiz when video ends
      selectRandomQuizQuestions()
      setShowQuiz(true)
    }

    const handleSeeked = () => {
      // Check if we're in a segment that should be skipped based on previous answers
      // Force check even if in answer segment (user manually sought)
      const current = videoElement.currentTime
      const skipTo = checkAndSkipSegments(current, true)
      if (skipTo !== null && Math.abs(current - skipTo) > 0.5) {
        // Immediately skip to the correct segment
        videoElement.currentTime = skipTo
        setCurrentTime(skipTo)
        // After skipping, check for questions at the new position
        setTimeout(() => {
          const newTime = videoElement.currentTime
          checkForQuestionAtTime(newTime)
          // Double-check we're not still in a skipped segment (force check)
          const skipToAgain = checkAndSkipSegments(newTime, true)
          if (skipToAgain !== null && Math.abs(newTime - skipToAgain) > 0.5) {
            videoElement.currentTime = skipToAgain
            setCurrentTime(skipToAgain)
          }
        }, 100)
      } else {
        // Check for questions when user seeks to a new position
        checkForQuestionAtTime(current)
      }
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('ended', handleEnded)
    videoElement.addEventListener('seeked', handleSeeked)

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('ended', handleEnded)
      videoElement.removeEventListener('seeked', handleSeeked)
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
    const timings = getQuestionTimings(currentQuestion)
    let skipTo
    let endTime

    if (isCorrect) {
      skipTo = timeToSeconds(timings.correctSkip)
      endTime = timeToSeconds(timings.correctEnd)
    } else {
      skipTo = timeToSeconds(timings.wrongSkip)
      endTime = timeToSeconds(timings.wrongEnd)
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

  const handleSeekForward = () => {
    const videoElement = videoRef.current
    if (!videoElement || duration === 0) return

    let newTime = Math.min(videoElement.currentTime + 10, duration)

    // Check if the new time is in a segment that should be skipped (force check even if in answer segment)
    let skipTo = checkAndSkipSegments(newTime, true)
    let iterations = 0
    // Keep checking until we find a valid time (not in a skipped segment)
    while (skipTo !== null && Math.abs(newTime - skipTo) > 0.5 && iterations < 10) {
      newTime = skipTo
      skipTo = checkAndSkipSegments(newTime, true)
      iterations++
      // Prevent infinite loop
      if (skipTo !== null && Math.abs(newTime - skipTo) < 0.5) break
    }

    // Check if we've skipped past an unanswered question
    const skippedQuestionTime = checkForSkippedQuestion(newTime)
    if (skippedQuestionTime !== null) {
      newTime = skippedQuestionTime
    }

    // Set the time immediately - this must happen synchronously
    videoElement.currentTime = newTime
    setCurrentTime(newTime)

    // Immediately check again after setting (sometimes the video doesn't update instantly)
    requestAnimationFrame(() => {
      const current = videoElement.currentTime
      const finalSkip = checkAndSkipSegments(current, true)
      if (finalSkip !== null && Math.abs(current - finalSkip) > 0.5) {
        videoElement.currentTime = finalSkip
        setCurrentTime(finalSkip)
      }
      // Check if we've skipped past a question
      const skippedQTime = checkForSkippedQuestion(videoElement.currentTime)
      if (skippedQTime !== null) {
        videoElement.currentTime = skippedQTime
        setCurrentTime(skippedQTime)
      }
      // Check if we landed on a question time
      setTimeout(() => {
        const finalTime = videoElement.currentTime
        checkForQuestionAtTime(finalTime)
      }, 50)
    })
  }

  const handleSeekBackward = () => {
    const videoElement = videoRef.current
    if (!videoElement || duration === 0) return

    let newTime = Math.max(videoElement.currentTime - 10, 0)

    // Check if the new time is in a segment that should be skipped (force check even if in answer segment)
    let skipTo = checkAndSkipSegments(newTime, true)
    let iterations = 0
    // Keep checking until we find a valid time (not in a skipped segment)
    while (skipTo !== null && Math.abs(newTime - skipTo) > 0.5 && iterations < 10) {
      newTime = skipTo
      skipTo = checkAndSkipSegments(newTime, true)
      iterations++
      // Prevent infinite loop
      if (skipTo !== null && Math.abs(newTime - skipTo) < 0.5) break
    }

    // Check if we've skipped past an unanswered question
    const skippedQuestionTime = checkForSkippedQuestion(newTime)
    if (skippedQuestionTime !== null) {
      newTime = skippedQuestionTime
    }

    // Set the time immediately - this must happen synchronously
    videoElement.currentTime = newTime
    setCurrentTime(newTime)

    // Immediately check again after setting (sometimes the video doesn't update instantly)
    requestAnimationFrame(() => {
      const current = videoElement.currentTime
      const finalSkip = checkAndSkipSegments(current, true)
      if (finalSkip !== null && Math.abs(current - finalSkip) > 0.5) {
        videoElement.currentTime = finalSkip
        setCurrentTime(finalSkip)
      }
      // Check if we've skipped past a question
      const skippedQTime = checkForSkippedQuestion(videoElement.currentTime)
      if (skippedQTime !== null) {
        videoElement.currentTime = skippedQTime
        setCurrentTime(skippedQTime)
      }
      // Check if we landed on a question time
      setTimeout(() => {
        const finalTime = videoElement.currentTime
        checkForQuestionAtTime(finalTime)
      }, 50)
    })
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

  // Select 5 random questions from the pool of 15
  const selectRandomQuizQuestions = () => {
    const allQuestions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, 5)
    setSelectedQuizQuestions(selected)
    setQuizAnswers({})
    setQuizCompleted(false)
    setQuizPassed(false)
    setQuizScore(0)
    setCurrentQuizQuestionIndex(0)
  }

  const getQuizQuestionText = (questionId) => {
    return t(`inductionQuizQ${questionId}`)
  }

  const getQuizQuestionOptions = (questionId) => {
    return {
      A: t(`inductionQuizQ${questionId}A`),
      B: t(`inductionQuizQ${questionId}B`),
      C: t(`inductionQuizQ${questionId}C`),
      D: t(`inductionQuizQ${questionId}D`)
    }
  }

  const getQuizCorrectAnswer = (questionId) => {
    return t(`inductionQuizQ${questionId}Correct`)
  }

  const handleQuizAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleQuizSubmit = () => {
    let correctCount = 0
    selectedQuizQuestions.forEach(qId => {
      const userAnswer = quizAnswers[qId]
      const correctAnswer = getQuizCorrectAnswer(qId)
      // Ensure both are strings and trim whitespace for comparison
      if (String(userAnswer).trim() === String(correctAnswer).trim()) {
        correctCount++
      }
    })

    setQuizScore(correctCount)
    setQuizCompleted(true)
    // Passing criteria: 4 out of 5 correct (80%) - 4 or more correct answers
    const passed = correctCount >= 4
    setQuizPassed(passed)

    // Show confetti if passed
    if (passed) {
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 }

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)
    }
  }

  const handleRetakeQuiz = () => {
    selectRandomQuizQuestions()
  }

  const handleNextQuestion = () => {
    if (currentQuizQuestionIndex < selectedQuizQuestions.length - 1) {
      setCurrentQuizQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuizQuestionIndex > 0) {
      setCurrentQuizQuestionIndex(prev => prev - 1)
    }
  }

  // Retake Quiz handler - resets all state and restarts video
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
            src={videoUrl}
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

          {/* Video Controls - Play/Pause, Seek, Time, Mute, and Fullscreen */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              right: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              zIndex: 5,
              flexWrap: 'wrap'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                onClick={handleSeekBackward}
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
                title="Rewind 10 seconds"
              >
                <Replay10 />
              </Button>

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

              <Button
                onClick={handleSeekForward}
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
                title="Forward 10 seconds"
              >
                <Forward10 />
              </Button>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: 'white',
                minWidth: 100,
                textAlign: 'center',
                fontWeight: 500,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '8px 12px',
                borderRadius: '8px'
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>

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

      {/* Quiz Screen */}
      {showQuiz && !quizCompleted && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: { xs: 2, sm: 4 },
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <Card
            sx={{
              maxWidth: '800px',
              width: '100%',
              animation: 'fadeInScale 0.3s ease-out',
              p: { xs: 3, sm: 4 },
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(227, 27, 35, 0.2)',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: 'center', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
              {t('inductionQuizTitle')}
            </Typography>

            <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary', direction: language === 'ar' ? 'rtl' : 'ltr' }}>
              {t('question')} {currentQuizQuestionIndex + 1} {t('of')} {selectedQuizQuestions.length}
            </Typography>

            {selectedQuizQuestions.length > 0 && (
              <>
                <Card sx={{ p: 3, border: '1px solid rgba(0, 0, 0, 0.1)', mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                    {getQuizQuestionText(selectedQuizQuestions[currentQuizQuestionIndex])}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {Object.entries(getQuizQuestionOptions(selectedQuizQuestions[currentQuizQuestionIndex])).map(([key, value]) => (
                      <Button
                        key={key}
                        variant={quizAnswers[selectedQuizQuestions[currentQuizQuestionIndex]] === key ? "contained" : "outlined"}
                        onClick={() => handleQuizAnswer(selectedQuizQuestions[currentQuizQuestionIndex], key)}
                        sx={{
                          padding: '12px 20px',
                          borderRadius: '8px',
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          direction: language === 'ar' ? 'rtl' : 'ltr',
                          ...(quizAnswers[selectedQuizQuestions[currentQuizQuestionIndex]] === key ? {
                            background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
                            color: 'white',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #c91a22 0%, #2a2a7a 100%)',
                            }
                          } : {})
                        }}
                      >
                        <Box sx={{ minWidth: 32, height: 32, borderRadius: '50%', background: quizAnswers[selectedQuizQuestions[currentQuizQuestionIndex]] === key ? 'rgba(255,255,255,0.3)' : 'rgba(227, 27, 35, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: language === 'ar' ? 0 : 2, ml: language === 'ar' ? 2 : 0, fontWeight: 700 }}>
                          {key}
                        </Box>
                        {value}
                      </Button>
                    ))}
                  </Box>
                </Card>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuizQuestionIndex === 0}
                    startIcon={<ArrowBack />}
                    sx={{
                      fontSize: '1rem',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {t('previous')}
                  </Button>

                  {currentQuizQuestionIndex === selectedQuizQuestions.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleQuizSubmit}
                      disabled={!quizAnswers[selectedQuizQuestions[currentQuizQuestionIndex]]}
                      className="crystal-button crystal-button-primary"
                      sx={{
                        fontSize: '1rem',
                        padding: '14px 32px',
                        borderRadius: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {t('inductionQuizSubmit')}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNextQuestion}
                      disabled={!quizAnswers[selectedQuizQuestions[currentQuizQuestionIndex]]}
                      className="crystal-button crystal-button-primary"
                      sx={{
                        fontSize: '1rem',
                        padding: '14px 32px',
                        borderRadius: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {t('next')}
                    </Button>
                  )}
                </Box>
              </>
            )}
          </Card>
        </Box>
      )}

      {/* Quiz Results Screen */}
      {showQuiz && quizCompleted && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: { xs: 2, sm: 4 },
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <Card
            sx={{
              maxWidth: '600px',
              width: '100%',
              animation: 'fadeInScale 0.3s ease-out',
              p: 4,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(227, 27, 35, 0.2)',
              boxShadow: '0 8px 32px rgba(227, 27, 35, 0.2)',
            }}
          >
            {quizPassed ? (
              <>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 8px 24px rgba(227, 27, 35, 0.4)',
                  }}
                >
                  <CheckCircle sx={{ fontSize: 60, color: 'white' }} />
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                  }}
                >
                  {t('inductionQuizPassed')}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    color: '#1e293b',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                    fontWeight: 500
                  }}
                >
                  {t('inductionQuizPassedMessage').replace('{score}', quizScore)}
                </Typography>
                <Button
                  variant="contained"
                  onClick={onBack}
                  className="crystal-button crystal-button-primary"
                  sx={{
                    fontSize: '1rem',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 700,
                  }}
                >
                  {t('safetyInductionBackToHome')}
                </Button>
              </>
            ) : (
              <>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e31b23 0%, #333092 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 8px 24px rgba(227, 27, 35, 0.4)',
                    opacity: 0.7,
                  }}
                >
                  <Cancel sx={{ fontSize: 60, color: 'white' }} />
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: '#e31b23',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                  }}
                >
                  {t('inductionQuizFailed')}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    color: '#1e293b',
                    direction: language === 'ar' ? 'rtl' : 'ltr',
                    fontWeight: 500
                  }}
                >
                  {t('inductionQuizFailedMessage').replace('{score}', quizScore)}
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleRetakeQuiz}
                  className="crystal-button crystal-button-primary"
                  sx={{
                    fontSize: '1rem',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontWeight: 700,
                  }}
                >
                  {t('inductionQuizRetake')}
                </Button>
              </>
            )}
          </Card>
        </Box>
      )}
    </Container>
  )
}


