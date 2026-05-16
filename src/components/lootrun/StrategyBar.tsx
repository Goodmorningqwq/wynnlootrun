'use client';

import { LootrunState, TipSeverity } from '@/lib/lootrun/types';
import { getStrategyAdvice } from '@/lib/lootrun/strategy';

interface StrategyBarProps {
  state: LootrunState;
}

const SEVERITY_STYLES: Record<TipSeverity, string> = {
  critical: 'bg-[var(--color-wynn-red)]/15 border-[var(--color-wynn-red)]/40 text-[var(--color-wynn-red)]',
  warning: 'bg-[var(--color-wynn-gold)]/15 border-[var(--color-wynn-gold)]/40 text-[var(--color-wynn-gold)]',
  info: 'bg-[var(--color-wynn-cyan)]/15 border-[var(--color-wynn-cyan)]/40 text-[var(--color-wynn-cyan)]',
};

export function StrategyBar({ state }: StrategyBarProps) {
  const tips = getStrategyAdvice(state);

  if (tips.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {tips.slice(0, 4).map((tip, i) => (
        <div
          key={i}
          className={`text-[11px] px-3 py-1.5 rounded-lg border ${SEVERITY_STYLES[tip.severity]}`}
        >
          {tip.text}
        </div>
      ))}
    </div>
  );
}
