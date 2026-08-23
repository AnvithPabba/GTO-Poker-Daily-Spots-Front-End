import type { AttemptResource, DailyGame, PublicSpot } from "@poker-trainer/contracts";

export const publicSpotFixture: PublicSpot = {
  schemaVersion: 3,
  spotId: "fixture-spot",
  spotVersionId: "fixture-spot-v3",
  publicationDate: "2026-08-22",
  slotOrder: 1,
  preflop: {
    status: "known",
    scenarioId: "2bet_call",
    label: "BTN opens, BB calls",
    summary: "A single-raised pot with BTN in position against the BB caller.",
    actions: [
      { sequence: 1, actor: "ip", position: "BTN", type: "open", amountBb: 2.5, label: "BTN opens to 2.5 bb" },
      { sequence: 2, actor: "oop", position: "BB", type: "call", amountBb: 2.5, label: "BB calls" },
    ],
    rangeAssumptions: {
      ip: { presetId: "open_ip", label: "BTN opening range", cells: [{ handClass: "AA", inclusionBasisPoints: 10_000 }, { handClass: "A5s", inclusionBasisPoints: 5_000 }] },
      oop: { presetId: "call_oop", label: "BB calling range", cells: [{ handClass: "KQs", inclusionBasisPoints: 7_500 }] },
    },
  },
  initialState: { board: ["Qs", "Jh", "2h"], pot: 50, stacks: { ip: 100, oop: 100 }, street: "flop", actor: "oop", allIn: { ip: false, oop: false } },
  history: [
    { kind: "deal_hole", actor: "ip", cards: ["Ah", "As"] },
    { kind: "deal_board", street: "flop", cards: ["Qs", "Jh", "2h"] },
    { kind: "action", actor: "oop", actionId: "history-check", actionType: "check", solverLabel: "CHECK" },
    { kind: "decision", actor: "ip" },
  ],
  decision: { board: ["Qs", "Jh", "2h"], pot: 50, stacks: { ip: 100, oop: 100 }, street: "flop", actor: "ip", allIn: { ip: false, oop: false } },
  legalActions: [
    { id: "a0", type: "check", displayLabel: "Check", solverLabel: "CHECK", isAllIn: false },
    { id: "a1", type: "bet", amount: 25, displayLabel: "Bet 25", solverLabel: "BET 25", isAllIn: false },
    { id: "a2", type: "bet", amount: 75, displayLabel: "Bet 75", solverLabel: "BET 75", isAllIn: false },
  ],
  featuredCombo: "AhAs",
  selectableCombos: [
    { combo: "AhAs", category: "pair" },
    { combo: "AcAd", category: "pair" },
    { combo: "AdAs", category: "pair" },
    { combo: "KcKd", category: "pair" },
  ],
  presentation: { heroActor: "ip", dealerActor: "ip", positions: { ip: "BTN", oop: "BB" }, holdingVisibility: "featured_hero", chipUnit: "bb" },
};

export const dailyGameFixture: DailyGame = {
  date: "2026-08-22",
  requestedDate: "2026-08-22",
  timezone: "America/Los_Angeles",
  fallback: { active: false },
  spots: [{ spotId: "fixture-spot", spotVersionId: "fixture-spot-v3", sequence: 1, title: "BTN versus BB flop", street: "flop", heroPosition: "BTN", completed: false }],
  progress: { completedSpots: 0, totalSpots: 1, status: "not_started", nextSpot: { id: "fixture-spot", sequence: 1 }, scorePoints: 0, maximumScorePoints: 1_000 },
};

export const attemptFixture: AttemptResource = {
  attemptId: "fixture-attempt",
  spotId: "fixture-spot",
  spotVersionId: "fixture-spot-v3",
  createdAt: "2026-08-22T20:00:00.000Z",
  attemptKind: "official",
  metric: { key: "l1", version: 1 },
  aggregator: { key: "equal_average", version: 1 },
  score: { points: 875, maximumPoints: 1_000, similarityBasisPoints: 8_750 },
  hands: [{
    combo: "AhAs",
    similarityBasisPoints: 8_750,
    gtoMajorityActionId: "a1",
    actions: [
      { actionId: "a0", submittedBasisPoints: 2_500, gtoBasisPoints: 1_250, signedDifferenceBasisPoints: 1_250, absoluteDifferenceBasisPoints: 1_250 },
      { actionId: "a1", submittedBasisPoints: 7_500, gtoBasisPoints: 8_750, signedDifferenceBasisPoints: -1_250, absoluteDifferenceBasisPoints: 1_250 },
      { actionId: "a2", submittedBasisPoints: 0, gtoBasisPoints: 0, signedDifferenceBasisPoints: 0, absoluteDifferenceBasisPoints: 0 },
    ],
  }],
  progress: { completedSpots: 1, totalSpots: 1, status: "completed", nextSpot: null, scorePoints: 875, maximumScorePoints: 1_000 },
};
