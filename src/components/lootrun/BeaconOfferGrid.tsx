'use client';

import { BeaconColor, BeaconOffer, LootrunState } from '@/lib/lootrun/types';
import { BEACON_DEFINITIONS } from '@/lib/lootrun/beacons';
import { getBeaconConstraints } from '@/lib/lootrun/constraints';
import { BeaconCard } from './BeaconCard';

interface BeaconOfferGridProps {
  offers: BeaconOffer[];
  state: LootrunState;
  onToggleSelect: (color: BeaconColor) => void;
  onToggleVibrant: (color: BeaconColor) => void;
  onClearAll: () => void;
  onGetRecommendations: () => void;
}

export function BeaconOfferGrid({
  offers,
  state,
  onToggleSelect,
  onToggleVibrant,
  onClearAll,
  onGetRecommendations,
}: BeaconOfferGridProps) {
  const selectedOffers = offers.filter(o => o.isSelected);
  const hasAqua = selectedOffers.some(o => o.color === 'aqua');
  const constraints = getBeaconConstraints(state);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          Beacon Offer
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-wynn-text-muted)]">
            {selectedOffers.length} selected
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
        Click the beacons that are offered to you this challenge. Toggle vibrant if they appear vibrant. Then get recommendations.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {offers.map((offer) => {
          const def = BEACON_DEFINITIONS[offer.color];
          const maxedOut = def.maxCount > 0 && (state.beaconsUsed[offer.color] || 0) >= def.maxCount;
          const constraint = constraints[offer.color];
          const isUnavailable = !constraint.available && !maxedOut;

          return (
            <div key={offer.color} className="relative">
              <BeaconCard
                key={offer.color}
                offer={offer}
                isAquaAvailable={hasAqua}
                maxedOut={maxedOut}
                onToggleSelect={onToggleSelect}
                onToggleVibrant={onToggleVibrant}
              />
              {isUnavailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl z-10 pointer-events-none">
                  <span className="text-[9px] text-[var(--color-wynn-red)] text-center px-1 leading-tight font-semibold">
                    {constraint.reason}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onGetRecommendations}
        disabled={selectedOffers.length === 0}
        className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: selectedOffers.length > 0
            ? 'linear-gradient(135deg, var(--color-wynn-pink), var(--color-wynn-purple-dark))'
            : 'rgba(168, 85, 247, 0.15)',
          border: '1px solid rgba(232, 121, 249, 0.5)',
          color: 'white',
        }}
      >
        🧠 Get Recommendations ({selectedOffers.length} beacon{selectedOffers.length !== 1 ? 's' : ''})
      </button>
    </div>
  );
}
