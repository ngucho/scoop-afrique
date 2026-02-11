import { Heading, Blockquote, BlockquoteContent } from 'scoop'
import { getYoutubeEmbedSrc } from '@/lib/youtube'

/**
 * ArticleBody — renders Tiptap JSON content for the reader.
 *
 * Supports two content formats:
 * 1. Tiptap ProseMirror JSON (from admin editor): { type: "doc", content: [...] }
 * 2. Legacy block array format: [{ type, content, ... }]
 *
 * Supports all Tiptap block types including:
 * - paragraphs, headings, blockquotes, lists
 * - images, youtube embeds
 * - code blocks, horizontal rules
 * - tables (table, tableRow, tableCell, tableHeader)
 * - text alignment, highlight, superscript, subscript, text color, links
 */

interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  attrs?: Record<string, unknown>
  marks?: { type: string; attrs?: Record<string, unknown> }[]
}

interface ArticleBodyProps {
  content: unknown
  className?: string
}

export function ArticleBody({ content, className }: ArticleBodyProps) {
  if (!content) return null

  // Handle Tiptap JSON (type: "doc")
  if (typeof content === 'object' && content !== null && 'type' in content) {
    const doc = content as TiptapNode
    if (doc.type === 'doc' && Array.isArray(doc.content)) {
      return (
        <article className={`prose prose-neutral max-w-none dark:prose-invert ${className ?? ''}`}>
          {doc.content.map((node, i) => (
            <TiptapBlock key={i} node={node} />
          ))}
        </article>
      )
    }
  }

  // Handle HTML string content
  if (typeof content === 'string') {
    return (
      <article
        className={`prose prose-neutral max-w-none dark:prose-invert ${className ?? ''}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  // Handle legacy block array
  if (Array.isArray(content)) {
    return (
      <article className={`prose prose-neutral max-w-none dark:prose-invert ${className ?? ''}`}>
        {content.map((block, i) => (
          <LegacyBlock key={i} block={block as LegacyBlockData} />
        ))}
      </article>
    )
  }

  return null
}

/* ============ Tiptap ProseMirror JSON Renderer ============ */

function getTextAlign(attrs?: Record<string, unknown>): React.CSSProperties | undefined {
  const align = attrs?.textAlign as string | undefined
  if (align && ['left', 'center', 'right', 'justify'].includes(align)) {
    return { textAlign: align as 'left' | 'center' | 'right' | 'justify' }
  }
  return undefined
}

function TiptapBlock({ node }: { node: TiptapNode }) {
  switch (node.type) {
    case 'paragraph':
      return (
        <p className="mb-4 leading-relaxed" style={getTextAlign(node.attrs)}>
          <TiptapInline nodes={node.content} />
        </p>
      )

    case 'heading': {
      const level = Math.min(Number(node.attrs?.level ?? 1), 6) as 1 | 2 | 3 | 4 | 5 | 6
      const tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return (
        <Heading as={tag} level={tag} className="mb-2 mt-8" style={getTextAlign(node.attrs)}>
          <TiptapInline nodes={node.content} />
        </Heading>
      )
    }

    case 'blockquote':
      return (
        <Blockquote className="my-6">
          <BlockquoteContent>
            {node.content?.map((child, i) => <TiptapBlock key={i} node={child} />) ?? null}
          </BlockquoteContent>
        </Blockquote>
      )

    case 'bulletList':
      return (
        <ul className="mb-4 list-disc pl-6 space-y-1">
          {node.content?.map((child, i) => <TiptapBlock key={i} node={child} />) ?? null}
        </ul>
      )

    case 'orderedList':
      return (
        <ol className="mb-4 list-decimal pl-6 space-y-1">
          {node.content?.map((child, i) => <TiptapBlock key={i} node={child} />) ?? null}
        </ol>
      )

    case 'listItem':
      return (
        <li>
          {node.content?.map((child, i) => <TiptapBlock key={i} node={child} />) ?? null}
        </li>
      )

    case 'codeBlock':
      return (
        <pre className="mb-4 overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-sm">
          <code>
            <TiptapInline nodes={node.content} />
          </code>
        </pre>
      )

    case 'image': {
      const src = typeof node.attrs?.src === 'string' ? node.attrs.src.trim() : ''
      if (!src) return null
      const alt = (node.attrs?.alt as string) ?? ''
      const title = (node.attrs?.title as string) ?? ''
      return (
        <figure className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            title={title || undefined}
            className="mx-auto max-h-[500px] w-full rounded-lg object-contain"
            loading="lazy"
          />
          {title && (
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
              {title}
            </figcaption>
          )}
        </figure>
      )
    }

    case 'youtube': {
      const embedSrc = getYoutubeEmbedSrc(node.attrs?.src as string | undefined)
      if (!embedSrc) return null
      return (
        <div className="my-6 aspect-video overflow-hidden rounded-lg">
          <iframe
            src={embedSrc}
            className="h-full w-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title="YouTube video"
            loading="lazy"
          />
        </div>
      )
    }

    case 'horizontalRule':
      return <hr className="my-8 border-border" />

    case 'hardBreak':
      return <br />

    /* ---------- Table support ---------- */
    case 'table':
      return (
        <div className="my-6 overflow-x-auto">
          <table className="w-full border-collapse border border-border text-sm">
            {node.content?.map((child, i) => <TiptapBlock key={i} node={child} />) ?? null}
          </table>
        </div>
      )

    case 'tableRow':
      return (
        <tr className="border-b border-border">
          {node.content?.map((child, i) => <TiptapBlock key={i} node={child} />) ?? null}
        </tr>
      )

    case 'tableHeader':
      return (
        <th className="border border-border bg-muted/50 px-3 py-2 text-left font-semibold">
          <TiptapInline nodes={node.content?.[0]?.content} />
        </th>
      )

    case 'tableCell':
      return (
        <td className="border border-border px-3 py-2">
          {node.content?.map((child, i) => {
            // Cells contain paragraphs — render without extra margin
            if (child.type === 'paragraph') {
              return (
                <span key={i} style={getTextAlign(child.attrs)}>
                  <TiptapInline nodes={child.content} />
                </span>
              )
            }
            return <TiptapBlock key={i} node={child} />
          }) ?? null}
        </td>
      )

    default:
      // Render unknown blocks as divs if they have content
      if (node.content) {
        return (
          <div className="mb-4">
            {node.content.map((child, i) => <TiptapBlock key={i} node={child} />)}
          </div>
        )
      }
      return null
  }
}

/** Renders inline content (text with marks) */
function TiptapInline({ nodes }: { nodes?: TiptapNode[] }) {
  if (!nodes) return null
  return (
    <>
      {nodes.map((node, i) => {
        if (node.type === 'text') {
          let el: React.ReactNode = node.text ?? ''
          if (node.marks) {
            for (const mark of node.marks) {
              switch (mark.type) {
                case 'bold':
                case 'strong':
                  el = <strong key={`b${i}`}>{el}</strong>
                  break
                case 'italic':
                case 'em':
                  el = <em key={`i${i}`}>{el}</em>
                  break
                case 'underline':
                  el = <u key={`u${i}`}>{el}</u>
                  break
                case 'strike':
                  el = <s key={`s${i}`}>{el}</s>
                  break
                case 'code':
                  el = (
                    <code key={`c${i}`} className="rounded bg-muted px-1.5 py-0.5 text-sm">
                      {el}
                    </code>
                  )
                  break
                case 'link': {
                  const href = (mark.attrs?.href as string) ?? '#'
                  el = (
                    <a
                      key={`a${i}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {el}
                    </a>
                  )
                  break
                }
                case 'highlight': {
                  const color = mark.attrs?.color as string | undefined
                  el = (
                    <mark
                      key={`hl${i}`}
                      className="rounded px-0.5"
                      style={color ? { backgroundColor: color } : { backgroundColor: '#fef08a' }}
                    >
                      {el}
                    </mark>
                  )
                  break
                }
                case 'textStyle': {
                  const textColor = mark.attrs?.color as string | undefined
                  if (textColor) {
                    el = (
                      <span key={`ts${i}`} style={{ color: textColor }}>
                        {el}
                      </span>
                    )
                  }
                  break
                }
                case 'superscript':
                  el = <sup key={`sup${i}`}>{el}</sup>
                  break
                case 'subscript':
                  el = <sub key={`sub${i}`}>{el}</sub>
                  break
              }
            }
          }
          return <span key={i}>{el}</span>
        }
        if (node.type === 'hardBreak') return <br key={i} />
        return <TiptapBlock key={i} node={node} />
      })}
    </>
  )
}

