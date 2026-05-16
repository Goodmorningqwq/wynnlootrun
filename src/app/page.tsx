import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-[rgba(120,68,190,0.35)]" style={{ backdropFilter: 'blur(10px) saturate(130%)', background: 'linear-gradient(180deg, rgba(22,10,35,0.85), rgba(10,5,18,0.9))' }}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚔️</span>
            <h1 className="text-xl font-bold text-white font-heading" style={{ textShadow: '0 0 12px rgba(255,79,216,0.3)' }}>
              WynnLootrun Advisor
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/run" className="text-[var(--color-wynn-text-muted)] hover:text-[var(--color-wynn-pink)] transition-colors text-sm font-medium">
              Advisor
            </Link>
            <Link href="/login" className="text-[var(--color-wynn-text-muted)] hover:text-[var(--color-wynn-pink)] transition-colors text-sm font-medium">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center py-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 font-heading" style={{ background: 'linear-gradient(130deg, #f5d0fe 0%, #f472b6 40%, #c084fc 74%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            WynnLootrun Advisor
          </h2>
          <div className="neon-line w-48 mx-auto mb-8" />
          <p className="text-lg text-[var(--color-wynn-text-muted)] mb-10 leading-relaxed">
            Real-time beacon recommendations for your Wynncraft lootruns.
            Phase-aware scoring, combo detection, and expert strategies — all at your fingertips.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/run">
              <Button size="lg" className="text-base px-8 py-6 bg-gradient-to-br from-[var(--color-wynn-pink)] to-[var(--color-wynn-purple-dark)] hover:opacity-90 border border-[rgba(232,121,249,0.75)] text-white shadow-lg shadow-purple-900/30">
                Start Advisor
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 border-[var(--color-wynn-border-glow)] text-[var(--color-wynn-text)] hover:bg-[var(--color-secondary)]">
                Login
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
            <div className="glow-card rounded-xl p-6 text-left">
              <div className="text-2xl mb-3">🎯</div>
              <h3 className="text-white font-semibold mb-2">Phase-Aware Scoring</h3>
              <p className="text-sm text-[var(--color-wynn-text-muted)]">Beacon priorities change based on your run phase — setup, extension, mission, trial, or farming.</p>
            </div>
            <div className="glow-card rounded-xl p-6 text-left">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="text-white font-semibold mb-2">Combo Detection</h3>
              <p className="text-sm text-[var(--color-wynn-text-muted)]">Automatically detects your active combo (Opal Offering, Jester&apos;s Scheme, etc.) and adjusts recommendations.</p>
            </div>
            <div className="glow-card rounded-xl p-6 text-left">
              <div className="text-2xl mb-3">⏱️</div>
              <h3 className="text-white font-semibold mb-2">Low-Time Priority</h3>
              <p className="text-sm text-[var(--color-wynn-text-muted)]">Toggle &quot;Less than 4 minutes&quot; to instantly boost Green beacon priority when time is running out.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[rgba(130,86,188,0.35)] py-6" style={{ background: 'rgba(8,5,14,0.92)' }}>
        <p className="text-center text-[var(--color-wynn-text-muted)] text-sm opacity-60">
          Not affiliated with Wynncraft Industries. Built with data from the Ultimate Wynncraft Lootrun Guide.
        </p>
      </footer>
    </div>
  );
}
