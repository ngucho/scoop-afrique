/**
 * Drizzle schema — matches supabase/migrations.
 * All tables use parameterized queries (SQL injection safe).
 */
import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  date,
  real,
  uniqueIndex,
  pgEnum,
  primaryKey,
} from 'drizzle-orm/pg-core'
// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------
export const appRoleEnum = pgEnum('app_role', [
  'journalist',
  'editor',
  'manager',
  'admin',
])
export const articleStatusEnum = pgEnum('article_status', [
  'draft',
  'review',
  'scheduled',
  'published',
])
export const commentStatusEnum = pgEnum('comment_status', [
  'pending',
  'approved',
  'rejected',
])
export const newsletterStatusEnum = pgEnum('newsletter_status', [
  'pending',
  'confirmed',
  'unsubscribed',
])
export const crmContactTypeEnum = pgEnum('crm_contact_type', [
  'prospect',
  'client',
  'partner',
  'sponsor',
  'influencer',
  'other',
])
export const crmDevisStatusEnum = pgEnum('crm_devis_status', [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
])
export const crmProjectStatusEnum = pgEnum('crm_project_status', [
  'draft',
  'confirmed',
  'in_progress',
  'review',
  'delivered',
  'closed',
  'cancelled',
])
export const crmTaskStatusEnum = pgEnum('crm_task_status', [
  'todo',
  'in_progress',
  'done',
  'blocked',
])
export const crmTaskPriorityEnum = pgEnum('crm_task_priority', [
  'low',
  'normal',
  'high',
  'urgent',
])
export const crmInvoiceStatusEnum = pgEnum('crm_invoice_status', [
  'draft',
  'sent',
  'partial',
  'paid',
  'overdue',
  'cancelled',
])
export const crmPaymentMethodEnum = pgEnum('crm_payment_method', [
  'cash',
  'bank_transfer',
  'mobile_money',
  'wave',
  'orange_money',
  'check',
  'other',
])
export const crmContractStatusEnum = pgEnum('crm_contract_status', [
  'draft',
  'sent',
  'signed',
  'expired',
  'cancelled',
])
export const crmReminderChannelEnum = pgEnum('crm_reminder_channel', [
  'email',
  'whatsapp',
  'both',
])
export const crmDeliverableTypeEnum = pgEnum('crm_deliverable_type', [
  'video_short',
  'video_long',
  'post',
  'story',
  'article',
  'recap',
  'report',
  'other',
])
export const crmPlatformEnum = pgEnum('crm_platform', [
  'tiktok',
  'instagram',
  'facebook',
  'youtube',
  'threads',
  'website',
  'other',
])

