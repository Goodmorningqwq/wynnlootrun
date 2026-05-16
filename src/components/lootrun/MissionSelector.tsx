'use client';

import { ActiveMission } from '@/lib/lootrun/types';
import { MISSION_DEFINITIONS } from '@/lib/lootrun/missions';

interface MissionSelectorProps {
  missions: ActiveMission[];
  onRemoveMission: (index: number) => void;
  onToggleComplete: (index: number) => void;
  onUpdateObjective: (index: number, current: number) => void;
}

export function MissionSelector({ missions, onRemoveMission, onToggleComplete, onUpdateObjective }: MissionSelectorProps) {
  if (missions.length === 0) {
    return (
      <div className="text-xs text-[var(--color-wynn-text-muted)] opacity-50">
        No missions active yet
      </div>
    );
  }

  return (
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
  );
}
