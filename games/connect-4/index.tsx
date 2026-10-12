'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Users, Wifi, WifiOff } from 'lucide-react';
import { useCanvas, rounded } from '@/hooks/use-canvas';
import { browserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { emptyBoard, drop, winner } from './engine';
import type { GameProps, Room } from '@/types';
export default function Connect4({
  paused,
  onScore,
  onEnd,
  multiplayer = true,
}: GameProps & { multiplayer?: boolean }) {
  const [board, setBoard] = useState(emptyBoard);
  const [player, setPlayer] = useState(1);
  const [room, setRoom] = useState<Room | null>(null);
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(false);
  const [column, setColumn] = useState(3);
  const ended = useRef(false);
  const localBoard = useRef(board);
  localBoard.current = board;
  const localPlayer = useRef(player);
  localPlayer.current = player;
  const roomId = room && ['waiting', 'playing'].includes(room.status) ? room.id : null;
  const update = useCallback((r: Room) => {
    setRoom(r);
    setBoard(r.board);
  }, []);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const db = browserClient();
    db.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        const saved = localStorage.getItem('playroom-room');
        if (saved) {
          const { data: r } = await db
            .from('match_rooms')
            .select('*')
            .eq('id', saved)
            .in('status', ['playing', 'waiting'])
            .maybeSingle();
          if (r) update(r as Room);
          else localStorage.removeItem('playroom-room');
        }
      }
    });
  }, [update]);
  useEffect(() => {
    if (!roomId) return;
    const db = browserClient();
    localStorage.setItem('playroom-room', roomId);
    const channel = db
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'match_rooms', filter: `id=eq.${roomId}` },
        (payload) => update(payload.new as Room),
      )
      .subscribe((status) => {
        setOnline(status === 'SUBSCRIBED');
        if (status === 'CHANNEL_ERROR')
          setMessage('Connection interrupted. Your room will sync when you reconnect.');
      });
    const beat = async () => {
      const { data, error } = await db.rpc('heartbeat_match', { p_room: roomId, p_leave: false });
      if (data) update(data as Room);
      if (error) setOnline(false);
    };
    void beat();
    const timer = setInterval(() => void beat(), 15000);
    const focus = () => void beat();
    window.addEventListener('focus', focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', focus);
      void db.removeChannel(channel);
    };
  }, [roomId, update]);
  const win = winner(board),
    draw = board.every((r) => r.every(Boolean));
  const over = room ? ['finished', 'abandoned'].includes(room.status) : !!win || draw;
  useEffect(() => {
    if (over && !ended.current) {
      ended.current = true;
      const score = room
        ? room.status === 'abandoned'
          ? 0
          : room.winner_id === userId
            ? 100
            : !room.winner_id
              ? 50
              : 0
        : win
          ? 100
          : 50;
      onScore(score);
      onEnd(score, []);
    }
  }, [over, room, userId, win, onEnd, onScore]);
  async function createOrJoin(join: boolean) {
    if (!userId) {
      setMessage('Sign in to play with a friend. You can still play locally.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await browserClient().rpc(
        join ? 'join_match_room' : 'create_match_room',
        join ? { p_code: code.trim().toUpperCase() } : {},
      );
      if (error) throw new Error(error.message);
      update(data as Room);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to open room.');
    } finally {
      setBusy(false);
    }
  }
  const play = useCallback(
    async (c: number) => {
      if (paused || over || busy) return;
      if (room) {
        if (room.status !== 'playing') {
          setMessage('Waiting for your friend to join.');
          return;
        }
        if (room.turn !== userId) {
          setMessage('Your friend’s turn.');
          return;
        }
        setBusy(true);
        const { data, error } = await browserClient().rpc('play_match_move', {
          p_room: room.id,
          p_column: c,
        });
        if (error) setMessage(error.message);
        else if (data) update(data as Room);
        setBusy(false);
      } else {
        try {
          const next = drop(localBoard.current, c, localPlayer.current);
          localBoard.current = next;
          localPlayer.current = localPlayer.current === 1 ? 2 : 1;
          setBoard(next);
          setPlayer(localPlayer.current);
        } catch (e) {
          setMessage(e instanceof Error ? e.message : 'Try another column.');
        }
      }
    },
    [paused, over, busy, room, userId, update],
  );
  const drawBoard = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, 560, 490);
      rounded(ctx, 0, 42, 560, 440, 20, '#6596ad');
      board.forEach((row, r) =>
        row.forEach((n, c) => {
          ctx.fillStyle = n === 1 ? '#ec795b' : n === 2 ? '#f1cc6b' : '#dcebf0';
          ctx.beginPath();
          ctx.arc(40 + c * 80, 80 + r * 72, 28, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#3d718a44';
          ctx.lineWidth = 3;
          ctx.stroke();
        }),
      );
      ctx.fillStyle = '#607a63';
      ctx.beginPath();
      ctx.moveTo(30 + column * 80, 8);
      ctx.lineTo(50 + column * 80, 8);
      ctx.lineTo(40 + column * 80, 24);
      ctx.fill();
    },
    [board, column],
  );
  const canvas = useCanvas(560, 490, drawBoard);
  const turnText = room
    ? room.status === 'waiting'
      ? 'Waiting for a friend…'
      : room.status === 'abandoned'
        ? 'Room closed after a player left.'
        : room.turn === userId
          ? 'Your turn'
          : 'Your friend’s turn'
    : `Player ${player}’s turn`;
  return (
    <div className="mx-auto max-w-[560px]">
      {!room && multiplayer && (
        <div className="mb-4 flex flex-wrap gap-2 rounded-xl bg-muted p-3">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void createOrJoin(false)}
          >
            <Users size={14} />
            Invite a friend
          </Button>
          <input
            className="h-9 min-w-0 flex-1 rounded-lg border border-border px-3 text-xs uppercase"
            aria-label="Room code"
            placeholder="Room code"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button
            size="sm"
            variant="dark"
            disabled={busy || code.trim().length !== 8}
            onClick={() => void createOrJoin(true)}
          >
            Join
          </Button>
        </div>
      )}
      {room && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-muted p-3 text-xs">
          <span className="flex items-center gap-2">
            {online ? <Wifi size={14} /> : <WifiOff size={14} />} Room <strong>{room.code}</strong>
          </span>
          <button
            className="inline-flex items-center gap-1 font-semibold"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(room.code);
                setMessage('Room code copied. Send it to your friend.');
              } catch {
                setMessage(`Your room code is ${room.code}`);
              }
            }}
          >
            <Copy size={13} />
            Copy code
          </button>
          <button
            className="text-primary"
            onClick={async () => {
              await browserClient().rpc('heartbeat_match', { p_room: room.id, p_leave: true });
              localStorage.removeItem('playroom-room');
              setMessage('You left the room. Start a new game to play locally.');
            }}
          >
            Leave
          </button>
        </div>
      )}
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${room ? (room.turn === room.host_id ? 'bg-[#ec795b]' : 'bg-[#f1cc6b]') : player === 1 ? 'bg-[#ec795b]' : 'bg-[#f1cc6b]'}`}
          />
          {over
            ? room?.status === 'abandoned'
              ? 'Room closed. Start a fresh game.'
              : win
                ? room
                  ? room.winner_id === userId
                    ? 'You connected four!'
                    : 'Your friend connected four!'
                  : `Player ${win} wins!`
                : 'A friendly draw.'
            : turnText}
        </span>
        <span className="text-muted-foreground">{room ? 'Online match' : 'Local two-player'}</span>
      </div>
      <canvas
        ref={canvas}
        className="game-canvas"
        role="img"
        tabIndex={0}
        aria-label={`Connect 4. ${turnText}. Select column with left and right then Enter, or keys 1 to 7.`}
        onPointerDown={(e) => {
          const b = e.currentTarget.getBoundingClientRect();
          const col = Math.min(6, Math.max(0, Math.floor(((e.clientX - b.left) / b.width) * 7)));
          setColumn(col);
          void play(col);
          e.currentTarget.focus();
        }}
        onKeyDown={(e) => {
          if (['ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key) || /^[1-7]$/.test(e.key)) {
            e.preventDefault();
            if (e.key === 'ArrowLeft') setColumn((c) => Math.max(0, c - 1));
            else if (e.key === 'ArrowRight') setColumn((c) => Math.min(6, c + 1));
            else void play(/^[1-7]$/.test(e.key) ? Number(e.key) - 1 : column);
          }
        }}
      />
      <div className="mt-3 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            disabled={paused || over || busy}
            aria-label={`Drop in column ${i + 1}`}
            onClick={() => {
              setColumn(i);
              void play(i);
            }}
          >
            {i + 1}
          </Button>
        ))}
      </div>
      <div className="sr-only" aria-live="polite">
        {board
          .map(
            (r, i) =>
              `Row ${i + 1}: ${r.map((n) => (n === 1 ? 'red' : n === 2 ? 'gold' : 'empty')).join(', ')}`,
          )
          .join('. ')}
      </div>
      <p role="status" className="mt-3 min-h-5 text-center text-xs text-muted-foreground">
        {message || 'A little strategy. A little friendly competition.'}
      </p>
    </div>
  );
}
