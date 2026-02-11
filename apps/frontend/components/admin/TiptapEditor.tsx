'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Underline from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'
import { Link } from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Superscript } from '@tiptap/extension-superscript'
import { Subscript } from '@tiptap/extension-subscript'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Dropcursor } from '@tiptap/extension-dropcursor'
import { Gapcursor } from '@tiptap/extension-gapcursor'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PromptDialog } from 'scoop'
import { isValidYoutubeUrl, toYoutubeEmbedUrl } from '@/lib/youtube'
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconH1,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconQuote,
  IconMinus,
  IconPhoto,
  IconBrandYoutube,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCode,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconAlignJustified,
  IconHighlight,
  IconLink,
  IconLinkOff,
  IconTable,
  IconTablePlus,
  IconTableMinus,
  IconSuperscript,
  IconSubscript,
  IconPalette,
} from '@tabler/icons-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Ref for save/restore per TipTap docs: getJSON() to save, setContent() to restore (e.g. draft/revision). */
export type TiptapEditorRef = {
  getJSON: () => unknown
  setContent: (content: unknown) => void
} | null

/** Called when user inserts image or youtube so the form can keep URLs for payload fix if getJSON() omits attrs. */
export type OnMediaInserted = (type: 'image' | 'youtube', attrs: Record<string, unknown>) => void

interface TiptapEditorProps {
  content?: unknown
  onChange?: (content: unknown) => void
  onAutoSave?: (content: unknown) => void
  autoSaveMs?: number
  placeholder?: string
  readOnly?: boolean
  contentRef?: React.MutableRefObject<unknown>
  editorRef?: React.MutableRefObject<TiptapEditorRef>
  onMediaInserted?: OnMediaInserted
}

/* ------------------------------------------------------------------ */
/*  Sanitize helpers                                                   */
/* ------------------------------------------------------------------ */

/** Sanitize attrs: null/undefined → '' so extensions don't crash on .match(). */
function sanitizeAttrs(
  attrs: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined {
  if (!attrs || typeof attrs !== 'object') return undefined
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) {
      // Null → empty string (prevents .match(null) crashes)
      clean[key] = ''
    } else {
      clean[key] = value
    }
  }
  return clean
}

function sanitizeNode(node: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...node }

  // Sanitize node-level attrs
  if (out.attrs != null && typeof out.attrs === 'object') {
    out.attrs = sanitizeAttrs(out.attrs as Record<string, unknown>)
  }
  if (out.type === 'youtube' || out.type === 'image') {
    const a = (out.attrs ?? {}) as Record<string, unknown>
    if (a.src === null || a.src === undefined || typeof a.src !== 'string') {
      a.src = ''
    }
    out.attrs = a
  }

  // Sanitize marks (each mark can also carry attrs)
  if (Array.isArray(out.marks)) {
    out.marks = (out.marks as Record<string, unknown>[]).map((mark) => {
      if (!mark || typeof mark !== 'object') return mark
      const m = { ...mark }
      if (m.attrs != null && typeof m.attrs === 'object') {
        m.attrs = sanitizeAttrs(m.attrs as Record<string, unknown>)
      }
      return m
    })
  }

  // Recurse into child nodes
  if (Array.isArray(out.content)) {
    out.content = (out.content as unknown[]).map((child) =>
      child && typeof child === 'object' && !Array.isArray(child)
        ? sanitizeNode(child as Record<string, unknown>)
        : child,
    )
  }

  return out
}

function normalizeTiptapContent(
  content: unknown,
): Record<string, unknown> | undefined {
  try {
    if (content == null) return undefined

    let doc: Record<string, unknown> | undefined

    if (typeof content === 'object' && !Array.isArray(content)) {
      const obj = content as Record<string, unknown>
      if (obj.type === 'doc') {
        doc = obj
      } else if (Array.isArray(obj.content)) {
        doc = { type: 'doc', content: obj.content }
      }
    } else if (Array.isArray(content)) {
      doc = { type: 'doc', content }
    }

    if (!doc) return undefined

    // Deep-clone via JSON round-trip so we never mutate the prop,
    // then sanitize every node and mark.
    const cloned = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>
    return sanitizeNode(cloned)
  } catch {
    // If anything goes wrong, return undefined so the editor starts empty
    // rather than crashing.
    return undefined
  }
}

