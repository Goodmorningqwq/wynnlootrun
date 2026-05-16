'use client';

import { MissionName, ActiveMission, LootrunState } from '@/lib/lootrun/types';
import { MISSION_DEFINITIONS } from '@/lib/lootrun/missions';
import { recommendMissions } from '@/lib/lootrun/recommendations';
import { Badge } from '@/components/ui/badge';

interface MissionSelectorProps {
  missions: ActiveMission[];
  onAddMission: (name: MissionName) => void;
  onRemoveMission: (index: number) => void;
  state: LootrunState;
}

const MISSION_NAMES = Object.keys(MISSION_DEFINITIONS) as MissionName[];

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-[var(--color-wynn-red)]/15 text-[var(--color-wynn-red)] border-[var(--color-wynn-red)]/40',
  high: 'bg-[var(--color-wynn-gold)]/15 text-[var(--color-wynn-gold)] border-[var(--color-wynn-gold)]/40',
  medium: 'bg-[var(--color-wynn-cyan)]/15 text-[var(--color-wynn-cyan)] border-[var(--color-wynn-cyan)]/40',
  low: 'bg-gray-500/15 text-gray-400 border-gray-400/40',
};

export function MissionSelector({ missions, onAddMission, onRemoveMission, state }: MissionSelectorProps) {
  const canAdd = missions.length < 4;
  const recommendations = canAdd ? recommendMissions(state, MISSION_NAMES) : [];
  const recMap = new Map(recommendations.map(r => [r.mission, r]));

  return (
    <div className="space-y-2">
      <span className="text-sm text-[var(--color-wynn-text-muted)]">Active Missions ({missions.length}/4)</span>

      <div className="flex flex-wrap gap-1.5">
        {missions.map((mission, i) => {
          const def = MISSION_DEFINITIONS[mission.name];
          return (
            <Badge
              key={i}
              className="text-xs px-2 py-1 bg-[var(--color-wynn-gold)]/15 text-[var(--color-wynn-gold)] border border-[var(--color-wynn-gold)]/30 cursor-pointer hover:bg-[var(--color-wynn-gold)]/25"
              onClick={() => onRemoveMission(i)}
            >
              {def?.label || mission.name} ✕
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
              if (e.target.value) onAddMission(e.target.value as MissionName);
            }}
          >
            <option value="" disabled>+ Add mission...</option>
            {MISSION_NAMES
              .filter(name => !missions.some(m => m.name === name))
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
