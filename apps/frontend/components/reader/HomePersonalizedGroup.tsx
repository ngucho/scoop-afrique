'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { READER_STATE_EVENT, readReaderHistory, type ReaderHistoryItem } from '@/lib/readerHistory'

interface HomePersonalizedGroupProps {
  children: ReactNode
  className?: string
}

export function HomePersonalizedGroup({ children, className }: HomePersonalizedGroupProps) {
  const groupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    const apply = () => personalizeChildren(group, readReaderHistory())
    apply()
    window.addEventListener(READER_STATE_EVENT, apply)
    return () => window.removeEventListener(READER_STATE_EVENT, apply)
  }, [])

  return (
    <div ref={groupRef} className={className}>
      {children}
    </div>
  )
}

function personalizeChildren(group: HTMLDivElement, history: ReaderHistoryItem[]) {
  const children = Array.from(group.children).filter((child): child is HTMLElement => child instanceof HTMLElement)
  if (children.length < 2) return

  const locked = children.filter((child) => child.dataset.homeSectionLocked === 'true')
  const scored = children.filter((child) => child.dataset.homeSectionLocked !== 'true').map((child, index) => ({
    child,
    index,
    score: sectionScore(child, history, index),
  }))

  locked.forEach((child, index) => {
    child.style.order = String(index)
  })

  scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .forEach((item, order) => {
      item.child.style.order = String(locked.length + order)
    })
}

function sectionScore(node: HTMLElement, history: ReaderHistoryItem[], index: number): number {
  const category = node.dataset.homeSectionCategorySlug ?? ''
  const key = node.dataset.homeSectionKey ?? ''
  const tags = (node.dataset.homeSectionTags ?? '')
    .split('|')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
  const seed = homeSeed()
  let score = seededNumber(`${seed}:${key}:${category}:${index}`) * 2

  history.slice(0, 40).forEach((item, historyIndex) => {
    const weight = Math.max(1, 8 - historyIndex * 0.18) * Math.max(1, item.views)
    if (category && item.category_slug === category) score += weight
    if (key && item.tags.some((tag) => tag.toLowerCase() === key.toLowerCase())) score += weight * 0.35
    if (item.category_slug && tags.includes(item.category_slug.toLowerCase())) score += weight * 0.7
    item.tags.forEach((tag) => {
      if (tags.includes(tag.toLowerCase())) score += weight * 0.25
    })
  })

  return score
}

function homeSeed() {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const key = 'scoop_home_session_seed'
    const existing = window.sessionStorage.getItem(key)
    if (existing) return `${today}:${existing}`
    const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
    window.sessionStorage.setItem(key, next)
    return `${today}:${next}`
  } catch {
    return today
  }
}

function seededNumber(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967296
}
