import BankDisplay from "./BankDisplay";
import CardRow from "./CardRow";
import { calcScore } from "../game/engine";

export default function PlayerArea({ player, isActive, isOpponent }) {
  const score = calcScore(player.bank);

  return (
    <div
      className={[
        "flex flex-col gap-2 p-4 overflow-hidden transition-all duration-300",
        isOpponent
          ? "border-b border-yellow-900/40"
          : "border-t border-yellow-900/40",
        isActive
          ? "ring-1 ring-inset ring-yellow-600/60 bg-yellow-950/10"
          : "bg-stone-950/40",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          )}
          <span className="text-yellow-400 font-bold text-base">
            {player.name}
            {isOpponent && " (AI)"}
          </span>
        </div>
        <span className="text-yellow-300 text-sm font-semibold">
          Score: <span className="text-yellow-200">{score}</span>
        </span>
      </div>

      {/* Bank */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-yellow-800 mb-1">
          Bank
        </p>
        <BankDisplay bank={player.bank} size={isOpponent ? "xs" : "sm"} />
      </div>

      {/* Play Area */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-yellow-800 mb-1">
          Play Area
        </p>
        <CardRow cards={player.playArea} size={isOpponent ? "sm" : "lg"} />
      </div>
    </div>
  );
}
