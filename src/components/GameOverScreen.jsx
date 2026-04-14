import { calcScore } from '../game/engine';

export default function GameOverScreen({ players, myIdx = 0, onRestart }) {
  const s0 = calcScore(players[0].bank);
  const s1 = calcScore(players[1].bank);
  const myScore  = myIdx === 0 ? s0 : s1;
  const oppScore = myIdx === 0 ? s1 : s0;
  const myName   = players[myIdx].name;
  const oppName  = players[1 - myIdx].name;

  let result, resultColor;
  if (myScore > oppScore)       { result = '⚓ You Win!';              resultColor = 'text-yellow-300'; }
  else if (oppScore > myScore)  { result = `💀 ${oppName} Wins!`;     resultColor = 'text-red-400';    }
  else                          { result = "⚖️ It's a Tie!";           resultColor = 'text-blue-300';   }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-stone-900 border-2 border-yellow-600 rounded-2xl p-10 text-center max-w-sm w-[90%]
                      shadow-2xl shadow-yellow-900/50">
        <h2 className="text-4xl font-bold text-yellow-400 mb-4">⚓ Game Over</h2>
        <div className="space-y-2 mb-4 text-lg">
          <p>
            <span className="text-yellow-600">{myName} (You):</span>{' '}
            <span className="text-yellow-200 font-bold text-2xl">{myScore}</span>
          </p>
          <p>
            <span className="text-yellow-600">{oppName}:</span>{' '}
            <span className="text-yellow-200 font-bold text-2xl">{oppScore}</span>
          </p>
        </div>
        <p className={`text-2xl font-bold mb-8 ${resultColor}`}>{result}</p>
        <button
          onClick={onRestart}
          className="px-8 py-3 rounded-xl border-2 border-yellow-600 bg-yellow-950 text-yellow-300
                     font-semibold hover:bg-yellow-900 hover:shadow-lg active:scale-95 transition-all duration-150"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
