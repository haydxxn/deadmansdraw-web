import { useState } from 'react';
import Card from './Card';
import CardAbilityModal from './CardAbilityModal';

export default function AbilityModal({ modal, onSelect }) {
  const [abilityCard, setAbilityCard] = useState(null);

  if (!modal) return null;

  return (
    <>
      <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-xl">
          <h2 className="text-zinc-100 text-lg font-semibold tracking-tight mb-1">{modal.title}</h2>
          <p className="text-zinc-500 text-sm mb-5">{modal.desc}</p>

          <div className="flex flex-wrap gap-4 justify-center">
            {modal.cards.map((card, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <Card
                  card={card}
                  size="lg"
                  selectable
                  onClick={() => onSelect(idx)}
                />
                <span className="text-xs text-zinc-500 tabular-nums">{card.suit} ({card.value})</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAbilityCard(card);
                  }}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-300 underline underline-offset-2 decoration-zinc-600"
                >
                  Card ability
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {abilityCard && (
        <CardAbilityModal
          card={abilityCard}
          onClose={() => setAbilityCard(null)}
          zClass="z-[65]"
        />
      )}
    </>
  );
}
