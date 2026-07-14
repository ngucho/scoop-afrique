export interface FuzzySearchDocument<T> {
  item: T
  fields: Array<{ value: string | null | undefined; weight?: number }>
}

export interface FuzzySearchResult<T> {
  item: T
  score: number
}

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  const current = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost,
      )
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j]
  }

  return previous[b.length]
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1
  if (b.includes(a)) return Math.min(1, 0.86 + a.length / Math.max(b.length, 1) * 0.14)
  if (a.includes(b)) return Math.min(1, 0.74 + b.length / Math.max(a.length, 1) * 0.16)

  const distance = levenshteinDistance(a, b)
  return Math.max(0, 1 - distance / Math.max(a.length, b.length))
}

function bestFieldScore(query: string, field: string): number {
  const normalized = normalizeSearchText(field)
  if (!normalized) return 0

  const queryTokens = query.split(' ').filter(Boolean)
  const fieldTokens = normalized.split(' ').filter(Boolean)
  const phraseScore = similarity(query, normalized)
  const tokenScore = queryTokens.reduce((sum, token) => {
    const best = fieldTokens.reduce((max, fieldToken) => Math.max(max, similarity(token, fieldToken)), 0)
    return sum + best
  }, 0) / Math.max(queryTokens.length, 1)

  return Math.max(phraseScore, tokenScore)
}

export function scoreFuzzySearch<T>(
  query: string,
  documents: Array<FuzzySearchDocument<T>>,
): Array<FuzzySearchResult<T>> {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return documents.map((document) => ({ item: document.item, score: 0 }))

  return documents
    .map((document, index) => {
      const score = document.fields.reduce((sum, field) => {
        const weight = field.weight ?? 1
        return sum + bestFieldScore(normalizedQuery, field.value ?? '') * weight
      }, 0)
      return { item: document.item, score, index }
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item, score }) => ({ item, score }))
}
