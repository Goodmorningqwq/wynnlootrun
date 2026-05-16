import {
  LootrunState, BeaconColor, BeaconOffer, Recommendation,
  RunPhase, ScoringConfig, ComboName,
} from './types';
import { BEACON_DEFINITIONS } from './beacons';
import { getBeaconConstraints } from './constraints';
import { detectCombos, getComboModifierBeacons } from './combos';
import { detectSetupSubPhase } from './strategy';

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  phaseWeights: {
    setup: {
      rainbow: 100, orange: 90, aqua: 75, pink: 65, red: 50, blue: 20,
      green: 15, yellow: 10, purple: 10, white: 30, darkGray: 5, gray: 5, crimson: 0,
    },
    extension: {
      rainbow: 85, orange: 80, aqua: 80, white: 95, red: 70, pink: 55,
      green: 40, blue: 30, darkGray: 25, yellow: 15, purple: 15, gray: 35, crimson: 20,
    },
    mission_setup: {
      gray: 90, aqua: 85, rainbow: 75, orange: 70, pink: 55, red: 45,
      blue: 30, green: 35, white: 40, darkGray: 20, purple: 20, yellow: 15, crimson: 30,
    },
    trial_setup: {
      crimson: 95, aqua: 90, rainbow: 75, orange: 70, pink: 55,
      gray: 50, red: 45, green: 40, blue: 30, white: 35, darkGray: 25, purple: 20, yellow: 15,
    },
    pull_farming: {
      aqua: 80, darkGray: 75, purple: 70, green: 65, blue: 60, pink: 50,
      rainbow: 55, orange: 55, yellow: 45, red: 40, white: 30, gray: 10, crimson: 10,
    },
    ending: {
      green: 90, red: 70, aqua: 60, darkGray: 55, purple: 50, pink: 45,
      rainbow: 40, orange: 35, blue: 25, yellow: 20, white: 15, gray: 5, crimson: 5,
    },
  },
  lowTimeBoost: { green: 40 },
  aquaStackBonus: 15,
  vibrantBonus: 10,
  missionSynergyBonus: 20,
  comboDetectionEnabled: true,
};

export function detectPhase(state: LootrunState): RunPhase {
  const { challengeNumber, totalChallenges, missions, trials, activeEffects } = state;

  const hasRainbow = activeEffects.some(e => e.color === 'rainbow' && e.challenges > 0);
  const orangeChallenges = activeEffects
    .filter(e => e.color === 'orange' && e.challenges > 0)
    .reduce((sum, e) => sum + e.challenges, 0);
  const hasWhite = (state.beaconsUsed.white ?? 0) >= 1;
  const missionsComplete = missions.length;
  const trialsActive = trials.filter(t => !t.completed).length;
  const challengesLeft = totalChallenges - challengeNumber;

  if (!hasRainbow || orangeChallenges < 10) {
    return 'setup';
  }
  if (challengeNumber < 20 && (!hasWhite || totalChallenges < 25)) {
    return 'extension';
  }
  if (missionsComplete < 4 && challengeNumber < 40) {
    return 'mission_setup';
  }
  if (trialsActive < 2 && challengeNumber >= 20 && challengeNumber < 65) {
    return 'trial_setup';
  }
  if (challengesLeft <= 5 || state.timerSeconds < 120) {
    return 'ending';
  }
  if (challengeNumber >= 40 && totalChallenges >= 30) {
    return 'pull_farming';
  }
  return 'pull_farming';
}

