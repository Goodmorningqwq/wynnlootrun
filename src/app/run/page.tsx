'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  LootrunState,
  BeaconColor,
  BeaconOffer,
  Recommendation,
  MissionName,
  MissionOffer,
  MissionRecommendation,
  ActiveMission,
  TrialName,
  CurseState,
} from '@/lib/lootrun/types';
import { BEACON_COLORS } from '@/lib/lootrun/beacons';
import { MISSION_DEFINITIONS, createMissionObjective } from '@/lib/lootrun/missions';
import {
  createInitialState,
  scoreBeacons,
  applyBeaconEffect,
  calculateEffectivePulls,
  detectPhase,
} from '@/lib/lootrun/engine';
import { scoreMissions } from '@/lib/lootrun/recommendations';
import { RunSummary } from '@/components/lootrun/RunSummary';
import { BeaconOfferGrid } from '@/components/lootrun/BeaconOfferGrid';
import { AdvisorPanel } from '@/components/lootrun/AdvisorPanel';
import { MissionSelector } from '@/components/lootrun/MissionSelector';
import { MissionOfferGrid } from '@/components/lootrun/MissionOfferGrid';
import { TrialSelector } from '@/components/lootrun/TrialSelector';
import { StrategyBar } from '@/components/lootrun/StrategyBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function createDefaultOffers(): BeaconOffer[] {
  return BEACON_COLORS.map((color) => ({
    color,
    isVibrant: false,
    isSelected: false,
  }));
}

function createDefaultMissionOffers(): MissionOffer[] {
  return (Object.keys(MISSION_DEFINITIONS) as MissionName[]).map((name) => ({
    name,
    isSelected: false,
  }));
}

const CURSE_KEYS: (keyof CurseState)[] = [
  'damage', 'health', 'attackSpeed', 'walkSpeed',
  'damageResist', 'radiantPower', 'radiantChance',
];

type TabId = 'beacons' | 'missions' | 'trials';

