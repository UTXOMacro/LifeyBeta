import {
  HomeHeader,
  NowCard,
  PulseCard,
  MetricTiles,
  WeekStrip,
  Today,
  FriendsPeek,
} from '../components/HomeParts';

// Home — fixed curated layout matching Lifey-Home-01.
// Edit Home / module toggles live on You (no WIDGETS heading here).
export function HomeScreen({ onOpenConnect }: { onOpenConnect: (seed?: string) => void }) {
  return (
    <div className="home">
      <HomeHeader onOpenConnect={onOpenConnect} />
      <NowCard onOpenConnect={onOpenConnect} />
      <PulseCard onOpenConnect={onOpenConnect} />
      <MetricTiles onOpenConnect={onOpenConnect} />
      <WeekStrip />
      <Today />
      <FriendsPeek />
    </div>
  );
}
