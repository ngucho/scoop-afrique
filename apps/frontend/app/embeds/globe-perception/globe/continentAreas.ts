/**
 * Superficies continentales — ordres de grandeur usuels (M km²).
 * Références courantes : agrégats géographiques de type CIA World Factbook / manuels de cartographie.
 * Les définitions de « continent » varient (ex. Europe/Asie) ; chiffres indicatifs pour comparaison pédagogique.
 */
export type ContinentAreaRow = {
  id: string
  name: string
  /** Millions de km² */
  areaMillionKm2: number
}

export const CONTINENT_AREAS: ContinentAreaRow[] = [
  { id: 'asia', name: 'Asie', areaMillionKm2: 44.58 },
  { id: 'africa', name: 'Afrique', areaMillionKm2: 30.37 },
  { id: 'namerica', name: 'Amérique du Nord', areaMillionKm2: 24.71 },
  { id: 'samerica', name: 'Amérique du Sud', areaMillionKm2: 17.84 },
  { id: 'antarctica', name: 'Antarctique', areaMillionKm2: 14.2 },
  { id: 'europe', name: 'Europe', areaMillionKm2: 10.53 },
  { id: 'oceania', name: 'Océanie', areaMillionKm2: 8.54 },
].sort((a, b) => b.areaMillionKm2 - a.areaMillionKm2)
