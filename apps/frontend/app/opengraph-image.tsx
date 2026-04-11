import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export const alt = 'Scoop.Afrique — média panafricain'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Image Open Graph / partages sociaux — logo typographique (fichier og-image.png absent auparavant). */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #fafafa 0%, #e8e8e8 50%, #f5f5f5 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontSize: 88,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#0d0d0d',
            }}
          >
            SCOOP
          </span>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 9999,
              background: '#FF3131',
            }}
          />
          <span
            style={{
              fontSize: 88,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#FF3131',
            }}
          >
            AFRIQUE
          </span>
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#404040',
            fontWeight: 600,
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          Actualités, décryptages & reportages panafricains
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 22,
            color: '#737373',
            fontWeight: 500,
          }}
        >
          www.scoop-afrique.com · brands.scoop-afrique.com
        </div>
      </div>
    ),
    { ...size },
  )
}