function applyComboModifiers(
  scores: Record<BeaconColor, number>,
  combo: string | null,
  state: LootrunState,
): Record<BeaconColor, number> {
  const modified = { ...scores };
  if (!combo) return modified;

  const { boost, avoid } = getComboModifierBeacons(combo as ComboName);

  for (const color of boost) {
    if (modified[color] !== undefined) {
      switch (combo) {
        case 'opal_offering':
          if (color === 'blue') modified[color] += 30;
          if (color === 'purple') modified[color] += 25;
          if (state.curses.damage + state.curses.health < 6 && color === 'purple') modified[color] += 10;
          break;
        case 'jesters_scheme':
          if (color === 'yellow') modified[color] += 35;
          if (color === 'aqua') modified[color] += 10;
          break;
        case 'radiant_hunter':
          if (color === 'purple') modified[color] += 15;
          break;
        case 'chronotrigger':
          if (color === 'green') modified[color] += 40;
          if (color === 'purple') modified[color] += 20;
          break;
        case 'gambling_beast':
          if (color === 'green') modified[color] += 45;
          if (color === 'pink') modified[color] += 15;
          break;
        case 'dying_light_all_in':
          if (color === 'rainbow') modified[color] += 35;
          if (color === 'blue') modified[color] += 20;
          break;
        case 'comboless':
          if (color === 'purple') modified[color] += 25;
          if (color === 'darkGray') modified[color] += 20;
          break;
      }
    }
  }

  for (const color of avoid) {
    if (modified[color] !== undefined) {
      modified[color] = Math.max(0, modified[color] - 20);
    }
  }

  return modified;
}

function isBeaconAvailable(color: BeaconColor, state: LootrunState): boolean {
  const def = BEACON_DEFINITIONS[color];
  if (def.maxCount === -1) return true;
  const used = state.beaconsUsed[color] ?? 0;
  return used < def.maxCount;
}

function getPhaseSpecificAdjustments(color: BeaconColor, state: LootrunState, phase: RunPhase): number {
  let adj = 0;

  const subPhase = phase === 'setup' ? detectSetupSubPhase(state) : null;
  const hasRainbow = state.activeEffects.some(e => e.color === 'rainbow' && e.challenges > 0);
  const orangeChallenges = state.activeEffects
    .filter(e => e.color === 'orange' && e.challenges > 0)
    .reduce((sum, e) => sum + e.challenges, 0);
  const challengesLeft = state.totalChallenges - state.challengeNumber;

  if (phase === 'setup') {
    if (subPhase === 'rainbow_hunt') {
      if (!hasRainbow && color === 'rainbow') adj += 25;
      if (color === 'pink') adj += 15;
    } else if (subPhase === 'orange_stacking') {
      if (orangeChallenges < 20 && color === 'orange') adj += 15;
    }
    if (color === 'aqua') adj += 5;
    if (color === 'blue' && hasRainbow) adj += 5;
  }

  if (phase === 'extension') {
    if (color === 'white' && (state.beaconsUsed.white ?? 0) === 0) adj += 20;
    if (color === 'red') {
      if (challengesLeft <= 3) adj += 30;
      else adj += 10;
    }
  }

  if (phase === 'mission_setup') {
    if (color === 'gray' && (state.beaconsUsed.gray ?? 0) < 3) adj += 15;
  }

  if (phase === 'trial_setup') {
    if (color === 'crimson' && (state.beaconsUsed.crimson ?? 0) < 2) adj += 15;
  }

  if (phase === 'pull_farming') {
    const hasNoCombo = detectCombos(state.missions)[0] === 'comboless';
    if (hasNoCombo && (color === 'purple' || color === 'darkGray')) adj += 10;
  }

  if (phase === 'ending') {
    if (color === 'green') adj += 20;
  }

  return adj;
}

