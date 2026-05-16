'use client';

import { Recommendation, BeaconColor, LootrunState } from '@/lib/lootrun/types';
import { BEACON_DEFINITIONS } from '@/lib/lootrun/beacons';
import { detectCombos, getActiveComboStrategy } from '@/lib/lootrun/combos';
import { getBeaconConstraints } from '@/lib/lootrun/constraints';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdvisorPanelProps {
  recommendations: Recommendation[];
  onTakeBeacon: (color: BeaconColor) => void;
  state: LootrunState;
}

export function AdvisorPanel({ recommendations, onTakeBeacon, state }: AdvisorPanelProps) {
  const combos = detectCombos(state.missions);
  const activeStrategy = getActiveComboStrategy(state.missions);
  const hasActiveCombo = combos.length > 0 && combos[0] !== 'comboless';
  const constraints = getBeaconConstraints(state);

  return (
    <div className="glow-card rounded-xl p-4 space-y-4 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
        🧠 Advisor
      </h2>

      {hasActiveCombo && (
        <div className="rounded-lg p-3 border border-[var(--color-wynn-gold)]/30 bg-[var(--color-wynn-gold)]/5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-[var(--color-wynn-gold)]">🎯 {activeStrategy.label}</span>
            <Badge className="text-[9px] px-1.5 py-0 bg-[var(--color-wynn-gold)]/20 text-[var(--color-wynn-gold)] border-[var(--color-wynn-gold)]/40">
              {activeStrategy.type === 'active' ? 'ACTIVE' : activeStrategy.type === 'passive' ? 'PASSIVE' : 'SEMI'}
            </Badge>
          </div>
          <p className="text-[10px] text-[var(--color-wynn-text-muted)] leading-relaxed">
            {activeStrategy.description}
          </p>
          <p className="text-[10px] text-[var(--color-wynn-gold)] mt-1">
            Expected: {activeStrategy.expectedPulls}
          </p>
        </div>
      )}

      {!hasActiveCombo && state.missions.length > 0 && (
        <div className="rounded-lg p-3 border border-[var(--color-wynn-red)]/30 bg-[var(--color-wynn-red)]/5">
          <p className="text-[10px] text-[var(--color-wynn-text-muted)]">
            No strong combo detected. Consider Porphyrophobia + Inner Peace, or take Gambling Beast to kill the run for rerolls.
          </p>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--color-wynn-text-muted)] text-sm">
            Select the beacons offered to you to get recommendations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            const def = BEACON_DEFINITIONS[rec.beaconColor];
            const constraint = constraints[rec.beaconColor];
            return (
              <div
                key={rec.beaconColor}
                className="rounded-xl p-4 border"
                style={{
                  background: `linear-gradient(135deg, ${def.colorHex}10, ${def.colorHex}05)`,
                  borderColor: `${def.colorHex}40`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-[var(--color-wynn-gold)]' :
                      index === 1 ? 'text-gray-300' :
                      'text-amber-700'
                    }`}>
                      #{rec.priority}
                    </span>
                    <span className="text-xl">{def.emoji}</span>
                    <span className="font-semibold text-white">{def.label}</span>
                    {rec.willBeAquaStacked && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-[var(--color-wynn-cyan)]/20 text-[var(--color-wynn-cyan)] border-[var(--color-wynn-cyan)]/40">
                        AQUA STACK
                      </Badge>
                    )}
                    {rec.shouldTakeVibrant && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-[var(--color-wynn-gold)]/20 text-[var(--color-wynn-gold)] border-[var(--color-wynn-gold)]/40">
                        VIBRANT
                      </Badge>
                    )}
                    {!constraint.available && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-[var(--color-wynn-red)]/20 text-[var(--color-wynn-red)] border-[var(--color-wynn-red)]/40">
                        UNAVAILABLE
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-2 rounded-full bg-[rgba(168,85,247,0.15)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${rec.score}%`,
                          background: `linear-gradient(90deg, ${def.colorHex}, ${def.colorHex}80)`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-[var(--color-wynn-text-muted)] w-8 text-right">{rec.score}</span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--color-wynn-text-muted)] leading-relaxed mb-3">
                  {rec.reason}
                </p>

                <Button
                  size="sm"
                  onClick={() => onTakeBeacon(rec.beaconColor)}
                  className="w-full text-xs font-semibold border"
                  style={{
                    background: `linear-gradient(135deg, ${def.colorHex}30, ${def.colorHex}15)`,
                    borderColor: `${def.colorHex}60`,
                    color: def.colorHex,
                  }}
                >
                  Take {def.label}{rec.willBeAquaStacked ? ' (Aqua Stacked)' : ''}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
