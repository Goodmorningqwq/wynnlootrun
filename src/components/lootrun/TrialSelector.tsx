'use client';

import { TrialName, ActiveTrial, LootrunState } from '@/lib/lootrun/types';
import { TRIAL_DEFINITIONS } from '@/lib/lootrun/trials';
import { recommendTrials } from '@/lib/lootrun/recommendations';
import { Badge } from '@/components/ui/badge';

interface TrialSelectorProps {
  trials: ActiveTrial[];
  onAddTrial: (name: TrialName) => void;
  onRemoveTrial: (index: number) => void;
  onToggleComplete: (index: number) => void;
  state: LootrunState;
}

const TRIAL_NAMES = Object.keys(TRIAL_DEFINITIONS) as TrialName[];

const TIER_COLORS: Record<string, string> = {
  S: 'text-[var(--color-wynn-gold)] border-[var(--color-wynn-gold)]/40 bg-[var(--color-wynn-gold)]/10',
  A: 'text-[var(--color-wynn-purple)] border-[var(--color-wynn-purple)]/40 bg-[var(--color-wynn-purple)]/10',
  B: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
  C: 'text-gray-400 border-gray-400/40 bg-gray-400/10',
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-[var(--color-wynn-red)]/15 text-[var(--color-wynn-red)] border-[var(--color-wynn-red)]/40',
  high: 'bg-[var(--color-wynn-gold)]/15 text-[var(--color-wynn-gold)] border-[var(--color-wynn-gold)]/40',
  medium: 'bg-[var(--color-wynn-cyan)]/15 text-[var(--color-wynn-cyan)] border-[var(--color-wynn-cyan)]/40',
  low: 'bg-gray-500/15 text-gray-400 border-gray-400/40',
};

export function TrialSelector({ trials, onAddTrial, onToggleComplete, state }: TrialSelectorProps) {
  const canAdd = trials.length < 2;
  const recommendations = canAdd ? recommendTrials(state) : [];

  return (
    <div className="space-y-2">
      <span className="text-sm text-[var(--color-wynn-text-muted)]">Active Trials ({trials.length}/2)</span>

      <div className="flex flex-wrap gap-1.5">
        {trials.map((trial, i) => {
          const def = TRIAL_DEFINITIONS[trial.name];
          return (
            <Badge
              key={i}
              className={`text-xs px-2 py-1 cursor-pointer hover:opacity-80 ${TIER_COLORS[def?.tier || 'C']} ${
                trial.completed ? 'line-through opacity-60' : ''
              }`}
              onClick={() => onToggleComplete(i)}
            >
              [{def?.tier || '?'}] {def?.label || trial.name} {trial.completed ? '✓' : `(${trial.challengesRemaining})`}
            </Badge>
          );
        })}
      </div>

      {canAdd && (
        <div className="space-y-1.5">
          <select
            className="w-full text-xs bg-[rgba(10,6,20,0.92)] border border-[rgba(192,132,252,0.45)] rounded-lg px-3 py-2 text-white focus:border-[rgba(232,121,249,0.9)] focus:ring-1 focus:ring-[rgba(236,72,153,0.2)]"
            value=""
            onChange={(e) => {
              if (e.target.value) onAddTrial(e.target.value as TrialName);
            }}
          >
            <option value="" disabled>+ Add trial...</option>
            {['S', 'A', 'B', 'C'].map(tier => (
              <optgroup key={tier} label={`${tier} Tier`}>
                {TRIAL_NAMES
                  .filter(name => TRIAL_DEFINITIONS[name].tier === tier && !trials.some(t => t.name === name))
                  .map(name => (
                    <option key={name} value={name}>
                      {TRIAL_DEFINITIONS[name].label} - {TRIAL_DEFINITIONS[name].reward}
                    </option>
                  ))
                }
              </optgroup>
            ))}
          </select>

          {recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').slice(0, 3).map(rec => (
            <div
              key={`${rec.trial}-${rec.slot}`}
              className={`text-[10px] px-2 py-1 rounded border ${PRIORITY_STYLES[rec.priority]}`}
            >
              <span className="font-semibold">[{rec.slot}st] {TRIAL_DEFINITIONS[rec.trial]?.label || rec.trial}</span>
              <span className="ml-1 opacity-80">— {rec.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
