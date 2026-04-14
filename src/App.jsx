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

// ── Screen enum ───────────────────────────────────────────────────────────────
// 'start' | 'online_lobby' | 'waiting_room' | 'game_local' | 'game_online'
// ─────────────────────────────────────────────────────────────────────────────

function DiscardFace({ discard }) {
  if (!discard.length)
    return (
      <div className="w-14 h-20 rounded-lg border-2 border-yellow-950 bg-stone-950
                      flex items-center justify-center text-yellow-950 text-xl select-none">—</div>
    );
  return <Card card={discard[discard.length - 1]} size="sm" />;
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

  const socketRef = useRef(null);
  const aiTimer   = useRef(null);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(aiTimer.current);
      socketRef.current?.disconnect();
    };
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  //  LOCAL (vs AI) GAME
  // ══════════════════════════════════════════════════════════════════════════

  const applyLocalResult = useCallback(({ state: ns, modal: nm }) => {
    if (nm) {
      setGameState(ns);
      if (ns.players[ns.curIdx].isHuman) {
        setModal(nm);
      } else {
        setModal(null);
        aiTimer.current = setTimeout(() => applyLocalResult(nm.onAi(ns)), 600);
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

  function startLocalGame(name) {
    clearTimeout(aiTimer.current);
    setMyName(name);
    setModal(null);
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
    const sock = io();
    socketRef.current = sock;

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
    sock.emit('create_room', { name: myName });
  }

  function handleJoinRoom(code) {
    setLobbyError('');
    const sock = connectSocket();
    sock.emit('join_room', { code, name: myName });
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
    <div className="flex flex-col h-screen bg-stone-950 overflow-hidden font-serif">

      {/* ── Header ──────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-2.5 bg-gradient-to-b from-stone-900
                         to-stone-950 border-b border-yellow-900/50 shrink-0 z-10">
        <h1 className="text-yellow-300 text-xl font-bold tracking-widest">☠ Dead Man's Draw++</h1>
        <div className="flex items-center gap-4">
          {isOnline && (
            <span className="text-xs bg-sky-900 border border-sky-700 text-sky-300 px-2 py-0.5 rounded-full">
              🌐 Room: {roomCode}
            </span>
          )}
          <div className="text-right text-xs text-yellow-700 leading-5">
            <div>Turn <span className="text-yellow-500 font-semibold">{Math.min(gameState.totalTurn, gameState.maxTurns)}</span> / {gameState.maxTurns}</div>
            <div>{isMyTurn ? 'Your turn' : `${oppPlayer.name}'s turn`}</div>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">

          {/* Opponent area (top) */}
          <div className="flex-1 overflow-auto min-h-0">
            <PlayerArea player={topPlayer} isActive={topActive} isOpponent />
          </div>

          {/* Controls strip */}
          <div className={[
            'flex items-center gap-4 px-5 py-3 border-y-2 border-yellow-900/60 shrink-0 transition-colors duration-500',
            busting ? 'bg-red-950/50' : 'bg-stone-900',
          ].join(' ')}>

            {/* Deck */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-14 h-20 rounded-lg border-2 border-yellow-900 bg-gradient-to-br
                              from-green-950 to-stone-950 flex items-center justify-center text-2xl select-none">
                🏴‍☠️
              </div>
              <span className="text-[10px] text-yellow-800">Deck {gameState.deck.length}</span>
            </div>

            {/* Discard */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <DiscardFace discard={gameState.discard} />
              <span className="text-[10px] text-yellow-800">Discard {gameState.discard.length}</span>
            </div>

            {/* Status + oracle peek */}
            <div className="flex-1 text-center px-2 min-w-0">
              <p className="text-sm text-yellow-200 leading-snug">{statusText}</p>
              {peek && isMyTurn && (
                <div className={[
                  'mt-1.5 inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border',
                  peekWouldBust
                    ? 'bg-red-950 border-red-700 text-red-300'
                    : 'bg-purple-950 border-purple-700 text-purple-300',
                ].join(' ')}>
                  🔮 Next: <strong>{SUIT_INFO[peek.suit].emoji} {peek.suit}({peek.value})</strong>
                  {peekWouldBust ? ' ⚠️ Would BUST!' : ' — Safe'}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleDraw}
                disabled={!canDraw}
                className="px-4 py-2 rounded-lg border-2 border-green-700 bg-green-950 text-green-300
                           text-sm font-semibold hover:bg-green-900 disabled:opacity-30
                           disabled:cursor-not-allowed active:scale-95 transition-all duration-150"
              >
                Draw Card
              </button>
              <button
                onClick={handleBank}
                disabled={!canBank}
                className="px-4 py-2 rounded-lg border-2 border-red-700 bg-red-950 text-red-300
                           text-sm font-semibold hover:bg-red-900 disabled:opacity-30
                           disabled:cursor-not-allowed active:scale-95 transition-all duration-150"
              >
                Bank
              </button>
            </div>
          </div>

          {/* My area (bottom) */}
          <div className="flex-1 overflow-auto min-h-0">
            <PlayerArea player={btmPlayer} isActive={btmActive} isOpponent={false} />
          </div>
        </div>

        {/* Log panel */}
        <div className="w-56 border-l border-yellow-900/50 bg-stone-950 p-3 overflow-hidden flex flex-col shrink-0">
          <GameLog log={gameState.log} />
        </div>
      </div>

      {/* Modals */}
      {modal && isMyTurn && (
        <AbilityModal modal={modal} onSelect={handleModalSelect} />
      )}
      {gameState.phase === 'game_over' && (
        <GameOverScreen players={gameState.players} myIdx={isOnline ? myIdx : 0} onRestart={resetToStart} />
      )}
      {opponentLeft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-stone-900 border-2 border-red-700 rounded-2xl p-8 text-center">
            <p className="text-2xl text-red-300 mb-4">😢 Your opponent disconnected.</p>
            <button onClick={resetToStart} className="px-6 py-2 rounded-xl border-2 border-yellow-600 bg-yellow-950 text-yellow-300 hover:bg-yellow-900 transition-all">
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
