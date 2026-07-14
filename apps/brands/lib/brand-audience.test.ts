import test from 'node:test'
import assert from 'node:assert/strict'
import { buildBrandAudienceSummary, formatAudienceNumber } from './brand-audience'

test('formatAudienceNumber formats media-kit scale values', () => {
  assert.equal(formatAudienceNumber(1_600_000), '+1,6M')
  assert.equal(formatAudienceNumber(488_000), '+488K')
  assert.equal(formatAudienceNumber(10_000), '+10K')
})

test('buildBrandAudienceSummary prefers admin metrics and falls back per platform', () => {
  const summary = buildBrandAudienceSummary([
    { platform: 'TikTok', metric_key: 'followers', snapshot_date: '2026-07-14', value_numeric: '1200000', country_code: null },
    { platform: 'site', metric_key: 'visits_30d', snapshot_date: '2026-07-14', value_numeric: '12500', country_code: null },
  ])

  assert.equal(summary.stats.find((s) => s.key === 'tiktok')?.display, '+1,2M')
  assert.equal(summary.stats.find((s) => s.key === 'facebook')?.source, 'fallback')
  assert.equal(summary.siteVisits.display, '+13K')
  assert.equal(summary.sourceLabel, 'Synchronise depuis admin / audience metrics')
})
