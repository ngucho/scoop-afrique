import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import {
  KEY_TAKEAWAY_ICON_VALUES,
  KEY_TAKEAWAYS_NODE_NAME,
  buildDefaultKeyTakeawaysAttrs,
  normalizeKeyTakeawaysAttrs,
  type KeyTakeawayIcon,
  type KeyTakeawayItem,
} from '@/lib/keyTakeaways'

const ICON_LABELS: Record<KeyTakeawayIcon, string> = {
  database: 'Donnee',
  trend: 'Tendance',
  target: 'Cible',
  building: 'Institution',
  banknote: 'Argent',
  users: 'Public',
  globe: 'Afrique',
  landmark: 'Etat',
}

function safeParseItems(value: string | null): unknown {
  if (!value) return []
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}

function KeyTakeawaysNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const attrs = normalizeKeyTakeawaysAttrs(node.attrs)

  function updateTitle(title: string) {
    updateAttributes(normalizeKeyTakeawaysAttrs({ ...attrs, title }))
  }

  function updateItem(index: number, patch: Partial<KeyTakeawayItem>) {
    const nextItems = attrs.items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    )
    updateAttributes(normalizeKeyTakeawaysAttrs({ ...attrs, items: nextItems }))
  }

  function addItem() {
    if (attrs.items.length >= 6) return
    updateAttributes(
      normalizeKeyTakeawaysAttrs({
        ...attrs,
        items: [
          ...attrs.items,
          { icon: 'target', value: 'Point cle', label: 'Contexte', body: 'Pourquoi cela compte' },
        ],
      }),
    )
  }

  function removeItem(index: number) {
    if (attrs.items.length <= 1) return
    updateAttributes(normalizeKeyTakeawaysAttrs({ ...attrs, items: attrs.items.filter((_, i) => i !== index) }))
  }

  return (
    <NodeViewWrapper
      data-key-takeaways
      contentEditable={false}
      className={[
        'my-5 rounded-xl border bg-card p-4 shadow-sm',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border',
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block flex-1">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-primary">
            Bloc lecteur
          </span>
          <input
            value={attrs.title}
            onChange={(event) => updateTitle(event.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-black uppercase tracking-[0.12em] text-foreground outline-none focus:ring-2 focus:ring-ring"
            aria-label="Titre du bloc a retenir"
          />
        </label>
        <button
          type="button"
          onClick={addItem}
          disabled={attrs.items.length >= 6}
          className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ajouter une carte
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {attrs.items.map((item, index) => (
          <div key={index} className="rounded-lg border border-border bg-background p-3">
            <div className="grid gap-2 sm:grid-cols-[130px_1fr]">
              <label>
                <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">Icone</span>
                <select
                  value={item.icon}
                  onChange={(event) =>
                    updateItem(index, { icon: event.target.value as KeyTakeawayIcon })
                  }
                  className="w-full rounded-md border border-input bg-card px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  aria-label={`Icone carte ${index + 1}`}
                >
                  {KEY_TAKEAWAY_ICON_VALUES.map((icon) => (
                    <option key={icon} value={icon}>
                      {ICON_LABELS[icon]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">Valeur</span>
                <input
                  value={item.value}
                  onChange={(event) => updateItem(index, { value: event.target.value })}
                  className="w-full rounded-md border border-input bg-card px-2 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
                  aria-label={`Valeur carte ${index + 1}`}
                />
              </label>
            </div>
            <label className="mt-2 block">
              <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">Libelle</span>
              <input
                value={item.label}
                onChange={(event) => updateItem(index, { label: event.target.value })}
                className="w-full rounded-md border border-input bg-card px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                aria-label={`Libelle carte ${index + 1}`}
              />
            </label>
            <label className="mt-2 block">
              <span className="mb-1 block text-[11px] font-semibold text-muted-foreground">Precision</span>
              <textarea
                value={item.body}
                onChange={(event) => updateItem(index, { body: event.target.value })}
                rows={2}
                className="w-full resize-none rounded-md border border-input bg-card px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                aria-label={`Precision carte ${index + 1}`}
              />
            </label>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={attrs.items.length <= 1}
                className="text-xs font-bold text-muted-foreground transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>
    </NodeViewWrapper>
  )
}

export const KeyTakeaways = Node.create({
  name: KEY_TAKEAWAYS_NODE_NAME,
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: buildDefaultKeyTakeawaysAttrs().title,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-title') ?? "Ce qu'il faut retenir",
        renderHTML: (attrs: Record<string, unknown>) => ({ 'data-title': attrs.title }),
      },
      items: {
        default: buildDefaultKeyTakeawaysAttrs().items,
        parseHTML: (el: HTMLElement) => safeParseItems(el.getAttribute('data-items')),
        renderHTML: (attrs: Record<string, unknown>) => ({
          'data-items': JSON.stringify(normalizeKeyTakeawaysAttrs(attrs).items),
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'section[data-key-takeaways]' }]
  },

  renderHTML({
    HTMLAttributes,
    node,
  }: {
    HTMLAttributes: Record<string, unknown>
    node: { attrs: Record<string, unknown> }
  }) {
    const attrs = normalizeKeyTakeawaysAttrs(node.attrs)
    return [
      'section',
      mergeAttributes(HTMLAttributes, {
        'data-key-takeaways': '',
        'data-title': attrs.title,
        'data-items': JSON.stringify(attrs.items),
        class: 'rounded-xl border border-border bg-card p-4',
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(KeyTakeawaysNodeView)
  },
})
