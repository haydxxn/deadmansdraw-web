const CLS = {
  turn:  'text-yellow-500 font-bold',
  bust:  'text-red-400',
  bank:  'text-green-400',
  event: 'text-blue-300',
  '':    'text-yellow-800',
};

export default function GameLog({ log }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h3 className="text-yellow-600 text-xs uppercase tracking-widest border-b border-yellow-900 pb-2 mb-2 shrink-0">
        ☠ Game Log
      </h3>
      <div className="overflow-y-auto flex-1 space-y-0.5 pr-1">
        {log.map(entry => (
          <p key={entry.id} className={`text-[11px] leading-5 border-b border-white/[0.03] ${CLS[entry.cls] ?? CLS['']}`}>
            {entry.msg}
          </p>
        ))}
      </div>
    </div>
  );
}
