'use client'

import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heading,
  Card,
  CardContent,
  Input,
  Textarea,
  Select,
  LockBanner,
  DraftRestoredBanner,
  SaveIndicator,
  StatusBadge,
  RevisionItem,
  EditorialComment as EditorialCommentCard,
  ConfirmDialog,
  AlertDialog,
} from 'scoop'
import type { SaveState } from 'scoop'
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconSend,
  IconEye,
  IconLoader2,
  IconHistory,
  IconUsers,
  IconMessageDots,
  IconChevronRight,
  IconTrash,
  IconPlus,
  IconUpload,
  IconX,
} from '@tabler/icons-react'
import { getAccessToken } from '@auth0/nextjs-auth0/client'
import { compressImageFileToJpegBase64 } from '@/lib/imageCompress'
import { apiPostAuth } from '@/lib/api/adminClient'
import type { ApiResponse, MediaRecord } from '@/lib/api/types'
import { TiptapEditor, type TiptapEditorRef, type OnMediaInserted } from '@/components/admin/TiptapEditor'
import { ensureMediaAttrsInPayload } from '@/lib/ensureMediaAttrs'
import {
  createArticle,
  updateArticle,
  publishArticle,
  deleteArticle,
  acquireLock,
  renewLock,
  releaseLock,
  autosaveArticle,
  listRevisions,
  restoreRevision,
  listCollaborators,
  addCollaborator,
  removeCollaborator,
  listEditorialComments,
  addEditorialComment,
  resolveEditorialComment,
  deleteEditorialComment,
} from '@/lib/admin/actions'
import { saveDraft, getDraft, deleteDraft, type LocalDraft } from '@/lib/admin/localDrafts'
import { useAdminUser } from '@/lib/admin/UserContext'
import { formatDate } from '@/lib/formatDate'
import { getYoutubeThumbnailUrl, isValidYoutubeUrl } from '@/lib/youtube'
import { buildArticleEditorChecklist, countArticleContentWords } from '@/lib/articleEditorReadiness'
import { buildArticleEditorPayload } from '@/lib/articleEditorPayload'
import {
  ARTICLE_EDITOR_STEPS,
  canAccessArticleEditorStep,
  getNextArticleEditorStep,
  getPreviousArticleEditorStep,
  type ArticleEditorStep,
} from '@/lib/articleEditorWizard'
import type { Article, Category } from '@/lib/api/types'

