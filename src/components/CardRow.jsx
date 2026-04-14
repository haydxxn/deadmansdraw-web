import Card from './Card';

export default function CardRow({ cards, size = 'lg', selectable = false, onSelect }) {
  if (!cards.length)
    return <p className="text-xs italic text-yellow-900/60 py-1">Empty</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {cards.map((card, i) => (
        <Card
          key={`${card.suit}-${card.value}-${i}`}
          card={card}
          size={size}
          selectable={selectable}
          onClick={() => onSelect?.(i)}
        />
      ))}
    </div>
  );
}
