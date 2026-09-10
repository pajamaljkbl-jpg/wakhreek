import './globals.css'
import PushRegistrar from './PushRegistrar'
import CommunicationTvBand from '../components/CommunicationTvBand'
import OutgoingCallTone from '../components/OutgoingCallTone'
import LanguageSwitcher from '../components/LanguageSwitcher'
import AutoTranslator from '../components/AutoTranslator'

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
        <PushRegistrar />
        {children}
        <CommunicationTvBand />
        <OutgoingCallTone />
        <AutoTranslator />
        <LanguageSwitcher />
      </body>
    </html>
  )
}
