export default function WaitingRoom({ roomCode, playerName, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 px-4
                    bg-zinc-950 text-zinc-100"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Waiting for opponent
        </h2>
        <p className="text-sm text-zinc-500">Share this code</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="px-10 py-5 rounded-2xl border border-zinc-700 bg-zinc-900 text-center">
          <span className="text-4xl font-semibold tracking-[0.35em] text-zinc-100 tabular-nums">
            {roomCode}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(roomCode)}
          className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
        >
          Copy code
        </button>
      </div>

      <p className="text-sm text-zinc-500">
        Playing as <span className="text-zinc-300 font-medium">{playerName}</span>
      </p>

      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-zinc-500 font-medium hover:text-zinc-300 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
