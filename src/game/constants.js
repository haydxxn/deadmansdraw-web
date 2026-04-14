export const SUIT_INFO = {
  Cannon:  { emoji: '💣', vals: [2,3,4,5,6,7], color: 'from-indigo-950 to-indigo-900', text: 'text-indigo-300',  border: 'border-indigo-700',  desc: "Discard opponent's highest card of chosen suit" },
  Chest:   { emoji: '📦', vals: [2,3,4,5,6,7], color: 'from-amber-950 to-amber-900',   text: 'text-amber-300',   border: 'border-amber-700',   desc: "With Key: draw bonus cards from discard when banking" },
  Key:     { emoji: '🗝️', vals: [2,3,4,5,6,7], color: 'from-yellow-950 to-yellow-900', text: 'text-yellow-300',  border: 'border-yellow-700',  desc: "With Chest: draw bonus cards from discard when banking" },
  Sword:   { emoji: '⚔️',  vals: [2,3,4,5,6,7], color: 'from-sky-950 to-sky-900',      text: 'text-sky-300',     border: 'border-sky-700',     desc: "Steal opponent's highest card of chosen suit" },
  Hook:    { emoji: '🪝', vals: [2,3,4,5,6,7], color: 'from-red-950 to-red-900',       text: 'text-red-300',     border: 'border-red-700',     desc: "Pull your highest card of chosen suit back from bank" },
  Oracle:  { emoji: '🔮', vals: [2,3,4,5,6,7], color: 'from-purple-950 to-purple-900', text: 'text-purple-300',  border: 'border-purple-700',  desc: "Peek at the next card in the deck" },
  Map:     { emoji: '🗺️', vals: [2,3,4,5,6,7], color: 'from-lime-950 to-lime-900',     text: 'text-lime-300',    border: 'border-lime-700',    desc: "Draw 3 from discard, play one into your area" },
  Mermaid: { emoji: '🧜', vals: [4,5,6,7,8,9], color: 'from-teal-950 to-teal-900',     text: 'text-teal-300',    border: 'border-teal-700',    desc: "No ability, but worth more points (4–9)" },
  Kraken:  { emoji: '🐙', vals: [2,3,4,5,6,7], color: 'from-blue-950 to-blue-900',     text: 'text-blue-300',    border: 'border-blue-700',    desc: "Must draw and play 3 cards consecutively" },
};

export const AI_NAMES = ['Sasha','Marge','Billy','Tina','Joe','Sally','Jen','Bob','Sam','Sue'];

export const MAX_TURNS = 20;
