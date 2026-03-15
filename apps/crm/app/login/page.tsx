export default function LoginPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: 'var(--background)' }}
    >
      {/* Glass card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8 space-y-6"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-md)' }}
          >
            <span
              className="text-white font-bold text-xl"
              style={{ fontFamily: 'var(--font-scoop)' }}
            >
              S
            </span>
          </div>
          <div className="text-center">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-scoop)', letterSpacing: '-0.02em' }}
            >
              Scoop CRM
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Espace de gestion Scoop Afrique
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Description */}
        <p className="text-center text-sm text-muted-foreground leading-relaxed">
          Connexion sécurisée par Auth0. Accédez à votre espace de gestion client.
        </p>

        {/* CTA */}
        <a
          href="/auth/login?returnTo=/dashboard"
          className="flex w-full items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          Se connecter
        </a>

        <p className="text-center text-xs text-muted-foreground">
          Accès réservé à l&apos;équipe Scoop Afrique
        </p>
      </div>
    </main>
  )
}
