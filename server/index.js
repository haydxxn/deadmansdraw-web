import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  createInitialState, beginTurn, playCard, bankCards,
  drawCard, addLog,
  resolveCannonSuit, resolveSwordSuit, resolveHookSuit, resolveMapCard,
  aiShouldBank,
} from '../src/game/engine.js';
import { SUIT_INFO } from '../src/game/constants.js';

const app  = express();
const http = createServer(app);
const io   = new Server(http, { cors: { origin: '*' } });

const PORT = 3001;

// ── Room store ────────────────────────────────────────────────────────────────
// rooms: Map<code, Room>
// Room = { state, pendingModal, sockets: [id|null, id|null], names: [str, str] }
const rooms = new Map();

function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ── Broadcast helpers ─────────────────────────────────────────────────────────
function stripModal(modal) {
  if (!modal) return null;
  // Remove the non-serializable onAi callback before sending over the wire
  const { onAi: _omit, ...rest } = modal;
  return rest;
}

function broadcastRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  const payload = { state: room.state, modal: stripModal(room.pendingModal) };
  for (const sid of room.sockets) {
    if (sid) io.to(sid).emit('game_update', payload);
  }
}

// ── Process state until it needs player input ──────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function processState(code, state, modal) {
  const room = rooms.get(code);
  if (!room) return;

  // Modal: needs the active player to select
  if (modal) {
    room.state        = state;
    room.pendingModal = modal;
    broadcastRoom(code);
    return;
  }

  room.pendingModal = null;

  // Bust or banked → brief pause, then begin next turn
  if (state.phase === 'bust' || state.phase === 'banked') {
    room.state = state;
    broadcastRoom(code);
    await delay(1400);
    if (!rooms.has(code)) return;
    const next = beginTurn(state);
    room.state = next;
    broadcastRoom(code);
    return;
  }

  // Kraken forced draw
  if (state.phase === 'kraken') {
    room.state = state;
    broadcastRoom(code);
    await delay(700);
    if (!rooms.has(code)) return;
    const [s2, card] = drawCard(state);
    if (!card) {
      const done = { ...state, phase: 'game_over' };
      room.state = done;
      broadcastRoom(code);
      return;
    }
    const p   = s2.players[s2.curIdx];
    const s3  = addLog(s2, `${p.name} draws ${SUIT_INFO[card.suit].emoji} ${card.suit}(${card.value})`);
    const res = playCard(s3, card);
    processState(code, res.state, res.modal);
    return;
  }

  // Game over
  if (state.phase === 'game_over') {
    room.state = state;
    broadcastRoom(code);
    return;
  }

  // draw / decide / oracle — wait for player action
  room.state = state;
  broadcastRoom(code);
}

// ── Socket handlers ──────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] connected: ${socket.id}`);

  // ── Create room ───────────────────────────────────────────────────────────
  socket.on('create_room', ({ name }) => {
    let code = generateCode();
    while (rooms.has(code)) code = generateCode();

    rooms.set(code, {
      state:        null,
      pendingModal: null,
      sockets:      [socket.id, null],
      names:        [name ?? 'Player 1', ''],
    });

    socket.join(code);
    socket.data.roomCode    = code;
    socket.data.playerIndex = 0;
    socket.data.name        = name;

    socket.emit('room_created', { code, playerIndex: 0 });
    console.log(`[room] ${code} created by "${name}" (${socket.id})`);
  });

  // ── Join room ─────────────────────────────────────────────────────────────
  socket.on('join_room', ({ code, name }) => {
    const room = rooms.get(code);
    if (!room) { socket.emit('error', { message: `Room "${code}" not found.` }); return; }
    if (room.sockets[1]) { socket.emit('error', { message: `Room "${code}" is full.` }); return; }

    room.sockets[1] = socket.id;
    room.names[1]   = name ?? 'Player 2';

    socket.join(code);
    socket.data.roomCode    = code;
    socket.data.playerIndex = 1;
    socket.data.name        = name;

    // Both players connected — start the game
    const rawState = createInitialState('_online_');
    // Override player names with the actual names
    const state = {
      ...rawState,
      players: [
        { ...rawState.players[0], name: room.names[0], isHuman: true },
        { ...rawState.players[1], name: room.names[1], isHuman: true },
      ],
    };

    const started = beginTurn(state);
    room.state = started;

    // Tell each player their index
    io.to(room.sockets[0]).emit('game_start', { playerIndex: 0 });
    io.to(room.sockets[1]).emit('game_start', { playerIndex: 1 });

    console.log(`[room] ${code} started: "${room.names[0]}" vs "${room.names[1]}"`);
    processState(code, started, null);
  });

  // ── Player: draw card ─────────────────────────────────────────────────────
  socket.on('player_draw', () => {
    const { roomCode, playerIndex } = socket.data;
    const room = rooms.get(roomCode);
    if (!room || !room.state) return;

    const s = room.state;
    if (s.curIdx !== playerIndex) return; // not your turn
    if (!['draw', 'decide', 'oracle'].includes(s.phase)) return;

    const [s2, card] = drawCard(s);
    if (!card) { processState(roomCode, { ...s, phase: 'game_over' }, null); return; }

    const p   = s2.players[s2.curIdx];
    const s3  = addLog({ ...s2, oraclePeek: null }, `${p.name} draws ${SUIT_INFO[card.suit].emoji} ${card.suit}(${card.value})`);
    const res = playCard(s3, card);
    processState(roomCode, res.state, res.modal);
  });

  // ── Player: bank ──────────────────────────────────────────────────────────
  socket.on('player_bank', () => {
    const { roomCode, playerIndex } = socket.data;
    const room = rooms.get(roomCode);
    if (!room || !room.state) return;

    const s = room.state;
    if (s.curIdx !== playerIndex) return;
    if (!['decide', 'oracle'].includes(s.phase)) return;

    const s2 = addLog(s, `${s.players[playerIndex].name} banks.`);
    processState(roomCode, bankCards(s2), null);
  });

  // ── Player: modal selection ───────────────────────────────────────────────
  socket.on('player_modal_select', ({ idx }) => {
    const { roomCode, playerIndex } = socket.data;
    const room = rooms.get(roomCode);
    if (!room || !room.state || !room.pendingModal) return;

    const s     = room.state;
    const modal = room.pendingModal;
    if (s.curIdx !== playerIndex) return;

    room.pendingModal = null;
    let result;
    switch (modal.type) {
      case 'cannon': result = resolveCannonSuit(s, modal.suits[idx]); break;
      case 'sword':  result = resolveSwordSuit(s, modal.suits[idx]);  break;
      case 'hook':   result = resolveHookSuit(s, modal.suits[idx]);   break;
      case 'map':    result = resolveMapCard(s, idx, modal.cards);    break;
      default: return;
    }
    processState(roomCode, result.state, result.modal);
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const { roomCode } = socket.data;
    console.log(`[-] disconnected: ${socket.id}`);
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    // Notify the other player
    for (const sid of room.sockets) {
      if (sid && sid !== socket.id) {
        io.to(sid).emit('opponent_left');
      }
    }
    rooms.delete(roomCode);
    console.log(`[room] ${roomCode} closed`);
  });
});

http.listen(PORT, () => console.log(`☠ Dead Man's Draw++ server running on :${PORT}`));
