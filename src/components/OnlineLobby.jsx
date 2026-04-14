import { useState } from 'react';

export default function OnlineLobby({ playerName, onCreate, onJoin, onBack, error }) {
  const [joinCode, setJoinCode] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6
                    bg-[radial-gradient(ellipse_at_center,_#0a1020_0%,_#020408_100%)]">

      <h2 className="text-4xl font-bold text-sky-300 tracking-wide">🌐 Online Multiplayer</h2>
      <p className="text-sky-700 text-sm">Playing as <span className="text-sky-400 font-semibold">{playerName}</span></p>

      <div className="flex flex-col items-center gap-5 border border-sky-900 rounded-2xl p-8 bg-black/30 w-72">

        {/* Create room */}
        <div className="flex flex-col items-center gap-2 w-full">
          <p className="text-sky-600 text-xs uppercase tracking-widest">Start a new game</p>
          <button
            onClick={onCreate}
            className="w-full py-3 rounded-xl border-2 border-sky-600 bg-sky-950 text-sky-300
                       font-semibold hover:bg-sky-900 active:scale-95 transition-all duration-150"
          >
            ⚓ Create Room
          </button>
        </div>

        <div className="w-full border-t border-sky-900/50 my-1" />

        {/* Join room */}
        <div className="flex flex-col items-center gap-2 w-full">
          <p className="text-sky-600 text-xs uppercase tracking-widest">Join a friend's room</p>
          <input
            type="text"
            maxLength={4}
            placeholder="Room code…"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && joinCode.length === 4 && onJoin(joinCode)}
            className="px-3 py-2 rounded-lg border-2 border-sky-800 bg-stone-900 text-sky-200
                       placeholder-sky-900 text-center text-lg w-full outline-none tracking-[0.3em]
                       focus:border-sky-600 transition-colors uppercase"
          />
          <button
            disabled={joinCode.length !== 4}
            onClick={() => onJoin(joinCode)}
            className="w-full py-3 rounded-xl border-2 border-emerald-700 bg-emerald-950 text-emerald-300
                       font-semibold hover:bg-emerald-900 disabled:opacity-30 disabled:cursor-not-allowed
                       active:scale-95 transition-all duration-150"
          >
            🚪 Join Room
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>

      <button onClick={onBack} className="text-sky-800 text-sm hover:text-sky-600 transition-colors">
        ← Back
      </button>
    </div>
  );
}