function generateReason(
  color: BeaconColor, score: number, phase: RunPhase, combo: string | null,
  state: LootrunState, isVibrant: boolean,
): string {
  const beacon = BEACON_DEFINITIONS[color];
  const phaseNames: Record<RunPhase, string> = {
    setup: 'Run Setup',
    extension: 'Run Extension',
    mission_setup: 'Mission Setup',
    trial_setup: 'Trial Setup',
    pull_farming: 'Pull Farming',
    ending: 'Run Ending',
  };

  const reasons: string[] = [];
  reasons.push(`${phaseNames[phase]} phase — ${beacon.label} is a priority.`);

  if (isVibrant) reasons.push('Vibrant variant increases value significantly.');

  const challengesLeft = state.totalChallenges - state.challengeNumber;

  switch (phase) {
    case 'setup':
      if (color === 'rainbow') reasons.push('Rainbow is your #1 priority — it makes all beacons vibrant.');
      if (color === 'orange') reasons.push('More beacon choices = better options every challenge.');
      if (color === 'aqua') reasons.push('Aqua enables stacking key beacons for 2x-6x effect.');
      if (color === 'pink') reasons.push('Rerolls help force Rainbow/Orange to appear.');
      if (color === 'blue') reasons.push('Good downtime pick — build boons for survivability.');
      break;
    case 'extension':
      if (color === 'white') reasons.push('V.Aqua→V.White gives +30 challenges — the best extension.');
      if (color === 'red') {
        if (challengesLeft <= 3) reasons.push('Nearing last challenge — Red urgently extends your run.');
        else reasons.push('V.Aqua→V.Red gives +15 challenges if you can\'t find white.');
      }
      if (color === 'rainbow') reasons.push('Refresh rainbow duration to keep beacons vibrant.');
      if (color === 'orange') reasons.push('Keep beacon choices high for better options.');
      break;
    case 'mission_setup':
      if (color === 'gray') reasons.push('V.Aqua→V.Gray gives 5 mission choices instead of 3.');
      if (color === 'aqua') reasons.push('Aqua stack gray for maximum mission options.');
      break;
    case 'trial_setup':
      if (color === 'crimson') reasons.push('V.Aqua→V.Crimson gives 4 trial choices instead of 2.');
      if (color === 'aqua') reasons.push('Aqua stack crimson for maximum trial options.');
      break;
    case 'pull_farming':
      if (combo === 'opal_offering' && color === 'blue') reasons.push('Stack boons at 600% potency for Opal Offering.');
      if (combo === 'opal_offering' && color === 'purple') reasons.push('Convert stacked boons to massive pulls.');
      if (combo === 'jesters_scheme' && color === 'yellow') reasons.push('Spawn flying chests for Jester\'s Scheme.');
      if (combo === 'chronotrigger' && color === 'green') reasons.push('Green cleanses 15% curses and boosts pulls by 3.5%.');
      if (combo === 'chronotrigger' && color === 'purple') reasons.push('Build pulls while Chronotrigger amplifies them.');
      if (combo === 'gambling_beast' && color === 'green') reasons.push('Each green beacon = 1+ reroll from Gambling Beast.');
      if (combo === 'dying_light_all_in' && color === 'rainbow') reasons.push('Rainbow gives +1 Sacrifice for Dying Light.');
      if (combo === 'comboless' && color === 'purple') reasons.push('Purple beacons are your main pull source.');
      if (combo === 'comboless' && color === 'darkGray') reasons.push('Dark Gray gives 3x pulls — good for comboless runs.');
      break;
    case 'ending':
      if (color === 'green') reasons.push('Low time — green beacons add crucial seconds.');
      break;
  }

  if (combo === 'opal_offering' && (color === 'blue' || color === 'purple')) {
    reasons.push('Opal Offering strategy: build boons → convert to pulls.');
  }

  if (state.aquaStackPending) {
    reasons.push('Aqua Stack active — this beacon will have enhanced effect.');
  }

  return reasons.join(' ');
}

