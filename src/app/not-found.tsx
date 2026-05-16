import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glow-card rounded-xl p-8 text-center max-w-md">
        <div className="text-5xl mb-4">⚔️</div>
        <h1 className="text-3xl font-bold mb-3 font-heading" style={{ background: 'linear-gradient(130deg, #f5d0fe, #f472b6, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Page Not Found
        </h1>
        <p className="text-[var(--color-wynn-text-muted)] mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-gradient-to-br from-[var(--color-wynn-pink)] to-[var(--color-wynn-purple-dark)] border border-[rgba(232,121,249,0.75)] text-white">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
