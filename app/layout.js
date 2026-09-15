import './globals.css'
import PushRegistrar from './PushRegistrar'
import CommunicationTvBand from '../components/CommunicationTvBand'
import OutgoingCallTone from '../components/OutgoingCallTone'
import LanguageSwitcher from '../components/LanguageSwitcher'
import I18nProvider from '../components/I18nProvider'
import AnalyticsTracker from '../components/AnalyticsTracker'
import NewUserAssistant from '../components/NewUserAssistant'
import BoutiqueOwnerAssistant from '../components/BoutiqueOwnerAssistant'

export const metadata = {
  title: "WakhReek",
  description: "WakhReek - Onley Took Communication",
  manifest: "/manifest.json?v=20260913-3",
  themeColor: "#0066ff",
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <I18nProvider>
          <AnalyticsTracker />
          <PushRegistrar />
          {children}
          <NewUserAssistant />
          <BoutiqueOwnerAssistant />
          <CommunicationTvBand />
          <OutgoingCallTone />
          <LanguageSwitcher />
        </I18nProvider>
      </body>
    </html>
  )
}