export function scoreBeacons(
  state: LootrunState,
  offers: BeaconOffer[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): Recommendation[] {
  const phase = detectPhase(state);
  const combos = detectCombos(state.missions);
  const combo = config.comboDetectionEnabled ? combos[0] : null;
  const constraints = getBeaconConstraints(state);

  const phaseWeights = config.phaseWeights[phase] || config.phaseWeights.pull_farming;

  let scores: Record<BeaconColor, number> = {} as Record<BeaconColor, number>;

  for (const offer of offers) {
    if (!offer.isSelected) continue;

    let score = phaseWeights[offer.color] || 0;

    if (offer.isVibrant) {
      score += config.vibrantBonus;
    }

    if (state.isLowTime && config.lowTimeBoost[offer.color]) {
      score += config.lowTimeBoost[offer.color];
    }

    if (!isBeaconAvailable(offer.color, state)) {
      score = 0;
    }

    if (!constraints[offer.color].available) {
      score = 0;
    }

    score += getPhaseSpecificAdjustments(offer.color, state, phase);

    if (state.aquaStackPending && offer.color !== 'aqua') {
      const aquaStackTargets: BeaconColor[] = [
        'rainbow', 'orange', 'white', 'red', 'green', 'purple',
        'darkGray', 'gray', 'crimson', 'yellow', 'blue',
      ];
      if (aquaStackTargets.includes(offer.color)) {
        score += 20;
      }
    }

    scores[offer.color] = score;
  }

  if (combo) {
    scores = applyComboModifiers(scores, combo, state);
  }

  if (scores.aqua !== undefined && offers.some(o => o.isSelected && o.color !== 'aqua')) {
    const bestOtherScore = Math.max(
      ...Object.entries(scores)
        .filter(([k]) => k !== 'aqua')
        .map(([, v]) => v),
    );
    scores.aqua = Math.max(scores.aqua, bestOtherScore * 0.5 + config.aquaStackBonus);
  }

  const recommendations: Recommendation[] = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([color, score], index) => {
      const beaconColor = color as BeaconColor;
      const offer = offers.find(o => o.color === beaconColor)!;
      return {
        beaconColor,
        score: Math.min(100, Math.round(score)),
        reason: generateReason(beaconColor, score, phase, combo, state, offer.isVibrant),
        willBeAquaStacked: state.aquaStackPending,
        shouldTakeVibrant: offer.isVibrant,
        priority: index + 1,
      };
    });

  return recommendations;
}

