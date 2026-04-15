const CLS = {
  turn:  'text-zinc-200 font-semibold',
  bust:  'text-rose-400',
  bank:  'text-emerald-400/90',
  event: 'text-sky-400/90',
  '':    'text-zinc-500',
};

export default function GameLog({ log }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h3 className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800 pb-2 mb-2 shrink-0 font-medium">
        Log
      </h3>
      <div className="overflow-y-auto flex-1 space-y-0.5 pr-1">
        {log.map(entry => (
          <p key={entry.id} className={`text-[12px] leading-snug border-b border-zinc-800/40 py-0.5 ${CLS[entry.cls] ?? CLS['']}`}>
            {entry.msg}
          </p>
        ))}
      </div>
    </div>
  );
}
