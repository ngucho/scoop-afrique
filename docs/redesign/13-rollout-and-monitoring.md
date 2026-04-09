# Rollout and monitoring plan

This runbook defines how to deploy the redesigned reader/admin/newsletter platform safely, monitor it, and react quickly if regressions appear.

## 1) Rollout strategy (staged)

Use a progressive rollout sequence instead of a single full cutover.

## Stage A — Pre-release (staging validation)

Goals:

- Verify environment/auth/digest wiring.
- Validate end-to-end critical paths with real integrations.

Required checks before production:

- [ ] `pnpm build` and `pnpm lint` pass in CI.
- [ ] Reader homepage/article/category render correctly.
- [ ] Admin reader modules (announcements/ads/homepage/subscribers/newsletters) load with role-gated access.
- [ ] Digest dry-run executes with expected result object.
- [ ] Footer contrast validated in light/dark (post-fix).

## Stage B — Controlled production release

Goals:

- Release to production with heightened monitoring.
- Keep rollback fast and low-risk.

Deployment steps:

1. Deploy backend and frontend revisions together (same release window).
2. Run smoke tests (section 2) immediately after deployment.
3. Enable digest cron only after smoke tests pass.

## Stage C — Post-release stabilization

Goals:

- Observe behavior under normal traffic.
- Detect and close quality gaps (performance, a11y, ad/data integrity).

Actions:

- Monitor first digest cycle results.
- Review admin KPI surfaces for data consistency.
- Triage residual warnings and optimization debt (`<img>` migration where appropriate).

---

## 2) Production smoke tests (must pass)

Execute immediately after deployment.

## 2.1 Reader experience

- [ ] `/` loads with sidebar/chrome/footer.
- [ ] `/articles` list renders and pagination works.
- [ ] `/articles/<slug>` renders body, related block, share/like controls.
- [ ] `/category/<slug>` renders title/description and article list.
- [ ] Theme toggle + footer readability in both themes.

## 2.2 Admin operations

- [ ] `/admin/login` works.
- [ ] `/admin` dashboard renders and reader KPI panel appears for eligible roles.
- [ ] `/admin/reader/announcements` create+toggle+delete works.
- [ ] `/admin/reader/ads` campaign+creative create works.
- [ ] `/admin/reader/homepage` section edit persists.
- [ ] `/admin/reader/subscribers` filter and segment update (with reason) persists.
- [ ] `/admin/reader/newsletters` campaign create/update/delete works.

## 2.3 Newsletter and digest

- [ ] `/newsletter` subscribe flow returns success response.
- [ ] `/account/login` starts reader auth flow.
- [ ] `/account` shows preferences when logged in.
- [ ] `POST /api/v1/digest/run` with correct secret returns job result.
- [ ] Unsubscribe endpoint redirects correctly (`digest=unsubscribed` on success).

## 2.4 Ads and fallbacks

- [ ] At least one slot with creative displays correctly.
- [ ] At least one empty slot shows fallback/placeholder and keeps layout stable.
- [ ] Impression/click events are recorded in backend data.

---

## 3) Monitoring checklist

## 3.1 Availability and error monitoring

Track at minimum:

- Backend health endpoint (`GET /`).
- Frontend route availability:
  - `/`
  - `/articles`
  - `/articles/<known-slug>`
  - `/admin`
  - `/account/login`

Alert on:

- HTTP 5xx spikes.
- Sustained elevated latency on API or SSR pages.
- Authentication callback/login failures.

## 3.2 Functional monitoring (business-level)

Create operational monitors for:

- Digest jobs:
  - attempted/sent/failed counts
  - empty-send anomalies
- Resend webhook:
  - sudden increase in bounced/failed status
- Ads:
  - impression volume by slot
  - CTR anomalies by slot
- Announcements:
  - active announcements count unexpectedly zero during campaigns

## 3.3 Performance monitoring

Track:

- Route-level LCP/INP/CLS for `/`, `/articles`, `/articles/<slug>`.
- Cache behavior / revalidation for ISR routes.
- Ad-slot rendering impact on LCP and CLS.

Recommended thresholds:

- LCP p75 (mobile) should stay within acceptable range for media pages.
- CLS should remain stable when ad slots fallback/resolve.

## 3.4 Accessibility quality monitoring

After each major UI release:

- Keyboard navigation quick-pass.
- Theme contrast quick-pass (especially footer/chrome).
- Reduced-motion behavior check (ticker and animations).

---

## 4) SEO monitoring

Daily/regular checks:

- [ ] `https://<site>/sitemap.xml` returns 200 and includes latest URLs.
- [ ] `https://<site>/robots.txt` returns expected rules.
- [ ] Canonical tags resolve to production domain.
- [ ] JSON-LD present on home/category/article pages.
- [ ] OG previews render expected title/image.

Watch for:

- Indexing drops on key sections.
- Canonical mismatches after domain/env changes.
- Sudden crawl error increases.

---

## 5) Incident response and rollback

## 5.1 Trigger conditions for rollback

Rollback if any of these persist beyond immediate hotfix capability:

- Critical authentication failure (admin or reader account access).
- Widespread 5xx on reader core routes.
- Digest endpoint/webhook failures causing production email incidents.
- Severe accessibility regression (unreadable text, keyboard trap).

## 5.2 Rollback procedure

1. Re-deploy previous known-good backend/frontend revisions.
2. Pause digest scheduler jobs if email subsystem involved.
3. Disable newly-created ad campaigns/homepage modules if they are root cause.
4. Post incident summary with:
   - impact
   - root cause
   - mitigation
   - follow-up actions

## 5.3 Recovery verification

After rollback/hotfix:

- Re-run smoke tests in section 2.
- Verify health/error metrics are back to baseline.
- Confirm reader footer/theme contrast remains correct.

---

## 6) Post-rollout hardening backlog

Prioritized follow-up items:

1. Migrate editorial-heavy `<img>` usage to `next/image` where suitable (LCP gains).
2. Add automated E2E suite (reader/admin/newsletter/digest/ad fallback scenarios).
3. Add synthetic checks for digest run + webhook endpoint contract.
4. Expand accessibility automated checks (axe/pa11y) in CI.
5. Add SEO regression checks in CI (canonical/schema/sitemap smoke).

---

## 7) Ownership template

Assign owners before rollout:

- Release commander: [name]
- Frontend owner: [name]
- Backend owner: [name]
- IAM/Auth owner: [name]
- Email/Digest owner: [name]
- Ads/Monetization owner: [name]
- Incident communications owner: [name]

This ownership map is mandatory for fast escalation and controlled recovery.
