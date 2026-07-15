import test from 'node:test'
import assert from 'node:assert/strict'
import { levenshteinDistance, normalizeSearchText, scoreFuzzySearch } from './fuzzy-search.js'

test('normalizeSearchText removes accents and punctuation for comparable indexing', () => {
  assert.equal(normalizeSearchText('  Côte-d’Ivoire / CAN 2026!  '), 'cote d ivoire can 2026')
})

test('levenshteinDistance measures character edits', () => {
  assert.equal(levenshteinDistance('kinshasa', 'kinshassa'), 1)
  assert.equal(levenshteinDistance('can', 'afcon'), 3)
})

test('scoreFuzzySearch ranks close character matches above unrelated articles', () => {
  const ranked = scoreFuzzySearch('kinshassa', [
    {
      item: 'diaspora',
      fields: [{ value: 'La diaspora investit dans la mode urbaine', weight: 3 }],
    },
    {
      item: 'kinshasa',
      fields: [{ value: 'Kinshasa lance une scene culturelle nocturne', weight: 3 }],
    },
    {
      item: 'abidjan',
      fields: [{ value: 'Abidjan prepare un nouveau festival', weight: 3 }],
    },
  ])

  assert.equal(ranked[0]?.item, 'kinshasa')
  assert.ok((ranked[0]?.score ?? 0) > (ranked[1]?.score ?? 0))
})

test('scoreFuzzySearch uses field weights to favor title matches', () => {
  const ranked = scoreFuzzySearch('startup', [
    {
      item: 'excerpt-match',
      fields: [
        { value: 'Football africain', weight: 3 },
        { value: 'Une startup est citee en fin de resume', weight: 1 },
      ],
    },
    {
      item: 'title-match',
      fields: [
        { value: 'Startup africaine en pleine levee', weight: 3 },
        { value: 'Economie numerique', weight: 1 },
      ],
    },
  ])

  assert.equal(ranked[0]?.item, 'title-match')
})
