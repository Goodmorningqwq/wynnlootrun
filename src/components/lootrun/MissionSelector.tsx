'use client';

import { MissionName, ActiveMission, LootrunState } from '@/lib/lootrun/types';
import { MISSION_DEFINITIONS } from '@/lib/lootrun/missions';
import { recommendMissions } from '@/lib/lootrun/recommendations';

interface MissionSelectorProps {
  missions: ActiveMission[];
  onAddMission: (name: MissionName, source: 'free' | 'gray') => void;
  onRemoveMission: (index: number) => void;
  onToggleComplete: (index: number) => void;
  onUpdateObjective: (index: number, current: number) => void;
  state: LootrunState;
}

const MISSION_NAMES = Object.keys(MISSION_DEFINITIONS) as MissionName[];

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-[var(--color-wynn-red)]/15 text-[var(--color-wynn-red)] border-[var(--color-wynn-red)]/40',
  high: 'bg-[var(--color-wynn-gold)]/15 text-[var(--color-wynn-gold)] border-[var(--color-wynn-gold)]/40',
  medium: 'bg-[var(--color-wynn-cyan)]/15 text-[var(--color-wynn-cyan)] border-[var(--color-wynn-cyan)]/40',
  low: 'bg-gray-500/15 text-gray-400 border-gray-400/40',
};

export function MissionSelector({ missions, onAddMission, onRemoveMission, onToggleComplete, onUpdateObjective, state }: MissionSelectorProps) {
  const canAddFree = state.freeMissionAvailable && missions.length === 0;
  const grayChoices = state.grayMissionChoices;
  const canAddGray = grayChoices > 0 && missions.length < 4;
  const canAdd = (canAddFree || canAddGray) && missions.length < 4;
  const recommendations = canAdd ? recommendMissions(state, MISSION_NAMES) : [];
  const recMap = new Map(recommendations.map(r => [r.mission, r]));
  const activeMissionNames = new Set(missions.map(m => m.name));
  const incompleteMission = missions.find(m => !m.completed);

  return (
    <div className="space-y-2">
      <span className="text-sm text-[var(--color-wynn-text-muted)]">Missions ({missions.length}/4)</span>

      {canAddFree && (
        <div className="text-[10px] px-2 py-1 rounded border border-[var(--color-wynn-gold)]/30 bg-[var(--color-wynn-gold)]/10 text-[var(--color-wynn-gold)]">
          Free mission choice available (challenge 4 complete)
        </div>
      )}

      {canAddGray && (
        <div className="text-[10px] px-2 py-1 rounded border border-[var(--color-wynn-cyan)]/30 bg-[var(--color-wynn-cyan)]/10 text-[var(--color-wynn-cyan)]">
          Gray beacon: {grayChoices} mission choice{grayChoices !== 1 ? 's' : ''} available
        </div>
      )}

      {incompleteMission && (
        <div className="text-[10px] px-2 py-1 rounded border border-[var(--color-wynn-pink)]/30 bg-[var(--color-wynn-pink)]/10 text-[var(--color-wynn-pink)]">
          Complete &quot;{MISSION_DEFINITIONS[incompleteMission.name]?.label}&quot; before gray beacons can appear
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {missions.map((mission, i) => {
          const def = MISSION_DEFINITIONS[mission.name];
          const obj = mission.objective;
          const progressPct = obj.target > 0 ? Math.min(100, Math.round((obj.current / obj.target) * 100)) : 100;
          return (
            <div
              key={i}
              className={`text-xs px-2 py-1 rounded border ${
                mission.completed
                  ? 'bg-[var(--color-wynn-green)]/10 border-[var(--color-wynn-green)]/30 text-[var(--color-wynn-green)]'
                  : 'bg-[var(--color-wynn-gold)]/10 border-[var(--color-wynn-gold)]/30 text-[var(--color-wynn-gold)]'
              }`}
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onToggleComplete(i)}
                  className={`w-3 h-3 rounded-sm border text-[8px] flex items-center justify-center ${
                    mission.completed
                      ? 'bg-[var(--color-wynn-green)] border-[var(--color-wynn-green)] text-white'
                      : 'border-[var(--color-wynn-gold)]/50 hover:bg-[var(--color-wynn-gold)]/20'
                  }`}
                >
                  {mission.completed ? '✓' : ''}
                </button>
                <span className="font-semibold">{def?.label || mission.name}</span>
                {mission.source === 'free' && (
                  <span className="text-[8px] opacity-60">FREE</span>
                )}
                {mission.source === 'gray' && (
                  <span className="text-[8px] opacity-60">GRAY</span>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveMission(i)}
                  className="ml-1 opacity-60 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
              {obj.target > 0 && !mission.completed && (
                <div className="mt-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] opacity-70">{obj.label}</span>
                    <span className="text-[9px] opacity-70">{obj.current}/{obj.target}</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-black/30 mt-0.5">
                    <div
                      className="h-full rounded-full bg-[var(--color-wynn-gold)]"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      type="button"
                      onClick={() => onUpdateObjective(i, Math.max(0, obj.current - 1))}
                      className="text-[9px] px-1 border border-current/30 rounded opacity-60 hover:opacity-100"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateObjective(i, obj.current + 1)}
                      className="text-[9px] px-1 border border-current/30 rounded opacity-60 hover:opacity-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
              {obj.target > 0 && mission.completed && (
                <div className="text-[9px] opacity-60 mt-0.5">✓ {obj.label}</div>
              )}
            </div>
          );
        })}
      </div>

      {canAdd && (
        <div className="space-y-1.5">
          <select
            className="w-full text-xs bg-[rgba(10,6,20,0.92)] border border-[rgba(192,132,252,0.45)] rounded-lg px-3 py-2 text-white focus:border-[rgba(232,121,249,0.9)] focus:ring-1 focus:ring-[rgba(236,72,153,0.2)]"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                const source = canAddFree ? 'free' : 'gray';
                onAddMission(e.target.value as MissionName, source);
              }
            }}
          >
            <option value="" disabled>+ Add mission...</option>
            {MISSION_NAMES
              .filter(name => !activeMissionNames.has(name))
              .map(name => {
                const rec = recMap.get(name);
                const prefix = rec?.priority === 'critical' ? '★ ' : rec?.priority === 'high' ? '● ' : '';
                return (
                  <option key={name} value={name}>
                    {prefix}{MISSION_DEFINITIONS[name].label}
                  </option>
                );
              })
            }
          </select>

          {recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').slice(0, 3).map(rec => (
            <div
              key={rec.mission}
              className={`text-[10px] px-2 py-1 rounded border ${PRIORITY_STYLES[rec.priority]}`}
            >
              <span className="font-semibold">{MISSION_DEFINITIONS[rec.mission]?.label || rec.mission}</span>
              <span className="ml-1 opacity-80">— {rec.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
