import { LootrunState, StrategyTip, SetupSubPhase, BeaconColor } from './types';
import { detectCombos } from './combos';
import { getBeaconConstraints } from './constraints';

export function detectSetupSubPhase(state: LootrunState): SetupSubPhase {
  const hasRainbow = state.activeEffects.some(e => e.color === 'rainbow' && e.challenges > 0);
  const orangeChallenges = state.activeEffects
    .filter(e => e.color === 'orange' && e.challenges > 0)
    .reduce((sum, e) => sum + e.challenges, 0);

  if (!hasRainbow) return 'rainbow_hunt';
  if (orangeChallenges < 20) return 'orange_stacking';
  return 'extension_prep';
}

export function getStrategyAdvice(state: LootrunState): StrategyTip[] {
  const tips: StrategyTip[] = [];
  const subPhase = detectSetupSubPhase(state);
  const combos = detectCombos(state.missions);
  const hasActiveCombo = combos.length > 0 && combos[0] !== 'comboless';
  const constraints = getBeaconConstraints(state);
  const totalCurses = Object.values(state.curses).reduce((s, v) => s + v, 0);
  const challengesLeft = state.totalChallenges - state.challengeNumber;

  if (state.phase === 'setup') {
    if (subPhase === 'rainbow_hunt') {
      tips.push({
        text: 'Priority: Rainbow > Orange > Aqua >= Pink > Red > Blue. Take rainbow immediately if offered.',
        severity: 'critical',
        category: 'setup',
      });
      if (state.beaconChoices >= 4 && state.rerolls > 0) {
        tips.push({
          text: `You have ${state.rerolls} rerolls — use them at 4-5 beacon choices to force Rainbow or Orange.`,
          severity: 'info',
          category: 'reroll',
        });
      }
    } else if (subPhase === 'orange_stacking') {
      tips.push({
        text: 'Rainbow active! Focus on stacking Orange beacons. V.Aqua → V.Orange for +30 choices is extremely effective.',
        severity: 'critical',
        category: 'setup',
      });
    } else {
      tips.push({
        text: 'Good setup! Prepare V.Aqua → V.White for +30 challenges or V.Aqua → V.Red for +15 challenges.',
        severity: 'info',
        category: 'extension',
      });
    }
  }

  if (state.phase === 'extension') {
    const hasWhite = constraints.white.available;
    const whiteUsed = state.beaconsUsed.white ?? 0;

    if (hasWhite && whiteUsed === 0) {
      tips.push({
        text: 'Save your White beacon for when you can aqua stack it. V.Aqua → V.White = +30 challenges with time.',
        severity: 'critical',
        category: 'extension',
      });
    } else if (whiteUsed === 0) {
      tips.push({
        text: 'V.Aqua → V.Red = +15 challenges (easier). Avoid taking Red more than once or you\'ll need green beacons.',
        severity: 'info',
        category: 'extension',
      });
    }

    const orangeChallenges = state.activeEffects
      .filter(e => e.color === 'orange' && e.challenges > 0)
      .reduce((sum, e) => sum + e.challenges, 0);
    if (orangeChallenges < 15) {
      tips.push({
        text: 'Refresh your Orange beacons when possible. +30 oranges are EXTREMELY effective. Keep 4-5 beacon choices.',
        severity: 'warning',
        category: 'beacon',
      });
    }

    const rainbowChallenges = state.activeEffects
      .filter(e => e.color === 'rainbow' && e.challenges > 0)
      .reduce((sum, e) => sum + e.challenges, 0);
    if (rainbowChallenges < 10) {
      tips.push({
        text: 'Rainbow is running low! Refresh with V.Aqua → V.Rainbow for +60 challenges when possible.',
        severity: 'warning',
        category: 'beacon',
      });
    }
  }

  if (state.phase === 'mission_setup') {
    const grayUsed = state.beaconsUsed.gray ?? 0;
    const hasIncompleteMission = state.missions.some(m => !m.progress || m.progress === '');
    const orangeChallenges = state.activeEffects
      .filter(e => e.color === 'orange' && e.challenges > 0)
      .reduce((sum, e) => sum + e.challenges, 0);

    if (hasIncompleteMission && orangeChallenges < 15) {
      tips.push({
        text: 'Don\'t rush to complete your mission. Prioritize run setup (orange/rainbow) first. Gray beacons can be skipped 6-8 times.',
        severity: 'critical',
        category: 'mission',
      });
    }

    if (grayUsed === 0 && state.challengeNumber >= 5) {
      tips.push({
        text: 'Stack V.Aqua → V.Gray for 5 mission choices instead of 3. Better selection = better combo potential.',
        severity: 'info',
        category: 'mission',
      });
    }

    if (state.challengeNumber >= 35 && grayUsed < 3) {
      tips.push({
        text: `You've only used ${grayUsed}/3 gray beacons and you're at challenge ${state.challengeNumber}. Gray beacons stop appearing around challenge 40-45.`,
        severity: 'warning',
        category: 'mission',
      });
    }
  }

  if (state.phase === 'trial_setup') {
    if (state.challengeNumber >= 17 && state.challengeNumber <= 19) {
      tips.push({
        text: 'Prepare an aqua beacon at challenge 19! Aqua-stacked crimson beacons are a near must for good trial selection.',
        severity: 'critical',
        category: 'trial',
      });
    }

    const crimsonUsed = state.beaconsUsed.crimson ?? 0;
    if (crimsonUsed === 0 && state.challengeNumber >= 25) {
      tips.push({
        text: 'Crimson beacons are volatile — they can vanish quickly if skipped on low beacon choices. Take them ASAP.',
        severity: 'warning',
        category: 'trial',
      });
    }

    if (state.challengeNumber >= 55 && crimsonUsed < 2) {
      tips.push({
        text: `You've only used ${crimsonUsed}/2 crimson beacons and you're at challenge ${state.challengeNumber}. Crimson beacons stop appearing around challenge 65-70.`,
        severity: 'warning',
        category: 'trial',
      });
    }
  }

  if (state.phase === 'pull_farming') {
    if (hasActiveCombo) {
      const comboName = combos[0];

      switch (comboName) {
        case 'opal_offering':
          tips.push({
            text: 'Opal Offering: Build boons with V.Aqua → V.Blue (600% potency), then convert with V.Aqua → V.Purple.',
            severity: 'critical',
            category: 'combo',
          });
          if (totalCurses < 6) {
            tips.push({
              text: `You need 6+ curses for optimal Opal Offering. You have ${totalCurses} total. Take Purple/Dark Gray to build curses.`,
              severity: 'info',
              category: 'combo',
            });
          }
          break;
        case 'jesters_scheme':
          tips.push({
            text: 'Jester\'s Scheme: Cycle V.Aqua → V.Yellow for massive flying chests. Jester\'s Trick provides pulls, boons, and time.',
            severity: 'critical',
            category: 'combo',
          });
          break;
        case 'radiant_hunter':
          tips.push({
            text: 'Radiant Hunter: Kill side mobs in challenges for +1 Pull per radiant mob (max +5/challenge). Keep radiant curses moderate.',
            severity: 'info',
            category: 'combo',
          });
          break;
        case 'chronotrigger':
          tips.push({
            text: 'Chronotrigger active: Alternate V.Purple and V.Green. Green cleanses 15% curses and gives +3.5% pulls.',
            severity: 'critical',
            category: 'combo',
          });
          break;
        case 'gambling_beast':
          tips.push({
            text: 'Gambling Beast: Stack V.Aqua → V.Green beacons for maximum rerolls. Should net 6-15 end reward rerolls.',
            severity: 'critical',
            category: 'combo',
          });
          break;
      }
    } else {
      tips.push({
        text: 'No good combo detected. Consider stacking curses and taking Gambling Beast as 2nd trial to kill the run for rerolls.',
        severity: 'warning',
        category: 'combo',
      });
      if (state.missions.some(m => m.name === 'porphyrophobia') && state.missions.some(m => m.name === 'inner_peace')) {
        tips.push({
          text: 'Porphyrophobia + Inner Peace combo: Purple beacons give 2x pulls with half-strength curses. 200+ pulls possible from a dead run.',
          severity: 'info',
          category: 'combo',
        });
      }
    }

    if (state.rerolls > 0) {
      const saveTargets = getSaveRerollTargets(state);
      if (saveTargets.length > 0) {
        tips.push({
          text: `Save your rerolls for aqua stacking: ${saveTargets.join(', ')}. Settle for V.Blue if your target doesn't appear.`,
          severity: 'info',
          category: 'reroll',
        });
      }
    }
  }

  if (state.phase === 'ending' || challengesLeft <= 3) {
    tips.push({
      text: 'Last challenge rules: Purple/Dark Gray pulls still work, but curses from them don\'t. No mission/trial completion.',
      severity: 'warning',
      category: 'ending',
    });

    if (state.sacrifices > 0) {
      const savedPct = ((1 - 1 / (state.sacrifices + 1)) * 100).toFixed(1);
      tips.push({
        text: `${state.sacrifices} sacrifice(s) will save ${savedPct}% of pulls for next run.`,
        severity: 'info',
        category: 'ending',
      });
    }
  }

  if (state.isLowTime) {
    if (constraints.green.available) {
      tips.push({
        text: 'LOW TIME! Green beacon is your top priority. V.Aqua → V.Green = +720s.',
        severity: 'critical',
        category: 'timer',
      });
    } else {
      tips.push({
        text: 'LOW TIME! Green beacon unavailable this turn. Consider V.Red for extension or end the run at camp NPC.',
        severity: 'critical',
        category: 'timer',
      });
    }
  }

  return tips;
}

function getSaveRerollTargets(state: LootrunState): BeaconColor[] {
  const targets: BeaconColor[] = [];
  const constraints = getBeaconConstraints(state);

  if (constraints.rainbow.available && !state.activeEffects.some(e => e.color === 'rainbow' && e.challenges > 5)) {
    targets.push('rainbow');
  }
  if (constraints.orange.available) {
    const orangeChallenges = state.activeEffects
      .filter(e => e.color === 'orange' && e.challenges > 0)
      .reduce((sum, e) => sum + e.challenges, 0);
    if (orangeChallenges < 20) targets.push('orange');
  }
  if (constraints.gray.available && (state.beaconsUsed.gray ?? 0) < 3) {
    targets.push('gray');
  }
  if (constraints.crimson.available && (state.beaconsUsed.crimson ?? 0) < 2) {
    targets.push('crimson');
  }
  if (constraints.darkGray.available && (state.beaconsUsed.darkGray ?? 0) < 1 && state.phase === 'pull_farming') {
    targets.push('darkGray');
  }

  return targets;
}
