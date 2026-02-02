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

## Design

Le design s'inspire de l'esthetique **Urban Street Art** combinee avec le **patrimoine africain** :

- **Typographie** : Space Grotesk (corps) + Brasika (logo)
- **Palette** : Rouge Scoop (#FF3131), noir profond, blanc pur
- **Themes** : Mode clair et mode sombre disponibles
- **Animations** : Glitch effects, parallax, text scramble, cursor tracking
- **Motifs** : Patterns geometriques africains

## Structure du Projet

```
/app
  /page.tsx          # Page principale
  /layout.tsx        # Layout avec fonts et metadata
  /globals.css       # Styles globaux, themes et animations

/components
  /hero-video.tsx         # Hero avec video et logo
  /manifeste-section.tsx  # Vision et valeurs
  /why-section.tsx        # Pourquoi nous choisir
  /publications-section.tsx # Apercu des publications
  /social-cta-section.tsx # CTA reseaux sociaux
  /footer.tsx             # Footer avec contact
  /theme-toggle.tsx       # Bouton theme clair/sombre
  /cursor-tracker.tsx     # Curseur personnalise (desktop)
  /glitch-text.tsx        # Texte avec effet glitch
  /marquee-band.tsx       # Bande defilante
  /african-pattern.tsx    # Motif SVG africain
```

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

**Important** : Utilisez la classe `font-brasika` pour le texte du logo si vous gardez du texte.

### 2. Ajouter votre Video Hero

Dans `/app/page.tsx` :
```tsx
<HeroVideo
  videoSrc="/videos/votre-video.mp4"
  posterImage="/images/poster.jpg"
  fallbackImage="/images/fallback.jpg"
/>
```

### 3. Ajouter les Publications

Creez un dossier `/public/publications/` et ajoutez vos images :
- `tiktok-1.jpg`, `tiktok-2.jpg`, `tiktok-3.jpg`
- `instagram-1.jpg`, `instagram-2.jpg`, `instagram-3.jpg`
- `facebook-1.jpg`, `facebook-2.jpg`

Puis editez `/components/publications-section.tsx` pour mettre a jour les chemins et les statistiques.

### 4. Integrer une Video YouTube

Dans `/components/publications-section.tsx`, remplacez `YOUR_VIDEO_ID` :
```tsx
youtube: {
  videoId: "votre_video_id",
  title: "Titre de votre video",
  views: "125K",
  duration: "12:34",
}
```

### 5. Modifier les Couleurs

Dans `/app/globals.css`, la couleur primaire est definie en OKLCH :
```css
/* Rouge Scoop #FF3131 */
--primary: oklch(0.59 0.24 25);
```

Pour changer la couleur, utilisez un convertisseur HEX vers OKLCH.

### 6. Theme Clair/Sombre

Le toggle de theme est dans le header du hero. Les deux themes sont definis dans `globals.css` :
- `:root` = theme clair
- `.dark` = theme sombre (par defaut)

## Animations Disponibles

| Classe | Description |
|--------|-------------|
| `animate-glitch` | Effet glitch tremblant |
| `animate-glitch-skew` | Glitch avec skew |
| `animate-noise` | Animation bruit/grain |
| `animate-scanline` | Ligne de scan TV |
| `animate-float` | Flottement doux |
| `animate-pulse-glow` | Pulsation lumineuse |
| `animate-text-reveal` | Revelation de texte |
| `animate-marquee` | Defilement horizontal |
| `animate-draw-line` | Dessin de ligne SVG |

## Composants Reutilisables

### GlitchText
```tsx
<GlitchText
  text="VOTRE TEXTE"
  as="h1"                    // h1, h2, h3, p, span
  className="text-4xl"
  delay={200}                // Delai avant animation (ms)
  scramble={true}            // Activer effet scramble
/>
```

### ThemeToggle
```tsx
<ThemeToggle /> // Bouton soleil/lune pour switcher le theme
```

### MarqueeBand
```tsx
<MarqueeBand
  text="VOTRE TEXTE"
  direction="left"           // left ou right
  speed={25}                 // Duree en secondes
/>
```

### AfricanPattern
```tsx
<AfricanPattern className="w-96 h-96 text-primary" />
```

## Ameliorations Possibles

1. **Ajouter une police Brasika custom**
   - Telechargez la police Brasika
   - Ajoutez-la dans `/public/fonts/`
   - Configurez-la dans `layout.tsx` et `globals.css`

2. **Integrer les vrais embeds**
   - TikTok embed API
   - Instagram oEmbed
   - YouTube iframe

3. **Ajouter un formulaire newsletter**
   - Integrer avec Mailchimp/ConvertKit
   - Ajouter validation email

4. **Analytics**
   - Vercel Analytics (deja integre)
   - Google Analytics
   - Meta Pixel

5. **SEO**
   - Open Graph images
   - Twitter cards
   - Schema.org markup

## Performance

- Lazy loading des composants lourds
- Animations optimisees avec CSS transforms
- Intersection Observer pour animations au scroll
- Curseur custom desactive sur mobile
- Theme persiste en local (JavaScript)

## Contact

- **Email professionnel** : Contact@scoop-afrique.com
- **Instagram** : @Scoop.Afrique
- **TikTok** : @Scoop.Afrique
- **Facebook** : @scoop.afrique

---

**Scoop.Afrique** - Le media digital qui decrypte l'Afrique autrement.

*N'oubliez pas : c'est Scoop POINT Afrique*
