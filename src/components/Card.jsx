import { SUIT_INFO } from '../game/constants';

const SIZE_CLASSES = {
  lg: 'w-20 h-28',
  md: 'w-16 h-22',
  sm: 'w-14 h-20',
  xs: 'w-11 h-16',
};

const EMOJI_SIZE = { lg: 'text-3xl', md: 'text-2xl', sm: 'text-xl', xs: 'text-base' };
const VALUE_SIZE = { lg: 'text-2xl', md: 'text-xl',  sm: 'text-lg', xs: 'text-sm'  };
const LABEL_SIZE = { lg: 'text-[9px]', md: 'text-[8px]', sm: 'text-[8px]', xs: 'text-[7px]' };

export default function Card({ card, size = 'lg', selectable = false, onClick, dimmed = false }) {
  const info = SUIT_INFO[card.suit];

  return (
    <button
      onClick={selectable ? onClick : undefined}
      disabled={!selectable}
      className={[
        'relative flex flex-col items-center justify-center rounded-lg border-2',
        'bg-gradient-to-br transition-all duration-150 select-none',
        SIZE_CLASSES[size],
        info.color,
        info.text,
        selectable
          ? `${info.border} cursor-pointer hover:-translate-y-2 hover:shadow-lg hover:shadow-yellow-500/30 active:scale-95`
          : 'border-white/10 cursor-default hover:-translate-y-1',
        dimmed ? 'opacity-50' : '',
        selectable ? 'ring-1 ring-yellow-500/50' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* shine */}
      <span className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent" />

      <span className={EMOJI_SIZE[size]}>{info.emoji}</span>
      <span className={`font-bold leading-none ${VALUE_SIZE[size]}`}>{card.value}</span>
      <span className={`mt-0.5 uppercase tracking-wide opacity-70 ${LABEL_SIZE[size]}`}>{card.suit}</span>
    </button>
  );
}
