import './globals.css'
import PushRegistrar from './PushRegistrar'
import CommunicationTvBand from '../components/CommunicationTvBand'
import OutgoingCallTone from '../components/OutgoingCallTone'
import LanguageSwitcher from '../components/LanguageSwitcher'
import I18nProvider from '../components/I18nProvider'

export const metadata = {
  title: "WakhReek",
  description: "WakhReek - Onley Took Communication",
  manifest: "/manifest.json",
  themeColor: "#0066ff",
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <I18nProvider>
          <PushRegistrar />
          {children}
          <CommunicationTvBand />
          <OutgoingCallTone />
          <LanguageSwitcher />
        </I18nProvider>
      </body>
    </html>
  )
}