/* ============ Legacy Block Format Renderer ============ */

interface LegacyBlockData {
  type: string
  content?: string
  children?: LegacyBlockData[]
  attrs?: { level?: number; src?: string; alt?: string }
}

function LegacyBlock({ block }: { block: LegacyBlockData }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="mb-4 leading-relaxed">
          {block.content ?? block.children?.map((c) => c.content).join('') ?? ''}
        </p>
      )
    case 'heading': {
      const level = Math.min(block.attrs?.level ?? 1, 6) as 1 | 2 | 3 | 4 | 5 | 6
      const tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return (
        <Heading as={tag} level={tag} className="mb-2 mt-6">
          {block.content ?? block.children?.map((c) => c.content).join('') ?? ''}
        </Heading>
      )
    }
    case 'blockquote':
      return (
        <Blockquote className="my-4">
          <BlockquoteContent>
            {block.children?.map((b, i) => <LegacyBlock key={i} block={b} />) ?? block.content}
          </BlockquoteContent>
        </Blockquote>
      )
    case 'bulletList':
    case 'orderedList': {
      const ListTag = block.type === 'orderedList' ? 'ol' : 'ul'
      return (
        <ListTag className="mb-4 list-inside list-disc pl-4">
          {block.children?.map((b, i) => <LegacyBlock key={i} block={b} />)}
        </ListTag>
      )
    }
    case 'listItem':
      return (
        <li>
          {block.content ?? block.children?.map((c, i) => <LegacyBlock key={i} block={c} />)}
        </li>
      )
    case 'image':
      return (
        <figure className="my-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.attrs?.src ?? ''}
            alt={block.attrs?.alt ?? ''}
            className="max-h-[400px] w-full object-contain"
            loading="lazy"
          />
        </figure>
      )
    case 'codeBlock':
      return (
        <pre className="mb-4 overflow-x-auto rounded border border-border bg-muted p-4 text-sm">
          <code>{block.content ?? ''}</code>
        </pre>
      )
    default:
      return (
        <p className="mb-4">
          {block.content ?? block.children?.map((c, i) => <LegacyBlock key={i} block={c} />) ?? null}
        </p>
      )
  }
}
