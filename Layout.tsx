import './globals.css'

export const metadata = {
  title: 'WakhReek - Onley Took | Marché Afrique',
  description: '15 pays, 7 langues mondiales, boutiques réelles',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
