'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glow-card rounded-xl p-8 text-center max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-3 text-white">Something went wrong</h2>
        <p className="text-[var(--color-wynn-text-muted)] mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-gradient-to-br from-[var(--color-wynn-pink)] to-[var(--color-wynn-purple-dark)] border border-[rgba(232,121,249,0.75)] text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
