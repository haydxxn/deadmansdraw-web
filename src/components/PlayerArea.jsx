import BankDisplay from "./BankDisplay";
import CardRow from "./CardRow";
import { calcScore } from "../game/engine";

export default function PlayerArea({ player, isActive, isOpponent, onInspectCard }) {
  const score = calcScore(player.bank);

  return (
    <div
      className={[
        "flex flex-col gap-3 p-4 overflow-hidden transition-all duration-300",
        isOpponent ? "border-b border-zinc-800/80" : "border-t border-zinc-800/80",
        isActive
          ? "ring-1 ring-inset ring-zinc-500/40 bg-zinc-800/25"
          : "bg-zinc-950/50",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="inline-block w-2 h-2 rounded-full bg-zinc-300 animate-pulse" />
          )}
          <span className="text-zinc-100 font-semibold text-base tracking-tight">
            {player.name}
            {isOpponent && " (AI)"}
          </span>
        </div>
        <span className="text-zinc-400 text-sm font-medium tabular-nums">
          Score <span className="text-zinc-100">{score}</span>
        </span>
      </div>

      {/* Bank */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-medium">
          Bank
        </p>
        <BankDisplay
          bank={player.bank}
          size={isOpponent ? "sm" : "md"}
          onInspectCard={onInspectCard}
        />
      </div>

      {/* Play Area */}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-medium">
          Play Area
        </p>
        <CardRow
          cards={player.playArea}
          size={isOpponent ? "md" : "lg"}
          onInspectCard={onInspectCard}
        />
      </div>
    </div>
  );
}
