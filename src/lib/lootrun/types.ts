export type BeaconColor =
  | 'rainbow' | 'orange' | 'aqua' | 'blue' | 'purple'
  | 'yellow' | 'green' | 'white' | 'red' | 'pink'
  | 'gray' | 'darkGray' | 'crimson';

export type BeaconRarity = 'common' | 'medium' | 'rare';

export interface BeaconDefinition {
  color: BeaconColor;
  label: string;
  rarity: BeaconRarity;
  maxCount: number;
  baseEffect: string;
  vibrantEffect: string;
  vibrantAquaEffect: string;
  emoji: string;
  colorHex: string;
  glowColor: string;
}

export interface ActiveBeaconEffect {
  color: BeaconColor;
  challenges: number;
  isVibrant: boolean;
  isAquaStacked: boolean;
}

export type MissionName =
  | 'cleansing_greed' | 'materialism' | 'hoarder' | 'jesters_trick'
  | 'interest_scheme' | 'orphions_grace' | 'opal_offering' | 'gourmand'
  | 'porphyrophobia' | 'sacrificial_ritual' | 'equilibrium' | 'inner_peace'
  | 'radiant_hunter' | 'optimism' | 'backup_beat' | 'stasis'
  | 'chronokinesis' | 'requiem' | 'thrill_seeker' | 'high_roller'
  | 'redemption' | 'complete_chaos';

export type TrialName =
  | 'hubris' | 'ultimate_sacrifice' | 'chronotrigger' | 'side_hustle'
  | 'adrenaline_junkie' | 'warmth_devourer' | 'gambling_beast'
  | 'dying_light' | 'all_in' | 'monochromokopia' | 'treasury_bill' | 'lights_out';

export type TrialTier = 'S' | 'A' | 'B' | 'C';

export type MissionObjectiveType =
  | 'none' | 'open_chests' | 'gain_pulls' | 'complete_challenges'
  | 'obtain_boons' | 'gain_curses' | 'use_rerolls' | 'add_time';

export interface MissionObjective {
  type: MissionObjectiveType;
  target: number;
  current: number;
  label: string;
}

export interface ActiveMission {
  name: MissionName;
  objective: MissionObjective;
  completed: boolean;
  source: 'free' | 'gray';
}

export interface ActiveTrial {
  name: TrialName;
  challengesRemaining: number;
  completed: boolean;
}

export interface Boon {
  name: string;
  potency: number;
  isStatic: boolean;
  category: string;
}

export interface CurseState {
  damage: number;
  health: number;
  attackSpeed: number;
  walkSpeed: number;
  damageResist: number;
  radiantPower: number;
  radiantChance: number;
}

export type RunPhase = 'setup' | 'extension' | 'mission_setup' | 'trial_setup' | 'pull_farming' | 'ending';

export type SetupSubPhase = 'rainbow_hunt' | 'orange_stacking' | 'extension_prep';

export type ComboName =
  | 'opal_offering'
  | 'jesters_scheme'
  | 'radiant_hunter'
  | 'chronotrigger'
  | 'gambling_beast'
  | 'dying_light_all_in'
  | 'comboless';

export interface ComboStrategy {
  name: ComboName;
  label: string;
  description: string;
  requiredMissions: MissionName[];
  recommendedMissions: MissionName[];
  sideMissions: MissionName[];
  preferredTrials: TrialName[];
  secondTrialPreference: TrialName[];
  beaconPriority: BeaconColor[];
  expectedPulls: string;
  type: 'active' | 'passive' | 'semi_active';
}

export interface ComboPotential {
  combo: ComboName;
  isComplete: boolean;
  hasRequired: boolean;
  missingMissions: MissionName[];
  missingRecommended: MissionName[];
}

export interface MissionRecommendation {
  mission: MissionName;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  enablesCombo: ComboName | null;
}

export interface TrialRecommendation {
  trial: TrialName;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  slot: 1 | 2;
}

export type TipSeverity = 'info' | 'warning' | 'critical';

export interface StrategyTip {
  text: string;
  severity: TipSeverity;
  category: 'setup' | 'extension' | 'mission' | 'trial' | 'combo' | 'pull_farming' | 'ending' | 'beacon' | 'reroll' | 'timer';
}

export interface BeaconConstraint {
  color: BeaconColor;
  available: boolean;
  reason: string;
}

export interface BoonAdvice {
  shouldTakeBlue: boolean;
  reason: string;
  targetPotency: number;
  currentBoonCount: number;
  recommendedCurseCount: number;
}

export interface LootrunState {
  challengeNumber: number;
  totalChallenges: number;
  timerSeconds: number;
  isLowTime: boolean;

  rawPulls: number;
  sacrifices: number;
  rerolls: number;

  activeEffects: ActiveBeaconEffect[];

  beaconChoices: number;

  beaconsUsed: Partial<Record<BeaconColor, number>>;
  aquaStackPending: boolean;
  grayBeaconsSkipped: number;
  crimsonBeaconsSkipped: number;

  missions: ActiveMission[];
  freeMissionAvailable: boolean;
  grayMissionChoices: number;
  trials: ActiveTrial[];

  boons: Boon[];
  curses: CurseState;

  phase: RunPhase;
}

export interface BeaconOffer {
  color: BeaconColor;
  isVibrant: boolean;
  isSelected: boolean;
}

export interface Recommendation {
  beaconColor: BeaconColor;
  score: number;
  reason: string;
  willBeAquaStacked: boolean;
  shouldTakeVibrant: boolean;
  priority: number;
}

export interface ScoringConfig {
  phaseWeights: Record<RunPhase, Partial<Record<BeaconColor, number>>>;
  lowTimeBoost: { green: number; [key: string]: number };
  aquaStackBonus: number;
  vibrantBonus: number;
  missionSynergyBonus: number;
  comboDetectionEnabled: boolean;
}
