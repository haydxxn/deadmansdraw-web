import Card from './Card';

export default function CardRow({
  cards,
  size = "lg",
  selectable = false,
  onSelect,
  onInspectCard,
}) {
  if (!cards.length)
    return <p className="text-xs text-zinc-600 py-1">Empty</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {cards.map((card, i) => (
        <div
          key={`${card.suit}-${card.value}-${i}`}
          className={
            onInspectCard && !selectable
              ? "inline-flex rounded-xl cursor-pointer focus-within:ring-2 focus-within:ring-zinc-500 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950"
              : "inline-flex"
          }
          role={onInspectCard && !selectable ? "button" : undefined}
          tabIndex={onInspectCard && !selectable ? 0 : undefined}
          onClick={
            onInspectCard && !selectable ? () => onInspectCard(card) : undefined
          }
          onKeyDown={
            onInspectCard && !selectable
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onInspectCard(card);
                  }
                }
              : undefined
          }
        >
          <Card
            card={card}
            size={size}
            selectable={selectable}
            onClick={() => onSelect?.(i)}
          />
        </div>
      ))}
    </div>
  );
}
