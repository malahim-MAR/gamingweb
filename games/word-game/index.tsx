'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Delete, Share2 } from 'lucide-react';
import { useCanvas, rounded } from '@/hooks/use-canvas';
import { feedback, WORDS } from './engine';
import { Button } from '@/components/ui/button';
import type { GameProps } from '@/types';
type Guess = { word: string; feedback: string[] };
const colors: Record<string, string> = {
  correct: '#769679',
  present: '#c6a55c',
  absent: '#9c9e99',
};
export default function WordGame({
  paused,
  onScore,
  onEnd,
  sessionId,
  date,
  initialGuesses = [],
  completed = false,
}: GameProps) {
  const [guesses, setGuesses] = useState<Guess[]>(initialGuesses);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(completed);
  const [answer, setAnswer] = useState('');
  const inputRef = useRef(input);
  inputRef.current = input;
  const guessesRef = useRef(guesses);
  guessesRef.current = guesses;
  const busyRef = useRef(false);
  const won = guesses.some((g) => g.feedback.every((f) => f === 'correct'));
  useEffect(() => {
    if (completed) onScore(won ? (7 - initialGuesses.length) * 100 : 0);
  }, [completed, won, initialGuesses.length, onScore]);
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, 350, 420);
      for (let r = 0; r < 6; r++)
        for (let c = 0; c < 5; c++) {
          const guess = guesses[r],
            letter = guess?.word[c] || (!over && r === guesses.length ? input[c] : '');
          const color = guess ? colors[guess.feedback[c]] : letter ? '#e7e5db' : '#eeede5';
          const x = 16 + c * 65,
            y = 6 + r * 67;
          rounded(ctx, x, y, 57, 59, 7, color);
          ctx.strokeStyle = letter && !guess ? '#aaa99e' : '#deddd3';
          if (!guess) {
            ctx.beginPath();
            ctx.roundRect(x, y, 57, 59, 7);
            ctx.stroke();
          }
          ctx.fillStyle = guess ? '#fff' : '#344038';
          ctx.font = 'bold 27px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(letter, x + 28.5, y + 30);
        }
    },
    [guesses, input, over],
  );
  const canvas = useCanvas(350, 420, draw);
  const enter = useCallback(async () => {
    if (paused || over || busyRef.current) return;
    const guess = inputRef.current;
    if (guess.length !== 5) {
      setMessage('Five letters, please.');
      return;
    }
    if (!WORDS.has(guess)) {
      setMessage('That word isn’t in our dictionary yet.');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      let next: Guess[],
        isWon,
        isOver,
        score,
        solution = '';
      if (sessionId) {
        const res = await fetch('/api/word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, guess }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        next = data.guesses;
        isWon = data.won;
        isOver = data.over;
        score = data.score;
        solution = data.answer || '';
      } else {
        solution = 'CRANE';
        next = [...guessesRef.current, { word: guess, feedback: feedback(guess, solution) }];
        isWon = guess === solution;
        isOver = isWon || next.length === 6;
        score = isWon ? (7 - next.length) * 100 : 0;
      }
      setGuesses(next);
      setInput('');
      if (isOver) {
        setOver(true);
        setAnswer(solution);
        onScore(score);
        onEnd(
          score,
          next.map((g) => g.word),
        );
        setMessage(
          isWon ? 'A lovely little victory!' : `The word was ${solution}. A fresh start tomorrow.`,
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [paused, over, sessionId, onScore, onEnd]);
  const type = useCallback(
    (key: string) => {
      if (paused || over || busyRef.current) return;
      if (key === 'ENTER') {
        void enter();
      } else if (key === 'BACKSPACE') {
        setInput((s) => s.slice(0, -1));
      } else if (/^[A-Z]$/.test(key)) {
        setInput((s) => (s.length < 5 ? s + key : s));
      }
    },
    [paused, over, enter],
  );
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'Enter' || e.key === 'Backspace' || /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        type(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [type]);
  async function share() {
    const text = `Word Club ${date || 'Practice'} ${won ? guesses.length : 'X'}/6\n\n${guesses.map((g) => g.feedback.map((f) => (f === 'correct' ? '🟩' : f === 'present' ? '🟨' : '⬜')).join('')).join('\n')}\n${window.location.origin}/games/word-game`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setMessage('Copied! Share a little happy.');
      }
    } catch {
      setMessage('Sharing is unavailable in this browser.');
    }
  }
  return (
    <div className="mx-auto max-w-[470px]">
      <p className="mb-2 text-center text-[11px] text-muted-foreground">
        {sessionId
          ? `DAILY WORD · ${date} · RESETS AT 00:00 UTC`
          : 'PRACTICE WORD · SIGN IN FOR TODAY’S CHALLENGE'}
      </p>
      <canvas
        ref={canvas}
        className="game-canvas mx-auto max-w-[350px]"
        role="img"
        aria-label={`Word Club board. ${guesses.length} of six guesses used.`}
      />
      <div className="sr-only" aria-live="polite">
        {guesses.map((g) => `${g.word}: ${g.feedback.join(', ')}`).join('. ')} Current guess {input}
      </div>
      <div className="min-h-7 text-center text-xs" role="status">
        {busy ? 'Checking your word…' : message}
      </div>
      <div className="space-y-1.5">
        {['QWERTYUIOP', 'ASDFGHJKL', 'ENTER ZXCVBNM BACKSPACE'].map((row, i) => {
          const keys = i === 2 ? ['ENTER', ...'ZXCVBNM', 'BACKSPACE'] : row.split('');
          return (
            <div key={row} className="flex justify-center gap-1">
              {keys.map((k) => {
                const statuses = guesses
                  .flatMap((g) => g.word.split('').map((l, j) => (l === k ? g.feedback[j] : '')))
                  .filter(Boolean);
                const f = statuses.includes('correct')
                  ? 'correct'
                  : statuses.includes('present')
                    ? 'present'
                    : statuses.includes('absent')
                      ? 'absent'
                      : '';
                return (
                  <button
                    key={k}
                    disabled={paused || over || busy}
                    onClick={() => type(k)}
                    aria-label={
                      k === 'BACKSPACE' ? 'Delete letter' : k === 'ENTER' ? 'Submit guess' : k
                    }
                    className={`flex h-11 min-w-0 flex-1 items-center justify-center rounded-md text-xs font-bold sm:h-12 ${k.length > 1 ? 'max-w-[58px]' : 'max-w-[38px]'}`}
                    style={{
                      background: f ? colors[f] : '#deded5',
                      color: f ? 'white' : '#354137',
                    }}
                  >
                    {k === 'BACKSPACE' ? <Delete size={17} /> : k === 'ENTER' ? 'ENTER' : k}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      {over && (
        <div className="mt-5 text-center">
          <p className="mb-3 text-sm font-semibold">
            {won
              ? 'Nicely done. See you tomorrow!'
              : answer
                ? `Today’s word: ${answer}`
                : 'Your daily challenge is complete.'}
          </p>
          <Button variant="outline" onClick={share}>
            <Share2 size={16} />
            Share your result
          </Button>
        </div>
      )}
    </div>
  );
}
