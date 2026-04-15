import { useState } from "react";

export default function OnlineLobby({
  playerName,
  onCreate,
  onJoin,
  onBack,
  error,
}) {
  const [joinCode, setJoinCode] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 px-4
                    bg-zinc-950 text-zinc-100"
    >
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-50">
          Online
        </h2>
        <p className="text-sm text-zinc-500">
          Playing as <span className="text-zinc-300 font-medium">{playerName}</span>
        </p>
      </div>

      <div className="flex flex-col items-center gap-5 border border-zinc-800 rounded-2xl p-8 bg-zinc-900/40 w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 w-full">
          <p className="text-zinc-500 text-xs uppercase tracking-wider font-medium">
            New game
          </p>
          <button
            onClick={onCreate}
            className="w-full py-3 rounded-xl border border-zinc-600 bg-zinc-800 text-zinc-100
                       font-semibold text-sm hover:bg-zinc-700 active:scale-[0.99] transition-all"
          >
            Create room
          </button>
        </div>

        <div className="w-full border-t border-zinc-800" />

        <div className="flex flex-col items-center gap-2 w-full">
          <p className="text-zinc-500 text-xs uppercase tracking-wider font-medium">
            Join room
          </p>
          <input
            type="text"
            maxLength={4}
            placeholder="Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) =>
              e.key === "Enter" && joinCode.length === 4 && onJoin(joinCode)
            }
            className="px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100
                       placeholder-zinc-600 text-center text-lg w-full outline-none tracking-[0.35em]
                       focus:border-zinc-500 transition-colors uppercase font-medium"
          />
          <button
            disabled={joinCode.length !== 4}
            onClick={() => onJoin(joinCode)}
            className="w-full py-3 rounded-xl border border-zinc-500 bg-zinc-100 text-zinc-900
                       font-semibold text-sm hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed
                       active:scale-[0.99] transition-all"
          >
            Join room
          </button>
        </div>

        {error && <p className="text-rose-400 text-sm text-center">{error}</p>}
      </div>

      <button
        onClick={onBack}
        className="text-zinc-500 text-sm font-medium hover:text-zinc-300 transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}
