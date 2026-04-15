import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  createInitialState, beginTurn, playCard, bankCards,
  drawCard, addLog, aiShouldBank, aiShouldBankOracle,
  resolveCannonSuit, resolveSwordSuit, resolveHookSuit, resolveMapCard,
} from './game/engine';
import { SUIT_INFO } from './game/constants';
import StartScreen    from './components/StartScreen';
import OnlineLobby    from './components/OnlineLobby';
import WaitingRoom    from './components/WaitingRoom';
import GameOverScreen from './components/GameOverScreen';
import PlayerArea     from './components/PlayerArea';
import AbilityModal   from './components/AbilityModal';
import GameLog        from './components/GameLog';
import Card           from './components/Card';
import DiscardPileModal from './components/DiscardPileModal';
import CardAbilityModal from './components/CardAbilityModal';

// ── Screen enum ───────────────────────────────────────────────────────────────
// 'start' | 'online_lobby' | 'waiting_room' | 'game_local' | 'game_online'
// ─────────────────────────────────────────────────────────────────────────────

function DiscardFace({ discard }) {
  if (!discard.length)
    return (
      <div
        className="w-20 h-28 rounded-xl border border-zinc-600 bg-zinc-900/80
                   flex items-center justify-center text-zinc-600 text-sm font-medium select-none"
      >
        Empty
      </div>
    );
  return <Card card={discard[discard.length - 1]} size="md" />;
}

