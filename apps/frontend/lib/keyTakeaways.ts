export const KEY_TAKEAWAYS_NODE_NAME = 'keyTakeaways' as const

export const KEY_TAKEAWAY_ICON_VALUES = [
  'database',
  'trend',
  'target',
  'building',
  'banknote',
  'users',
  'globe',
  'landmark',
] as const

export type KeyTakeawayIcon = (typeof KEY_TAKEAWAY_ICON_VALUES)[number]

export type KeyTakeawayItem = {
  icon: KeyTakeawayIcon
  value: string
  label: string
  body: string
}

export type KeyTakeawaysAttrs = {
  title: string
  items: KeyTakeawayItem[]
}

const MAX_KEY_TAKEAWAYS = 6

const DEFAULT_KEY_TAKEAWAY_ITEMS: KeyTakeawayItem[] = [
  {
    icon: 'database',
    value: '18 124 milliards FCFA',
    label: 'Capitalisation boursiere',
    body: 'Total de la BRVM',
  },
  {
    icon: 'trend',
    value: '+7,8%',
    label: 'Hausse annuelle',
    body: 'Poussee par le secteur bancaire',
  },
  {
    icon: 'target',
    value: 'Cacao',
    label: 'Record',
    body: 'Des cours records soutiennent les valeurs agro-industrielles',
  },
  {
    icon: 'building',
    value: '7 valeurs mobilieres',
    label: 'Seuil symbolique',
    body: 'Franchissent les 100 milliards FCFA',
  },
]

function copyItem(item: KeyTakeawayItem): KeyTakeawayItem {
  return { ...item }
}

function trimText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

function normalizeIcon(value: unknown): KeyTakeawayIcon {
  return KEY_TAKEAWAY_ICON_VALUES.includes(value as KeyTakeawayIcon)
    ? (value as KeyTakeawayIcon)
    : 'database'
}

export function buildDefaultKeyTakeawaysAttrs(): KeyTakeawaysAttrs {
  return {
    title: "Ce qu'il faut retenir",
    items: DEFAULT_KEY_TAKEAWAY_ITEMS.map(copyItem),
  }
}

export function normalizeKeyTakeawayItems(input: unknown): KeyTakeawayItem[] {
  if (!Array.isArray(input)) return buildDefaultKeyTakeawaysAttrs().items

  const items = input
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null
      const row = raw as Record<string, unknown>
      const item: KeyTakeawayItem = {
        icon: normalizeIcon(row.icon),
        value: trimText(row.value, 80),
        label: trimText(row.label, 80),
        body: trimText(row.body, 160),
      }
      return item.value || item.label || item.body ? item : null
    })
    .filter((item): item is KeyTakeawayItem => Boolean(item))
    .slice(0, MAX_KEY_TAKEAWAYS)

  return items.length > 0 ? items : buildDefaultKeyTakeawaysAttrs().items
}

export function normalizeKeyTakeawaysAttrs(input: unknown): KeyTakeawaysAttrs {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  return {
    title: trimText(raw.title, 80) || "Ce qu'il faut retenir",
    items: normalizeKeyTakeawayItems(raw.items),
  }
}
