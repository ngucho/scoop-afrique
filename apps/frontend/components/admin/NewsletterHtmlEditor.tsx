'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Link2, Redo2, Undo2 } from 'lucide-react'
import { Button } from 'scoop'

export function NewsletterHtmlEditor({
  html,
  onChange,
  placeholder = 'Rédigez le corps de l’e-mail (aperçu WYSIWYG). Le HTML sera utilisé à l’envoi.',
}: {
  html: string
  onChange: (nextHtml: string) => void
  placeholder?: string
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank', class: 'text-primary underline' },
      }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full rounded-md' } }),
      Placeholder.configure({ placeholder }),
    ],
    content: html?.trim() ? html : '<p></p>',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[280px] focus:outline-none px-3 py-2 rounded-md border border-input bg-background',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  if (!editor) return <div className="min-h-[280px] animate-pulse rounded-md border border-border bg-muted/30" />

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 rounded-md border border-border bg-muted/40 p-1">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="icon-sm"
          className="rounded-md"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Gras"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="icon-sm"
          className="rounded-md"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italique"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
          size="icon-sm"
          className="rounded-md"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Souligné"
        >
          <span className="text-xs font-semibold underline">U</span>
        </Button>
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="icon-sm"
          className="rounded-md"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Liste"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="icon-sm"
          className="rounded-md"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Liste numérotée"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-md"
          onClick={() => {
            const url = window.prompt('URL du lien')
            if (!url) return
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          }}
          aria-label="Lien"
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-md"
          onClick={() => editor.chain().focus().undo().run()}
          aria-label="Annuler"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-md"
          onClick={() => editor.chain().focus().redo().run()}
          aria-label="Rétablir"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
