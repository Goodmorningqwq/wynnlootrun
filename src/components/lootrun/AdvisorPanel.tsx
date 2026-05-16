'use client';

import { Recommendation, BeaconColor, LootrunState, MissionRecommendation, MissionName } from '@/lib/lootrun/types';
import { BEACON_DEFINITIONS } from '@/lib/lootrun/beacons';
import { MISSION_DEFINITIONS } from '@/lib/lootrun/missions';
import { detectCombos, getActiveComboStrategy } from '@/lib/lootrun/combos';
import { getBeaconConstraints } from '@/lib/lootrun/constraints';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface AdvisorPanelProps {
  recommendations: Recommendation[];
  missionRecommendations: MissionRecommendation[];
  onTakeBeacon: (color: BeaconColor) => void;
  onTakeMission: (name: MissionName, source: 'free' | 'gray') => void;
  state: LootrunState;
}

export function AdvisorPanel({ recommendations, missionRecommendations, onTakeBeacon, onTakeMission, state }: AdvisorPanelProps) {
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

      {missionRecommendations.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">📋 Mission Pick</h3>
            {(state.freeMissionAvailable || state.grayMissionChoices > 0) && (
              <Badge className="text-[8px] px-1.5 py-0 bg-[var(--color-wynn-cyan)]/20 text-[var(--color-wynn-cyan)] border-[var(--color-wynn-cyan)]/40">
                {state.freeMissionAvailable ? 'FREE CHOICE' : `${state.grayMissionChoices} CHOICE${state.grayMissionChoices > 1 ? 'S' : ''}`}
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            {missionRecommendations.map((rec, index) => {
              const def = MISSION_DEFINITIONS[rec.mission];
              if (!def) return null;
              const priorityColor = rec.priority === 'critical' ? '#ef4444' : rec.priority === 'high' ? '#f5d442' : rec.priority === 'medium' ? '#00d2d3' : '#a39abf';
              const source = state.freeMissionAvailable && state.missions.length === 0 ? 'free' : 'gray';
              return (
                <div
                  key={rec.mission}
                  className="rounded-lg p-3 border"
                  style={{
                    background: `linear-gradient(135deg, ${priorityColor}10, ${priorityColor}05)`,
                    borderColor: `${priorityColor}40`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold ${index === 0 ? 'text-[var(--color-wynn-gold)]' : 'text-gray-300'}`}>
                      #{index + 1}
                    </span>
                    <span className="text-xs font-semibold text-white">{def.label}</span>
                    <Badge
                      className="text-[8px] px-1.5 py-0"
                      style={{ background: `${priorityColor}20`, color: priorityColor, borderColor: `${priorityColor}40` }}
                    >
                      {rec.priority.toUpperCase()}
                    </Badge>
                    {rec.enablesCombo && (
                      <Badge className="text-[8px] px-1.5 py-0 bg-[var(--color-wynn-gold)]/20 text-[var(--color-wynn-gold)] border-[var(--color-wynn-gold)]/40">
                        COMBO
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--color-wynn-text-muted)] leading-relaxed mb-2">{rec.reason}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[rgba(168,85,247,0.15)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${rec.score}%`, background: `linear-gradient(90deg, ${priorityColor}, ${priorityColor}80)` }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--color-wynn-text-muted)] w-6 text-right">{rec.score}</span>
                    <Button
                      size="xs"
                      onClick={() => onTakeMission(rec.mission, source)}
                      className="text-[10px] px-2 py-0.5 h-auto border"
                      style={{ background: `${priorityColor}20`, borderColor: `${priorityColor}60`, color: priorityColor }}
                    >
                      Take
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <Separator className="bg-[var(--color-wynn-border-glow)]" />
        </>
      )}

      {recommendations.length === 0 && missionRecommendations.length === 0 ? (
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
