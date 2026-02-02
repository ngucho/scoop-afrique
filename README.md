# Scoop.Afrique - Landing Page

Landing page temporaire pour **Scoop.Afrique**, le media digital africain.

> **Note importante** : Le vrai Scoop.Afrique s'ecrit avec un **POINT** (Scoop.Afrique). Attention aux medias parasites qui utilisent un nom similaire sans le point.

## Informations Cles

| Element | Valeur |
|---------|--------|
| **Couleur primaire** | `#FF3131` (Scoop Red) |
| **Police logo** | Brasika |
| **Email** | Contact@scoop-afrique.com |
| **Localisation** | Abidjan, Cote d'Ivoire |

## Reseaux Sociaux

| Plateforme | Handle | Abonnes |
|------------|--------|---------|
| TikTok | @Scoop.Afrique | 837.5K |
| Facebook | @scoop.afrique | 359K |
| Threads | @Scoop.Afrique | 24.5K |
| Instagram | @Scoop.Afrique | 23.5K |
| YouTube | @Scoop.Afrique | 6.5K |

---

## SEO & Technical Implementation

### 1. Indexation & Crawl Control

| File | Status | Description |
|------|--------|-------------|
| `/app/robots.ts` | Done | robots.txt dynamique (HTTP 200), Allow /, Sitemap, Disallow /api/, /_next/, /admin/ |
| `/app/sitemap.ts` | Done | sitemap.xml dynamique avec lastmod, changefreq, priority |
| Canonical URLs | Done | Via `metadata.alternates.canonical` (URL absolue) sur chaque page |

**Verification** :
- `https://scoop-afrique.com/robots.txt` et `https://scoop-afrique.com/sitemap.xml` accessibles (HTTP 200)
- Google Search Console : soumettre sitemap et vérifier l’indexation
- Chaque page a `<link rel="canonical" ...>` avec URL absolue

### 2. Metadata & Sharing

| Element | Implementation |
|---------|----------------|
| Title | Unique par page avec template `%s | Scoop.Afrique` |
| Meta description | Defini pour chaque page |
| Open Graph | Complete (type, locale, site_name, images) |
| Twitter Cards | `summary_large_image` avec image 1200x630 |
| Favicons | `icon.svg`, `apple-icon.png` utilisés ; ajouter `favicon.ico` et `og-image.png` (voir ci-dessous) |
| Web App Manifest | `/app/manifest.ts` avec theme colors |

**Assets requis pour un aperçu de lien complet** :
- **`/public/og-image.png`** : image **1200×630 px** pour Open Graph / Twitter (partage WhatsApp, LinkedIn, X, etc.). À créer si absent.
- **`/public/favicon.ico`** : favicon classique (optionnel si `icon.svg` suffit).
- **`/public/icon-192x192.png`** et **`/public/icon-512x512.png`** : pour le manifest (PWA). À ajouter si besoin.

**Verification** :
- Partager un lien affiche titre/image/description corrects
- Pas de titres dupliques entre pages

### 3. Structured Data (Schema.org)

JSON-LD implementes dans `/app/layout.tsx` :

```json
{
  "@type": "NewsMediaOrganization",
  "name": "Scoop.Afrique",
  "url": "https://scoop-afrique.com",
  "logo": {...},
  "sameAs": ["tiktok", "facebook", "instagram", "youtube", "threads"],
  "contactPoint": {...}
}
```

```json
{
  "@type": "WebSite",
  "name": "Scoop.Afrique",
  "url": "https://scoop-afrique.com",
  "publisher": {"@id": ".../#organization"}
}
```

**Verification** :
- Donnees structurees presentes dans le code source HTML
- Tester avec Google Rich Results Test

### 4. Security Headers

Configures dans `/next.config.mjs` :

| Header | Valeur |
|--------|--------|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `SAMEORIGIN` |
| X-XSS-Protection | `1; mode=block` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |
| Content-Security-Policy | Baseline restrictif |

**Verification** :
- Scanner avec securityheaders.com
- Pas d'avertissements mixed-content

### 5. Trust Pages

| Page | URL | Status |
|------|-----|--------|
| A Propos | `/a-propos` | Done |
| Contact | `/contact` | Done |
| Politique de Confidentialite | `/politique-de-confidentialite` | Done |
| Mentions Legales | `/mentions-legales` | Done |

### 6. Performance Optimization

- [x] `next/image` pour les images optimisees
- [x] Lazy loading des medias below-the-fold
- [x] Fonts avec `display: swap`
- [x] Cache-Control pour assets statiques (1 an)
- [x] CSS animations avec transforms GPU-accelerees
- [x] Intersection Observer pour animations au scroll

**Verification** :
- Lighthouse Performance > 90 sur mobile
- Pas de gros layout shifts (CLS)

---

## Structure du Projet