/* ------------------------------------------------------------------ */
/*  Toolbar Button                                                     */
/* ------------------------------------------------------------------ */

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        if (!disabled) onClick()
      }}
      disabled={disabled}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      } disabled:opacity-40`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-border" />
}

/* ------------------------------------------------------------------ */
/*  Color picker popover (inline)                                      */
/* ------------------------------------------------------------------ */

const TEXT_COLORS = [
  '#000000',
  '#434343',
  '#666666',
  '#999999',
  '#E03131',
  '#E8590C',
  '#F08C00',
  '#2F9E44',
  '#1971C2',
  '#6741D9',
  '#C2255C',
]

function ColorPicker({
  currentColor,
  onSelect,
}: {
  currentColor?: string
  onSelect: (color: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <ToolbarButton onClick={() => setOpen(!open)} title="Couleur du texte">
        <IconPalette
          className="h-4 w-4"
          style={{ color: currentColor || undefined }}
        />
      </ToolbarButton>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-2 shadow-lg">
          {TEXT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="h-5 w-5 rounded-sm border border-border transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(color)
                setOpen(false)
              }}
            />
          ))}
          <button
            type="button"
            className="h-5 w-5 rounded-sm border border-border bg-transparent text-[8px] hover:scale-110"
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect('')
              setOpen(false)
            }}
            title="Réinitialiser"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Editor                                                        */
/* ------------------------------------------------------------------ */

export function TiptapEditor({
  content,
  onChange,
  onAutoSave,
  autoSaveMs = 5000,
  placeholder = 'Commencez à écrire votre article...',
  readOnly = false,
  contentRef,
  editorRef,
  onMediaInserted,
}: TiptapEditorProps) {
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  type PromptKind = 'image' | 'youtube' | 'link'
  const [promptOpen, setPromptOpen] = useState(false)
  const [promptKind, setPromptKind] = useState<PromptKind | null>(null)
  const [promptDefaultValue, setPromptDefaultValue] = useState('')
  const [promptError, setPromptError] = useState('')

  const safePlaceholder =
    placeholder ?? 'Commencez à écrire votre article...'

  // TipTap persistence (https://tiptap.dev/docs/editor/core-concepts/persistence):
  // Save: editor.getJSON() → send JSON to API. Restore: editor.setContent(data) or content at init.
  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        dropcursor: false,
        gapcursor: false,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TextStyle,
      Color,
      Superscript,
      Subscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Dropcursor.configure({ color: 'hsl(var(--primary))' }),
      Gapcursor,
      Image.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full mx-auto' },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'rounded-lg overflow-hidden mx-auto',
        },
        width: 640,
        height: 360,
      }),
      Placeholder.configure({ placeholder: safePlaceholder }),
      CharacterCount,
    ],
    content: normalizeTiptapContent(content),
    onUpdate: ({ editor: e }) => {
      const json = e.getJSON()
      if (contentRef) contentRef.current = json
      onChange?.(json)

      if (onAutoSave) {
        clearTimeout(autoSaveRef.current)
        autoSaveRef.current = setTimeout(() => {
          onAutoSave(json)
        }, autoSaveMs)
      }
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose dark:prose-invert max-w-none min-h-[400px] focus:outline-none px-4 py-3',
      },
    },
  })

  useEffect(() => {
    return () => clearTimeout(autoSaveRef.current)
  }, [])

  useEffect(() => {
    if (!editorRef || !editor) return
    editorRef.current = {
      getJSON: () => editor.getJSON(),
      setContent: (content: unknown) => {
        const doc = normalizeTiptapContent(content)
        editor.commands.setContent(doc ?? '')
      },
    }
    return () => {
      editorRef.current = null
    }
  }, [editor, editorRef])

  useEffect(() => {
    if (!editor || !contentRef) return
    contentRef.current = editor.getJSON()
  }, [editor, contentRef])

  const addImage = useCallback(() => {
    if (!editor) return
    setPromptKind('image')
    setPromptDefaultValue('')
    setPromptError('')
    setPromptOpen(true)
  }, [editor])

  const addYoutube = useCallback(() => {
    if (!editor) return
    setPromptKind('youtube')
    setPromptDefaultValue('')
    setPromptError('')
    setPromptOpen(true)
  }, [editor])

  const addLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href ?? ''
    setPromptKind('link')
    setPromptDefaultValue(typeof previousUrl === 'string' ? previousUrl : '')
    setPromptError('')
    setPromptOpen(true)
  }, [editor])

  const handlePromptSubmit = useCallback(
    (value: string): boolean | void => {
      if (!editor || !promptKind) return
      // Use insertContent for both so attrs (src) are stored in the doc and persist in getJSON().
      if (promptKind === 'image') {
        const src = (value ?? '').trim()
        if (src) {
          editor.chain().focus().insertContent({ type: 'image', attrs: { src } }).run()
        }
        setPromptOpen(false)
        setPromptError('')
        return
      }
      if (promptKind === 'youtube') {
        const url = (value ?? '').trim()
        if (!url) return
        if (!isValidYoutubeUrl(url)) {
          setPromptError(
            'URL YouTube invalide. Utilisez un lien du type youtube.com/watch?v=... ou youtu.be/...',
          )
          return false
        }
        const embedUrl = toYoutubeEmbedUrl(url)
        if (!embedUrl) {
          setPromptError('Impossible de convertir le lien en vidéo.')
          return false
        }
        editor.chain().focus().insertContent({
          type: 'youtube',
          attrs: { src: embedUrl, width: 640, height: 360 },
        }).run()
        setPromptOpen(false)
        setPromptError('')
        return
      }
      if (promptKind === 'link') {
        if (value === '') {
          editor.chain().focus().extendMarkRange('link').unsetLink().run()
        } else {
          editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: value })
            .run()
        }
        setPromptOpen(false)
      }
    },
    [editor, promptKind, onMediaInserted],
  )

  const promptConfig =
    promptKind === 'image'
      ? {
          title: "URL de l'image",
          label: "URL de l'image",
          placeholder: 'https://…',
          submitLabel: 'Insérer',
        }
      : promptKind === 'youtube'
        ? {
            title: 'Vidéo YouTube',
            label: 'Collez un lien YouTube (watch, youtu.be ou embed)',
            placeholder: 'https://www.youtube.com/watch?v=…',
            submitLabel: 'Insérer',
          }
        : promptKind === 'link'
          ? {
              title: 'URL du lien',
              label: 'URL',
              placeholder: 'https://…',
              submitLabel: 'Appliquer',
            }
          : null

  const insertTable = useCallback(() => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }, [editor])

  if (!editor) return null

  const iconSize = 'h-4 w-4'
  const words = editor.storage.characterCount.words()
  const chars = editor.storage.characterCount.characters()
  const readingTime = Math.max(1, Math.ceil(words / 200))

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Gras (Ctrl+B)"
          >
            <IconBold className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italique (Ctrl+I)"
          >
            <IconItalic className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Souligné (Ctrl+U)"
          >
            <IconUnderline className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Barré"
          >
            <IconStrikethrough className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive('highlight')}
            title="Surligner"
          >
            <IconHighlight className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            active={editor.isActive('superscript')}
            title="Exposant"
          >
            <IconSuperscript className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            active={editor.isActive('subscript')}
            title="Indice"
          >
            <IconSubscript className={iconSize} />
          </ToolbarButton>
          <ColorPicker
            currentColor={editor.getAttributes('textStyle').color}
            onSelect={(color) => {
              if (color) editor.chain().focus().setColor(color).run()
              else editor.chain().focus().unsetColor().run()
            }}
          />

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive('heading', { level: 1 })}
            title="Titre 1"
          >
            <IconH1 className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive('heading', { level: 2 })}
            title="Titre 2"
          >
            <IconH2 className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive('heading', { level: 3 })}
            title="Titre 3"
          >
            <IconH3 className={iconSize} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign('left').run()
            }
            active={editor.isActive({ textAlign: 'left' })}
            title="Aligner à gauche"
          >
            <IconAlignLeft className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign('center').run()
            }
            active={editor.isActive({ textAlign: 'center' })}
            title="Centrer"
          >
            <IconAlignCenter className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign('right').run()
            }
            active={editor.isActive({ textAlign: 'right' })}
            title="Aligner à droite"
          >
            <IconAlignRight className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setTextAlign('justify').run()
            }
            active={editor.isActive({ textAlign: 'justify' })}
            title="Justifier"
          >
            <IconAlignJustified className={iconSize} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists & blocks */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Liste à puces"
          >
            <IconList className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
            active={editor.isActive('orderedList')}
            title="Liste numérotée"
          >
            <IconListNumbers className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleBlockquote().run()
            }
            active={editor.isActive('blockquote')}
            title="Citation"
          >
            <IconQuote className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleCodeBlock().run()
            }
            active={editor.isActive('codeBlock')}
            title="Bloc de code"
          >
            <IconCode className={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().setHorizontalRule().run()
            }
            title="Séparateur"
          >
            <IconMinus className={iconSize} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Links & media */}
          <ToolbarButton
            onClick={addLink}
            active={editor.isActive('link')}
            title="Lien (Ctrl+K)"
          >
            <IconLink className={iconSize} />
          </ToolbarButton>
          {editor.isActive('link') && (
            <ToolbarButton
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .extendMarkRange('link')
                  .unsetLink()
                  .run()
              }
              title="Retirer le lien"
            >
              <IconLinkOff className={iconSize} />
            </ToolbarButton>
          )}
          <ToolbarButton onClick={addImage} title="Image (URL)">
            <IconPhoto className={iconSize} />
          </ToolbarButton>
          <ToolbarButton onClick={addYoutube} title="Vidéo YouTube">
            <IconBrandYoutube className={iconSize} />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Table */}
          <ToolbarButton onClick={insertTable} title="Insérer un tableau">
            <IconTable className={iconSize} />
          </ToolbarButton>
          {editor.isActive('table') && (
            <>
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().addColumnAfter().run()
                }
                title="Ajouter colonne"
              >
                <IconTablePlus className={iconSize} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().deleteTable().run()
                }
                title="Supprimer tableau"
              >
                <IconTableMinus className={iconSize} />
              </ToolbarButton>
            </>
          )}

          {/* Undo / redo */}
          <div className="ml-auto flex items-center gap-0.5">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Annuler (Ctrl+Z)"
            >
              <IconArrowBackUp className={iconSize} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Rétablir (Ctrl+Y)"
            >
              <IconArrowForwardUp className={iconSize} />
            </ToolbarButton>
          </div>
        </div>
      )}

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Footer with stats */}
      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
        <span>
          {chars} caractères · {words} mots
        </span>
        <span>~{readingTime} min de lecture</span>
      </div>

      {/* URL prompt (image, YouTube, link) — replaces window.prompt */}
      {promptConfig && promptKind && (
        <PromptDialog
          open={promptOpen}
          onOpenChange={setPromptOpen}
          title={promptConfig.title}
          label={promptConfig.label}
          defaultValue={promptDefaultValue}
          placeholder={promptConfig.placeholder}
          submitLabel={promptConfig.submitLabel}
          cancelLabel="Annuler"
          error={promptError}
          onSubmit={handlePromptSubmit}
        />
      )}
    </div>
  )
}
