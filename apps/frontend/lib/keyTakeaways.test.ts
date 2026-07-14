import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDefaultKeyTakeawaysAttrs,
  normalizeKeyTakeawayItems,
  normalizeKeyTakeawaysAttrs,
} from './keyTakeaways'

test('buildDefaultKeyTakeawaysAttrs returns fresh default attributes for each new block', () => {
  const first = buildDefaultKeyTakeawaysAttrs()
  const second = buildDefaultKeyTakeawaysAttrs()

  first.items[0].value = 'Changed'

  assert.equal(second.title, "Ce qu'il faut retenir")
  assert.equal(second.items.length, 4)
  assert.equal(second.items[0].value, '18 124 milliards FCFA')
})

test('normalizeKeyTakeawayItems trims editor rows and removes unusable rows', () => {
  const items = normalizeKeyTakeawayItems([
    { icon: 'trend', value: ' +7,8% ', label: ' Hausse annuelle ', body: ' Secteur bancaire ' },
    { icon: 'database', value: ' ', label: ' ', body: ' ' },
    { icon: 'unknown', value: 'Cacao', label: 'Record', body: 'Cours records' },
  ])

  assert.deepEqual(items, [
    { icon: 'trend', value: '+7,8%', label: 'Hausse annuelle', body: 'Secteur bancaire' },
    { icon: 'database', value: 'Cacao', label: 'Record', body: 'Cours records' },
  ])
})

test('normalizeKeyTakeawaysAttrs keeps the block compact and falls back to defaults', () => {
  const attrs = normalizeKeyTakeawaysAttrs({
    title: '  Points cles  ',
    items: Array.from({ length: 8 }, (_, index) => ({
      icon: 'users',
      value: `Point ${index + 1}`,
      label: `Label ${index + 1}`,
      body: `Body ${index + 1}`,
    })),
  })

  assert.equal(attrs.title, 'Points cles')
  assert.equal(attrs.items.length, 6)
  assert.equal(normalizeKeyTakeawaysAttrs({ items: [] }).items.length, 4)
})
