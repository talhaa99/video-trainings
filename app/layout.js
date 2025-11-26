// import { Inter } from 'next/font/google'
// import CustomThemeProvider from './components/ThemeProvider'
// import './globals.css'

// const inter = Inter({ subsets: ['latin'] })
// // finish the zooming effecr at mobile or tablet
// export const metadata = {
//   title: 'Video Training Application',
//   description: 'Professional video training with interactive quizzes',
//   viewport: {
//     width: 'device-width',
//     initialScale: 1,
//     maximumScale: 1,
//     userScalable: false,
//     viewportFit: 'cover',
//   },
// }

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <head>
//         <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
//         <meta name="format-detection" content="telephone=no" />
//         <meta name="msapplication-tap-highlight" content="no" />
//       </head>
//       <body className={inter.className}>
//         <CustomThemeProvider>
//           {children}
//         </CustomThemeProvider>
//       </body>
//     </html>
//   )
// }
import { Inter } from 'next/font/google'
import CustomThemeProvider from './components/ThemeProvider'
import { LanguageProvider } from './contexts/LanguageContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Video Training Application',
  description: 'Professional video training with interactive quizzes',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <CustomThemeProvider>
            {children}
          </CustomThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
