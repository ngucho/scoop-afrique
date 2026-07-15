import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPaginationItems } from './adminPagination'

test('buildPaginationItems keeps small pagination fully visible', () => {
  assert.deepEqual(buildPaginationItems(2, 4), [
    { type: 'page', page: 1, isCurrent: false },
    { type: 'page', page: 2, isCurrent: true },
    { type: 'page', page: 3, isCurrent: false },
    { type: 'page', page: 4, isCurrent: false },
  ])
})

test('buildPaginationItems collapses large pagination around current page', () => {
  assert.deepEqual(buildPaginationItems(10, 20), [
    { type: 'page', page: 1, isCurrent: false },
    { type: 'ellipsis', key: '1-9' },
    { type: 'page', page: 9, isCurrent: false },
    { type: 'page', page: 10, isCurrent: true },
    { type: 'page', page: 11, isCurrent: false },
    { type: 'ellipsis', key: '11-20' },
    { type: 'page', page: 20, isCurrent: false },
  ])
})

test('buildPaginationItems clamps invalid current page values', () => {
  const items = buildPaginationItems(99, 5)
  assert.deepEqual(items.at(-1), { type: 'page', page: 5, isCurrent: true })
})
