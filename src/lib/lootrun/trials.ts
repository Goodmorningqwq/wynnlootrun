import { TrialName, TrialTier } from './types';

export interface TrialDefinition {
  name: TrialName;
  label: string;
  tier: TrialTier;
  reward: string;
  objective: string;
  penalty: string;
  strategy: string;
  isSecondTrial: boolean;
}

export const TRIAL_DEFINITIONS: Record<TrialName, TrialDefinition> = {
  hubris: {
    name: 'hubris',
    label: 'Hubris',
    tier: 'S',
    reward: '+1 reroll, +1 sacrifice',
    objective: 'Complete 10 challenges',
    penalty: 'Dying within the next 10 challenges ends your lootrun',
    strategy: 'Easy completion. Great first trial when mobs aren\'t too dangerous.',
    isSecondTrial: false,
  },
  ultimate_sacrifice: {
    name: 'ultimate_sacrifice',
    label: 'Ultimate Sacrifice',
    tier: 'S',
    reward: '+2 sacrifices',
    objective: 'Complete 10 challenges',
    penalty: 'For the next 10 challenges, all boon effects are disabled',
    strategy: 'Best as first trial when mobs aren\'t scaled hard. Pairs well with Gambling Beast.',
    isSecondTrial: false,
  },
  chronotrigger: {
    name: 'chronotrigger',
    label: 'Chronotrigger',
    tier: 'S',
    reward: 'Green beacons cleanse 15% curses and increase pulls by 3.5%',
    objective: 'Complete 12 challenges',
    penalty: 'Cannot gain time in any way for 12 challenges',
    strategy: 'Extremely powerful. Green beacons become pull multiplier + curse cleanse. Alternate V.Purple and V.Green.',
    isSecondTrial: false,
  },
  side_hustle: {
    name: 'side_hustle',
    label: 'Side Hustle',
    tier: 'A',
    reward: '+2 rerolls',
    objective: 'Open 30 chests',
    penalty: 'Timer limited to 75 seconds',
    strategy: 'Fast with good chest route or yellow beacon run. Timer resets at each beacon.',
    isSecondTrial: false,
  },
  adrenaline_junkie: {
    name: 'adrenaline_junkie',
    label: 'Adrenaline Junkie',
    tier: 'A',
    reward: '+2 rerolls',
    objective: 'Gain 25 pulls',
    penalty: 'Lose 1 boon every 25s during interludes',
    strategy: 'Fast if you have pull generation. Boon losses minimal if moving quickly.',
    isSecondTrial: false,
  },
  warmth_devourer: {
    name: 'warmth_devourer',
    label: 'Warmth Devourer',
    tier: 'A',
    reward: '+1 reroll, +1 sacrifice',
    objective: 'Obtain 20 end reward pulls',
    penalty: 'Lose 1 boon and 1 challenge every challenge completed',
    strategy: 'Complete fast with purple/dark gray beacons. If no boons, can\'t take challenges away.',
    isSecondTrial: false,
  },
  gambling_beast: {
    name: 'gambling_beast',
    label: 'Gambling Beast',
    tier: 'A',
    reward: '+1 End Reward Reroll every challenge completed',
    objective: 'Active immediately',
    penalty: 'Lose 300 + 90(n-1) seconds every nth challenge completed',
    strategy: 'ALMOST ALWAYS take as 2nd trial. Stack V.Aqua→V.Green before and after. Run killer for bad runs.',
    isSecondTrial: true,
  },
  dying_light: {
    name: 'dying_light',
    label: 'Dying Light',
    tier: 'A',
    reward: 'Rainbow beacons now grant +1 Sacrifice',
    objective: 'Obtain Boons totalling 1000% Potency',
    penalty: 'Your boons lose 5% Potency every 2.5s, one by one',
    strategy: 'Synergizes with All In. Take rainbow beacons sparingly before this trial activates.',
    isSecondTrial: false,
  },
  all_in: {
    name: 'all_in',
    label: 'All In',
    tier: 'B',
    reward: 'Convert each sacrifice into 3 rerolls',
    objective: 'Complete 10 challenges',
    penalty: 'Curses doubled for 10 challenges',
    strategy: 'Best with Dying Light. 3+ sacrifices = 9+ rerolls. You lose ALL sacrifices though.',
    isSecondTrial: false,
  },
  monochromokopia: {
    name: 'monochromokopia',
    label: 'Monochromokopia',
    tier: 'C',
    reward: 'Additional White, Gray and Dark Gray beacon',
    objective: 'Gain 30 pulls',
    penalty: 'Completed beacons become obscured for 7 challenges',
    strategy: 'Last resort. Spam purple to complete — only purple gets obscured.',
    isSecondTrial: false,
  },
  treasury_bill: {
    name: 'treasury_bill',
    label: 'Treasury Bill',
    tier: 'C',
    reward: 'Boosts current end reward pulls by 75%',
    objective: 'Obtain 20 end reward pulls',
    penalty: 'Lose a pull every 45s (removes trial progress)',
    strategy: 'Fill requirement to near-completion, then aquastack Purple/Dark Gray to maximize.',
    isSecondTrial: false,
  },
  lights_out: {
    name: 'lights_out',
    label: 'Lights Out',
    tier: 'C',
    reward: 'Cleanse all Radiant curses for +5 Pulls each',
    objective: 'Defeat 25 Radiant challenge mobs',
    penalty: 'Receive 2 Radiant chance curses every challenge',
    strategy: 'One-time burst. Not worth the trial slot usually.',
    isSecondTrial: false,
  },
};

export const TRIAL_TIER_ORDER: Record<TrialTier, TrialName[]> = {
  S: ['hubris', 'ultimate_sacrifice', 'chronotrigger'],
  A: ['side_hustle', 'adrenaline_junkie', 'warmth_devourer', 'gambling_beast', 'dying_light'],
  B: ['all_in'],
  C: ['monochromokopia', 'treasury_bill', 'lights_out'],
};