export default function RunPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [state, setState] = useState<LootrunState>(createInitialState);
  const [offers, setOffers] = useState<BeaconOffer[]>(createDefaultOffers);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [missionOffers, setMissionOffers] = useState<MissionOffer[]>(createDefaultMissionOffers);
  const [missionRecommendations, setMissionRecommendations] = useState<MissionRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('beacons');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [advisorSheetOpen, setAdvisorSheetOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      router.replace('/login');
      return;
    }
    startTransition(() => {
      setCurrentUser(user);
      setMounted(true);
    });
  }, [router]);

  useEffect(() => {
    if (!timerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timerSeconds <= 0) {
          setTimerRunning(false);
          return { ...prev, timerSeconds: 0, isLowTime: true };
        }
        const next = prev.timerSeconds - 1;
        return { ...prev, timerSeconds: next, isLowTime: next < 240 };
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const toggleTimer = useCallback(() => setTimerRunning((v) => !v), []);
  const resetTimer = useCallback(() => {
    setTimerRunning(false);
    setState((prev) => ({ ...prev, timerSeconds: 300, isLowTime: false }));
  }, []);
  const addTime = useCallback((secs: number) => {
    setState((prev) => ({
      ...prev,
      timerSeconds: Math.min(900, prev.timerSeconds + secs),
      isLowTime: prev.timerSeconds + secs < 240,
    }));
  }, []);

  const toggleLowTime = useCallback(() => {
    setState((prev) => ({ ...prev, isLowTime: !prev.isLowTime }));
  }, []);

  const toggleSelect = useCallback((color: BeaconColor) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.color === color ? { ...o, isSelected: !o.isSelected } : o,
      ),
    );
  }, []);

  const toggleVibrant = useCallback((color: BeaconColor) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.color === color ? { ...o, isVibrant: !o.isVibrant } : o,
      ),
    );
  }, []);

  const clearAll = useCallback(() => {
    setOffers((prev) =>
      prev.map((o) => ({ ...o, isSelected: false, isVibrant: false })),
    );
    setRecommendations([]);
  }, []);

  const getRecommendations = useCallback(() => {
    const recs = scoreBeacons(state, offers);
    setRecommendations(recs);
  }, [state, offers]);

  const takeBeacon = useCallback(
    (color: BeaconColor) => {
      const offer = offers.find((o) => o.color === color);
      if (!offer) return;
      const isVibrant = offer.isVibrant;
      const newState = applyBeaconEffect(state, color, isVibrant);
      setState(newState);
      setOffers(createDefaultOffers());
      setRecommendations([]);
      setAdvisorSheetOpen(false);
    },
    [state, offers],
  );

  const addMission = useCallback((name: MissionName, source: 'free' | 'gray') => {
    setState((prev) => {
      const def = MISSION_DEFINITIONS[name];
      const mission: ActiveMission = {
        name,
        objective: def ? createMissionObjective(def) : { type: 'none' as const, target: 0, current: 0, label: 'Unknown' },
        completed: def?.objectiveType === 'none',
        source,
      };
      const newMissions = [...prev.missions, mission];
      return {
        ...prev,
        missions: newMissions,
        freeMissionAvailable: source === 'free' ? false : prev.freeMissionAvailable,
        grayMissionChoices: source === 'gray' ? Math.max(0, prev.grayMissionChoices - 1) : prev.grayMissionChoices,
        phase: detectPhase({ ...prev, missions: newMissions }),
      };
    });
  }, []);

  const removeMission = useCallback((index: number) => {
    setState((prev) => {
      const missions = prev.missions.filter((_, i) => i !== index);
      return { ...prev, missions, phase: detectPhase({ ...prev, missions }) };
    });
  }, []);

  const toggleMissionComplete = useCallback((index: number) => {
    setState((prev) => {
      const missions = prev.missions.map((m, i) =>
        i === index ? { ...m, completed: !m.completed } : m,
      );
      return { ...prev, missions, phase: detectPhase({ ...prev, missions }) };
    });
  }, []);

  const updateMissionObjective = useCallback((index: number, current: number) => {
    setState((prev) => {
      const missions = prev.missions.map((m, i) => {
        if (i !== index) return m;
        const newCurrent = Math.max(0, Math.min(m.objective.target, current));
        return { ...m, objective: { ...m.objective, current: newCurrent }, completed: m.objective.target > 0 && newCurrent >= m.objective.target };
      });
      return { ...prev, missions, phase: detectPhase({ ...prev, missions }) };
    });
  }, []);

  const toggleMissionOffer = useCallback((name: MissionName) => {
    setMissionOffers((prev) =>
      prev.map((o) => o.name === name ? { ...o, isSelected: !o.isSelected } : o),
    );
  }, []);

  const clearMissionOffers = useCallback(() => {
    setMissionOffers((prev) => prev.map((o) => ({ ...o, isSelected: false })));
    setMissionRecommendations([]);
  }, []);

  const getMissionRecommendations = useCallback(() => {
    const recs = scoreMissions(state, missionOffers);
    setMissionRecommendations(recs);
  }, [state, missionOffers]);

  const takeMissionFromAdvisor = useCallback((name: MissionName, source: 'free' | 'gray') => {
    addMission(name, source);
    setMissionOffers((prev) => prev.map((o) => o.name === name ? { ...o, isSelected: false } : o));
    setMissionRecommendations([]);
  }, [addMission]);

  const addTrial = useCallback((name: TrialName) => {
    setState((prev) => {
      const trials = [...prev.trials, { name, challengesRemaining: 10, completed: false }];
      return { ...prev, trials, phase: detectPhase({ ...prev, trials }) };
    });
  }, []);

  const removeTrial = useCallback((index: number) => {
    setState((prev) => {
      const trials = prev.trials.filter((_, i) => i !== index);
      return { ...prev, trials, phase: detectPhase({ ...prev, trials }) };
    });
  }, []);

  const toggleTrialComplete = useCallback((index: number) => {
    setState((prev) => {
      const trials = prev.trials.map((t, i) =>
        i === index ? { ...t, completed: !t.completed } : t,
      );
      return { ...prev, trials, phase: detectPhase({ ...prev, trials }) };
    });
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('currentUser');
    router.replace('/login');
  }, [router]);

  const handleNewRun = useCallback(() => {
    const initial = createInitialState();
    setState(initial);
    setOffers(createDefaultOffers());
    setRecommendations([]);
    setMissionOffers(createDefaultMissionOffers());
    setMissionRecommendations([]);
    setTimerRunning(false);
    setManualOpen(false);
  }, []);

  const updateManual = useCallback(
    <K extends keyof LootrunState>(key: K, value: LootrunState[K]) => {
      setState((prev) => {
        const next = { ...prev, [key]: value };
        return { ...next, phase: detectPhase(next) };
      });
    },
    [],
  );

  const updateCurse = useCallback(
    (key: keyof CurseState, value: number) => {
      setState((prev) => {
        const curses = { ...prev.curses, [key]: value };
        const next = { ...prev, curses };
        return { ...next, phase: detectPhase(next) };
      });
    },
    [],
  );

  const pulls = calculateEffectivePulls(state);

  const tabs: { id: TabId; label: string; emoji: string; badge?: number }[] = [
    { id: 'beacons', label: 'Beacons', emoji: '🔮' },
    { id: 'missions', label: 'Missions', emoji: '📋', badge: state.freeMissionAvailable || state.grayMissionChoices > 0 ? 1 : undefined },
    { id: 'trials', label: 'Trials', emoji: '⚔️' },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glow-card rounded-xl p-8 text-center">
          <div className="text-2xl mb-4">⚔️</div>
          <p className="text-[var(--color-wynn-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b border-[rgba(120,68,190,0.35)]"
        style={{
          backdropFilter: 'blur(10px) saturate(130%)',
          background: 'linear-gradient(180deg, rgba(22,10,35,0.85), rgba(10,5,18,0.9))',
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <h1 className="text-lg font-bold text-white font-heading">
              WynnLootrun
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span
                className={`font-mono font-bold text-lg ${
                  state.timerSeconds < 240
                    ? 'text-[var(--color-wynn-red)] animate-pulse'
                    : state.timerSeconds < 480
                      ? 'text-[var(--color-wynn-gold)]'
                      : 'text-[var(--color-wynn-green)]'
                }`}
              >
                {formatTime(state.timerSeconds)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="xs"
                variant={timerRunning ? 'destructive' : 'outline'}
                onClick={toggleTimer}
                className={
                  timerRunning
                    ? 'bg-[var(--color-wynn-red)]/20 border-[var(--color-wynn-red)]/40 text-[var(--color-wynn-red)]'
                    : 'border-[var(--color-wynn-border-glow)] text-[var(--color-wynn-green)]'
                }
              >
                {timerRunning ? '⏸' : '▶'}
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={resetTimer}
                className="border-[var(--color-wynn-border-glow)] text-[var(--color-wynn-text-muted)]"
              >
                ⟲
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => addTime(60)}
                className="border-[var(--color-wynn-green)]/30 text-[var(--color-wynn-green)]"
              >
                +60s
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => addTime(90)}
                className="border-[var(--color-wynn-green)]/30 text-[var(--color-wynn-green)]"
              >
                +90s
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6 bg-[var(--color-wynn-border-glow)]" />

            <span className="text-xs text-[var(--color-wynn-text-muted)] hidden sm:inline">
              {currentUser}
            </span>

            <Button
              size="xs"
              variant="ghost"
              onClick={handleLogout}
              className="text-[var(--color-wynn-text-muted)] hover:text-[var(--color-wynn-red)]"
            >
              Logout
            </Button>

            <Button
              size="xs"
              onClick={handleNewRun}
              className="bg-gradient-to-br from-[var(--color-wynn-pink)] to-[var(--color-wynn-purple-dark)] border border-[rgba(232,121,249,0.75)] text-white"
            >
              New Run
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* LEFT SIDEBAR - Run Summary (desktop) */}
          <aside className="hidden lg:block w-[280px] shrink-0">
            <RunSummary state={state} onToggleLowTime={toggleLowTime} />
            <div className="mt-3">
              <StrategyBar state={state} />
            </div>
          </aside>

          {/* CENTER */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Mobile: compact summary */}
            <div className="lg:hidden glow-card rounded-xl p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-wynn-text-muted)]">Ch</span>
                  <span className="font-bold text-white text-sm">{state.challengeNumber}/{state.totalChallenges}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-wynn-text-muted)]">Pulls</span>
                  <span className="font-bold text-[var(--color-wynn-gold)] text-sm">{pulls.effective}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--color-wynn-text-muted)]">Phase</span>
                  <Badge variant="outline" className="text-xs border-[var(--color-wynn-gold)]/40 text-[var(--color-wynn-gold)] bg-[var(--color-wynn-gold)]/10">
                    {state.phase}
                  </Badge>
                  {state.aquaStackPending && (
                    <Badge className="text-[9px] px-1.5 py-0 bg-[var(--color-wynn-cyan)]/20 text-[var(--color-wynn-cyan)] border-[var(--color-wynn-cyan)]/40 animate-pulse">
                      💧AQUA
                    </Badge>
                  )}
                </div>
                <Sheet>
                  <SheetTrigger
                    render={<Button size="xs" variant="outline" className="border-[var(--color-wynn-border-glow)]">📊</Button>}
                  />
                  <SheetContent side="left" className="w-[280px] p-0 bg-[var(--color-wynn-bg-card)] border-[var(--color-wynn-border-glow)]">
                    <SheetHeader>
                      <SheetTitle className="text-white">Run Summary</SheetTitle>
                      <SheetDescription className="text-[var(--color-wynn-text-muted)]">Full run overview</SheetDescription>
                    </SheetHeader>
                    <div className="px-4 pb-4 overflow-y-auto h-[calc(100%-4rem)]">
                      <RunSummary state={state} onToggleLowTime={toggleLowTime} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Tabbed Section: Beacons / Missions / Trials */}
            <div className="glow-card rounded-xl overflow-hidden">
              <div className="flex border-b border-[var(--color-wynn-border-glow)]">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'text-white bg-gradient-to-b from-[rgba(168,85,247,0.15)] to-transparent border-b-2 border-[var(--color-wynn-pink)]'
                        : 'text-[var(--color-wynn-text-muted)] hover:text-white hover:bg-[rgba(168,85,247,0.05)]'
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-wynn-pink)]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeTab === 'beacons' && (
                  <BeaconOfferGrid
                    offers={offers}
                    state={state}
                    onToggleSelect={toggleSelect}
                    onToggleVibrant={toggleVibrant}
                    onClearAll={clearAll}
                    onGetRecommendations={getRecommendations}
                  />
                )}

                {activeTab === 'missions' && (
                  <div className="space-y-4">
                    {/* Active missions */}
                    <div>
                      <span className="text-sm text-[var(--color-wynn-text-muted)] mb-2 block">
                        Active Missions ({state.missions.length}/4)
                      </span>
                      <MissionSelector
                        missions={state.missions}
                        onRemoveMission={removeMission}
                        onToggleComplete={toggleMissionComplete}
                        onUpdateObjective={updateMissionObjective}
                      />
                    </div>

                    {/* Mission offer + recommendations */}
                    <MissionOfferGrid
                      offers={missionOffers}
                      state={state}
                      onToggleSelect={toggleMissionOffer}
                      onClearAll={clearMissionOffers}
                      onGetRecommendations={getMissionRecommendations}
                    />
                  </div>
                )}

                {activeTab === 'trials' && (
                  <TrialSelector
                    trials={state.trials}
                    onAddTrial={addTrial}
                    onRemoveTrial={removeTrial}
                    onToggleComplete={toggleTrialComplete}
                    state={state}
                  />
                )}
              </div>
            </div>

            {/* Strategy Tips (mobile) */}
            <div className="lg:hidden">
              <StrategyBar state={state} />
            </div>

            {/* Manual Controls */}
            <div className="glow-card rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setManualOpen(!manualOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white hover:bg-[rgba(168,85,247,0.08)] transition-colors"
              >
                <span>⚙️ Manual Controls</span>
                <span className={`transition-transform ${manualOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {manualOpen && (
                <div className="p-4 space-y-4 border-t border-[var(--color-wynn-border-glow)]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    <ManualField label="Challenge #" type="number" value={state.challengeNumber} onChange={(v) => updateManual('challengeNumber', v)} />
                    <ManualField label="Total Challenges" type="number" value={state.totalChallenges} onChange={(v) => updateManual('totalChallenges', v)} />
                    <ManualField label="Timer (seconds)" type="number" value={state.timerSeconds} onChange={(v) => updateManual('timerSeconds', v)} />
                    <ManualField label="Raw Pulls" type="number" value={state.rawPulls} onChange={(v) => updateManual('rawPulls', v)} />
                    <ManualField label="Sacrifices" type="number" value={state.sacrifices} onChange={(v) => updateManual('sacrifices', v)} />
                    <ManualField label="Rerolls" type="number" value={state.rerolls} onChange={(v) => updateManual('rerolls', v)} />
                    <ManualField label="Beacon Choices" type="number" value={state.beaconChoices} onChange={(v) => updateManual('beaconChoices', v)} />
                    <ManualField label="Gray Skipped" type="number" value={state.grayBeaconsSkipped} onChange={(v) => updateManual('grayBeaconsSkipped', v)} />
                    <ManualField label="Crimson Skipped" type="number" value={state.crimsonBeaconsSkipped} onChange={(v) => updateManual('crimsonBeaconsSkipped', v)} />
                  </div>

                  <Separator className="bg-[var(--color-wynn-border-glow)]" />

                  <div>
                    <h4 className="text-xs font-semibold text-[var(--color-wynn-text-muted)] mb-2 uppercase tracking-wider">Curses</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {CURSE_KEYS.map((key) => (
                        <ManualField
                          key={key}
                          label={key.replace(/([A-Z])/g, ' $1').trim()}
                          type="number"
                          value={state.curses[key]}
                          onChange={(v) => updateCurse(key, v)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setState((prev) => ({ ...prev, isLowTime: !prev.isLowTime }))}
                      className={`border-[var(--color-wynn-border-glow)] ${
                        state.isLowTime
                          ? 'bg-[var(--color-wynn-red)]/20 text-[var(--color-wynn-red)] border-[var(--color-wynn-red)]/40'
                          : 'text-[var(--color-wynn-text-muted)]'
                      }`}
                    >
                      {state.isLowTime ? '⚠️ Low Time ON' : 'Low Time OFF'}
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setState((prev) => ({ ...prev, aquaStackPending: !prev.aquaStackPending }))}
                      className={`border-[var(--color-wynn-border-glow)] ${
                        state.aquaStackPending
                          ? 'bg-[var(--color-wynn-cyan)]/20 text-[var(--color-wynn-cyan)] border-[var(--color-wynn-cyan)]/40'
                          : 'text-[var(--color-wynn-text-muted)]'
                      }`}
                    >
                      {state.aquaStackPending ? '💧 Aqua Stack ON' : 'Aqua Stack OFF'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR - Advisor (desktop) */}
          <aside className="hidden lg:block w-[320px] shrink-0">
            <AdvisorPanel
              recommendations={recommendations}
              missionRecommendations={missionRecommendations}
              onTakeBeacon={takeBeacon}
              onTakeMission={takeMissionFromAdvisor}
              state={state}
            />
          </aside>
        </div>

        {/* Mobile: Advisor in bottom sheet */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
          <Sheet open={advisorSheetOpen} onOpenChange={setAdvisorSheetOpen}>
            <SheetTrigger
              render={
                <Button
                  className="w-full rounded-none h-12 bg-gradient-to-br from-[var(--color-wynn-pink)] to-[var(--color-wynn-purple-dark)] border-t border-[rgba(232,121,249,0.75)] text-white font-semibold"
                >
                  🧠 Advisor {(recommendations.length + missionRecommendations.length) > 0 && `(${recommendations.length + missionRecommendations.length})`}
                </Button>
              }
            />
            <SheetContent
              side="bottom"
              className="h-[60vh] bg-[var(--color-wynn-bg-card)] border-[var(--color-wynn-border-glow)] p-0"
            >
              <SheetHeader className="px-4 pt-4 pb-2">
                <SheetTitle className="text-white">Advisor</SheetTitle>
                <SheetDescription className="text-[var(--color-wynn-text-muted)]">
                  Beacon &amp; mission recommendations
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-4 overflow-y-auto h-[calc(100%-4rem)]">
                <AdvisorPanel
                  recommendations={recommendations}
                  missionRecommendations={missionRecommendations}
                  onTakeBeacon={takeBeacon}
                  onTakeMission={takeMissionFromAdvisor}
                  state={state}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>
    </div>
  );
}

function ManualField({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: 'number' | 'text';
  value: number | string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-[var(--color-wynn-text-muted)] uppercase tracking-wider">
        {label}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => {
          const v = type === 'number' ? parseInt(e.target.value, 10) || 0 : e.target.value;
          onChange(v as number);
        }}
        className="h-7 text-xs bg-[rgba(10,6,20,0.92)] border-[rgba(192,132,252,0.45)] text-white focus:border-[rgba(232,121,249,0.9)]"
      />
    </div>
  );
}
