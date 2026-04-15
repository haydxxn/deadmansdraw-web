import { useState } from "react";
import { SUIT_INFO } from "../game/constants";

export default function StartScreen({ onPlayLocal, onPlayOnline }) {
  const [name, setName] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 px-4
                    bg-zinc-950 text-zinc-100"
    >
      <div className="text-center space-y-2 max-w-lg">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
          Dead Man&apos;s Draw++
        </h1>
        <p className="text-zinc-500 text-sm font-medium">
          A pirate card game of luck and strategy
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
        <label className="text-zinc-500 text-xs uppercase tracking-wider font-medium self-start">
          Your name
        </label>
        <input
          type="text"
          maxLength={16}
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && name.trim() && onPlayLocal(name.trim())
          }
          className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100
                     placeholder-zinc-600 text-center text-base outline-none
                     focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
          autoFocus
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md">
        <button
          disabled={!name.trim()}
          onClick={() => onPlayLocal(name.trim())}
          className="flex-1 py-3 rounded-xl border border-zinc-600 bg-zinc-800 text-zinc-100
                     text-sm font-semibold hover:bg-zinc-700 disabled:opacity-30
                     disabled:cursor-not-allowed active:scale-[0.99] transition-all"
        >
          vs AI
        </button>
        <button
          disabled={!name.trim()}
          onClick={() => onPlayOnline(name.trim())}
          className="flex-1 py-3 rounded-xl border border-zinc-500 bg-zinc-100 text-zinc-900
                     text-sm font-semibold hover:bg-white disabled:opacity-30
                     disabled:cursor-not-allowed active:scale-[0.99] transition-all"
        >
          vs Human (online)
        </button>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 max-w-2xl w-full text-xs border border-zinc-800 rounded-2xl p-5 bg-zinc-900/50"
      >
        {Object.entries(SUIT_INFO).map(([suit, info]) => (
          <div key={suit} className="flex items-start gap-2">
            <span className="text-base leading-none shrink-0">{info.emoji}</span>
            <div className="min-w-0">
              <span className="text-zinc-300 font-medium">{suit}</span>
              <p className="text-zinc-500 leading-snug mt-0.5">{info.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-zinc-600 text-xs max-w-sm text-center leading-relaxed">
        Same suit twice in your play area ={" "}
        <span className="text-rose-400 font-medium">bust</span>. Score is the sum of your highest
        card per suit in your bank.
      </p>
    </div>
  );
}
