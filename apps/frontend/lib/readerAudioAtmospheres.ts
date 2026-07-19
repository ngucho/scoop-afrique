const ASSET_BASE_URL = process.env.NEXT_PUBLIC_READER_AUDIO_ASSETS_BASE_URL?.replace(/\/$/, '')

function audioAsset(filename: string) {
  return ASSET_BASE_URL
    ? `${ASSET_BASE_URL}/${filename}`
    : `/audio/ambiences/${filename}`
}

export interface ReaderAudioAtmosphere {
  key: string
  label: string
  url: string
  attribution: string
}

const ATMOSPHERES: ReaderAudioAtmosphere[] = [
  {
    key: 'kora',
    label: 'Kora douce',
    url: audioAsset('kora.ogg'),
    attribution: 'Cinus Laurent - Kora, Licence Art Libre, via Wikimedia Commons',
  },
  {
    key: 'market',
    label: 'Rythme vivant',
    url: audioAsset('market.ogg'),
    attribution: 'ItzAbdullahi - The African Anthem, CC BY-SA 4.0, via Wikimedia Commons',
  },
  {
    key: 'bell',
    label: 'Agogo',
    url: audioAsset('bell.ogg'),
    attribution: 'Freddythehat - African double bell, public domain, via Wikimedia Commons',
  },
  {
    key: 'ambient',
    label: 'Ambiance calme',
    url: audioAsset('ambient.ogg'),
    attribution: 'Brenticus - Ambient, CC BY 3.0, via Wikimedia Commons',
  },
]

const CATEGORY_ATMOSPHERE: Record<string, string> = {
  culture: 'kora',
  actualites: 'ambient',
  politique: 'ambient',
  economie: 'ambient',
  sport: 'market',
  sports: 'market',
  environnement: 'kora',
  societe: 'bell',
}

export function readerAudioAtmosphereForCategory(categorySlug?: string | null): ReaderAudioAtmosphere {
  const key = categorySlug ? CATEGORY_ATMOSPHERE[categorySlug] : undefined
  return ATMOSPHERES.find((item) => item.key === key) ?? ATMOSPHERES[0]
}
