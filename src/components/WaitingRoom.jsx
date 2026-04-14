export default function WaitingRoom({ roomCode, playerName, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6
                    bg-[radial-gradient(ellipse_at_center,_#0a1020_0%,_#020408_100%)]">
      <div className="text-5xl animate-bounce">⚓</div>
      <h2 className="text-3xl font-bold text-sky-300">Waiting for opponent…</h2>
      <p className="text-sky-700 text-sm">Share this code with your friend:</p>

      <div className="flex flex-col items-center gap-2">
        <div className="px-8 py-4 rounded-2xl border-2 border-yellow-600 bg-yellow-950/30 text-center">
          <span className="text-5xl font-bold tracking-[0.3em] text-yellow-300">{roomCode}</span>
        </div>
        <button
          onClick={() => navigator.clipboard?.writeText(roomCode)}
          className="text-xs text-yellow-700 hover:text-yellow-500 transition-colors"
        >
          📋 Copy code
        </button>
      </div>

      <p className="text-sky-800 text-sm">Playing as <span className="text-sky-400">{playerName}</span></p>

      <button onClick={onCancel} className="text-sky-900 text-sm hover:text-sky-700 transition-colors mt-2">
        Cancel
      </button>
    </div>
  );
}
