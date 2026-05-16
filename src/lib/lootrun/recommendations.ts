import {
  MissionName, TrialName, LootrunState,
  MissionRecommendation, TrialRecommendation, BoonAdvice,
} from './types';
import { COMBO_STRATEGIES, detectCombos, detectComboPotentials, getActiveComboStrategy } from './combos';

export function recommendMissions(
  state: LootrunState,
  availableMissions: MissionName[],
): MissionRecommendation[] {
  const names = new Set(state.missions.map(m => m.name));
  const remaining = availableMissions.filter(m => !names.has(m));
  const potentials = detectComboPotentials(state.missions);
  const activeStrategy = getActiveComboStrategy(state.missions);
  const detectedCombos = detectCombos(state.missions);
  const hasActiveCombo = detectedCombos.length > 0 && detectedCombos[0] !== 'comboless';
  const slotsLeft = 4 - state.missions.length;

  if (slotsLeft === 0 || remaining.length === 0) return [];

  const recs: MissionRecommendation[] = [];

  const incompletePotential = potentials.find(p => !p.isComplete && p.missingMissions.length <= slotsLeft);
  if (incompletePotential && incompletePotential.missingMissions.length > 0) {
    const strategy = COMBO_STRATEGIES[incompletePotential.combo];
    for (const mission of incompletePotential.missingMissions) {
      if (remaining.includes(mission)) {
        recs.push({
          mission,
          reason: `Required for ${strategy.label} combo: ${strategy.description.split('.')[0]}.`,
          priority: 'critical',
          enablesCombo: incompletePotential.combo,
        });
      }
    }
  }

  if (hasActiveCombo && activeStrategy.recommendedMissions.length > 0) {
    for (const mission of activeStrategy.recommendedMissions) {
      if (remaining.includes(mission) && !recs.some(r => r.mission === mission)) {
        recs.push({
          mission,
          reason: `Highly recommended for ${activeStrategy.label} strategy.`,
          priority: 'high',
          enablesCombo: activeStrategy.name,
        });
      }
    }
  }

  if (hasActiveCombo && activeStrategy.sideMissions.length > 0) {
    for (const mission of activeStrategy.sideMissions) {
      if (remaining.includes(mission) && !recs.some(r => r.mission === mission)) {
        recs.push({
          mission,
          reason: `Good side pick for ${activeStrategy.label}.`,
          priority: 'medium',
          enablesCombo: activeStrategy.name,
        });
      }
    }
  }

  const universalPicks: MissionName[] = ['redemption', 'high_roller', 'radiant_hunter', 'inner_peace'];
  for (const mission of universalPicks) {
    if (remaining.includes(mission) && !recs.some(r => r.mission === mission)) {
      recs.push({
        mission,
        reason: 'Strong universal pick — provides rerolls/sacrifices/survival for any strategy.',
        priority: 'medium',
        enablesCombo: null,
      });
    }
  }

  const survivalPicks: MissionName[] = ['requiem', 'stasis', 'cleansing_greed'];
  const totalCurses = Object.values(state.curses).reduce((s, v) => s + v, 0);
  if (totalCurses > 10) {
    for (const mission of survivalPicks) {
      if (remaining.includes(mission) && !recs.some(r => r.mission === mission)) {
        recs.push({
          mission,
          reason: `You have ${totalCurses} total curses — survival missions help you stay alive.`,
          priority: 'medium',
          enablesCombo: null,
        });
      }
    }
  }

  for (const mission of remaining) {
    if (!recs.some(r => r.mission === mission)) {
      recs.push({
        mission,
        reason: 'Available but not a priority for your current strategy.',
        priority: 'low',
        enablesCombo: null,
      });
    }
  }

  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export function recommendTrials(state: LootrunState): TrialRecommendation[] {
  const recs: TrialRecommendation[] = [];
  const activeTrials = state.trials.filter(t => !t.completed).length;
  const activeStrategy = getActiveComboStrategy(state.missions);
  const detectedCombos = detectCombos(state.missions);
  const hasActiveCombo = detectedCombos.length > 0 && detectedCombos[0] !== 'comboless';
  const totalCurses = Object.values(state.curses).reduce((s, v) => s + v, 0);
  const boonCount = state.boons.length;

  if (activeTrials >= 2) return [];

  const slot: 1 | 2 = state.trials.length === 0 ? 1 : 2;

  if (slot === 1) {
    if (hasActiveCombo) {
      if (activeStrategy.preferredTrials.includes('chronotrigger')) {
        recs.push({
          trial: 'chronotrigger',
          reason: 'Chronotrigger doubles your pull output with green beacon synergy. Best for your combo.',
          priority: 'critical',
          slot: 1,
        });
      }
    }

    if (totalCurses < 6) {
      recs.push({
        trial: 'ultimate_sacrifice',
        reason: 'Easy 10-challenge completion. Best as first trial when mobs aren\'t dangerous yet.',
        priority: 'high',
        slot: 1,
      });
    }

    recs.push({
      trial: 'hubris',
      reason: 'Easy completion with good rewards (+1 reroll, +1 sacrifice). Safe first trial.',
      priority: 'high',
      slot: 1,
    });

    if (boonCount === 0) {
      recs.push({
        trial: 'warmth_devourer',
        reason: 'Fast completion with no boons to lose. +1 reroll, +1 sacrifice.',
        priority: 'medium',
        slot: 1,
      });
    }
  }

  if (slot === 2 || state.challengeNumber >= 30) {
    if (!hasActiveCombo) {
      recs.push({
        trial: 'gambling_beast',
        reason: 'No good combo detected — take Gambling Beast to kill the run with maximum rerolls. Stack green beacons first.',
        priority: 'critical',
        slot: 2,
      });
    }

    if (activeStrategy.secondTrialPreference.includes('gambling_beast') && state.sacrifices >= 2) {
      recs.push({
        trial: 'gambling_beast',
        reason: 'Take as 2nd trial. Stack V.Aqua→V.Green before and after for 6-15 rerolls.',
        priority: 'high',
        slot: 2,
      });
    }

    if (activeStrategy.secondTrialPreference.includes('all_in') && state.sacrifices >= 3) {
      recs.push({
        trial: 'all_in',
        reason: `Convert your ${state.sacrifices} sacrifices into ${state.sacrifices * 3} rerolls. Note: you lose ALL sacrifices.`,
        priority: 'high',
        slot: 2,
      });
    }

    if (state.rerolls >= 2) {
      recs.push({
        trial: 'side_hustle',
        reason: 'Open 30 chests with your rerolls for +2 additional rerolls. Fast completion.',
        priority: 'medium',
        slot: 2,
      });
    }

    if (state.rawPulls >= 15) {
      recs.push({
        trial: 'adrenaline_junkie',
        reason: `You have ${state.rawPulls} pulls — reach 25 quickly for +2 rerolls. Minimize interlude time.`,
        priority: 'medium',
        slot: 2,
      });
    }
  }

  const tierFallbacks: TrialName[] = ['hubris', 'ultimate_sacrifice', 'warmth_devourer'];
  for (const trial of tierFallbacks) {
    if (!recs.some(r => r.trial === trial)) {
      recs.push({
        trial,
        reason: 'Reliable trial with straightforward completion.',
        priority: 'low',
        slot,
      });
    }
  }

  const avoidTrials: { trial: TrialName; reason: string }[] = [
    { trial: 'monochromokopia', reason: 'Obscured beacons are disruptive. Only as last resort.' },
    { trial: 'treasury_bill', reason: 'Pull drain penalty. Only worthwhile with very high pull count.' },
    { trial: 'lights_out', reason: 'Radiant curse accumulation is dangerous. Not worth the trial slot.' },
  ];
  for (const { trial, reason } of avoidTrials) {
    if (!recs.some(r => r.trial === trial)) {
      recs.push({
        trial,
        reason: `⚠ ${reason}`,
        priority: 'low',
        slot,
      });
    }
  }

  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const unique = new Map<string, TrialRecommendation>();
  for (const rec of recs) {
    const key = `${rec.trial}-${rec.slot}`;
    if (!unique.has(key)) unique.set(key, rec);
  }

  return Array.from(unique.values()).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export function recommendBoonStrategy(state: LootrunState): BoonAdvice {
  const detectedCombos = detectCombos(state.missions);
  const hasOpal = detectedCombos.includes('opal_offering');
  const totalCurses = Object.values(state.curses).reduce((s, v) => s + v, 0);
  const boonCount = state.boons.length;

  const isDowntime = state.missions.length >= 4
    && state.trials.filter(t => !t.completed).length <= 1
    && state.challengeNumber > 30;

  let shouldTakeBlue = false;
  let reason = '';
  let targetPotency = 100;
  const recommendedCurseCount = 6;

  if (hasOpal && boonCount < 5 && totalCurses >= 3) {
    shouldTakeBlue = true;
    reason = 'Opal Offering: Build boons with V.Aqua→V.Blue (600% potency), then convert to pulls with V.Purple.';
    targetPotency = 600;
  } else if (boonCount < 3 && isDowntime) {
    shouldTakeBlue = true;
    reason = 'Take advantage of downtime to stock up on boons. V.Aqua→V.Blue for high potency.';
    targetPotency = 200;
  } else if (totalCurses > 8 && boonCount < 4) {
    shouldTakeBlue = true;
    reason = 'High curses make Madman boons very potent. Get boons at 600% with V.Aqua→V.Blue.';
    targetPotency = 600;
  } else if (boonCount === 0 && state.challengeNumber > 20) {
    shouldTakeBlue = true;
    reason = 'You have no boons — take V.Blue during openings to build up survivability.';
    targetPotency = 100;
  } else {
    reason = 'Boon sustain is adequate. Save blue beacons for later when you have downtime.';
  }

  return { shouldTakeBlue, reason, targetPotency, currentBoonCount: boonCount, recommendedCurseCount };
}
