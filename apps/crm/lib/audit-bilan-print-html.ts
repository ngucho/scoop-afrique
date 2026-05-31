/**
 * Document imprimable « dossier bancaire / actionnaires » — méthode encaissements, non certifié.
 */

export type BilanAuditApi = {
  period: { start: string; end: string }
  treasuryLedger: {
    openingBalance: number
    periodIncome: number
    periodExpense: number
    closingBalance: number
    note: string
  }
  cashLike: {
    encaissementsFacturesPeriode: number
    autresEntreesTresorerie: number
    chargesProjetsPeriode: number
    sortiesTresoreriePeriode: number
    totalEntreesPeriode: number
    totalSortiesPeriode: number
    soldeNetPeriode: number
  }
  summary: {
    revenue: number
    treasuryIncome: number
    expenses: number
    treasuryExpense: number
    grossProfit: number
    grossMargin: number
    invoicesIssued: number
    invoicesPaid: number
    invoicesUnpaid: number
    invoicesOverdue: number
    expensesByCategory: Array<{ category: string; amount: number; count: number }>
    topClients: Array<{ contact_id: string; name: string; revenue: number; invoiceCount: number }>
  }
  audit: {
    generatedAt: string
    documentReference: string
    periodDurationDays: number
    outstandingReceivablesFcfa: number
    indicators: {
      totalProduitsEncaissement: number
      totalChargesExploitation: number
      resultatNetTresoreriePeriode: number
      margeSurProduitsPct: number
      intensiteChargesSurProduitsPct: number
      concentrationPremierClientPct: number | null
    }
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtFcfa(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 })}&nbsp;FCFA`
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function periodFr(start: string, end: string): string {
  try {
    const a = new Date(start + 'T12:00:00').toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const b = new Date(end + 'T12:00:00').toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    return `du ${a} au ${b}`
  } catch {
    return `${start} – ${end}`
  }
}

export function buildProfessionalAuditBilanHtml(
  data: BilanAuditApi,
  companyName: string,
): string {
  const { period, treasuryLedger, cashLike, summary, audit } = data
  const ind = audit.indicators
  const title = `État financier simplifié (méthode de l’encaissement)`
  const company = esc(companyName.trim() || 'Organisation')

  const rowsKpi: [string, string, string][] = [
    ['Produits d’exploitation (encaissements)', fmtFcfa(ind.totalProduitsEncaissement), 'Paiements clients + autres entrées trésorerie sur la période'],
    ['Charges d’exploitation', fmtFcfa(ind.totalChargesExploitation), 'Dépenses projets + sorties trésorerie'],
    ['Résultat net de trésorerie (excédent / déficit)', fmtFcfa(ind.resultatNetTresoreriePeriode), 'Produits − charges sur la période'],
    ['Marge sur produits', `${ind.margeSurProduitsPct} %`, 'Résultat / produits'],
    ['Intensité des charges', `${ind.intensiteChargesSurProduitsPct} %`, 'Charges / produits'],
    [
      'Créances clients (encours à la date du rapport)',
      fmtFcfa(audit.outstandingReceivablesFcfa),
      'Reste à encaisser sur factures actives non soldées',
    ],
  ]

  if (ind.concentrationPremierClientPct != null) {
    rowsKpi.push([
      'Concentration — part du 1er client (encaissements factures, période)',
      `${ind.concentrationPremierClientPct} %`,
      'Risque de dépendance client',
    ])
  }

  const chargesRows = summary.expensesByCategory
    .map(
      (c) =>
        `<tr><td>${esc(c.category)}</td><td class="num">${fmtFcfa(c.amount)}</td><td class="num">${c.count}</td></tr>`,
    )
    .join('')

  const topClientsRows = summary.topClients
    .map(
      (c, i) =>
        `<tr><td>${i + 1}</td><td>${esc(c.name)}</td><td class="num">${fmtFcfa(c.revenue)}</td><td class="num">${c.invoiceCount}</td></tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(title)} — ${esc(period.start)}_${esc(period.end)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #111; font-size: 10.5pt; line-height: 1.45; max-width: 190mm; margin: 0 auto; padding: 8px; }
    .cover { border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 18px; }
    .cover h1 { font-size: 15pt; font-weight: 700; margin: 0 0 6px 0; letter-spacing: -0.02em; }
    .cover .sub { font-size: 10pt; color: #444; margin: 0; }
    .badge { display: inline-block; background: #f4f4f4; border: 1px solid #ddd; padding: 2px 8px; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 8px; }
    h2 { font-size: 11pt; font-weight: 700; margin: 20px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #ccc; page-break-after: avoid; }
    h3 { font-size: 10pt; font-weight: 600; margin: 14px 0 6px 0; }
    table.sheet { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 8px 0; }
    table.sheet th, table.sheet td { border: 1px solid #bbb; padding: 6px 8px; vertical-align: top; }
    table.sheet th { background: #f0f0f0; font-weight: 600; text-align: left; }
    table.sheet .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    table.sheet tr.tot th, table.sheet tr.tot td { background: #e8e8e8; font-weight: 700; }
    .small { font-size: 8.5pt; color: #555; }
    .legal { font-size: 8.5pt; color: #333; background: #fafafa; border: 1px solid #e0e0e0; padding: 10px 12px; margin-top: 16px; page-break-inside: avoid; }
    .legal strong { color: #000; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <header class="cover">
    <p class="sub" style="margin-bottom:4px;">${company}</p>
    <h1>${esc(title)}</h1>
    <p class="sub">${esc(periodFr(period.start, period.end))} · <strong>${audit.periodDurationDays} jours</strong> ouvrés (calendaire)</p>
    <p class="sub">Réf. document : <strong>${esc(audit.documentReference)}</strong> · Émis le ${esc(fmtDate(audit.generatedAt))}</p>
    <span class="badge">Méthode encaissements — non certifié</span>
  </header>

  <section>
    <h2>I. Synthèse — indicateurs clés</h2>
    <table class="sheet">
      <thead>
        <tr><th>Indicateur</th><th class="num">Montant / valeur</th><th>Commentaire</th></tr>
      </thead>
      <tbody>
        ${rowsKpi
          .map(
            ([a, b, c]) =>
              `<tr><td>${esc(a)}</td><td class="num">${b}</td><td class="small">${esc(c)}</td></tr>`,
          )
          .join('')}
      </tbody>
    </table>
    <p class="small">Les ratios sont calculés sur la base des flux enregistrés dans le CRM pour la période sélectionnée.</p>
  </section>

  <section>
    <h2>II. Compte de résultat simplifié (méthode de l’encaissement)</h2>
    <p class="small">Les produits sont comptabilisés à la date d’encaissement réel (paiements factures et entrées trésorerie). Conformément à une présentation de trésorerie, ce n’est pas un compte de résultat PCG en comptabilité d’engagement.</p>
    <table class="sheet">
      <tr><th colspan="2">Produits</th></tr>
      <tr><td>Ventes et prestations encaissées (paiements sur factures)</td><td class="num">${fmtFcfa(cashLike.encaissementsFacturesPeriode)}</td></tr>
      <tr><td>Autres produits (mouvements trésorerie — hors facturation client)</td><td class="num">${fmtFcfa(cashLike.autresEntreesTresorerie)}</td></tr>
      <tr class="tot"><td>Total produits</td><td class="num">${fmtFcfa(ind.totalProduitsEncaissement)}</td></tr>
    </table>
    <table class="sheet">
      <tr><th colspan="2">Charges</th></tr>
      <tr><td>Charges affectées aux projets</td><td class="num">${fmtFcfa(cashLike.chargesProjetsPeriode)}</td></tr>
      <tr><td>Charges et sorties enregistrées en trésorerie</td><td class="num">${fmtFcfa(cashLike.sortiesTresoreriePeriode)}</td></tr>
      <tr class="tot"><td>Total charges</td><td class="num">${fmtFcfa(ind.totalChargesExploitation)}</td></tr>
    </table>
    <table class="sheet">
      <tr class="tot"><th>Résultat net de trésorerie sur la période</th><th class="num">${fmtFcfa(ind.resultatNetTresoreriePeriode)} (${summary.grossMargin} % du total produits)</th></tr>
    </table>
  </section>

  <section>
    <h2>III. Rapprochement de trésorerie (position cumulée)</h2>
    <p class="small">
      Solde au début = somme des entrées enregistrées avant le ${esc(period.start)} (paiements clients, entrées
      trésorerie) − somme des sorties avant cette date (charges projets, sorties trésorerie). Solde de fin = solde
      début + résultat net de la période (section II).
    </p>
    <table class="sheet">
      <tr><th>Libellé</th><th class="num">Montant</th></tr>
      <tr><td>Solde au début de période</td><td class="num">${fmtFcfa(treasuryLedger.openingBalance)}</td></tr>
      <tr><td>+ Encaissements factures (période)</td><td class="num">${fmtFcfa(cashLike.encaissementsFacturesPeriode)}</td></tr>
      <tr><td>+ Autres entrées (module Trésorerie, période)</td><td class="num">${fmtFcfa(cashLike.autresEntreesTresorerie)}</td></tr>
      <tr><td>− Charges projets (période)</td><td class="num">− ${fmtFcfa(cashLike.chargesProjetsPeriode)}</td></tr>
      <tr><td>− Sorties trésorerie (période)</td><td class="num">− ${fmtFcfa(cashLike.sortiesTresoreriePeriode)}</td></tr>
      <tr class="tot"><th>Solde en fin de période (${esc(period.end)})</th><th class="num">${fmtFcfa(treasuryLedger.closingBalance)}</th></tr>
    </table>
    <p class="small">${esc(treasuryLedger.note)}</p>
    <table class="sheet">
      <tr><th colspan="2">Détail — seulement le module Trésorerie sur la période</th></tr>
      <tr><td>Entrées trésorerie</td><td class="num">${fmtFcfa(treasuryLedger.periodIncome)}</td></tr>
      <tr><td>Sorties trésorerie</td><td class="num">− ${fmtFcfa(treasuryLedger.periodExpense)}</td></tr>
    </table>
  </section>

  <section>
    <h2>IV. Détail des charges par nature</h2>
    <table class="sheet">
      <thead>
        <tr><th>Nature</th><th class="num">Montant</th><th class="num">Écritures</th></tr>
      </thead>
      <tbody>
        ${chargesRows || '<tr><td colspan="3" class="small">Aucune charge sur la période</td></tr>'}
      </tbody>
    </table>
  </section>

  <section>
    <h2>V. Facturation — volumes sur la période analysée</h2>
    <table class="sheet">
      <tr><td>Factures émises (critère échéance / création dans la période)</td><td class="num">${summary.invoicesIssued}</td></tr>
      <tr><td>Factures soldées (statut)</td><td class="num">${summary.invoicesPaid}</td></tr>
      <tr><td>Factures en attente / partielles (hors retard)</td><td class="num">${summary.invoicesUnpaid}</td></tr>
      <tr><td>Factures en retard</td><td class="num">${summary.invoicesOverdue}</td></tr>
    </table>
  </section>

  <section>
    <h2>VI. Principaux clients — encaissements sur la période</h2>
    <table class="sheet">
      <thead>
        <tr><th>#</th><th>Client</th><th class="num">Encaissements</th><th class="num">Factures</th></tr>
      </thead>
      <tbody>
        ${topClientsRows || '<tr><td colspan="4" class="small">Aucun encaissement client sur la période</td></tr>'}
      </tbody>
    </table>
  </section>

  <section class="legal">
    <strong>Méthodologie, périmètre et limites pour un usage bancaire ou auprès d’actionnaires</strong>
    <p>Ce document est généré automatiquement à partir des données saisies dans l’outil CRM (factures, paiements, dépenses projet, mouvements de trésorerie). Il présente une <strong>image des flux de trésorerie</strong> et un <strong>compte de résultat d’encaissement simplifié</strong>, utile pour un premier niveau d’analyse ou de discussion avec des partenaires financiers.</p>
    <p><strong>Il ne constitue pas :</strong> des comptes annuels certifiés, un bilan comptable au sens du SYSCOHADA / PCG, ni une base suffisante pour un audit légal. Les créances et engagements hors CRM, les stocks, les dettes fournisseurs non suivies ici, ainsi que les régularisations d’inventaire ne sont pas intégrés.</p>
    <p><strong>Recommandation :</strong> pour un dossier de crédit, une levée de fonds ou une due diligence, joindre les pièces justificatives sources et faire valider les agrégats par un <strong>expert-comptable</strong> ou un <strong>commissaire aux comptes</strong>, qui pourra produire des états conformes aux normes applicables en zone OHADA / locale.</p>
    <p class="small" style="margin-top:10px;">Document confidentiel — usage interne et transmission à des tiers habilités uniquement.</p>
  </section>
</body>
</html>`
}
