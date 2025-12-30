import { translations } from './translations'

const DEFAULT_VIDEO_BASE = 'https://video.training.tecshield.net'

const normalizeBaseUrl = (url) => {
  if (!url) return ''
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const videoBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_VIDEO_DEPLOYED || DEFAULT_VIDEO_BASE)

const buildAssetUrl = (path) => {
  if (!path) return ''
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${videoBase}${normalizedPath}`
}

const getTrainingData = (lang = 'en') => {
  const currentLang = lang === 'ar' ? 'ar' : 'en'
  const t = (key) => translations[currentLang]?.[key] || translations['en'][key] || key
  const videoPaths = {
    fire: {
      en: '/videos/fire-english.mp4',
      ar: '/videos/Fire-Arabic.mp4'
    },
    cpr: {
      en: '/videos/Cpr-English.mp4',
      ar: '/videos/Cpr-Arabic.mp4'
    },
    safetyInduction: {
      en: '/safety-induction/video.mp4',
      ar: '/safety-induction/video.mp4'
    }
  }

  const videoSources = {
    fire: {
      en: buildAssetUrl(videoPaths.fire.en),
      ar: buildAssetUrl(videoPaths.fire.ar)
    },
    cpr: {
      en: buildAssetUrl(videoPaths.cpr.en),
      ar: buildAssetUrl(videoPaths.cpr.ar)
    },
    safetyInduction: {
      en: buildAssetUrl(videoPaths.safetyInduction.en),
      ar: buildAssetUrl(videoPaths.safetyInduction.ar)
    }
  }
  return {
    videoSources,
    videos: [
      {
        id: 1,
        title: t('firefightingTitle'),
        description: t('firefightingDescription'),
        videoUrl: videoSources.fire[currentLang],
        duration: "12:45",
        thumbnail: videoSources.fire[currentLang]
      },
      {
        id: 2,
        title: t('cprTitle'),
        description: t('cprDescription'),
        videoUrl: videoSources.cpr[currentLang],
        duration: "18:30",
        thumbnail: videoSources.cpr[currentLang]
      }
    ],
    quizzes: [
      {
        videoId: 1,
        questions: [
          {
            id: 1,
            question: t('firefightingQ1'),
            options: [
              t('firefightingQ1A1'),
              t('firefightingQ1A2'),
              t('firefightingQ1A3'),
              t('firefightingQ1A4')
            ],
            correctAnswer: 2
          },
          {
            id: 2,
            question: t('firefightingQ2'),
            options: [
              t('firefightingQ2A1'),
              t('firefightingQ2A2')
            ],
            correctAnswer: 1
          },
          {
            id: 3,
            question: t('firefightingQ3'),
            options: [
              t('firefightingQ3A1'),
              t('firefightingQ3A2'),
              t('firefightingQ3A3'),
              t('firefightingQ3A4')
            ],
            correctAnswer: 1
          },
          {
            id: 4,
            question: t('firefightingQ4'),
            options: [
              t('firefightingQ4A1'),
              t('firefightingQ4A2'),
              t('firefightingQ4A3'),
              t('firefightingQ4A4')
            ],
            correctAnswer: 1
          },
          {
            id: 5,
            question: t('firefightingQ5'),
            options: [
              t('firefightingQ5A1'),
              t('firefightingQ5A2'),
              t('firefightingQ5A3'),
              t('firefightingQ5A4')
            ],
            correctAnswer: 1
          },
          {
            id: 6,
            question: t('firefightingQ6'),
            options: [
              t('firefightingQ6A1'),
              t('firefightingQ6A2'),
              t('firefightingQ6A3'),
              t('firefightingQ6A4')
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        videoId: 2,
        questions: [
          {
            id: 7,
            question: t('cprQ1'),
            options: [
              t('cprQ1A1'),
              t('cprQ1A2'),
              t('cprQ1A3'),
              t('cprQ1A4')
            ],
            correctAnswer: 1
          },
          {
            id: 8,
            question: t('cprQ2'),
            options: [
              t('cprQ2A1'),
              t('cprQ2A2')
            ],
            correctAnswer: 1
          },
          {
            id: 9,
            question: t('cprQ3'),
            options: [
              t('cprQ3A1'),
              t('cprQ3A2'),
              t('cprQ3A3'),
              t('cprQ3A4')
            ],
            correctAnswer: 3
          },
          {
            id: 10,
            question: t('cprQ4'),
            options: [
              t('cprQ4A1'),
              t('cprQ4A2'),
              t('cprQ4A3'),
              t('cprQ4A4')
            ],
            correctAnswer: 1
          },
          {
            id: 11,
            question: t('cprQ5'),
            options: [
              t('cprQ5A1'),
              t('cprQ5A2'),
              t('cprQ5A3'),
              t('cprQ5A4')
            ],
            correctAnswer: 1
          },
          {
            id: 12,
            question: t('cprQ6'),
            options: [
              t('cprQ6A1'),
              t('cprQ6A2'),
              t('cprQ6A3'),
              t('cprQ6A4')
            ],
            correctAnswer: 2
          }
        ]
      }
    ]
  }
}

// Export default for backward compatibility (English)
export const trainingData = getTrainingData('en')

// Export function to get training data for a specific language
export { getTrainingData }

// Helper function to get safety induction video URL
export const getSafetyInductionVideoUrl = (lang = 'en') => {
  const currentLang = lang === 'ar' ? 'ar' : 'en'
  const trainingData = getTrainingData(lang)
  return trainingData.videoSources?.safetyInduction?.[currentLang] || buildAssetUrl('/safety-induction/video.mp4')
}
