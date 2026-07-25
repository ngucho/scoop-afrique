'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from 'scoop'
import { IconHeart } from '@tabler/icons-react'
import { config } from '@/lib/config'
import type { LikesResponse } from '@/lib/api/types'
import { getOrCreateReaderVisitorId } from '@/lib/readerIdentity'

const API_PREFIX = '/api/v1'

interface LikeButtonProps {
  articleId: string
  initialCount: number
  initialLiked: boolean
  className?: string
}

export function LikeButton({ articleId, initialCount, initialLiked, className }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(initialLiked)
  const [loading, setLoading] = useState(false)

  const fetchLikedState = useCallback(async () => {
    const anonId = getOrCreateReaderVisitorId()
    if (!anonId) return
    try {
      const url = `${config.apiBaseUrl}${API_PREFIX}/articles/${articleId}/likes?anonymous_id=${encodeURIComponent(anonId)}`
      const res = await fetch(url)
      if (res.ok) {
        const json = (await res.json()) as LikesResponse
        setCount(json.data.count)
        setLiked(json.data.liked)
      }
    } catch {
      // keep current state
    }
  }, [articleId])

  useEffect(() => {
    fetchLikedState()
  }, [fetchLikedState])

  const toggle = async () => {
    if (loading) return
    setLoading(true)
    try {
      const anonId = getOrCreateReaderVisitorId()
      const url = `${config.apiBaseUrl}${API_PREFIX}/articles/${articleId}/likes`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonymous_id: anonId }),
      })
      if (!res.ok) throw new Error('Failed to toggle like')
      const json = (await res.json()) as LikesResponse
      setCount(json.data.count)
      setLiked(json.data.liked)
    } catch {
      // keep previous state
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={liked ? 'default' : 'outline'}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={className}
      aria-pressed={liked}
      aria-label={liked ? 'Retirer le like' : 'J’aime'}
    >
      <IconHeart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
      <span>{count}</span>
    </Button>
  )
}
