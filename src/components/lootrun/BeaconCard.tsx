'use client';

import { BeaconColor, BeaconOffer } from '@/lib/lootrun/types';
import { BEACON_DEFINITIONS } from '@/lib/lootrun/beacons';
import { Switch } from '@/components/ui/switch';

interface BeaconCardProps {
  offer: BeaconOffer;
  isAquaAvailable: boolean;
  maxedOut: boolean;
  onToggleSelect: (color: BeaconColor) => void;
  onToggleVibrant: (color: BeaconColor) => void;
}

export function BeaconCard({ offer, isAquaAvailable, maxedOut, onToggleSelect, onToggleVibrant }: BeaconCardProps) {
  const def = BEACON_DEFINITIONS[offer.color];

  let effectText = def.baseEffect;
  if (offer.isVibrant && isAquaAvailable) {
    effectText = def.vibrantAquaEffect;
  } else if (offer.isVibrant) {
    effectText = def.vibrantEffect;
  }

  return (
    <button
      type="button"
      disabled={maxedOut}
      onClick={() => onToggleSelect(offer.color)}
      className={`
        relative rounded-xl p-3 text-left transition-all duration-200
        beacon-glow
        ${offer.isSelected
          ? 'selected ring-2 scale-[1.02]'
          : 'hover:scale-[1.01]'
        }
        ${maxedOut
          ? 'opacity-40 cursor-not-allowed grayscale'
          : 'cursor-pointer'
        }
      `}
      style={{
        background: offer.isSelected
          ? `linear-gradient(180deg, ${def.colorHex}15, ${def.colorHex}08)`
          : 'linear-gradient(180deg, rgba(24, 12, 39, 0.96), rgba(14, 8, 26, 0.94))',
        borderColor: offer.isSelected ? `${def.colorHex}80` : 'rgba(120, 68, 190, 0.35)',
        borderWidth: '1px',
        borderStyle: 'solid',
        '--glow-color': def.glowColor,
        boxShadow: offer.isSelected ? `0 0 12px ${def.glowColor}, inset 0 0 12px ${def.colorHex}15` : undefined,
        ringColor: def.colorHex,
      } as React.CSSProperties}
    >
      <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[var(--color-wynn-text-muted)]">V</span>
          <Switch
            checked={offer.isVibrant}
            onCheckedChange={() => onToggleVibrant(offer.color)}
            disabled={!offer.isSelected || maxedOut}
            className="scale-75 data-[state=checked]:bg-[var(--color-wynn-gold)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xl">{def.emoji}</span>
        <span className="font-semibold text-sm text-white">{def.label}</span>
        {offer.isVibrant && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-wynn-gold)]/20 text-[var(--color-wynn-gold)] border border-[var(--color-wynn-gold)]/40">
            VIBRANT
          </span>
        )}
        {maxedOut && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
            MAX
          </span>
        )}
      </div>

      <p className="text-[11px] leading-tight text-[var(--color-wynn-text-muted)]">
        {effectText}
      </p>

      <div className="mt-2 flex items-center gap-1">
        <span className={`text-[9px] uppercase font-bold tracking-wider ${
          def.rarity === 'rare' ? 'text-[var(--color-wynn-gold)]' :
          def.rarity === 'medium' ? 'text-[var(--color-wynn-purple)]' :
          'text-[var(--color-wynn-text-muted)]'
        }`}>
          {def.rarity}
        </span>
        {def.maxCount > 0 && (
          <span className="text-[9px] text-[var(--color-wynn-text-muted)]">
            (max {def.maxCount})
          </span>
        )}
      </div>
    </button>
  );
}
