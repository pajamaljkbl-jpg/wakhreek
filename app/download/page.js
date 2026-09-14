import Link from 'next/link'
import styles from './download.module.css'

const APK_URL = ''
const VERSION = 'Android 0.2 • Test validé'

export const metadata = {
  title: 'Télécharger WakhReek pour Android',
  description: 'Téléchargez l’application officielle WakhReek pour Android depuis wakhreek.com.',
}

export default function DownloadPage() {
  const releaseReady = Boolean(APK_URL)

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="WakhReek accueil">
          <img src="/wakhreek-192-v2.png" alt="WakhReek" />
          <span>WakhReek</span>
        </Link>
        <nav>
          <Link href="/communication">Ouvrir WakhReek</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.badge}>APPLICATION OFFICIELLE ANDROID</span>
          <h1>WakhReek sur votre téléphone</h1>
          <p className={styles.lead}>
            Boutiques, messagerie, notes vocales et appels audio/vidéo dans une seule application.
          </p>

          <div className={styles.actions}>
            {releaseReady ? (
              <a className={styles.primary} href={APK_URL} download>
                Télécharger WakhReek APK
              </a>
            ) : (
              <span className={`${styles.primary} ${styles.disabled}`} aria-disabled="true">
                APK Release officiel en préparation
              </span>
            )}
            <Link className={styles.secondary} href="/communication">
              Utiliser la version Web
            </Link>
          </div>

          <div className={styles.releaseInfo}>
            <span>✓ {VERSION}</span>
            <span>✓ Android</span>
            <span>✓ Téléchargement officiel : wakhreek.com</span>
          </div>
        </div>

        <div className={styles.phoneCard} aria-label="Aperçu WakhReek Android">
          <div className={styles.phoneTop}></div>
          <img src="/wakhreek-512-v2.png" alt="Icône officielle WakhReek" />
          <h2>WakhReek</h2>
          <p>Boutiques • Messagerie • Communauté</p>
          <div className={styles.features}>
            <span>💬 Messages</span>
            <span>🎙️ Audio</span>
            <span>📞 Appels</span>
            <span>🎥 Vidéo</span>
          </div>
        </div>
      </section>

      <section className={styles.install}>
        <div className={styles.sectionTitle}>
          <span>INSTALLATION</span>
          <h2>Comment installer WakhReek</h2>
          <p>Une installation simple, depuis le site officiel.</p>
        </div>

        <div className={styles.steps}>
          <article>
            <b>1</b>
            <h3>Télécharger</h3>
            <p>Appuyez sur « Télécharger WakhReek APK » depuis cette page officielle.</p>
          </article>
          <article>
            <b>2</b>
            <h3>Autoriser l’installation</h3>
            <p>Si Android le demande, autorisez votre navigateur à installer cette application.</p>
          </article>
          <article>
            <b>3</b>
            <h3>Installer</h3>
            <p>Ouvrez le fichier téléchargé puis appuyez sur « Installer ».</p>
          </article>
          <article>
            <b>4</b>
            <h3>Ouvrir WakhReek</h3>
            <p>Connectez-vous et utilisez la messagerie, l’audio et les appels.</p>
          </article>
        </div>

        <div className={styles.securityNote}>
          <strong>🔒 Sécurité</strong>
          <p>
            Téléchargez WakhReek uniquement depuis <b>wakhreek.com</b>. Il n’est pas nécessaire de désactiver Play Protect.
          </p>
        </div>
      </section>

      <section className={styles.videoSection}>
        <div>
          <span className={styles.badge}>GUIDE VIDÉO</span>
          <h2>Une vidéo montrera chaque étape</h2>
          <p>
            Nous ajouterons ici une démonstration courte : téléchargement, autorisation Android, installation et première ouverture.
          </p>
        </div>
        <div className={styles.videoPlaceholder}>
          <span>▶</span>
          <strong>Guide d’installation WakhReek</strong>
          <small>Vidéo bientôt disponible</small>
        </div>
      </section>

      <footer className={styles.footer}>
        <img src="/wakhreek-192-v2.png" alt="" />
        <div>
          <strong>WakhReek</strong>
          <span>Application officielle Android</span>
        </div>
        <Link href="/">Retour à l’accueil</Link>
      </footer>
    </main>
  )
}
