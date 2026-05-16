'use client';

import { MissionName, MissionOffer, LootrunState } from '@/lib/lootrun/types';
import { MISSION_DEFINITIONS } from '@/lib/lootrun/missions';

interface MissionOfferGridProps {
  offers: MissionOffer[];
  state: LootrunState;
  onToggleSelect: (name: MissionName) => void;
  onClearAll: () => void;
  onGetRecommendations: () => void;
}

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pull_farming: { bg: 'rgba(168, 85, 247, 0.10)', border: 'rgba(168, 85, 247, 0.40)', text: '#a855f7' },
  chest_farming: { bg: 'rgba(245, 212, 66, 0.10)', border: 'rgba(245, 212, 66, 0.40)', text: '#f5d442' },
  survival: { bg: 'rgba(46, 204, 113, 0.10)', border: 'rgba(46, 204, 113, 0.40)', text: '#2ecc71' },
  qol: { bg: 'rgba(84, 160, 255, 0.10)', border: 'rgba(84, 160, 255, 0.40)', text: '#54a0ff' },
  beacon_manipulation: { bg: 'rgba(255, 79, 216, 0.10)', border: 'rgba(255, 79, 216, 0.40)', text: '#ff4fd8' },
  run_extension: { bg: 'rgba(238, 90, 36, 0.10)', border: 'rgba(238, 90, 36, 0.40)', text: '#ee5a24' },
  reroll: { bg: 'rgba(0, 210, 211, 0.10)', border: 'rgba(0, 210, 211, 0.40)', text: '#00d2d3' },
  sacrifice: { bg: 'rgba(239, 68, 68, 0.10)', border: 'rgba(239, 68, 68, 0.40)', text: '#ef4444' },
};

export function MissionOfferGrid({ offers, state, onToggleSelect, onClearAll, onGetRecommendations }: MissionOfferGridProps) {
  const activeNames = new Set(state.missions.map(m => m.name));
  const availableOffers = offers.filter(o => !activeNames.has(o.name));
  const selectedAvailable = availableOffers.filter(o => o.isSelected);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">📋 Mission Offer</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-wynn-text-muted)]">
            {selectedAvailable.length} selected
          </span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-[var(--color-wynn-text-muted)] hover:text-[var(--color-wynn-red)] transition-colors px-2 py-1 rounded border border-[var(--color-wynn-border-glow)]"
          >
            Clear
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--color-wynn-text-muted)]">
        Select the missions offered to you. Then get recommendations.
      </p>

      <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
        {availableOffers.map((offer) => {
          const def = MISSION_DEFINITIONS[offer.name];
          if (!def) return null;
          const colors = TYPE_COLORS[def.type] || TYPE_COLORS.qol;
          return (
            <button
              key={offer.name}
              type="button"
              onClick={() => onToggleSelect(offer.name)}
              className={`text-left rounded-lg p-2 transition-all duration-150 border ${
                offer.isSelected
                  ? 'ring-1 scale-[1.01]'
                  : 'hover:scale-[1.005]'
              }`}
              style={{
                background: offer.isSelected
                  ? `linear-gradient(180deg, ${colors.bg}, rgba(10, 6, 20, 0.94))`
                  : 'linear-gradient(180deg, rgba(24, 12, 39, 0.96), rgba(14, 8, 26, 0.94))',
                borderColor: offer.isSelected ? colors.border : 'rgba(120, 68, 190, 0.25)',
                boxShadow: offer.isSelected ? `0 0 8px ${colors.border}` : undefined,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded border flex items-center justify-center text-[8px] ${
                    offer.isSelected ? 'border-current' : 'border-[var(--color-wynn-border-glow)]'
                  }`}
                  style={{ color: colors.text }}
                >
                  {offer.isSelected ? '✓' : ''}
                </div>
                <span className="text-xs font-semibold text-white">{def.label}</span>
                <span
                  className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                >
                  {def.type.replace('_', ' ')}
                </span>
                {def.comboRole === 'required' && (
                  <span className="text-[8px] px-1 py-0.5 rounded-full bg-[var(--color-wynn-gold)]/15 text-[var(--color-wynn-gold)] border border-[var(--color-wynn-gold)]/30 font-medium">
                    COMBO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[var(--color-wynn-text-muted)] mt-0.5 ml-5 leading-tight">
                {def.description}
              </p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onGetRecommendations}
        disabled={selectedAvailable.length === 0}
        className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: selectedAvailable.length > 0
            ? 'linear-gradient(135deg, var(--color-wynn-pink), var(--color-wynn-purple-dark))'
            : 'rgba(168, 85, 247, 0.15)',
          border: '1px solid rgba(232, 121, 249, 0.5)',
          color: 'white',
        }}
      >
        🧠 Get Mission Recommendations ({selectedAvailable.length} mission{selectedAvailable.length !== 1 ? 's' : ''})
      </button>
    </div>
  );
}
