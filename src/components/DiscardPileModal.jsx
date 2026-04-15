import { useEffect } from "react";
import Card from "./Card";

export default function DiscardPileModal({ discard, onClose, onInspectCard }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[45] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discard-pile-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close discard pile"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-5 py-4 shrink-0">
          <div>
            <h2
              id="discard-pile-title"
              className="text-lg font-semibold tracking-tight text-zinc-100"
            >
              Discard pile
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {discard.length === 0
                ? "No cards yet."
                : `${discard.length} card${discard.length === 1 ? "" : "s"} — oldest first, top card on the right`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {discard.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-12">
              Cards will appear here as they are discarded.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {discard.map((card, i) => {
                const isTop = i === discard.length - 1;
                return (
                  <div
                    key={`${card.suit}-${card.value}-${i}`}
                    className={`flex flex-col items-center gap-1 ${onInspectCard ? "rounded-xl cursor-pointer focus-within:ring-2 focus-within:ring-zinc-500 focus-within:ring-offset-2 focus-within:ring-offset-zinc-900" : ""}`}
                    role={onInspectCard ? "button" : undefined}
                    tabIndex={onInspectCard ? 0 : undefined}
                    onClick={onInspectCard ? () => onInspectCard(card) : undefined}
                    onKeyDown={
                      onInspectCard
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onInspectCard(card);
                            }
                          }
                        : undefined
                    }
                  >
                    <Card card={card} size="md" />
                    {isTop && (
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                        Top
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
