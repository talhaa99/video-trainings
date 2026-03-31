import { Inter } from 'next/font/google'
import CustomThemeProvider from './components/ThemeProvider'
import { LanguageProvider } from './contexts/LanguageContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Petrogas E&P',
  description: 'Petrogas E&P training and administration portal',
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
