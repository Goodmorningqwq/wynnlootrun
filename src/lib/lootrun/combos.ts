import { BeaconColor, ComboName, ComboStrategy, ComboPotential, ActiveMission } from './types';

export const COMBO_STRATEGIES: Record<ComboName, ComboStrategy> = {
  opal_offering: {
    name: 'opal_offering',
    label: 'Opal Offering',
    description: 'Build boons with aqua-stacked Blue, then convert to massive pulls with aqua-stacked Purple. 300-500 pulls expected.',
    requiredMissions: ['opal_offering'],
    recommendedMissions: ['radiant_hunter', 'sacrificial_ritual'],
    sideMissions: ['redemption', 'high_roller'],
    preferredTrials: ['hubris', 'ultimate_sacrifice'],
    secondTrialPreference: ['gambling_beast', 'warmth_devourer'],
    beaconPriority: ['aqua', 'blue', 'purple', 'rainbow', 'orange', 'green', 'darkGray', 'white'],
    expectedPulls: '300-500',
    type: 'active',
  },
  jesters_scheme: {
    name: 'jesters_scheme',
    label: "Jester's Scheme",
    description: 'Cycle V.Aqua → V.Yellow for massive flying chests. Great for boxed mythics. 200-400 pulls / 8k-10k boxes.',
    requiredMissions: ['interest_scheme', 'jesters_trick'],
    recommendedMissions: ['sacrificial_ritual', 'radiant_hunter', 'materialism', 'complete_chaos'],
    sideMissions: ['redemption', 'high_roller', 'orphions_grace', 'hoarder', 'chronokinesis'],
    preferredTrials: ['hubris', 'ultimate_sacrifice', 'chronotrigger'],
    secondTrialPreference: ['gambling_beast', 'side_hustle'],
    beaconPriority: ['aqua', 'yellow', 'rainbow', 'orange', 'green', 'white', 'red'],
    expectedPulls: '200-400 + 8k-10k boxes',
    type: 'active',
  },
  radiant_hunter: {
    name: 'radiant_hunter',
    label: 'Radiant Hunter',
    description: 'Passive pull generation from killing Radiant mobs. Pairs well with any combo. Up to +5 pulls per challenge.',
    requiredMissions: ['radiant_hunter'],
    recommendedMissions: [],
    sideMissions: ['chronokinesis', 'inner_peace', 'redemption', 'high_roller'],
    preferredTrials: ['chronotrigger', 'hubris'],
    secondTrialPreference: ['gambling_beast', 'ultimate_sacrifice'],
    beaconPriority: ['aqua', 'rainbow', 'orange', 'green', 'purple', 'white', 'red'],
    expectedPulls: 'Varies (passive)',
    type: 'passive',
  },
  chronotrigger: {
    name: 'chronotrigger',
    label: 'Chronotrigger',
    description: 'Green beacons cleanse 15% curses and increase pulls by 3.5%. Alternate V.Purple and V.Green for insane value.',
    requiredMissions: [],
    recommendedMissions: ['radiant_hunter', 'chronokinesis', 'porphyrophobia'],
    sideMissions: ['equilibrium', 'inner_peace'],
    preferredTrials: ['chronotrigger'],
    secondTrialPreference: ['hubris', 'ultimate_sacrifice'],
    beaconPriority: ['aqua', 'green', 'purple', 'rainbow', 'orange', 'white', 'red'],
    expectedPulls: 'Doubles pull count',
    type: 'active',
  },
  gambling_beast: {
    name: 'gambling_beast',
    label: 'Gambling Beast',
    description: 'Stack green beacons for rerolls. Take as 2nd trial. 6-15 end reward rerolls expected.',
    requiredMissions: [],
    recommendedMissions: ['redemption', 'high_roller', 'optimism', 'backup_beat'],
    sideMissions: ['gourmand'],
    preferredTrials: ['ultimate_sacrifice', 'hubris'],
    secondTrialPreference: ['gambling_beast'],
    beaconPriority: ['aqua', 'green', 'rainbow', 'orange', 'pink', 'white', 'red'],
    expectedPulls: '6-15 rerolls',
    type: 'active',
  },
  dying_light_all_in: {
    name: 'dying_light_all_in',
    label: 'Dying Light + All In',
    description: 'Rainbow beacons grant +1 Sacrifice. Convert sacrifices to 3 rerolls each. Voids ALL sacrifices.',
    requiredMissions: [],
    recommendedMissions: [],
    sideMissions: ['redemption', 'high_roller', 'radiant_hunter'],
    preferredTrials: ['dying_light'],
    secondTrialPreference: ['all_in'],
    beaconPriority: ['aqua', 'rainbow', 'blue', 'orange', 'green', 'white', 'red'],
    expectedPulls: 'High rerolls, 0 sacrifices',
    type: 'semi_active',
  },
  comboless: {
    name: 'comboless',
    label: 'Comboless',
    description: 'No meaningful combo. Stack curses and take Gambling Beast to kill run, or Porphyrophobia + Inner Peace for 200+ pulls.',
    requiredMissions: [],
    recommendedMissions: ['porphyrophobia', 'inner_peace', 'radiant_hunter', 'chronokinesis'],
    sideMissions: ['redemption', 'high_roller'],
    preferredTrials: ['hubris', 'ultimate_sacrifice'],
    secondTrialPreference: ['gambling_beast', 'warmth_devourer'],
    beaconPriority: ['aqua', 'purple', 'darkGray', 'rainbow', 'orange', 'green'],
    expectedPulls: '100-200',
    type: 'passive',
  },
};

