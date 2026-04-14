import Card from './Card';

export default function AbilityModal({ modal, onSelect }) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border-2 border-yellow-600 rounded-2xl p-6 max-w-xl w-[92%] max-h-[85vh] overflow-y-auto shadow-2xl shadow-yellow-900/40">
        <h2 className="text-yellow-300 text-lg font-bold mb-1">{modal.title}</h2>
        <p className="text-yellow-700 text-sm mb-5">{modal.desc}</p>

        <div className="flex flex-wrap gap-4 justify-center">
          {modal.cards.map((card, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <Card
                card={card}
                size="lg"
                selectable
                onClick={() => onSelect(idx)}
              />
              <span className="text-xs text-yellow-700">{card.suit}({card.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
