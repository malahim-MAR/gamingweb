import type { Game } from '@/types';
export const games: Game[] = [
  {
    slug: '2048',
    name: '2048',
    category: 'Puzzle',
    description: 'Small moves. Big numbers. An endlessly satisfying puzzle.',
    color: '#efbd6c',
    premium: false,
    tag: 'FAN FAVORITE',
    instructions: [
      'Use arrow keys, WASD, or swipe to slide the tiles.',
      'Matching tiles combine. Every move adds a new tile.',
      'Reach 2048, then keep going for your best score.',
    ],
  },
  {
    slug: 'word-game',
    name: 'Word Club',
    category: 'Word',
    description: 'One word. Six guesses. Your daily little victory.',
    color: '#a8c4a2',
    premium: false,
    tag: 'DAILY CHALLENGE',
    instructions: [
      'Guess the five-letter word in six tries.',
      'Green means the right letter in the right place; gold means the letter is elsewhere.',
      'A new word arrives at midnight UTC. Complete it to keep your streak.',
    ],
  },
  {
    slug: 'endless-runner',
    name: 'Cloud Runner',
    category: 'Arcade',
    description: 'Find your rhythm. Chase the horizon. Just one more run.',
    color: '#b3b8e0',
    premium: false,
    tag: 'QUICK PLAY',
    instructions: [
      'Tap, click, or press Space to jump.',
      'Clear obstacles as the world gets faster.',
      'Your distance is your score. Premium unlocks runner skins.',
    ],
  },
  {
    slug: 'match-3',
    name: 'Sweet Shuffle',
    category: 'Puzzle',
    description: 'A colorful little escape with some seriously sweet combos.',
    color: '#eab5c4',
    premium: true,
    tag: 'PREMIUM',
    instructions: [
      'Select two adjacent candies with touch or the arrow keys and Enter.',
      'Match three or more to clear them. You have 30 moves and three lives.',
      'Use one shuffle and one hammer booster per game. Invalid swaps cost a life.',
    ],
  },
  {
    slug: 'connect-4',
    name: 'Four in a Row',
    category: 'Multiplayer',
    description: 'Your move. Their move. A friendly battle of wits.',
    color: '#94c1d5',
    premium: false,
    tag: 'PLAY TOGETHER',
    instructions: [
      'Drop a disc into a column using touch or keys 1–7.',
      'Connect four horizontally, vertically, or diagonally.',
      'Play locally or sign in to create a private room and invite a friend.',
    ],
  },
];
export function findGame(slug: string) {
  return games.find((g) => g.slug === slug);
}