export function detectCombos(missions: ActiveMission[]): ComboName[] {
  const names = missions.map(m => m.name);
  const detected: ComboName[] = [];

  if (names.includes('opal_offering')) {
    detected.push('opal_offering');
  }
  if (names.includes('interest_scheme') && names.includes('jesters_trick')) {
    detected.push('jesters_scheme');
  }
  if (names.includes('radiant_hunter') && !names.includes('opal_offering') && !names.includes('interest_scheme')) {
    detected.push('radiant_hunter');
  }
  if (names.includes('porphyrophobia') && names.includes('inner_peace')) {
    detected.push('comboless');
  }

  return detected.length > 0 ? detected : ['comboless'];
}

export function detectComboPotentials(missions: ActiveMission[]): ComboPotential[] {
  const names = new Set(missions.map(m => m.name));
  const potentials: ComboPotential[] = [];

  for (const [key, strategy] of Object.entries(COMBO_STRATEGIES)) {
    if (key === 'comboless') continue;

    const hasRequired = strategy.requiredMissions.every(m => names.has(m));
    const missingRequired = strategy.requiredMissions.filter(m => !names.has(m));
    const missingRecommended = strategy.recommendedMissions.filter(m => !names.has(m));

    potentials.push({
      combo: key as ComboName,
      isComplete: hasRequired,
      hasRequired,
      missingMissions: missingRequired,
      missingRecommended,
    });
  }

  return potentials.sort((a, b) => {
    if (a.isComplete && !b.isComplete) return -1;
    if (!a.isComplete && b.isComplete) return 1;
    return a.missingMissions.length - b.missingMissions.length;
  });
}

export function getActiveComboStrategy(missions: ActiveMission[]): ComboStrategy {
  const combos = detectCombos(missions);
  const primaryCombo = combos[0];

  if (primaryCombo === 'radiant_hunter' && combos.length > 1) {
    return COMBO_STRATEGIES[combos[1]];
  }

  if (primaryCombo === 'comboless') {
    const names = missions.map(m => m.name);
    if (names.includes('porphyrophobia') || names.includes('chronokinesis')) {
      return COMBO_STRATEGIES.chronotrigger;
    }
  }

  return COMBO_STRATEGIES[primaryCombo];
}

export function getComboBeaconPriority(combo: ComboName): BeaconColor[] {
  return COMBO_STRATEGIES[combo]?.beaconPriority ?? ['aqua', 'rainbow', 'orange'];
}

export function getComboModifierBeacons(combo: ComboName): { boost: BeaconColor[]; avoid: BeaconColor[] } {
  switch (combo) {
    case 'opal_offering':
      return { boost: ['blue', 'purple'], avoid: [] };
    case 'jesters_scheme':
      return { boost: ['yellow', 'aqua'], avoid: ['darkGray'] };
    case 'radiant_hunter':
      return { boost: ['purple'], avoid: [] };
    case 'chronotrigger':
      return { boost: ['green', 'purple'], avoid: [] };
    case 'gambling_beast':
      return { boost: ['green', 'pink'], avoid: ['darkGray'] };
    case 'dying_light_all_in':
      return { boost: ['rainbow', 'blue'], avoid: [] };
    case 'comboless':
      return { boost: ['purple', 'darkGray'], avoid: [] };
    default:
      return { boost: [], avoid: [] };
  }
}
