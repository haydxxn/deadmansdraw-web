import Card from "./Card";
import { groupBySuit } from "../game/engine";

/** Renders the bank grouped by suit, stacked vertically within each group */
export default function BankDisplay({ bank, size = "sm", onInspectCard }) {
  if (!bank.length)
    return <p className="text-xs text-zinc-600 py-1">Empty</p>;

  const groups = groupBySuit(bank);

  return (
    <div className="flex flex-wrap gap-3 items-start">
      {Object.entries(groups).map(([suit, cards]) => (
        <div key={suit} className="flex flex-col items-center gap-0.5">
          {/* Stacked cards: each card after first slightly overlaps */}
          <div className="flex flex-col" style={{ gap: "-8px" }}>
            {cards.map((card, i) => (
              <div
                key={i}
                style={{ marginTop: i === 0 ? 0 : "-36px", position: "relative", zIndex: i }}
                className={
                  onInspectCard
                    ? "rounded-xl cursor-pointer focus-within:ring-2 focus-within:ring-zinc-500 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950"
                    : undefined
                }
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
                <Card card={card} size={size} />
              </div>
            ))}
          </div>
          {/* highest (= score contributor) label */}
          <span className="text-[8px] text-zinc-500 uppercase tracking-wider mt-1">
            {suit}
          </span>
        </div>
      ))}
    </div>
  );
}
