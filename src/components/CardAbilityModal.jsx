import { useEffect } from "react";
import { SUIT_INFO } from "../game/constants";

export default function CardAbilityModal({ card, onClose, zClass = "z-[60]" }) {
  const info = SUIT_INFO[card.suit];

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!info) return null;

  return (
    <div
      className={`fixed inset-0 ${zClass} flex items-center justify-center bg-black/70 backdrop-blur-sm p-4`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-ability-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4">
          <span className="text-4xl shrink-0 leading-none" aria-hidden>
            {info.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="card-ability-title"
              className="text-lg font-semibold text-zinc-100 tracking-tight"
            >
              {card.suit}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5 tabular-nums">Value {card.value}</p>
            <p className="text-sm text-zinc-300 leading-relaxed mt-4">{info.desc}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-zinc-600 bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-700 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