export function applyBeaconEffect(
  state: LootrunState,
  color: BeaconColor,
  isVibrant: boolean,
): LootrunState {
  const isAquaStacked = state.aquaStackPending;

  const existingEffects = state.activeEffects
    .map(e => ({ ...e, challenges: e.challenges - 1 }))
    .filter(e => e.challenges > 0);

  const newState = {
    ...state,
    beaconsUsed: { ...state.beaconsUsed },
    activeEffects: existingEffects,
    curses: { ...state.curses },
    aquaStackPending: color === 'aqua',
  };

  newState.beaconsUsed[color] = (newState.beaconsUsed[color] ?? 0) + 1;

  let pullsAdded = 0;
  let cursesAdded = 0;
  let timeAdded = 0;

  switch (color) {
    case 'rainbow': {
      const challenges = isAquaStacked ? 60 : isVibrant ? 20 : 10;
      newState.activeEffects.push({ color: 'rainbow', challenges, isVibrant: true, isAquaStacked });
      break;
    }
    case 'orange': {
      const beaconChoicesAdded = isAquaStacked ? 30 : isVibrant ? 10 : 5;
      newState.activeEffects.push({ color: 'orange', challenges: beaconChoicesAdded, isVibrant, isAquaStacked });
      break;
    }
    case 'aqua': {
      newState.activeEffects.push({ color: 'aqua', challenges: 1, isVibrant, isAquaStacked });
      break;
    }
    case 'white': {
      const challengesAdded = isAquaStacked ? 30 : isVibrant ? 10 : 5;
      newState.totalChallenges += challengesAdded;
      timeAdded += challengesAdded * 60;
      newState.activeEffects.push({ color: 'white', challenges: challengesAdded, isVibrant, isAquaStacked });
      break;
    }
    case 'red': {
      const challengesAdded = isAquaStacked ? 15 : isVibrant ? 5 : 3;
      newState.totalChallenges += challengesAdded;
      newState.activeEffects.push({ color: 'red', challenges: challengesAdded, isVibrant, isAquaStacked });
      break;
    }
    case 'green': {
      timeAdded = isAquaStacked ? 720 : isVibrant ? 240 : 120;
      newState.activeEffects.push({
        color: 'green',
        challenges: isAquaStacked ? 3 : isVibrant ? 2 : 1,
        isVibrant,
        isAquaStacked,
      });
      break;
    }
    case 'purple': {
      const count = isAquaStacked ? 6 : isVibrant ? 2 : 1;
      pullsAdded = count;
      cursesAdded = count;
      break;
    }
    case 'darkGray': {
      const count = isAquaStacked ? 18 : isVibrant ? 6 : 3;
      pullsAdded = count;
      cursesAdded = count;
      break;
    }
    case 'yellow': {
      newState.activeEffects.push({ color: 'yellow', challenges: 1, isVibrant, isAquaStacked });
      break;
    }
    case 'blue': {
      newState.activeEffects.push({ color: 'blue', challenges: 1, isVibrant, isAquaStacked });
      break;
    }
    case 'pink': {
      const rerolls = isAquaStacked ? 6 : isVibrant ? 2 : 1;
      newState.rerolls += rerolls;
      break;
    }
    case 'gray': {
      const choices = isAquaStacked ? 5 : isVibrant ? 4 : 3;
      newState.grayMissionChoices = choices;
      newState.activeEffects.push({ color: 'gray', challenges: 1, isVibrant, isAquaStacked });
      break;
    }
    case 'crimson': {
      newState.activeEffects.push({ color: 'crimson', challenges: 1, isVibrant, isAquaStacked });
      break;
    }
  }

  newState.rawPulls += pullsAdded + 1;

  if (cursesAdded > 0) {
    newState.curses.damage += Math.ceil(cursesAdded / 3);
    newState.curses.health += Math.ceil(cursesAdded / 3);
    newState.curses.attackSpeed += Math.floor(cursesAdded / 3);
  }

  if (timeAdded > 0) {
    newState.timerSeconds = Math.min(900, newState.timerSeconds + timeAdded);
  }

  newState.challengeNumber += 1;

  if (newState.challengeNumber >= 5 && newState.missions.length === 0 && !newState.freeMissionAvailable) {
    newState.freeMissionAvailable = true;
  }

  const isOnRedBeacon = newState.activeEffects.some(e => e.color === 'red' && e.challenges > 0);
  if (!isOnRedBeacon) {
    newState.timerSeconds = Math.min(900, newState.timerSeconds + 150);
  }

  newState.phase = detectPhase(newState);

  return newState;
}

export function calculateEffectivePulls(state: LootrunState): { raw: number; effective: number; sacrificePercent: number } {
  const raw = state.rawPulls;
  const sacrificePercent = state.sacrifices > 0
    ? (1 - 1 / (state.sacrifices + 1)) * 100
    : 0;
  const effective = Math.round(raw * (1 + sacrificePercent / 100));
  return { raw, effective, sacrificePercent };
}

export function createInitialState(): LootrunState {
  return {
    challengeNumber: 1,
    totalChallenges: 12,
    timerSeconds: 300,
    isLowTime: false,
    rawPulls: 0,
    sacrifices: 0,
    rerolls: 2,
    activeEffects: [],
    beaconChoices: 3,
    beaconsUsed: {},
    aquaStackPending: false,
    grayBeaconsSkipped: 0,
    crimsonBeaconsSkipped: 0,
    missions: [],
    freeMissionAvailable: false,
    grayMissionChoices: 0,
    trials: [],
    boons: [],
    curses: { damage: 0, health: 0, attackSpeed: 0, walkSpeed: 0, damageResist: 0, radiantPower: 0, radiantChance: 0 },
    phase: 'setup',
  };
}
