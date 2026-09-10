import './globals.css'
import PushRegistrar from './PushRegistrar'
import CommunicationTvBand from '../components/CommunicationTvBand'
import OutgoingCallTone from '../components/OutgoingCallTone'

export const metadata = {
  title: "WakhReek",
  description: "WakhReek - Onley Took Communication",
  manifest: "/manifest.json",
  themeColor: "#0066ff",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PushRegistrar />
        {children}
        <CommunicationTvBand />
        <OutgoingCallTone />
      </body>
    </html>
  )
}
