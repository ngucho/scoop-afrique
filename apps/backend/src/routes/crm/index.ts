import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth.js'
import { requireCrmPermission } from '../../middleware/crm-authorization.js'
import { crmErrorHandler } from '../../services/crm/project-write-guard.js'
import dashboardRoutes from './dashboard.js'
import devisRequestsRoutes from './devis-requests.js'
import contactsRoutes from './contacts.js'
import organizationsRoutes from './organizations.js'
import devisRoutes from './devis.js'
import projectsRoutes from './projects.js'
import projectClosureRoutes from './project-closure.js'
import tasksRoutes from './tasks.js'
import deliverablesRoutes from './deliverables.js'
import invoicesRoutes from './invoices.js'
import paymentsRoutes from './payments.js'
import contractsRoutes from './contracts.js'
import remindersRoutes from './reminders.js'
import activityRoutes from './activity.js'
import reportsRoutes from './reports.js'
import servicesRoutes from './services.js'
import treasuryRoutes from './treasury.js'
import settingsRoutes from './settings.js'

const app = new Hono()

app.use('*', requireAuth)
app.use('*', requireCrmPermission)

// Hono ne consulte que le gestionnaire d'erreur le plus externe : les refus de
// la garde d'archive doivent donc être traduits ici, pas dans les sous-routeurs.
app.onError(crmErrorHandler)

app.route('/dashboard', dashboardRoutes)
app.route('/services', servicesRoutes)
app.route('/reports', reportsRoutes)
app.route('/devis-requests', devisRequestsRoutes)
app.route('/contacts', contactsRoutes)
app.route('/organizations', organizationsRoutes)
app.route('/devis', devisRoutes)
// Monté avant le routeur projets : `/projects/archive-reconciliation` ne doit
// pas être capté par `/projects/:id`.
app.route('/projects', projectClosureRoutes)
app.route('/projects', projectsRoutes)
app.route('/tasks', tasksRoutes)
app.route('/deliverables', deliverablesRoutes)
app.route('/invoices', invoicesRoutes)
app.route('/payments', paymentsRoutes)
app.route('/contracts', contractsRoutes)
app.route('/reminders', remindersRoutes)
app.route('/activity', activityRoutes)
app.route('/treasury', treasuryRoutes)
app.route('/settings', settingsRoutes)

export default app