// -----------------------------------------------------------------------------
// Core tables
// -----------------------------------------------------------------------------
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  auth0Id: text('auth0_id'),
  role: appRoleEnum('role').notNull().default('journalist'),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  coverImageUrl: text('cover_image_url'),
  videoUrl: text('video_url'),
  content: jsonb('content').notNull().default([]),
  categoryId: uuid('category_id'),
  authorId: uuid('author_id').notNull(),
  authorDisplayName: text('author_display_name'),
  status: articleStatusEnum('status').notNull().default('draft'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  ogImageUrl: text('og_image_url'),
  tags: text('tags').array().notNull().default([]),
  viewCount: integer('view_count').notNull().default(0),
  wordCount: integer('word_count').notNull().default(0),
  readingTimeMin: integer('reading_time_min').notNull().default(1),
  version: integer('version').notNull().default(1),
  lastSavedBy: uuid('last_saved_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const articleLikes = pgTable('article_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').notNull(),
  userId: uuid('user_id'),
  anonymousId: text('anonymous_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').notNull(),
  userId: uuid('user_id'),
  parentId: uuid('parent_id'),
  body: text('body').notNull(),
  status: commentStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  status: newsletterStatusEnum('status').notNull().default('pending'),
  token: text('token'),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
})

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  storagePath: text('storage_path'),
  alt: text('alt'),
  caption: text('caption'),
  uploadedBy: uuid('uploaded_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const articleRevisions = pgTable('article_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').notNull(),
  content: jsonb('content').notNull(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  version: integer('version').notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const articleLocks = pgTable('article_locks', {
  articleId: uuid('article_id').primaryKey(),
  lockedBy: uuid('locked_by').notNull(),
  lockedAt: timestamp('locked_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull().default(sql`(now() + interval '5 minutes')`),
})

export const collabRoleEnum = pgEnum('collab_role', ['contributor', 'co_author'])

export const articleCollaborators = pgTable(
  'article_collaborators',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    articleId: uuid('article_id').notNull(),
    userId: uuid('user_id').notNull(),
    role: collabRoleEnum('role').notNull().default('contributor'),
    addedBy: uuid('added_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('article_collaborators_unique').on(t.articleId, t.userId)]
)

export const editorialComments = pgTable('editorial_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').notNull(),
  authorId: uuid('author_id'),
  body: text('body').notNull(),
  resolved: boolean('resolved').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// -----------------------------------------------------------------------------
// Devis requests (brands site)
// -----------------------------------------------------------------------------
export const devisRequests = pgTable('devis_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  serviceSlug: text('service_slug'),
  budgetMin: integer('budget_min'),
  budgetMax: integer('budget_max'),
  budgetCurrency: text('budget_currency').default('FCFA'),
  preferredDate: date('preferred_date'),
  deadline: text('deadline'),
  description: text('description').notNull(),
  sourceUrl: text('source_url'),
  convertedToContactId: uuid('converted_to_contact_id'),
  convertedToDevisId: uuid('converted_to_devis_id'),
  convertedToProjectId: uuid('converted_to_project_id'),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// -----------------------------------------------------------------------------
// CRM tables
// -----------------------------------------------------------------------------
export const crmContacts = pgTable('crm_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: crmContactTypeEnum('type').notNull().default('prospect'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  company: text('company'),
  position: text('position'),
  country: text('country').default('CI'),
  city: text('city'),
  source: text('source'),
  devisRequestId: uuid('devis_request_id'),
  tags: text('tags').array().default([]),
  notes: text('notes'),
  assignedTo: uuid('assigned_to'),
  isArchived: boolean('is_archived').notNull().default(false),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const crmOrganizations = pgTable('crm_organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type'),
  website: text('website'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  country: text('country').default('CI'),
  notes: text('notes'),
  tags: text('tags').array().default([]),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const crmContactOrganization = pgTable(
  'crm_contact_organization',
  {
    contactId: uuid('contact_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    role: text('role'),
  },
  (t) => [primaryKey({ columns: [t.contactId, t.organizationId] })]
)

export const crmDevis = pgTable('crm_devis', {
  id: uuid('id').primaryKey().defaultRandom(),
  reference: text('reference').notNull().unique(),
  contactId: uuid('contact_id'),
  devisRequestId: uuid('devis_request_id'),
  projectId: uuid('project_id'),
  status: crmDevisStatusEnum('status').notNull().default('draft'),
  serviceSlug: text('service_slug'),
  title: text('title').notNull(),
  lineItems: jsonb('line_items').notNull().default([]),
  subtotal: integer('subtotal').notNull().default(0),
  taxRate: real('tax_rate').notNull().default(0),
  taxAmount: integer('tax_amount').notNull().default(0),
  total: integer('total').notNull().default(0),
  discount: integer('discount').notNull().default(0),
  currency: text('currency').notNull().default('FCFA'),
  validUntil: date('valid_until'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  pdfUrl: text('pdf_url'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const crmProjects = pgTable('crm_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  reference: text('reference').notNull().unique(),
  title: text('title').notNull(),
  contactId: uuid('contact_id'),
  organizationId: uuid('organization_id'),
  devisId: uuid('devis_id'),
  serviceSlug: text('service_slug'),
  status: crmProjectStatusEnum('status').notNull().default('draft'),
  description: text('description'),
  objectives: text('objectives'),
  deliverablesSummary: text('deliverables_summary'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  budgetAgreed: integer('budget_agreed'),
  currency: text('currency').notNull().default('FCFA'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  assignedTo: uuid('assigned_to'),
  createdBy: uuid('created_by'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const crmProjectContacts = pgTable(
  'crm_project_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull(),
    contactId: uuid('contact_id').notNull(),
    role: text('role').default('client'),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('crm_project_contacts_project_contact_unique').on(t.projectId, t.contactId)]
)

export const crmTasks = pgTable('crm_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: crmTaskStatusEnum('status').notNull().default('todo'),
  priority: crmTaskPriorityEnum('priority').notNull().default('normal'),
  dueDate: date('due_date'),
  assignedTo: uuid('assigned_to'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdBy: uuid('created_by'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const crmDeliverables = pgTable('crm_deliverables', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  title: text('title').notNull(),
  type: crmDeliverableTypeEnum('type').notNull().default('post'),
  platform: crmPlatformEnum('platform').notNull().default('instagram'),
  url: text('url'),
  thumbnailUrl: text('thumbnail_url'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  notes: text('notes'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const crmDeliverableMetrics = pgTable('crm_deliverable_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  deliverableId: uuid('deliverable_id').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  views: integer('views'),
  likes: integer('likes'),
  comments: integer('comments'),
  shares: integer('shares'),
  saves: integer('saves'),
  reach: integer('reach'),
  impressions: integer('impressions'),
  clicks: integer('clicks'),
  engagementRate: real('engagement_rate'),
  extra: jsonb('extra').default({}),
})

export const crmInvoices = pgTable('crm_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'),
  contactId: uuid('contact_id'),
  devisId: uuid('devis_id'),
  reference: text('reference').notNull().unique(),
  status: crmInvoiceStatusEnum('status').notNull().default('draft'),
  lineItems: jsonb('line_items').notNull().default([]),
  subtotal: integer('subtotal').notNull().default(0),
  taxRate: real('tax_rate').notNull().default(0),
  taxAmount: integer('tax_amount').notNull().default(0),
  discountAmount: integer('discount_amount').notNull().default(0),
  total: integer('total').notNull().default(0),
  amountPaid: integer('amount_paid').notNull().default(0),
  currency: text('currency').notNull().default('FCFA'),
  dueDate: date('due_date'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  pdfUrl: text('pdf_url'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const crmPayments = pgTable('crm_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('FCFA'),
  method: crmPaymentMethodEnum('method').notNull().default('other'),
  reference: text('reference'),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  notes: text('notes'),
  receiptPdfUrl: text('receipt_pdf_url'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const crmContracts = pgTable('crm_contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'),
  contactId: uuid('contact_id'),
  devisId: uuid('devis_id'),
  reference: text('reference').notNull().unique(),
  type: text('type').notNull().default('service'),
  title: text('title').notNull(),
  content: jsonb('content').notNull().default({}),
  status: crmContractStatusEnum('status').notNull().default('draft'),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  pdfUrl: text('pdf_url'),
  expiresAt: date('expires_at'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const crmExpenses = pgTable('crm_expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('FCFA'),
  category: text('category'),
  receiptUrl: text('receipt_url'),
  incurredAt: date('incurred_at').notNull().default(sql`CURRENT_DATE`),
  notes: text('notes'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const crmReminders = pgTable('crm_reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id'),
  invoiceId: uuid('invoice_id'),
  projectId: uuid('project_id'),
  type: text('type').notNull(),
  channel: crmReminderChannelEnum('channel').notNull().default('both'),
  message: text('message').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const crmActivityLog = pgTable('crm_activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  action: text('action').notNull(),
  description: text('description'),
  metadata: jsonb('metadata').default({}),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const crmServices = pgTable('crm_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  unit: text('unit').notNull().default('unité'),
  defaultPrice: integer('default_price').notNull().default(0),
  currency: text('currency').notNull().default('FCFA'),
  category: text('category'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