export default function App() {
  const [screen,      setScreen]      = useState('start');
  const [myName,      setMyName]      = useState('');
  const [gameState,   setGameState]   = useState(null);
  const [modal,       setModal]       = useState(null);
  const [busting,     setBusting]     = useState(false);
  const [roomCode,    setRoomCode]    = useState('');
  const [myIdx,       setMyIdx]       = useState(0);    // online only
  const [lobbyError,  setLobbyError]  = useState('');
  const [opponentLeft,setOpponentLeft]= useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [inspectCard, setInspectCard] = useState(null);

  const socketRef = useRef(null);
  const aiTimer   = useRef(null);
  const socketConnectTimeoutRef = useRef(null);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(aiTimer.current);
      clearTimeout(socketConnectTimeoutRef.current);
      socketRef.current?.disconnect();
    };
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  //  LOCAL (vs AI) GAME
  // ══════════════════════════════════════════════════════════════════════════

  function scheduleLocalAi(s) {
    if (s.players[s.curIdx].isHuman) return;
    if (s.phase === 'draw')   aiTimer.current = setTimeout(() => localTriggerDraw(s), 800);
    if (s.phase === 'decide') aiTimer.current = setTimeout(() => localAiDecide(s), 700);
    if (s.phase === 'oracle') aiTimer.current = setTimeout(() => localAiOracle(s), 700);
  }

  function localTriggerDraw(s) {
    const [s2, card] = drawCard(s);
    if (!card) { setGameState({ ...s, phase: 'game_over' }); return; }
    const s3 = addLog(s2, `${s.players[s.curIdx].name} draws ${SUIT_INFO[card.suit].emoji} ${card.suit}(${card.value})`);
    applyLocalResult(playCard(s3, card));
  }

  function localAiDecide(s) {
    if (aiShouldBank(s)) {
      applyLocalResult({ state: bankCards(addLog(s, `${s.players[s.curIdx].name} banks.`)), modal: null });
    } else {
      localTriggerDraw(addLog(s, `${s.players[s.curIdx].name} draws again.`));
    }
  }

  function localAiOracle(s) {
    if (aiShouldBankOracle(s)) {
      applyLocalResult({ state: bankCards(addLog(s, `${s.players[s.curIdx].name} (Oracle) banks.`)), modal: null });
    } else {
      localAiDecide({ ...s, oraclePeek: null });
    }
  }

  const applyLocalResult = useCallback(function applyLocalResultCb({ state: ns, modal: nm }) {
    if (nm) {
      setGameState(ns);
      if (ns.players[ns.curIdx].isHuman) {
        setModal(nm);
      } else {
        setModal(null);
        aiTimer.current = setTimeout(() => applyLocalResultCb(nm.onAi(ns)), 600);
      }
      return;
    }
    setModal(null);

    if (ns.phase === 'bust') {
      setBusting(true);
      setTimeout(() => setBusting(false), 1400);
    }
    if (ns.phase === 'game_over') { setGameState(ns); return; }
    if (ns.phase === 'bust' || ns.phase === 'banked') {
      const next = beginTurn(ns);
      setGameState(next);
      scheduleLocalAi(next);
      return;
    }
    if (ns.phase === 'kraken') {
      setGameState(ns);
      const delay = ns.players[ns.curIdx].isHuman ? 900 : 700;
      aiTimer.current = setTimeout(() => localTriggerDraw(ns), delay);
      return;
    }
    setGameState(ns);
    scheduleLocalAi(ns);
  }, []); // eslint-disable-line

  function startLocalGame(name) {
    clearTimeout(aiTimer.current);
    setMyName(name);
    setModal(null);
    setDiscardModalOpen(false);
    setInspectCard(null);
    setBusting(false);
    const s0 = createInitialState(name);
    const s1 = beginTurn(s0);
    setGameState(s1);
    setScreen('game_local');
    scheduleLocalAi(s1);
  }

  // ── Human actions (local) ─────────────────────────────────────────────────
  function localDraw() {
    if (!gameState) return;
    if (!['draw', 'decide', 'oracle'].includes(gameState.phase)) return;
    if (gameState.curIdx !== 0) return;
    const [s2, card] = drawCard(gameState);
    if (!card) { setGameState({ ...gameState, phase: 'game_over' }); return; }
    const s3 = addLog({ ...s2, oraclePeek: null }, `You draw ${SUIT_INFO[card.suit].emoji} ${card.suit}(${card.value})`);
    applyLocalResult(playCard(s3, card));
  }

  function localBank() {
    if (!gameState) return;
    if (!['decide', 'oracle'].includes(gameState.phase)) return;
    if (gameState.curIdx !== 0) return;
    applyLocalResult({ state: bankCards(addLog(gameState, 'You bank.')), modal: null });
  }

  function localModalSelect(idx) {
    setModal(null);
    if (!modal || !gameState) return;
    let result;
    switch (modal.type) {
      case 'cannon': result = resolveCannonSuit(gameState, modal.suits[idx]); break;
      case 'sword':  result = resolveSwordSuit(gameState, modal.suits[idx]);  break;
      case 'hook':   result = resolveHookSuit(gameState, modal.suits[idx]);   break;
      case 'map':    result = resolveMapCard(gameState, idx, modal.cards);    break;
      default: return;
    }
    applyLocalResult(result);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ONLINE MULTIPLAYER
  // ══════════════════════════════════════════════════════════════════════════

  function connectSocket() {
    socketRef.current?.disconnect();
    const sock = io({
      transports: ['websocket', 'polling'],
      reconnection: false,
    });
    socketRef.current = sock;

    clearTimeout(socketConnectTimeoutRef.current);
    socketConnectTimeoutRef.current = setTimeout(() => {
      if (sock.connected) return;
      setLobbyError("Couldn't reach the online server. Start it with `npm run dev:all` (or `npm run server`).");
      try { sock.disconnect(); } catch { /* ignore */ }
    }, 2500);

    sock.on('connect', () => {
      clearTimeout(socketConnectTimeoutRef.current);
    });

    sock.on('connect_error', () => {
      clearTimeout(socketConnectTimeoutRef.current);
      setLobbyError("Couldn't connect to the online server. Start it with `npm run dev:all` (or `npm run server`).");
    });

    sock.on('room_created', ({ code, playerIndex }) => {
      setRoomCode(code);
      setMyIdx(playerIndex);
      setScreen('waiting_room');
    });

    sock.on('game_start', ({ playerIndex }) => {
      setMyIdx(playerIndex);
      setModal(null);
      setOpponentLeft(false);
    });

    sock.on('game_update', ({ state, modal: m }) => {
      setGameState(state);
      setModal(m ?? null);
      if (state.phase === 'bust') {
        setBusting(true);
        setTimeout(() => setBusting(false), 1400);
      }
      if (screen !== 'game_online') setScreen('game_online');
    });

    sock.on('opponent_left', () => {
      setOpponentLeft(true);
    });

    sock.on('error', ({ message }) => {
      setLobbyError(message);
    });

    return sock;
  }

  function goToOnlineLobby(name) {
    setMyName(name);
    setLobbyError('');
    setScreen('online_lobby');
  }

  function handleCreateRoom() {
    setLobbyError('');
    const sock = connectSocket();
    if (sock.connected) {
      sock.emit('create_room', { name: myName });
      return;
    }
    sock.once('connect', () => sock.emit('create_room', { name: myName }));
  }

  function handleJoinRoom(code) {
    setLobbyError('');
    const sock = connectSocket();
    if (sock.connected) {
      sock.emit('join_room', { code, name: myName });
      return;
    }
    sock.once('connect', () => sock.emit('join_room', { code, name: myName }));
  }

  // ── Online human actions (emit to server) ────────────────────────────────
  function onlineDraw() {
    if (!gameState || gameState.curIdx !== myIdx) return;
    if (!['draw', 'decide', 'oracle'].includes(gameState.phase)) return;
    socketRef.current?.emit('player_draw');
  }

  function onlineBank() {
    if (!gameState || gameState.curIdx !== myIdx) return;
    if (!['decide', 'oracle'].includes(gameState.phase)) return;
    socketRef.current?.emit('player_bank');
  }

  function onlineModalSelect(idx) {
    setModal(null);
    socketRef.current?.emit('player_modal_select', { idx });
  }

  function cancelOnline() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setGameState(null);
    setModal(null);
    setRoomCode('');
    setOpponentLeft(false);
    setDiscardModalOpen(false);
    setInspectCard(null);
    setScreen('start');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SHARED RENDER HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  function resetToStart() {
    clearTimeout(aiTimer.current);
    socketRef.current?.disconnect();
    socketRef.current = null;
    setGameState(null);
    setModal(null);
    setScreen('start');
    setOpponentLeft(false);
    setBusting(false);
    setDiscardModalOpen(false);
    setInspectCard(null);
  }

  // ── Screen routing ────────────────────────────────────────────────────────
  if (screen === 'start') {
    return <StartScreen onPlayLocal={startLocalGame} onPlayOnline={goToOnlineLobby} />;
  }

  if (screen === 'online_lobby') {
    return (
      <OnlineLobby
        playerName={myName}
        onCreate={handleCreateRoom}
        onJoin={handleJoinRoom}
        onBack={() => setScreen('start')}
        error={lobbyError}
      />
    );
  }

  if (screen === 'waiting_room') {
    return (
      <WaitingRoom
        roomCode={roomCode}
        playerName={myName}
        onCancel={cancelOnline}
      />
    );
  }

  // ── Game screen (local or online) ─────────────────────────────────────────
  if (!gameState) return null;

  const isOnline  = screen === 'game_online';
  const isMyTurn  = isOnline ? gameState.curIdx === myIdx : gameState.curIdx === 0;
  const myPlayer  = isOnline ? gameState.players[myIdx]     : gameState.players[0];
  const oppPlayer = isOnline ? gameState.players[1 - myIdx] : gameState.players[1];

  const canDraw = isMyTurn && ['draw', 'decide', 'oracle'].includes(gameState.phase);
  const canBank = isMyTurn && ['decide', 'oracle'].includes(gameState.phase) && myPlayer.playArea.length > 0;

  const handleDraw        = isOnline ? onlineDraw        : localDraw;
  const handleBank        = isOnline ? onlineBank        : localBank;
  const handleModalSelect = isOnline ? onlineModalSelect : localModalSelect;

  const peek          = gameState.oraclePeek;
  const peekWouldBust = peek && myPlayer.playArea.some(c => c.suit === peek.suit);

  const statusText = (() => {
    if (opponentLeft)                      return '😢 Opponent disconnected.';
    if (gameState.phase === 'game_over')   return '⚓ Game Over';
    if (gameState.phase === 'bust')        return `💥 BUST! ${gameState.players[gameState.curIdx].name} loses everything!`;
    if (gameState.phase === 'banked')      return '✅ Banked! Next turn…';
    if (!isMyTurn)                         return `${oppPlayer.name} is thinking…`;
    if (gameState.phase === 'draw')        return 'Your turn! Draw your first card.';
    if (gameState.phase === 'oracle')      return '🔮 Oracle peek — draw again or bank?';
    return `Play area: ${myPlayer.playArea.length} card(s). Draw again or bank?`;
  })();

  // Determine which player area is "top" (opponent) and "bottom" (me)
  const topPlayer = oppPlayer;
  const btmPlayer = myPlayer;
  const topActive = !isMyTurn;
  const btmActive = isMyTurn;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">

      {/* ── Header ──────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 bg-zinc-900/90 border-b border-zinc-800 shrink-0 z-10 backdrop-blur-sm">
        <h1 className="text-zinc-100 text-lg font-semibold tracking-tight">Dead Man&apos;s Draw++</h1>
        <div className="flex items-center gap-4">
          {isOnline && (
            <span className="text-xs bg-zinc-800 border border-zinc-600 text-zinc-300 px-2.5 py-1 rounded-md font-medium tabular-nums">
              Room {roomCode}
            </span>
          )}
          <div className="text-right text-xs text-zinc-500 leading-5">
            <div>
              Turn{' '}
              <span className="text-zinc-200 font-semibold tabular-nums">
                {Math.min(gameState.totalTurn, gameState.maxTurns)}
              </span>{' '}
              / {gameState.maxTurns}
            </div>
            <div className="text-zinc-400">{isMyTurn ? 'Your turn' : `${oppPlayer.name}'s turn`}</div>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">

          {/* Opponent area (top) */}
          <div className="flex-1 overflow-auto min-h-0">
            <PlayerArea
              player={topPlayer}
              isActive={topActive}
              isOpponent
              onInspectCard={setInspectCard}
            />
          </div>

          {/* Controls strip */}
          <div className={[
            'flex items-center gap-5 px-5 py-4 border-y border-zinc-800 shrink-0 transition-colors duration-500',
            busting ? 'bg-rose-950/35' : 'bg-zinc-900/80',
          ].join(' ')}>

            {/* Deck */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className="w-20 h-28 rounded-xl border border-dashed border-zinc-600 bg-zinc-900/60
                           bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(255,255,255,0.03)_6px,rgba(255,255,255,0.03)_7px)]"
                aria-hidden
              />
              <span className="text-[11px] font-medium text-zinc-500 tabular-nums">Deck {gameState.deck.length}</span>
            </div>

            {/* Discard — opens full pile */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setDiscardModalOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDiscardModalOpen(true);
                  }
                }}
                className="rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                aria-label={`Discard pile, ${gameState.discard.length} cards. Activate to view all.`}
              >
                <DiscardFace discard={gameState.discard} />
              </div>
              <span className="text-[11px] font-medium text-zinc-500 tabular-nums">
                Discard {gameState.discard.length}
              </span>
            </div>

            {/* Status + oracle peek */}
            <div className="flex-1 text-center px-2 min-w-0">
              <p className="text-sm text-zinc-200 leading-snug font-medium">{statusText}</p>
              {peek && isMyTurn && (
                <div className={[
                  'mt-2 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border',
                  peekWouldBust
                    ? 'bg-rose-950/50 border-rose-800/80 text-rose-200'
                    : 'bg-violet-950/40 border-violet-800/60 text-violet-200',
                ].join(' ')}>
                  Next: <strong className="tabular-nums">{SUIT_INFO[peek.suit].emoji} {peek.suit} ({peek.value})</strong>
                  {peekWouldBust ? ' — would bust' : ' — safe'}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleDraw}
                disabled={!canDraw}
                className="px-4 py-2.5 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100
                           text-sm font-semibold hover:bg-zinc-700 disabled:opacity-35
                           disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              >
                Draw
              </button>
              <button
                onClick={handleBank}
                disabled={!canBank}
                className="px-4 py-2.5 rounded-lg border border-zinc-500 bg-zinc-100 text-zinc-900
                           text-sm font-semibold hover:bg-white disabled:opacity-35
                           disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              >
                Bank
              </button>
            </div>
          </div>

          {/* My area (bottom) */}
          <div className="flex-1 overflow-auto min-h-0">
            <PlayerArea
              player={btmPlayer}
              isActive={btmActive}
              isOpponent={false}
              onInspectCard={setInspectCard}
            />
          </div>
        </div>

        {/* Log panel */}
        <div className="w-60 border-l border-zinc-800 bg-zinc-950 p-3 overflow-hidden flex flex-col shrink-0">
          <GameLog log={gameState.log} />
        </div>
      </div>

      {discardModalOpen && (
        <DiscardPileModal
          discard={gameState.discard}
          onClose={() => {
            setDiscardModalOpen(false);
            setInspectCard(null);
          }}
          onInspectCard={setInspectCard}
        />
      )}

      {inspectCard && (
        <CardAbilityModal
          card={inspectCard}
          onClose={() => setInspectCard(null)}
        />
      )}

      {/* Modals */}
      {modal && isMyTurn && (
        <AbilityModal modal={modal} onSelect={handleModalSelect} />
      )}
      {gameState.phase === 'game_over' && (
        <GameOverScreen players={gameState.players} myIdx={isOnline ? myIdx : 0} onRestart={resetToStart} />
      )}
      {opponentLeft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 text-center max-w-sm shadow-xl">
            <p className="text-lg font-semibold text-zinc-100 mb-1">Opponent disconnected</p>
            <p className="text-sm text-zinc-500 mb-6">The room was closed.</p>
            <button
              onClick={resetToStart}
              className="px-6 py-2.5 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 font-medium hover:bg-zinc-700 transition-colors w-full"
            >
              Back to menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
