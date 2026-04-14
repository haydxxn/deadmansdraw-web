import Card from './Card';
import { groupBySuit } from '../game/engine';

/** Renders the bank grouped by suit, stacked vertically within each group */
export default function BankDisplay({ bank, size = 'sm' }) {
  if (!bank.length)
    return <p className="text-xs italic text-yellow-900/60 py-1">Empty</p>;

  const groups = groupBySuit(bank);

  return (
    <div className="flex flex-wrap gap-3 items-start">
      {Object.entries(groups).map(([suit, cards]) => (
        <div key={suit} className="flex flex-col items-center gap-0.5">
          {/* Stacked cards: each card after first slightly overlaps */}
          <div className="flex flex-col" style={{ gap: '-8px' }}>
            {cards.map((card, i) => (
              <div key={i} style={{ marginTop: i === 0 ? 0 : '-28px' }}>
                <Card card={card} size={size} />
              </div>
            ))}
          </div>
          {/* highest (= score contributor) label */}
          <span className="text-[8px] text-yellow-600 uppercase tracking-wider mt-1">
            {suit}
          </span>
        </div>
      ))}
    </div>
  );
}