```
/app
  /page.tsx                      # Page principale
  /layout.tsx                    # Layout avec metadata et JSON-LD
  /globals.css                   # Styles, themes, animations
  /sitemap.ts                    # Sitemap auto-genere
  /manifest.ts                   # Web App Manifest
  /a-propos/page.tsx             # Page A Propos
  /contact/page.tsx              # Page Contact
  /politique-de-confidentialite/page.tsx
  /mentions-legales/page.tsx

/components
  /hero-video.tsx           # Hero avec video et logo
  /manifeste-section.tsx    # Vision et valeurs
  /why-section.tsx          # Pourquoi nous choisir
  /publications-section.tsx # Apercu des publications
  /social-cta-section.tsx   # CTA reseaux sociaux
  /footer.tsx               # Footer avec liens
  /theme-toggle.tsx         # Bouton theme clair/sombre
  /cursor-tracker.tsx       # Curseur personnalise (desktop)
  /glitch-text.tsx          # Texte avec effet glitch
  /marquee-band.tsx         # Bande defilante
  /african-pattern.tsx      # Motif SVG africain

/public
  /robots.txt               # Regles de crawl
```

---

## Personnalisation

### 1. Remplacer le Logo

Le logo est en placeholder dans deux fichiers :

**Dans `/components/hero-video.tsx`** (ligne ~170) :
```tsx
{/* Remplacez ce bloc par votre SVG */}
<div className="logo-placeholder">
  {/* VOTRE LOGO SVG ICI */}
</div>
```

**Dans `/components/footer.tsx`** (ligne ~35) :
```tsx
{/* Remplacez ce bloc par votre SVG */}
<div className="mb-4">
  {/* VOTRE LOGO SVG ICI */}
</div>
```

### 2. Configurer le Domaine

Dans les fichiers suivants, remplacez `scoop-afrique.com` par votre domaine :

- `/app/layout.tsx` : `BASE_URL`
- `/app/sitemap.ts` : `BASE_URL`
- `/public/robots.txt` : URL du sitemap

### 3. Ajouter les Images SEO

Creez dans `/public/` :
- `og-image.png` (1200x630) - Image pour partage social
- `logo.png` (512x512) - Logo pour schema.org
- `icon-192x192.png` - Icon PWA
- `icon-512x512.png` - Icon PWA large
- `apple-touch-icon.png` (180x180) - Icon iOS
- `favicon.ico` - Favicon classique
- `icon.svg` - Favicon SVG

### 4. Google Search Console & Bing

1. Verifier le site dans Google Search Console
2. Ajouter le code de verification dans `/app/layout.tsx` :
```tsx
verification: {
  google: 'votre-code-google',
  other: {
    'msvalidate.01': 'votre-code-bing',
  },
}
```
3. Soumettre le sitemap (`/sitemap.xml`)

### 5. Video Hero

```tsx
<HeroVideo
  videoSrc="/videos/votre-video.mp4"
  posterImage="/images/poster.jpg"
  fallbackImage="/images/fallback.jpg"
/>
```

### 6. Publications

Creez `/public/publications/` avec vos images, puis editez `/components/publications-section.tsx`.

### 7. Video YouTube

Dans `/components/publications-section.tsx`, remplacez `YOUR_VIDEO_ID` :
```tsx
youtube: {
  videoId: "votre_video_id",
  title: "Titre de votre video",
}
```

### 8. Modifier les Couleurs

Dans `/app/globals.css` :
```css
/* Rouge Scoop #FF3131 en OKLCH */
--primary: oklch(0.59 0.24 25);
```

---

## Checklist Pre-Production

### SEO
- [ ] Configurer le domaine correct dans `BASE_URL`
- [ ] Ajouter `og-image.png` (1200x630)
- [ ] Ajouter tous les favicons
- [ ] Verifier Google Search Console
- [ ] Verifier Bing Webmaster Tools
- [ ] Soumettre sitemap

### Securite
- [ ] Configurer SPF, DKIM, DMARC pour email
- [ ] Tester headers sur securityheaders.com
- [ ] Activer HTTPS force (Vercel le fait par defaut)

### Contenu
- [ ] Remplacer le logo placeholder
- [ ] Ajouter la video hero
- [ ] Ajouter les images de publications
- [ ] Completer les mentions legales (forme juridique, directeur)
- [ ] Verifier tous les liens sociaux

### Performance
- [ ] Tester Lighthouse sur mobile
- [ ] Verifier Core Web Vitals
- [ ] Optimiser les images

### Monitoring
- [ ] Configurer Sentry pour les erreurs
- [ ] Activer Vercel Analytics (deja integre)
- [ ] Configurer alertes uptime

---

## Ameliorations Futures

1. **Rate Limiting** - Ajouter sur les routes API si formulaires
2. **Captcha** - Turnstile/reCAPTCHA si abus detecte
3. **Newsletter** - Integrer Mailchimp/ConvertKit avec double opt-in
4. **Articles** - Ajouter schema `NewsArticle` pour chaque article
5. **Recherche** - Activer `SearchAction` dans schema.org
6. **Breadcrumbs** - Ajouter pour les pages profondes
7. **Push Notifications** - Web Push (optionnel)

---

## Contact

- **Email** : Contact@scoop-afrique.com
- **TikTok** : @Scoop.Afrique
- **Instagram** : @Scoop.Afrique
- **Facebook** : @scoop.afrique
- **YouTube** : @Scoop.Afrique
- **Threads** : @Scoop.Afrique

---

**Scoop.Afrique** - Le media digital qui decrypte l'Afrique autrement.

*N'oubliez pas : c'est Scoop POINT Afrique*
