# SCOOP AFRIQUE — Editorial Workflow

## Overview

Scoop Afrique uses a structured editorial workflow designed for pan-African newsrooms. Articles flow through defined stages, with role-based gates at each step.

## Article Lifecycle

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌────────────┐
│   DRAFT     │────▶│   REVIEW     │────▶│  PUBLISHED    │     │  SCHEDULED │
│             │     │              │     │               │     │            │
│ Journalist  │     │ Editor       │     │ Live on site  │     │ Future date│
│ creates &   │     │ reviews      │     │               │     │            │
│ edits       │     │              │     │               │     │            │
└─────────────┘     └──────┬───────┘     └───────────────┘     └────────────┘
      ▲                    │
      │                    │
      └────────────────────┘
         Return for correction
```

## Workflow Steps

### 1. Creation (Journalist)

1. Journalist clicks "Nouvel article" from dashboard or articles page
2. Opens the Tiptap block editor with:
   - Title field
   - Excerpt/chapeau field
   - Rich-text content area (headings, paragraphs, quotes, images, YouTube embeds)
   - Sidebar: category, tags, cover image, video URL, SEO metadata
3. Article is saved as **draft** (auto-save every 5 seconds)
4. Journalist can preview the article in reader format

### 2. Submission (Journalist)

1. When satisfied, journalist clicks **"Soumettre"** (Submit)
2. Article status changes to **review**
3. Article appears in the editor's review queue

### 3. Review (Editor)

Editor opens the article from the review queue:

**Option A: Approve & Publish**
- Editor clicks **"Publier"** → status becomes **published**, `published_at` is set
- Article is live on the reader website immediately

**Option B: Schedule**
- Editor sets a future date in `scheduled_at`
- Status becomes **scheduled** → article publishes automatically at that date

**Option C: Return for Correction**
- Editor can edit the article directly or change status back to **draft**
- Journalist sees it back in their drafts with any editor changes

### 4. Post-Publication

After publication:
- View count tracked automatically
- Comments appear in moderation queue
- Editors can update article content
- Managers can delete articles

## Comment Moderation

1. Reader submits a comment → status: **pending**
2. Comment appears in editor's moderation queue
3. Editor can:
   - **Approve** → visible on article
   - **Reject** → hidden
   - **Delete** → permanently removed

## Media Strategy

| Media Type | Storage | Workflow |
|-----------|---------|---------|
| **Images** | Supabase Storage (5 MB max) OR external URL | Upload in media library or paste URL in editor/article form |
| **Videos** | Never uploaded | Paste YouTube URL → embedded as iframe. Saves bandwidth. |

## Auto-Save

The Tiptap editor auto-saves content every 5 seconds when editing an existing article. This prevents data loss. A "Sauvegardé automatiquement" indicator appears in the header.

## Permissions Matrix

| Action | Journalist | Editor | Manager | Admin |
|--------|-----------|--------|---------|-------|
| Create article | ✓ | ✓ | ✓ | ✓ |
| Edit own article | ✓ (drafts) | ✓ | ✓ | ✓ |
| Edit any article | — | ✓ | ✓ | ✓ |
| Submit for review | ✓ | ✓ | ✓ | ✓ |
| Publish | — | ✓ | ✓ | ✓ |
| Schedule | — | ✓ | ✓ | ✓ |
| Delete article | — | — | ✓ | ✓ |
| Moderate comments | — | ✓ | ✓ | ✓ |
| Manage categories | — | — | ✓ | ✓ |
| Manage users | — | — | — | ✓ |
