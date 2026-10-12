export type GameSlug = '2048' | 'word-game' | 'endless-runner' | 'match-3' | 'connect-4';
export type Category = 'Puzzle' | 'Word' | 'Arcade' | 'Multiplayer';
export interface Game {
  slug: GameSlug;
  name: string;
  category: Category;
  description: string;
  color: string;
  premium: boolean;
  featured?: boolean;
  instructions: string[];
  tag: string;
}
export interface LeaderboardRow {
  user_id: string;
  username: string;
  avatar_url: string | null;
  game_slug: GameSlug;
  score: number;
  rank: number;
}
export interface GameProps {
  seed: number;
  paused: boolean;
  onScore: (score: number) => void;
  onEnd: (score: number, actions: unknown[]) => void;
  skin?: string;
  date?: string;
  sessionId?: string;
  initialGuesses?: { word: string; feedback: string[] }[];
  completed?: boolean;
}
export interface Room {
  id: string;
  code: string;
  host_id: string;
  guest_id: string | null;
  board: number[][];
  turn: string;
  status: 'waiting' | 'playing' | 'finished' | 'abandoned';
  winner_id: string | null;
  updated_at: string;
}
