/**
 * Layout for /embeds/* — full-bleed, no site chrome.
 * Intended for iframes inside articles (interactive viz, plots).
 */
export default function EmbedsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>
}
