export type ArticleEditorStep = 'write' | 'prepare' | 'review'

export const ARTICLE_EDITOR_STEPS: { id: ArticleEditorStep; label: string; hint: string }[] = [
  { id: 'write', label: 'Redaction', hint: 'Titre, resume et contenu' },
  { id: 'prepare', label: 'Preparation', hint: 'Rubrique, tags, medias et SEO' },
  { id: 'review', label: 'Validation', hint: 'Apercu recapitulatif' },
]

const STEP_ORDER: ArticleEditorStep[] = ARTICLE_EDITOR_STEPS.map((step) => step.id)

export function getNextArticleEditorStep(step: ArticleEditorStep): ArticleEditorStep {
  const index = STEP_ORDER.indexOf(step)
  return STEP_ORDER[Math.min(index + 1, STEP_ORDER.length - 1)]
}

export function getPreviousArticleEditorStep(step: ArticleEditorStep): ArticleEditorStep {
  const index = STEP_ORDER.indexOf(step)
  return STEP_ORDER[Math.max(index - 1, 0)]
}

export function canAccessArticleEditorStep(
  step: ArticleEditorStep,
  readiness: { hasTitle: boolean; hasBody: boolean; hasPreparation?: boolean },
): boolean {
  if (step === 'write') return true
  if (step === 'prepare') return readiness.hasTitle && readiness.hasBody
  return readiness.hasTitle && readiness.hasBody && Boolean(readiness.hasPreparation)
}
