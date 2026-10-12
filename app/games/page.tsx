import { Catalog } from '@/components/catalog';
import { activeGames } from '@/lib/data';
export const metadata = {
  title: 'All games',
  description:
    'Find your next favorite puzzle, daily word game, arcade challenge, or multiplayer game.',
};
export default async function Games() {
  return (
    <div className="layout py-12">
      <p className="eyebrow mb-3 text-primary">PICK YOUR HAPPY</p>
      <h1 className="page-title">Good games. Great little breaks.</h1>
      <p className="mb-9 mt-4 text-sm text-muted-foreground">
        A whole room of possibilities. What are you in the mood for?
      </p>
      <Catalog games={await activeGames()} />
    </div>
  );
}
