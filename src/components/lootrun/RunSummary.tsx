'use client';

import { LootrunState } from '@/lib/lootrun/types';
import { calculateEffectivePulls } from '@/lib/lootrun/engine';
import { BEACON_DEFINITIONS } from '@/lib/lootrun/beacons';
import { MISSION_DEFINITIONS } from '@/lib/lootrun/missions';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface RunSummaryProps {
  state: LootrunState;
  onToggleLowTime: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const PHASE_LABELS: Record<string, string> = {
  setup: '🛠️ Setup',
  extension: '📐 Extension',
  mission_setup: '📋 Mission Setup',
  trial_setup: '⚖️ Trial Setup',
  pull_farming: '💰 Pull Farming',
  ending: '⏰ Ending',
};

export function RunSummary({ state, onToggleLowTime }: RunSummaryProps) {
  const pulls = calculateEffectivePulls(state);
  const totalCurses = Object.values(state.curses).reduce((a, b) => a + b, 0);

  return (
    <div className="glow-card rounded-xl p-4 space-y-4 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
        Run Summary
      </h2>

      <div className="text-center">
        <div className={`text-4xl font-bold font-mono ${
          state.timerSeconds < 240 ? 'text-[var(--color-wynn-red)] animate-pulse' :
          state.timerSeconds < 480 ? 'text-[var(--color-wynn-gold)]' :
          'text-[var(--color-wynn-green)]'
        }`}>
          {formatTime(state.timerSeconds)}
        </div>
        <button
          type="button"
          onClick={onToggleLowTime}
          className={`mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            state.isLowTime
              ? 'bg-[var(--color-wynn-red)]/20 border-[var(--color-wynn-red)]/60 text-[var(--color-wynn-red)]'
              : 'bg-transparent border-[var(--color-wynn-border-glow)] text-[var(--color-wynn-text-muted)] hover:border-[var(--color-wynn-red)]/40'
          }`}
        >
          ⚠️ Less than 4 minutes
        </button>
      </div>

      <div className="text-center">
        <span className="text-sm text-[var(--color-wynn-text-muted)]">Phase</span>
        <div className="text-base font-semibold text-[var(--color-wynn-gold)]">
          {PHASE_LABELS[state.phase] || state.phase}
        </div>
        {state.aquaStackPending && (
          <div className="mt-1">
            <Badge className="text-[10px] px-2 py-0.5 bg-[var(--color-wynn-cyan)]/20 text-[var(--color-wynn-cyan)] border-[var(--color-wynn-cyan)]/40 font-bold animate-pulse">
              💧 AQUA STACK READY
            </Badge>
          </div>
        )}
      </div>

      <Separator className="bg-[var(--color-wynn-border-glow)]" />

      <div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-wynn-text-muted)]">Challenge</span>
          <span className="text-white font-semibold">{state.challengeNumber} / {state.totalChallenges}</span>
        </div>
        <Progress value={(state.challengeNumber / state.totalChallenges) * 100} className="mt-1 h-2 bg-[rgba(168,85,247,0.15)]" />
      </div>

      <div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-wynn-text-muted)]">Raw Pulls</span>
          <span className="text-white font-semibold">{pulls.raw}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-[var(--color-wynn-text-muted)]">Effective Pulls</span>
          <span className="text-[var(--color-wynn-gold)] font-bold">{pulls.effective}</span>
        </div>
        {state.sacrifices > 0 && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-[var(--color-wynn-text-muted)]">Sacrifice %</span>
            <span className="text-[var(--color-wynn-pink)] font-semibold">{pulls.sacrificePercent.toFixed(1)}%</span>
          </div>
        )}
        <div className="flex justify-between text-sm mt-1">
          <span className="text-[var(--color-wynn-text-muted)]">Rerolls</span>
          <span className="text-[var(--color-wynn-cyan)] font-semibold">{state.rerolls}</span>
        </div>
      </div>

      <Separator className="bg-[var(--color-wynn-border-glow)]" />

      <div>
        <span className="text-sm text-[var(--color-wynn-text-muted)] mb-2 block">Active Effects</span>
        <div className="flex flex-wrap gap-1.5">
          {state.activeEffects.length === 0 && (
            <span className="text-xs text-[var(--color-wynn-text-muted)] opacity-50">No active effects</span>
          )}
          {state.activeEffects.map((effect, i) => (
            <Badge
              key={`${effect.color}-${i}`}
              variant="outline"
              className="text-[10px] px-1.5 py-0.5"
              style={{
                borderColor: BEACON_DEFINITIONS[effect.color].colorHex + '80',
                color: BEACON_DEFINITIONS[effect.color].colorHex,
                backgroundColor: BEACON_DEFINITIONS[effect.color].colorHex + '15',
              }}
            >
              {BEACON_DEFINITIONS[effect.color].emoji} {BEACON_DEFINITIONS[effect.color].label} ×{effect.challenges}
              {effect.isVibrant && ' ✨'}
            </Badge>
          ))}
        </div>
      </div>

      {totalCurses > 0 && (
        <div>
          <span className="text-sm text-[var(--color-wynn-text-muted)] mb-2 block">Curses ({totalCurses} total)</span>
          <div className="grid grid-cols-2 gap-1">
            {state.curses.damage > 0 && <CurseBadge label="DMG" value={state.curses.damage} />}
            {state.curses.health > 0 && <CurseBadge label="HP" value={state.curses.health} />}
            {state.curses.attackSpeed > 0 && <CurseBadge label="ASPD" value={state.curses.attackSpeed} />}
            {state.curses.walkSpeed > 0 && <CurseBadge label="WSPD" value={state.curses.walkSpeed} />}
            {state.curses.damageResist > 0 && <CurseBadge label="DRES" value={state.curses.damageResist} />}
            {state.curses.radiantPower > 0 && <CurseBadge label="RAD" value={state.curses.radiantPower} />}
            {state.curses.radiantChance > 0 && <CurseBadge label="RAD%" value={state.curses.radiantChance} />}
          </div>
        </div>
      )}

      {state.missions.length > 0 && (
        <div>
          <span className="text-sm text-[var(--color-wynn-text-muted)] mb-2 block">Missions ({state.missions.length}/4)</span>
          <div className="space-y-1">
            {state.missions.map((mission, i) => {
              const def = MISSION_DEFINITIONS[mission.name];
              const obj = mission.objective;
              return (
                <div key={i} className={`text-xs rounded px-2 py-1 border ${
                  mission.completed
                    ? 'text-[var(--color-wynn-green)] bg-[var(--color-wynn-green)]/10 border-[var(--color-wynn-green)]/20'
                    : 'text-[var(--color-wynn-gold)] bg-[var(--color-wynn-gold)]/10 border-[var(--color-wynn-gold)]/20'
                }`}>
                  <div className="flex items-center gap-1">
                    <span>{mission.completed ? '✓' : '○'}</span>
                    <span>{def?.label || mission.name}</span>
                    {mission.source === 'free' && <span className="text-[8px] opacity-60">FREE</span>}
                    {mission.source === 'gray' && <span className="text-[8px] opacity-60">GRAY</span>}
                  </div>
                  {obj.target > 0 && !mission.completed && (
                    <div className="text-[9px] opacity-70 mt-0.5">
                      {obj.label}: {obj.current}/{obj.target}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(state.freeMissionAvailable || state.grayMissionChoices > 0) && (
        <div className="space-y-1">
          {state.freeMissionAvailable && state.missions.length === 0 && (
            <div className="text-[10px] px-2 py-1 rounded border border-[var(--color-wynn-gold)]/30 bg-[var(--color-wynn-gold)]/10 text-[var(--color-wynn-gold)]">
              ★ Free mission choice available
            </div>
          )}
          {state.grayMissionChoices > 0 && (
            <div className="text-[10px] px-2 py-1 rounded border border-[var(--color-wynn-cyan)]/30 bg-[var(--color-wynn-cyan)]/10 text-[var(--color-wynn-cyan)]">
              💧 {state.grayMissionChoices} mission choice{state.grayMissionChoices !== 1 ? 's' : ''} from gray beacon
            </div>
          )}
        </div>
      )}

      {state.trials.length > 0 && (
        <div>
          <span className="text-sm text-[var(--color-wynn-text-muted)] mb-2 block">Trials ({state.trials.length}/2)</span>
          <div className="space-y-1">
            {state.trials.map((trial, i) => (
              <div key={i} className={`text-xs rounded px-2 py-1 border ${
                trial.completed
                  ? 'text-[var(--color-wynn-green)] bg-[var(--color-wynn-green)]/10 border-[var(--color-wynn-green)]/20'
                  : 'text-[var(--color-wynn-red)] bg-[var(--color-wynn-red)]/10 border-[var(--color-wynn-red)]/20'
              }`}>
                {trial.name} {!trial.completed && `(${trial.challengesRemaining} left)`}
                {trial.completed && ' ✓'}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-wynn-text-muted)]">Beacon Choices</span>
          <span className="text-white font-semibold">{state.beaconChoices}</span>
        </div>
      </div>
    </div>
  );
}

function CurseBadge({ label, value }: { label: string; value: number }) {
  return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-red-500/40 text-red-400 bg-red-500/10">
      {label} +{value}
    </Badge>
  );
}
