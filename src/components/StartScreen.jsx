import { useState } from 'react';
import { SUIT_INFO } from '../game/constants';

export default function StartScreen({ onPlayLocal, onPlayOnline }) {
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6
                    bg-[radial-gradient(ellipse_at_center,_#1c1410_0%,_#050302_100%)]">

      <h1 className="text-6xl font-bold text-yellow-300 text-center leading-tight tracking-wide
                     drop-shadow-[0_0_30px_rgba(240,200,64,0.5)]">
        ☠ Dead Man's<br />Draw++
      </h1>
      <p className="text-yellow-700 tracking-widest text-sm">A pirate card game of luck and strategy</p>

      {/* Name input */}
      <div className="flex flex-col items-center gap-2">
        <label className="text-yellow-600 text-sm uppercase tracking-widest">Your Name</label>
        <input
          type="text"
          maxLength={16}
          placeholder="Enter your name…"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onPlayLocal(name.trim())}
          className="px-4 py-2 rounded-lg border-2 border-yellow-800 bg-stone-900 text-yellow-200
                     placeholder-yellow-900 text-center text-lg w-56 outline-none
                     focus:border-yellow-600 transition-colors"
          autoFocus
        />
      </div>

      {/* Mode buttons */}
      <div className="flex gap-4">
        <button
          disabled={!name.trim()}
          onClick={() => onPlayLocal(name.trim())}
          className="px-7 py-3 rounded-xl border-2 border-yellow-700 bg-yellow-950 text-yellow-300
                     text-base font-semibold hover:bg-yellow-900 disabled:opacity-30
                     disabled:cursor-not-allowed active:scale-95 transition-all duration-150"
        >
          🤖 vs AI
        </button>
        <button
          disabled={!name.trim()}
          onClick={() => onPlayOnline(name.trim())}
          className="px-7 py-3 rounded-xl border-2 border-sky-700 bg-sky-950 text-sky-300
                     text-base font-semibold hover:bg-sky-900 disabled:opacity-30
                     disabled:cursor-not-allowed active:scale-95 transition-all duration-150"
        >
          🌐 Play Online
        </button>
      </div>

      {/* Suit legend */}
      <div className="grid grid-cols-3 gap-2 max-w-lg text-xs text-yellow-700 border border-yellow-900
                      rounded-xl p-4 bg-black/30">
        {Object.entries(SUIT_INFO).map(([suit, info]) => (
          <div key={suit} className="flex items-start gap-1.5">
            <span className="text-base leading-none">{info.emoji}</span>
            <div>
              <span className="text-yellow-500 font-semibold">{suit}</span>
              <p className="text-[10px] leading-tight opacity-80">{info.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-yellow-900 text-xs max-w-xs text-center leading-relaxed">
        Draw the same suit twice = <span className="text-red-500">BUST</span>.<br />
        Score = highest card per suit in your bank.
      </p>
    </div>
  );
}
