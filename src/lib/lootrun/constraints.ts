import { BeaconColor, LootrunState } from './types';

export function getBeaconConstraints(state: LootrunState): Record<BeaconColor, { available: boolean; reason: string }> {
  const constraints: Record<BeaconColor, { available: boolean; reason: string }> = {
    rainbow: { available: true, reason: '' },
    orange: { available: true, reason: '' },
    aqua: { available: true, reason: '' },
    blue: { available: true, reason: '' },
    purple: { available: true, reason: '' },
    yellow: { available: true, reason: '' },
    green: { available: true, reason: '' },
    white: { available: true, reason: '' },
    red: { available: true, reason: '' },
    pink: { available: true, reason: '' },
    gray: { available: true, reason: '' },
    darkGray: { available: true, reason: '' },
    crimson: { available: true, reason: '' },
  };

  const lastEffect = state.activeEffects.length > 0
    ? state.activeEffects[state.activeEffects.length - 1]
    : null;
  const lastBeaconColor = lastEffect?.color;

  if (lastBeaconColor === 'aqua') {
    constraints.aqua = { available: false, reason: 'Aqua cannot be offered two challenges in a row' };
  }

  if (lastBeaconColor === 'green') {
    constraints.green = { available: false, reason: 'Green cannot be offered two challenges in a row' };
  }

  if (lastBeaconColor === 'red') {
    constraints.red = { available: false, reason: 'Red cannot be offered two challenges in a row' };
  }

  const rainbowChallenges = state.activeEffects
    .filter(e => e.color === 'rainbow')
    .reduce((sum, e) => sum + e.challenges, 0);
  const totalRainbowUsed = (state.beaconsUsed.rainbow ?? 0);
  if (rainbowChallenges <= 0 && totalRainbowUsed >= 10) {
    const approxTotal = totalRainbowUsed * 15;
    if (approxTotal >= 100) {
      constraints.rainbow = { available: false, reason: 'Rainbow stops being offered after 100+ rainbow challenges' };
    }
  }

  const whiteUsed = state.beaconsUsed.white ?? 0;
  if (whiteUsed >= 1) {
    constraints.white = { available: false, reason: 'White beacon can only be taken once (max count: 1)' };
  }

  const darkGrayUsed = state.beaconsUsed.darkGray ?? 0;
  if (darkGrayUsed >= 1) {
    constraints.darkGray = { available: false, reason: 'Dark Gray beacon can only be taken once (max count: 1)' };
  }

  const grayUsed = state.beaconsUsed.gray ?? 0;
  if (grayUsed >= 3) {
    constraints.gray = { available: false, reason: 'Gray beacon can only be taken 3 times (max count: 3)' };
  }

  const crimsonUsed = state.beaconsUsed.crimson ?? 0;
  if (crimsonUsed >= 2) {
    constraints.crimson = { available: false, reason: 'Crimson beacon can only be taken 2 times (max count: 2)' };
  }

  const hasIncompleteMission = state.missions.some(m => !m.completed);
  if (state.challengeNumber < 5) {
    constraints.gray = { available: false, reason: 'Gray beacons cannot appear before completing challenge 4' };
  } else if (hasIncompleteMission) {
    constraints.gray = { available: false, reason: 'Gray beacons cannot appear while a mission is incomplete' };
  }

  if (state.grayBeaconsSkipped >= 7) {
    constraints.gray = {
      ...constraints.gray,
      available: false,
      reason: constraints.gray.reason || 'Gray beacons stop appearing after being skipped ~6-8 times',
    };
  }
  if (state.challengeNumber >= 42 && grayUsed < 3) {
    constraints.gray = {
      ...constraints.gray,
      available: false,
      reason: constraints.gray.reason || 'Gray beacons typically stop appearing around challenge 40-45',
    };
  }

  if (state.challengeNumber < 20) {
    constraints.crimson = { available: false, reason: 'Crimson beacons cannot appear before challenge 20' };
  }

  if (state.crimsonBeaconsSkipped >= 7) {
    constraints.crimson = {
      ...constraints.crimson,
      available: false,
      reason: constraints.crimson.reason || 'Crimson beacons stop appearing after being skipped ~6-8 times',
    };
  }
  if (state.challengeNumber >= 67 && crimsonUsed < 2) {
    constraints.crimson = {
      ...constraints.crimson,
      available: false,
      reason: constraints.crimson.reason || 'Crimson beacons typically stop appearing around challenge 65-70',
    };
  }

  return constraints;
}

export function getAvailableBeacons(state: LootrunState): BeaconColor[] {
  const constraints = getBeaconConstraints(state);
  return (Object.keys(constraints) as BeaconColor[]).filter(c => constraints[c].available);
}
