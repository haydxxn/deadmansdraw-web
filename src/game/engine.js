import { SUIT_INFO, AI_NAMES, MAX_TURNS } from "./constants.js";

// ── Deck helpers ────────────────────────────────────────────────────────────
export function createDeck() {
  const deck = [];
  for (const suit in SUIT_INFO)
    for (const v of SUIT_INFO[suit].vals) deck.push({ suit, value: v });
  return deck;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Player / bank helpers ───────────────────────────────────────────────────
export function calcScore(bank) {
  const best = {};
  for (const c of bank)
    if (!best[c.suit] || c.value > best[c.suit]) best[c.suit] = c.value;
  return Object.values(best).reduce((a, b) => a + b, 0);
}

export function bankSuits(bank) {
  return [...new Set(bank.map((c) => c.suit))];
}

export function topOfSuit(bank, suit) {
  return (
    bank.filter((c) => c.suit === suit).sort((a, b) => b.value - a.value)[0] ??
    null
  );
}

export function hasSuit(area, suit) {
  return area.some((c) => c.suit === suit);
}

export function removeTop(bank, suit) {
  const top = topOfSuit(bank, suit);
  if (!top) return [bank, null];
  return [bank.filter((c) => c !== top), top];
}

export function groupBySuit(bank) {
  const g = {};
  for (const c of bank) {
    if (!g[c.suit]) g[c.suit] = [];
    g[c.suit].push(c);
  }
  for (const s in g) g[s].sort((a, b) => b.value - a.value);
  return g;
}

// ── Initial state ────────────────────────────────────────────────────────────
export function createInitialState(humanName = "You") {
  const aiName = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
  return {
    deck: shuffle(createDeck()),
    discard: [],
    players: [
      { name: humanName, playArea: [], bank: [], isHuman: true },
      { name: aiName, playArea: [], bank: [], isHuman: false },
    ],
    curIdx: 0,
    totalTurn: 1,
    maxTurns: MAX_TURNS,
    // phase: 'start' | 'draw' | 'decide' | 'oracle' | 'bust' | 'banked' | 'game_over'
    // For abilities needing user input, 'modal' is used (pendingModal holds context)
    phase: "draw",
    krakenLeft: 0,
    oraclePeek: null, // Card | null
    pendingModal: null, // { type, cards, suits, onAi } for AI auto-resolve
    log: [],
  };
}

// ── Pure state reducers ──────────────────────────────────────────────────────
// All mutators return a NEW state object (immutable pattern for React)

export function addLog(state, msg, cls = "") {
  return {
    ...state,
    log: [{ msg, cls, id: Date.now() + Math.random() }, ...state.log].slice(
      0,
      60,
    ),
  };
}

function setPhase(state, phase) {
  return { ...state, phase };
}

function updatePlayer(state, idx, update) {
  const players = state.players.map((p, i) =>
    i === idx ? { ...p, ...update } : p,
  );
  return { ...state, players };
}

// Draw from deck top
export function drawCard(state) {
  if (!state.deck.length) return null;
  return [{ ...state, deck: state.deck.slice(1) }, state.deck[0]];
}

export function drawFromDiscard(state) {
  if (!state.discard.length) return [state, null];
  return [
    { ...state, discard: state.discard.slice(0, -1) },
    state.discard[state.discard.length - 1],
  ];
}

export function pushDiscard(state, ...cards) {
  return { ...state, discard: [...state.discard, ...cards] };
}

// ── Core game actions (return new state + optional pending modal) ─────────────

export function beginTurn(state) {
  const idx = state.curIdx;
  let s = updatePlayer(state, idx, { playArea: [] });
  s = { ...s, krakenLeft: 0, oraclePeek: null, pendingModal: null };
  s = setPhase(s, "draw");
  s = addLog(s, `— ${s.players[idx].name}'s Turn (${s.totalTurn}) —`, "turn");
  return s;
}

/** Returns { state, modal: null | { type, cards, suits } } */
export function playCard(stateIn, card) {
  let s = stateIn;
  const idx = s.curIdx;
  const p = s.players[idx];

  // ── BUST CHECK ──────────────────────────────────────────────────────────
  if (hasSuit(p.playArea, card.suit)) {
    s = addLog(s, `BUST! ${p.name} loses all play area cards!`, "bust");
    const all = [...p.playArea, card];
    s = pushDiscard(s, ...all);
    s = updatePlayer(s, idx, { playArea: [] });
    s = setPhase(s, "bust");
    s = nextTurnState(s);
    return { state: s, modal: null };
  }

  // Add card to play area
  s = updatePlayer(s, idx, { playArea: [...p.playArea, card] });

  // ── ABILITY ─────────────────────────────────────────────────────────────
  return resolveAbility(s, card);
}

function resolveAbility(stateIn, card) {
  let s = stateIn;
  const idx = s.curIdx;
  const oppIdx = 1 - idx;
  const p = s.players[idx];
  const opp = s.players[oppIdx];

  switch (card.suit) {
    case "Cannon": {
      const suits = bankSuits(opp.bank);
      if (!suits.length) {
        s = addLog(s, `💣 Cannon: opponent's bank is empty.`);
        return afterAbility(s);
      }
      return {
        state: s,
        modal: {
          type: "cannon",
          title: "💣 Cannon — Discard opponent's highest card",
          desc: `Choose a suit from ${opp.name}'s bank:`,
          cards: suits.map((suit) => topOfSuit(opp.bank, suit)),
          suits,
          onAi: (st) => {
            // AI picks the suit with highest top card
            const best = suits.reduce((a, b) =>
              topOfSuit(st.players[oppIdx].bank, a).value >=
              topOfSuit(st.players[oppIdx].bank, b).value
                ? a
                : b,
            );
            return resolveCannonSuit(st, best);
          },
        },
      };
    }

    case "Chest":
    case "Key": {
      const other = card.suit === "Chest" ? "Key" : "Chest";
      s = addLog(
        s,
        `${SUIT_INFO[card.suit].emoji} ${card.suit}: No immediate effect. Activates with ${other} when banking.`,
      );
      return afterAbility(s);
    }

    case "Sword": {
      const suits = bankSuits(opp.bank);
      if (!suits.length) {
        s = addLog(s, `⚔️ Sword: opponent's bank is empty.`);
        return afterAbility(s);
      }
      return {
        state: s,
        modal: {
          type: "sword",
          title: "⚔️ Sword — Steal opponent's highest card",
          desc: `Choose a suit to steal from ${opp.name}'s bank:`,
          cards: suits.map((suit) => topOfSuit(opp.bank, suit)),
          suits,
          onAi: (st) => {
            const suit = suits[Math.floor(Math.random() * suits.length)];
            return resolveSwordSuit(st, suit);
          },
        },
      };
    }

    case "Hook": {
      const suits = bankSuits(p.bank);
      if (!suits.length) {
        s = addLog(s, `🪝 Hook: your bank is empty.`);
        return afterAbility(s);
      }
      return {
        state: s,
        modal: {
          type: "hook",
          title: "🪝 Hook — Pull back your highest card",
          desc: `Choose a suit from your own bank to pull into play:`,
          cards: suits.map((suit) => topOfSuit(p.bank, suit)),
          suits,
          onAi: (st) => {
            const suit = suits[Math.floor(Math.random() * suits.length)];
            return resolveHookSuit(st, suit);
          },
        },
      };
    }

    case "Oracle": {
      if (!s.deck.length) {
        s = addLog(s, `🔮 Oracle: deck is empty.`);
        return afterAbility(s);
      }
      const peek = s.deck[0];
      s = addLog(
        s,
        `🔮 Oracle reveals next card: ${peek.suit}(${peek.value})`,
        "event",
      );
      s = { ...s, oraclePeek: peek };
      // During Kraken forced draws, no choice — continue
      if (s.krakenLeft > 0) return afterAbility(s);
      // Otherwise go to decide phase so player can act on the info
      s = setPhase(s, "oracle");
      return { state: s, modal: null };
    }

    case "Map": {
      let drawn = [];
      let st = s;
      for (let i = 0; i < 3; i++) {
        const [ns, c] = drawFromDiscard(st);
        if (!c) break;
        st = ns;
        drawn.push(c);
      }
      s = st;
      if (!drawn.length) {
        s = addLog(s, `🗺️ Map: discard pile is empty.`);
        return afterAbility(s);
      }
      s = addLog(
        s,
        `🗺️ Map draws ${drawn.length} card(s) from discard.`,
        "event",
      );
      return {
        state: s,
        modal: {
          type: "map",
          title: "🗺️ Map — Choose one card to add to your play area",
          desc: "The other cards go back to the discard pile.",
          cards: drawn,
          suits: null,
          onAi: (st) => {
            // AI: pick highest value safe card, else highest value
            const p = st.players[st.curIdx];
            const safe = drawn.filter((c) => !hasSuit(p.playArea, c.suit));
            const pool = safe.length ? safe : drawn;
            const best = pool.reduce((a, b) => (a.value >= b.value ? a : b));
            return resolveMapCard(st, drawn.indexOf(best), drawn);
          },
        },
      };
    }

    case "Mermaid": {
      s = addLog(s, `🧜 Mermaid: No ability. High value card.`);
      return afterAbility(s);
    }

    case "Kraken": {
      s = addLog(
        s,
        `🐙 Kraken! Must draw 3 more cards consecutively.`,
        "event",
      );
      s = { ...s, krakenLeft: 3 };
      return afterAbility(s);
    }

    default:
      return afterAbility(s);
  }
}

// ── Ability resolvers (called from modal selection) ──────────────────────────

export function resolveCannonSuit(state, suit) {
  const oppIdx = 1 - state.curIdx;
  const [newBank, card] = removeTop(state.players[oppIdx].bank, suit);
  let s = state;
  if (card) {
    s = updatePlayer(s, oppIdx, { bank: newBank });
    s = pushDiscard(s, card);
    s = addLog(
      s,
      `💣 Cannon discards ${s.players[oppIdx].name}'s ${card.suit}(${card.value}).`,
      "event",
    );
  }
  return afterAbility(s);
}

export function resolveSwordSuit(state, suit) {
  const idx = state.curIdx,
    oppIdx = 1 - idx;
  const [newBank, card] = removeTop(state.players[oppIdx].bank, suit);
  let s = updatePlayer(state, oppIdx, { bank: newBank });
  if (card) {
    s = addLog(
      s,
      `⚔️ Sword steals ${card.suit}(${card.value}) from ${s.players[oppIdx].name}.`,
      "event",
    );
    return addToPlayOrBust(s, card);
  }
  return afterAbility(s);
}

export function resolveHookSuit(state, suit) {
  const idx = state.curIdx;
  const [newBank, card] = removeTop(state.players[idx].bank, suit);
  let s = updatePlayer(state, idx, { bank: newBank });
  if (card) {
    s = addLog(
      s,
      `🪝 Hook pulls ${card.suit}(${card.value}) from bank.`,
      "event",
    );
    return addToPlayOrBust(s, card);
  }
  return afterAbility(s);
}

export function resolveMapCard(state, chosenIdx, cards) {
  let s = state;
  cards.forEach((c, i) => {
    if (i !== chosenIdx) s = pushDiscard(s, c);
  });
  const chosen = cards[chosenIdx];
  s = addLog(
    s,
    `🗺️ Map adds ${chosen.suit}(${chosen.value}) to play area.`,
    "event",
  );
  return addToPlayOrBust(s, chosen);
}

function addToPlayOrBust(stateIn, card) {
  let s = stateIn;
  const idx = s.curIdx;
  const p = s.players[idx];
  if (hasSuit(p.playArea, card.suit)) {
    s = addLog(s, `BUST! ${card.suit} already in play area!`, "bust");
    s = pushDiscard(s, ...p.playArea, card);
    s = updatePlayer(s, idx, { playArea: [] });
    s = setPhase(s, "bust");
    s = nextTurnState(s);
    return { state: s, modal: null };
  }
  s = updatePlayer(s, idx, { playArea: [...p.playArea, card] });
  return afterAbility(s);
}

function afterAbility(stateIn) {
  let s = stateIn;
  if (s.krakenLeft > 0) {
    s = { ...s, krakenLeft: s.krakenLeft - 1 };
    s = addLog(s, `🐙 Kraken forces another draw (${s.krakenLeft} left)…`);
    s = setPhase(s, "kraken"); // UI will auto-draw
    return { state: s, modal: null };
  }
  s = { ...s, oraclePeek: null };
  s = setPhase(s, "decide");
  return { state: s, modal: null };
}

// ── Banking ──────────────────────────────────────────────────────────────────
export function bankCards(stateIn) {
  let s = stateIn;
  const idx = s.curIdx;
  const p = s.players[idx];
  if (!p.playArea.length) return nextTurnState(s);

  const cards = [...p.playArea];
  const hasChest = cards.some((c) => c.suit === "Chest");
  const hasKey = cards.some((c) => c.suit === "Key");

  s = updatePlayer(s, idx, { playArea: [], bank: [...p.bank, ...cards] });
  s = addLog(
    s,
    `${s.players[idx].name} banks ${cards.length} card(s).`,
    "bank",
  );

  if (hasChest && hasKey) {
    s = addLog(
      s,
      `📦🗝️ Chest & Key activated! Drawing ${cards.length} bonus cards from discard.`,
      "event",
    );
    for (let i = 0; i < cards.length; i++) {
      const [ns, bonus] = drawFromDiscard(s);
      if (!bonus) break;
      s = ns;
      s = updatePlayer(s, idx, { bank: [...s.players[idx].bank, bonus] });
      s = addLog(s, `  Bonus: ${bonus.suit}(${bonus.value}) → bank.`, "event");
    }
  }

  s = addLog(
    s,
    `${s.players[idx].name}'s score: ${calcScore(s.players[idx].bank)}`,
    "bank",
  );
  s = setPhase(s, "banked");
  return nextTurnState(s);
}

function nextTurnState(s) {
  const next = s.totalTurn + 1;
  if (next > s.maxTurns || !s.deck.length) {
    return { ...s, phase: "game_over" };
  }
  return { ...s, totalTurn: next, curIdx: 1 - s.curIdx };
}

// ── AI Decision ──────────────────────────────────────────────────────────────
export function aiShouldBank(state) {
  const p = state.players[state.curIdx];
  const n = p.playArea.length;
  return (
    n >= 5 ||
    state.deck.length <= 2 ||
    (n >= 3 && Math.random() < 0.42) ||
    (n >= 2 && Math.random() < 0.2)
  );
}

export function aiShouldBankOracle(state) {
  const p = state.players[state.curIdx];
  if (state.oraclePeek && hasSuit(p.playArea, state.oraclePeek.suit))
    return true;
  return aiShouldBank(state);
}
