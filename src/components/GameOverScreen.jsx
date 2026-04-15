import { calcScore } from '../game/engine';

export default function GameOverScreen({ players, myIdx = 0, onRestart }) {
  const s0 = calcScore(players[0].bank);
  const s1 = calcScore(players[1].bank);
  const myScore  = myIdx === 0 ? s0 : s1;
  const oppScore = myIdx === 0 ? s1 : s0;
  const myName   = players[myIdx].name;
  const oppName  = players[1 - myIdx].name;

  let result, resultColor;
  if (myScore > oppScore)       { result = 'You win';              resultColor = 'text-zinc-100'; }
  else if (oppScore > myScore)  { result = `${oppName} wins`;     resultColor = 'text-zinc-300';    }
  else                          { result = "It's a tie";           resultColor = 'text-zinc-400';   }

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-10 text-center max-w-sm w-full shadow-xl">
        <h2 className="text-2xl font-semibold text-zinc-100 mb-6 tracking-tight">Game over</h2>
        <div className="space-y-3 mb-6 text-left text-sm">
          <p className="flex justify-between gap-4">
            <span className="text-zinc-500">{myName} (you)</span>
            <span className="text-zinc-100 font-semibold tabular-nums text-lg">{myScore}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-zinc-500">{oppName}</span>
            <span className="text-zinc-100 font-semibold tabular-nums text-lg">{oppScore}</span>
          </p>
        </div>
        <p className={`text-lg font-semibold mb-8 ${resultColor}`}>{result}</p>
        <button
          onClick={onRestart}
          className="w-full px-6 py-3 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100
                     font-semibold hover:bg-zinc-700 active:scale-[0.99] transition-all"
        >
          Back to menu
        </button>
      </div>
    </div>
  );
}