/** Extract display name from email (e.g. prenom.nom@xxx.com → prenom.nom). */
function parseEmailToDisplayName(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') return '—'
  const local = email.split('@')[0]?.trim()
  return local || email
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ArticleEditorFormProps {
  article?: Article
  categories: Category[]
  authorName: string
}

type SidePanel = 'none' | 'history' | 'collaborators' | 'comments'

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ArticleEditorForm({
  article,
  categories,
  authorName,
}: ArticleEditorFormProps) {
  const router = useRouter()
  const adminUser = useAdminUser()
  const userRole = adminUser?.role ?? 'journalist'
  const [isPending, startTransition] = useTransition()

  // --- Core form state ----
  const [title, setTitle] = useState(article?.title ?? '')
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? '')
  const [content, setContent] = useState<unknown>(
    article?.content != null ? article.content : undefined,
  )
  const [categoryId, setCategoryId] = useState(article?.category_id ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(article?.cover_image_url ?? '')
  const [coverImageCredit, setCoverImageCredit] = useState((article as unknown as Record<string, unknown>)?.cover_image_credit as string ?? '')
  const [coverImageSource, setCoverImageSource] = useState((article as unknown as Record<string, unknown>)?.cover_image_source as string ?? '')
  const [videoUrl, setVideoUrl] = useState(article?.video_url ?? '')
  const [coverVideoCredit, setCoverVideoCredit] = useState((article as unknown as Record<string, unknown>)?.cover_video_credit as string ?? '')
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverUploadError, setCoverUploadError] = useState('')
  const [coverDragging, setCoverDragging] = useState(false)
  const [tags, setTags] = useState((article?.tags ?? []).join(', '))
  const [metaTitle, setMetaTitle] = useState(article?.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(article?.meta_description ?? '')
  const [status, setStatus] = useState(article?.status ?? 'draft')
  const [newArticleStep, setNewArticleStep] = useState<ArticleEditorStep>('write')

  // --- Lock state ---
  const [lockInfo, setLockInfo] = useState<{ lockerEmail: string } | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // --- Save state ---
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [confirmDialog, setConfirmDialog] = useState<null | 'publish' | 'delete' | 'restore'>(null)
  const [restoreVersionToConfirm, setRestoreVersionToConfirm] = useState<number | null>(null)
  const [alertDialog, setAlertDialog] = useState<{ message: string } | null>(null)
  const [version, setVersion] = useState<number | undefined>(
    (article as unknown as Record<string, unknown>)?.version as number | undefined,
  )

  // --- Local draft ---
  const [localDraft, setLocalDraft] = useState<LocalDraft | null>(null)

  // --- Side panels ---
  const [sidePanel, setSidePanel] = useState<SidePanel>('none')
  const [revisions, setRevisions] = useState<Record<string, unknown>[]>([])
  const [collaborators, setCollaborators] = useState<Record<string, unknown>[]>([])
  const [comments, setComments] = useState<Record<string, unknown>[]>([])
  const [unresolvedCount, setUnresolvedCount] = useState(0)
  const [newCollabEmail, setNewCollabEmail] = useState('')
  const [newCommentBody, setNewCommentBody] = useState('')

  const isEditing = !!article
  const articleId = article?.id ?? 'new'
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const editorContentRef = useRef<unknown>(null)
  const editorInstanceRef = useRef<TiptapEditorRef>(null)
  const pendingMediaRef = useRef<Array<{ type: 'image' | 'youtube'; attrs: Record<string, unknown> }>>([])

  const handleMediaInserted: OnMediaInserted = useCallback((type, attrs) => {
    pendingMediaRef.current.push({ type, attrs })
  }, [])

  // --- Lock management ---
  useEffect(() => {
    if (!isEditing) return
    let cancelled = false

    async function tryLock() {
      try {
        const result = await acquireLock(article!.id)
        if (cancelled) return
        if (result.acquired) {
          setIsLocked(false)
          setLockInfo(null)
          // Start heartbeat
          heartbeatRef.current = setInterval(async () => {
            try {
              await renewLock(article!.id)
            } catch {
              // Lost lock
            }
          }, 3 * 60_000) // Every 3 minutes
        } else {
          setIsLocked(true)
          setLockInfo({ lockerEmail: result.message ?? 'another user' })
        }
      } catch {
        // Ignore
      }
    }
    tryLock()

    return () => {
      cancelled = true
      clearInterval(heartbeatRef.current)
      // Release lock on unmount
      releaseLock(article!.id).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, article?.id])

  // Release lock on page unload
  useEffect(() => {
    if (!isEditing) return
    const handler = () => {
      navigator.sendBeacon?.(`/api/v1/admin/articles/${article!.id}/lock`)
      releaseLock(article!.id).catch(() => {})
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, article?.id])

  // --- Load editorial comments on mount (so journalist sees notification without opening panel) ---
  useEffect(() => {
    if (!isEditing || !article?.id) return
    loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, article?.id])

  // --- Local draft check on mount ---
  useEffect(() => {
    async function checkLocalDraft() {
      try {
        const draft = await getDraft(articleId)
        if (draft) {
          const serverUpdatedAt = (article as unknown as Record<string, unknown>)?.updated_at as
            | string
            | undefined
          const serverTime = serverUpdatedAt ? new Date(serverUpdatedAt).getTime() : 0
          if (draft.updatedAt > serverTime) {
            setLocalDraft(draft)
          } else {
            await deleteDraft(articleId)
          }
        }
      } catch {
        // Ignore
      }
    }
    checkLocalDraft()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId])

  // --- Local draft save on content change (debounced) ---
  const saveLocalDraft = useCallback(() => {
    clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft({
        articleId,
        title,
        excerpt,
        content,
        categoryId,
        coverImageUrl,
        coverImageCredit,
        coverImageSource,
        videoUrl,
        coverVideoCredit,
        tags,
        metaTitle,
        metaDescription,
        updatedAt: Date.now(),
      }).catch(() => {})
    }, 1000)
  }, [
    articleId,
    title,
    excerpt,
    content,
    categoryId,
    coverImageUrl,
    coverImageCredit,
    coverImageSource,
    videoUrl,
    coverVideoCredit,
    tags,
    metaTitle,
    metaDescription,
  ])

  useEffect(() => {
    saveLocalDraft()
    return () => clearTimeout(autoSaveTimerRef.current)
  }, [title, excerpt, content, saveLocalDraft])

  // --- Restore local draft (TipTap: setContent to restore editor state) ---
  function handleRestoreDraft() {
    if (!localDraft) return
    setTitle(localDraft.title)
    setExcerpt(localDraft.excerpt)
    setContent(localDraft.content)
    setCategoryId(localDraft.categoryId ?? '')
    setCoverImageUrl(localDraft.coverImageUrl ?? '')
    setCoverImageCredit(localDraft.coverImageCredit ?? '')
    setCoverImageSource(localDraft.coverImageSource ?? '')
    setVideoUrl(localDraft.videoUrl ?? '')
    setCoverVideoCredit(localDraft.coverVideoCredit ?? '')
    setTags(localDraft.tags ?? '')
    setMetaTitle(localDraft.metaTitle ?? '')
    setMetaDescription(localDraft.metaDescription ?? '')
    editorInstanceRef.current?.setContent(localDraft.content)
    setLocalDraft(null)
  }

  function handleDiscardDraft() {
    setLocalDraft(null)
    deleteDraft(articleId).catch(() => {})
  }

  // --- Build payload: read content from editor; ensure image/youtube have attrs (fix when TipTap omits them) ---
  function buildPayload() {
    const rawContent =
      editorInstanceRef.current?.getJSON() ?? editorContentRef.current ?? content
    let payloadContent = rawContent
    if (typeof rawContent === 'object' && rawContent !== null && !Array.isArray(rawContent)) {
      const doc = JSON.parse(JSON.stringify(rawContent)) as { type?: string; content?: unknown[] }
      ensureMediaAttrsInPayload(doc, pendingMediaRef.current)
      payloadContent = doc
    }
    const base = buildArticleEditorPayload({
      isEditing,
      authorName,
      title,
      excerpt,
      content: payloadContent,
      categoryId,
      coverImageUrl,
      coverImageCredit,
      coverImageSource,
      videoUrl,
      coverVideoCredit,
      tags,
      metaTitle,
      metaDescription,
    })
    return base
  }

  // --- Save ---
  function handleSave(newStatus?: string) {
    setSaveState('saving')
    startTransition(async () => {
      try {
        const payload = { ...buildPayload(), status: newStatus ?? status }
        if (isEditing) {
          const updated = await updateArticle(article.id, payload)
          // console.log('[ArticleEditor] Updated article:', JSON.stringify(updated, null, 2))
          setVersion((updated as unknown as Record<string, unknown>).version as number)
          setStatus(((updated as unknown as Record<string, unknown>).status ?? status) as typeof status)
          await deleteDraft(articleId)
          setSaveState('saved')
        } else {
          const created = await createArticle(payload)
          await deleteDraft('new')
          router.push(`/admin/articles/${created.id}/edit`)
          return
        }
      } catch (err) {
        console.error(err)
        setSaveState('error')
      }
    })
  }

  // --- Autosave to server ---
  function handleAutoSave(editorContent: unknown) {
    if (!isEditing || isLocked) return
    setSaveState('saving')
    startTransition(async () => {
      try {
        await autosaveArticle(article.id, editorContent)
        setSaveState('saved')
      } catch {
        setSaveState('offline')
      }
    })
  }

  // --- Publish (send current content/title/excerpt so they are persisted) ---
  function handlePublishClick() {
    if (!isEditing) return
    setConfirmDialog('publish')
  }

  function handlePublishConfirm() {
    if (!isEditing || !article) return
    setSaveState('saving')
    startTransition(async () => {
      try {
        const payload = buildPayload()
        await publishArticle(article.id, payload)
        setStatus('published')
        setSaveState('saved')
      } catch {
        setSaveState('error')
      }
    })
  }

  function goToNextNewArticleStep() {
    const next = getNextArticleEditorStep(newArticleStep)
    if (next === 'prepare' && !canGoToPrepare) return
    if (next === 'review' && !canGoToReview) return
    setNewArticleStep(next)
  }

  function goToPreviousNewArticleStep() {
    setNewArticleStep(getPreviousArticleEditorStep(newArticleStep))
  }

  // --- Delete ---
  function handleDeleteClick() {
    if (!isEditing) return
    setConfirmDialog('delete')
  }

  function handleDeleteConfirm() {
    if (!isEditing || !article) return
    startTransition(async () => {
      try {
        await deleteArticle(article.id)
        router.push('/admin/articles')
      } catch {
        setAlertDialog({ message: 'Erreur lors de la suppression.' })
      }
    })
  }

  // --- Side panel loaders ---
  async function loadRevisions() {
    if (!isEditing) return
    try {
      const res = await listRevisions(article.id)
      setRevisions(res.data)
    } catch {
      // Ignore
    }
  }

  async function loadCollaborators() {
    if (!isEditing) return
    try {
      const res = await listCollaborators(article.id)
      setCollaborators(res)
    } catch {
      // Ignore
    }
  }

  async function loadComments() {
    if (!isEditing) return
    try {
      const res = await listEditorialComments(article.id)
      setComments(res.data)
      setUnresolvedCount(res.unresolved_count)
    } catch {
      // Ignore
    }
  }

  function togglePanel(panel: SidePanel) {
    if (sidePanel === panel) {
      setSidePanel('none')
      return
    }
    setSidePanel(panel)
    if (panel === 'history') loadRevisions()
    if (panel === 'collaborators') loadCollaborators()
    if (panel === 'comments') loadComments()
  }

  // --- Collaborator actions ---
  async function handleAddCollaborator() {
    if (!isEditing || !newCollabEmail.trim()) return
    try {
      await addCollaborator(article.id, newCollabEmail.trim())
      setNewCollabEmail('')
      await loadCollaborators()
    } catch (e) {
      setAlertDialog({ message: (e as Error).message })
    }
  }

  async function handleRemoveCollaborator(userId: string) {
    if (!isEditing) return
    try {
      await removeCollaborator(article.id, userId)
      await loadCollaborators()
    } catch {
      // Ignore
    }
  }

  // --- Comment actions ---
  async function handleAddComment() {
    if (!isEditing || !newCommentBody.trim()) return
    try {
      await addEditorialComment(article.id, newCommentBody.trim())
      setNewCommentBody('')
      await loadComments()
    } catch {
      // Ignore
    }
  }

  async function handleResolveComment(commentId: string) {
    if (!isEditing) return
    try {
      await resolveEditorialComment(article.id, commentId)
      await loadComments()
    } catch {
      // Ignore
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!isEditing) return
    try {
      await deleteEditorialComment(article.id, commentId)
      await loadComments()
    } catch {
      // Ignore
    }
  }

  // --- Revision restore ---
  function handleRestoreRevisionClick(ver: number) {
    if (!isEditing) return
    setRestoreVersionToConfirm(ver)
    setConfirmDialog('restore')
  }

  async function handleRestoreRevisionConfirm() {
    if (!isEditing || !article || restoreVersionToConfirm == null) return
    const ver = restoreVersionToConfirm
    setRestoreVersionToConfirm(null)
    try {
      const rev = await restoreRevision(article.id, ver)
      setContent(rev.content)
      setTitle(rev.title as string)
      if (rev.excerpt) setExcerpt(rev.excerpt as string)
      editorInstanceRef.current?.setContent(rev.content)
      await loadRevisions()
    } catch {
      setAlertDialog({ message: 'Erreur lors de la restauration.' })
    }
  }

  // --- Cover image upload ---
  async function handleCoverImageFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setCoverUploadError('Type non supporté. Utilisez JPEG, PNG, WebP, GIF ou AVIF.')
      return
    }
    setCoverUploading(true)
    setCoverUploadError('')
    try {
      const tokenResult = await getAccessToken()
      let accessToken: string | null = null
      if (typeof tokenResult === 'string' && tokenResult.length > 0) accessToken = tokenResult
      else if (tokenResult && typeof tokenResult === 'object' && 'accessToken' in tokenResult) {
        const t = (tokenResult as { accessToken?: unknown }).accessToken
        if (typeof t === 'string' && t.length > 0) accessToken = t
      }
      if (!accessToken) throw new Error('Session expirée — reconnectez-vous.')
      const base64 = await compressImageFileToJpegBase64(file, 3 * 1024 * 1024)
      const res = await apiPostAuth<ApiResponse<MediaRecord>>(
        '/admin/media/imgbb',
        accessToken,
        { image: base64, name: file.name.replace(/\.[^.]+$/, '').slice(0, 80) || undefined },
      )
      setCoverImageUrl(res.data.url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur upload'
      setCoverUploadError(msg.includes('not configured') || msg.includes('IMGBB') ? 'ImgBB non configuré côté serveur.' : msg)
    } finally {
      setCoverUploading(false)
    }
  }

  const categoryOptions = [
    { value: '', label: '— Aucune catégorie —' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]
  const youtubeThumbnailUrl = getYoutubeThumbnailUrl(videoUrl)
  const coverPreviewUrl = coverImageUrl.trim() || youtubeThumbnailUrl
  const coverPreviewKind = coverImageUrl.trim() ? 'image' : youtubeThumbnailUrl ? 'video' : null
  const invalidVideoUrl = videoUrl.trim().length > 0 && !isValidYoutubeUrl(videoUrl)
  const canPersistArticle = title.trim().length > 0 && !invalidVideoUrl
  const contentWordCount = countArticleContentWords(content)
  const isNewArticleWizard = !isEditing
  const hasPreparation = Boolean(categoryId || tags.trim() || coverPreviewUrl || metaTitle.trim() || metaDescription.trim())
  const canGoToPrepare = canAccessArticleEditorStep('prepare', {
    hasTitle: title.trim().length >= 10,
    hasBody: contentWordCount > 0,
  })
  const canGoToReview = canAccessArticleEditorStep('review', {
    hasTitle: title.trim().length >= 10,
    hasBody: contentWordCount > 0,
    hasPreparation,
  })
  const showWritingSection = !isNewArticleWizard || newArticleStep === 'write'
  const showPreparationSection = !isNewArticleWizard || newArticleStep === 'prepare'
  const showReviewSection = isNewArticleWizard && newArticleStep === 'review'
  const editorChecklist = buildArticleEditorChecklist({
    title,
    excerpt,
    categoryId,
    contentWordCount,
    hasCoverVisual: Boolean(coverPreviewUrl),
    hasInvalidVideoUrl: invalidVideoUrl,
    metaTitle,
    metaDescription,
  })

  return (
    <div className="space-y-4 pb-24 sm:pb-0">
      {/* Lock banner */}
      {isLocked && lockInfo && (
        <LockBanner lockerEmail={lockInfo.lockerEmail} />
      )}

      {/* Local draft banner */}
      {localDraft && (
        <DraftRestoredBanner
          savedAt={localDraft.updatedAt}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/articles"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <IconArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <Heading as="h1" level="h3">
              {isEditing ? "Modifier l'article" : 'Nouvel article'}
            </Heading>
            {isEditing && (
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={status} />
                <SaveIndicator state={saveState} version={version} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Side panel toggles (edit mode only) */}
          {isEditing && (
            <>
              <button
                type="button"
                onClick={() => togglePanel('history')}
                className={`rounded-lg p-2 text-sm ${sidePanel === 'history' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                title="Historique"
              >
                <IconHistory className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => togglePanel('collaborators')}
                className={`rounded-lg p-2 text-sm ${sidePanel === 'collaborators' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                title="Collaborateurs"
              >
                <IconUsers className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => togglePanel('comments')}
                className={`relative rounded-lg p-2 text-sm ${sidePanel === 'comments' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                title="Commentaires éditoriaux"
              >
                <IconMessageDots className="h-4 w-4" />
                {unresolvedCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {unresolvedCount}
                  </span>
                )}
              </button>
            </>
          )}

          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isPending || !canPersistArticle || isLocked}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 sm:px-4"
            aria-label="Sauvegarder"
          >
            {isPending ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconDeviceFloppy className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Sauvegarder</span>
          </button>

          {status === 'draft' && (!isNewArticleWizard || newArticleStep === 'review') && (
            <button
              type="button"
              onClick={() => handleSave('review')}
              disabled={isPending || !canPersistArticle || isLocked}
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 sm:px-4"
              aria-label="Soumettre en relecture"
            >
              <IconSend className="h-4 w-4" />
              <span className="hidden sm:inline">Soumettre</span>
            </button>
          )}

          {isEditing && status !== 'published' && (
            <button
              type="button"
              onClick={userRole !== 'journalist' ? handlePublishClick : undefined}
              disabled={isPending || !canPersistArticle || isLocked || userRole === 'journalist'}
              title={userRole === 'journalist' ? 'Réservé aux éditeurs' : undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
              aria-label="Publier"
            >
              <IconEye className="h-4 w-4" />
              <span className="hidden sm:inline">Publier</span>
            </button>
          )}
        </div>
      </div>

      {isNewArticleWizard ? (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {ARTICLE_EDITOR_STEPS.map((step, index) => {
                const active = step.id === newArticleStep
                const accessible = canAccessArticleEditorStep(step.id, {
                  hasTitle: title.trim().length >= 10,
                  hasBody: contentWordCount > 0,
                  hasPreparation,
                })
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => accessible && setNewArticleStep(step.id)}
                    disabled={!accessible}
                    className={[
                      'rounded-lg border px-3 py-3 text-left transition',
                      active
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted',
                      !accessible ? 'cursor-not-allowed opacity-55' : '',
                    ].join(' ')}
                  >
                    <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                      Etape {index + 1}
                    </span>
                    <span className="mt-1 block text-sm font-semibold">{step.label}</span>
                    <span className="mt-0.5 block text-xs">{step.hint}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {newArticleStep === 'write'
                  ? 'Concentrez-vous sur le titre, le resume et le fond. Les metadonnees viennent apres.'
                  : newArticleStep === 'prepare'
                    ? 'Ajoutez la rubrique, les tags, la couverture et le SEO avant validation.'
                    : 'Relisez le recapitulatif avant de creer, soumettre ou publier.'}
              </p>
              <div className="flex gap-2">
                {newArticleStep !== 'write' ? (
                  <button
                    type="button"
                    onClick={goToPreviousNewArticleStep}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    Retour
                  </button>
                ) : null}
                {newArticleStep !== 'review' ? (
                  <button
                    type="button"
                    onClick={goToNextNewArticleStep}
                    disabled={newArticleStep === 'write' ? !canGoToPrepare : !canGoToReview}
                    className="rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-background disabled:opacity-50"
                  >
                    {newArticleStep === 'write' ? 'Continuer' : 'Voir le recap'}
                  </button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Editor + Sidebar layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main editor area */}
        <div className={showWritingSection ? 'space-y-4' : 'hidden'}>
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de l'article"
            disabled={isLocked}
            className="w-full border-0 bg-transparent text-2xl font-bold placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-60 sm:text-3xl"
          />

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Chapeau / résumé court (optionnel)"
            rows={2}
            disabled={isLocked}
            className="w-full resize-none border-0 bg-transparent text-lg text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-60"
          />

          {/* Tiptap editor */}
          <TiptapEditor
            content={content != null ? content : undefined}
            contentRef={editorContentRef}
            editorRef={editorInstanceRef}
            onMediaInserted={handleMediaInserted}
            onChange={setContent}
            onAutoSave={isEditing && !isLocked ? handleAutoSave : undefined}
            readOnly={isLocked}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Side panels */}
          {sidePanel === 'history' && (
            <Card>
              <CardContent className="max-h-96 space-y-2 overflow-y-auto p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <IconHistory className="h-4 w-4" /> Historique des versions
                </h3>
                {revisions.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucune version.</p>
                )}
                {revisions.map((rev) => (
                  <RevisionItem
                    key={rev.id as string}
                    version={rev.version as number}
                    createdAt={formatDate(rev.created_at as string)}
                    authorEmail={(rev.author as { email: string } | null)?.email}
                    onRestore={() => handleRestoreRevisionClick(rev.version as number)}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {sidePanel === 'collaborators' && (
            <Card>
              <CardContent className="space-y-3 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <IconUsers className="h-4 w-4" /> Collaborateurs
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={newCollabEmail}
                    onChange={(e) => setNewCollabEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCollaborator}
                    className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
                  >
                    <IconPlus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {collaborators.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucun collaborateur.</p>
                )}
                {collaborators.map((c) => (
                  <div
                    key={c.id as string}
                    className="flex items-center justify-between rounded border border-border px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-medium">
                        {(c.user as { email: string } | null)?.email ?? '—'}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {c.role === 'co_author' ? 'Co-auteur' : 'Contributeur'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCollaborator(c.user_id as string)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {sidePanel === 'comments' && (
            <Card>
              <CardContent className="max-h-96 space-y-3 overflow-y-auto p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <IconMessageDots className="h-4 w-4" /> Commentaires éditoriaux
                  {unresolvedCount > 0 && (
                    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {unresolvedCount}
                    </span>
                  )}
                </h3>
                <div className="flex gap-2">
                  <Textarea
                    value={newCommentBody}
                    onChange={(e) => setNewCommentBody(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={2}
                    className="flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={!newCommentBody.trim()}
                    className="self-end shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <IconChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucun commentaire.</p>
                )}
                {comments.map((c) => (
                  <EditorialCommentCard
                    key={c.id as string}
                    authorEmail={parseEmailToDisplayName(
                      (c.author as { email: string } | null)?.email,
                    )}
                    body={c.body as string}
                    createdAt={formatDate(c.created_at as string)}
                    resolved={c.resolved as boolean}
                    onResolve={() =>
                      handleResolveComment(c.id as string)
                    }
                    onDelete={() =>
                      handleDeleteComment(c.id as string)
                    }
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {showReviewSection ? (
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Recapitulatif</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Derniere verification avant creation.
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>
                <div className="space-y-3 rounded-lg border border-border bg-background p-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">Titre</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{title || 'Sans titre'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">Resume</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {excerpt || 'Aucun resume renseigne.'}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">Rubrique</p>
                      <p className="mt-1 text-sm text-foreground">
                        {categories.find((category) => category.id === categoryId)?.name ?? 'Non renseignee'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">Mots</p>
                      <p className="mt-1 text-sm text-foreground">{contentWordCount}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">Tags</p>
                    <p className="mt-1 text-sm text-muted-foreground">{tags || 'Aucun tag'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">Visuel</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {coverPreviewKind === 'image'
                        ? 'Image de couverture'
                        : coverPreviewKind === 'video'
                          ? 'Miniature YouTube'
                          : 'Aucun visuel'}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleSave('draft')}
                    disabled={isPending || !canPersistArticle}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    Creer brouillon
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave('review')}
                    disabled={isPending || !canPersistArticle}
                    className="rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-background disabled:opacity-50"
                  >
                    Soumettre
                  </button>
                  {userRole !== 'journalist' ? (
                    <button
                      type="button"
                      onClick={() => handleSave('published')}
                      disabled={isPending || !canPersistArticle}
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 sm:col-span-2"
                    >
                      Creer et publier
                    </button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Readiness card */}
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Pret pour publication</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {contentWordCount} mots dans le corps de l&apos;article.
                  </p>
                </div>
                <div className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-bold text-foreground">
                  {editorChecklist.readyCount}/{editorChecklist.items.length}
                </div>
              </div>
              <div className="space-y-2">
                {editorChecklist.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.done ? 'bg-primary' : 'bg-muted-foreground/35'}`}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">{item.hint}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {showPreparationSection ? (
            <>
          {/* Metadata card */}
          <Card>
            <CardContent className="space-y-4 p-4">
              <h3 className="text-sm font-semibold">Métadonnées</h3>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Catégorie
                </label>
                <Select
                  options={categoryOptions}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isLocked}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Tags (séparés par des virgules)
                </label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="politique, afrique, economie"
                  disabled={isLocked}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Auteur
                </label>
                <p className="text-sm">{authorName}</p>
              </div>
            </CardContent>
          </Card>

          {/* Media card */}
          <Card>
            <CardContent className="space-y-4 p-4">
              <h3 className="text-sm font-semibold">Médias de couverture</h3>

              {/* Cover image */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Image de couverture
                </label>

                {/* Preview + remove */}
                {coverPreviewUrl ? (
                  <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverPreviewUrl}
                      alt={coverPreviewKind === 'video' ? 'Miniature YouTube utilisee en couverture' : 'Couverture'}
                      className="aspect-video w-full object-cover"
                    />
                    <div className="absolute left-2 top-2 rounded-full border border-border bg-background/90 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground shadow-sm">
                      {coverPreviewKind === 'video' ? 'Miniature video' : 'Image'}
                    </div>
                    {coverPreviewKind === 'image' ? (
                      <button
                        type="button"
                        onClick={() => { setCoverImageUrl(''); setCoverImageCredit(''); setCoverImageSource('') }}
                        disabled={isLocked}
                        className="absolute right-2 top-2 rounded-full border border-border bg-background/90 p-1.5 text-foreground shadow-sm hover:bg-muted"
                        title={"Supprimer l'image"}
                        aria-label={"Supprimer l'image de couverture"}
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    ) : null}
                    {coverPreviewKind === 'video' ? (
                      <div className="border-t border-border bg-background/95 px-3 py-2 text-xs text-muted-foreground">
                        Aucune image n&apos;est definie. Cette miniature YouTube sera utilisee dans les cartes article.
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* URL input */}
                <Input
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://… ou glissez une image ci-dessous"
                  disabled={isLocked}
                />

                {/* Drag-drop / upload zone */}
                {!isLocked && (
                  <label
                    className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed p-3 text-center transition-colors ${coverDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/40'} ${coverUploading ? 'cursor-not-allowed opacity-60' : ''}`}
                    onDragEnter={() => setCoverDragging(true)}
                    onDragOver={(e) => { e.preventDefault(); setCoverDragging(true) }}
                    onDragLeave={() => setCoverDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setCoverDragging(false)
                      const file = e.dataTransfer.files?.[0]
                      if (file) handleCoverImageFile(file)
                    }}
                  >
                    {coverUploading ? (
                      <IconLoader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <IconUpload className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {coverUploading ? 'Upload via ImgBB…' : 'Glisser/déposer ou cliquer pour uploader'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={coverUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) handleCoverImageFile(file)
                      }}
                    />
                  </label>
                )}
                {coverUploadError ? (
                  <p className="text-xs text-red-600 dark:text-red-400">{coverUploadError}</p>
                ) : null}

                {/* Credits */}
                <div className="grid gap-2 pt-1">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Crédit photo <span className="font-normal text-muted-foreground/70">(optionnel)</span>
                    </label>
                    <Input
                      value={coverImageCredit}
                      onChange={(e) => setCoverImageCredit(e.target.value)}
                      placeholder="© AFP / Nom Photographe"
                      disabled={isLocked}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Source <span className="font-normal text-muted-foreground/70">(optionnel)</span>
                    </label>
                    <Input
                      value={coverImageSource}
                      onChange={(e) => setCoverImageSource(e.target.value)}
                      placeholder="AFP, Reuters, NomMédia…"
                      disabled={isLocked}
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Cover video */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Vidéo YouTube (URL)
                </label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={isLocked}
                />
                {invalidVideoUrl ? (
                  <p className="text-xs font-medium text-primary">
                    Lien YouTube invalide. Utilisez youtube.com/watch, youtu.be, embed ou shorts.
                  </p>
                ) : null}
                {youtubeThumbnailUrl && !coverImageUrl.trim() ? (
                  <p className="text-xs text-muted-foreground">
                    La miniature YouTube apparaitra automatiquement comme visuel de carte si l&apos;image reste vide.
                  </p>
                ) : null}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Crédit vidéo <span className="font-normal text-muted-foreground/70">(optionnel)</span>
                  </label>
                  <Input
                    value={coverVideoCredit}
                    onChange={(e) => setCoverVideoCredit(e.target.value)}
                    placeholder="© Chaîne YouTube / Source"
                    disabled={isLocked}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO card */}
          <Card>
            <CardContent className="space-y-4 p-4">
              <h3 className="text-sm font-semibold">SEO</h3>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Meta titre
                </label>
                <Input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || 'Titre SEO'}
                  disabled={isLocked}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Meta description
                </label>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={
                    excerpt || 'Description pour les moteurs de recherche'
                  }
                  rows={3}
                  disabled={isLocked}
                />
              </div>
            </CardContent>
          </Card>

            </>
          ) : null}

          {/* Danger zone */}
          {isEditing && !isLocked && (
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">
                  Zone dangereuse
                </h3>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={isPending}
                  className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Supprimer cet article
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {!isLocked && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 shadow-lg backdrop-blur sm:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isPending || !canPersistArticle}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              {isPending ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IconDeviceFloppy className="h-4 w-4" />
              )}
              Sauver
            </button>
            {isNewArticleWizard && newArticleStep !== 'review' ? (
              <button
                type="button"
                onClick={goToNextNewArticleStep}
                disabled={newArticleStep === 'write' ? !canGoToPrepare : !canGoToReview}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-3 text-sm font-semibold text-background disabled:opacity-50"
              >
                <IconChevronRight className="h-4 w-4" />
                {newArticleStep === 'write' ? 'Continuer' : 'Recap'}
              </button>
            ) : status === 'draft' ? (
              <button
                type="button"
                onClick={() => handleSave('review')}
                disabled={isPending || !canPersistArticle}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-3 text-sm font-semibold text-background disabled:opacity-50"
              >
                <IconSend className="h-4 w-4" />
                Relecture
              </button>
            ) : isEditing && status !== 'published' ? (
              <button
                type="button"
                onClick={userRole !== 'journalist' ? handlePublishClick : undefined}
                disabled={isPending || !canPersistArticle || userRole === 'journalist'}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <IconEye className="h-4 w-4" />
                Publier
              </button>
            ) : (
              <div className="rounded-lg border border-border bg-muted px-3 py-3 text-center text-sm font-semibold text-muted-foreground">
                {status}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm dialogs (replace window.confirm) */}
      {confirmDialog === 'publish' && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => !open && setConfirmDialog(null)}
          title="Publier l'article"
          message="Publier cet article ?"
          confirmLabel="Publier"
          cancelLabel="Annuler"
          onConfirm={handlePublishConfirm}
        />
      )}
      {confirmDialog === 'delete' && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => !open && setConfirmDialog(null)}
          title="Supprimer l'article"
          message="Supprimer cet article ? Cette action est irréversible."
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          variant="danger"
          onConfirm={handleDeleteConfirm}
        />
      )}
      {confirmDialog === 'restore' && restoreVersionToConfirm != null && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmDialog(null)
              setRestoreVersionToConfirm(null)
            }
          }}
          title="Restaurer une version"
          message={`Restaurer la version ${restoreVersionToConfirm} ? Cela créera une nouvelle version.`}
          confirmLabel="Restaurer"
          cancelLabel="Annuler"
          onConfirm={handleRestoreRevisionConfirm}
        />
      )}

      {/* Alert dialog (replace window.alert for errors) */}
      <AlertDialog
        open={!!alertDialog}
        onOpenChange={(open) => !open && setAlertDialog(null)}
        message={alertDialog?.message ?? ''}
        confirmLabel="OK"
        onClose={() => setAlertDialog(null)}
      />
    </div>
  )
}
