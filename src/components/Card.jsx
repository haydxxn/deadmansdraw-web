import { SUIT_INFO } from "../game/constants";

const SIZE_CLASSES = {
  lg: "w-24 h-32 min-w-[6rem]",
  md: "w-20 h-28 min-w-[5rem]",
  sm: "w-[4.5rem] h-[6.25rem] min-w-[4.5rem]",
  xs: "w-14 h-20 min-w-[3.5rem]",
};

const EMOJI_SIZE = {
  lg: "text-4xl",
  md: "text-3xl",
  sm: "text-2xl",
  xs: "text-xl",
};
const VALUE_SIZE = {
  lg: "text-3xl",
  md: "text-2xl",
  sm: "text-xl",
  xs: "text-lg",
};
const LABEL_SIZE = {
  lg: "text-[10px]",
  md: "text-[9px]",
  sm: "text-[8px]",
  xs: "text-[8px]",
};

export default function Card({
  card,
  size = "lg",
  selectable = false,
  onClick,
  dimmed = false,
}) {
  const info = SUIT_INFO[card.suit];

  return (
    <button
      onClick={selectable ? onClick : undefined}
      disabled={!selectable}
      className={[
        "relative flex flex-col items-center justify-center rounded-lg border-2",
        "bg-gradient-to-br transition-all duration-150 select-none",
        SIZE_CLASSES[size],
        info.color,
        info.text,
        selectable
          ? `${info.border} cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-black/25 active:scale-[0.98]`
          : "border-zinc-600/40 cursor-default pointer-events-none",
        dimmed ? "opacity-50" : "",
        selectable ? "ring-1 ring-yellow-500/50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* shine */}
      <span className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent" />

      <span className={EMOJI_SIZE[size]}>{info.emoji}</span>
      <span className={`font-bold leading-none ${VALUE_SIZE[size]}`}>
        {card.value}
      </span>
      <span
        className={`mt-0.5 uppercase tracking-wide opacity-70 ${LABEL_SIZE[size]}`}
      >
        {card.suit}
      </span>
    </button>
  );
}
