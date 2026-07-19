UPDATE homepage_sections
SET config = COALESCE(config, '{}'::jsonb) || '{"timeframe_hours": 48}'::jsonb,
    updated_at = now()
WHERE key = 'top_stories'
  AND NOT (COALESCE(config, '{}'::jsonb) ? 'timeframe_hours');
