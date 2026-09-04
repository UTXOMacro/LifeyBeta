import { mockFriends, mockPosts } from '../data/mock';
import { initials } from '../lib/score';
import { Avatar, GlassCard } from '../components/ui';

// Friends — same header glow, glass list rows, mint reactions, no leaderboards.
export function FriendsScreen() {
  return (
    <div className="screen">
      <h1 className="screen-title">Friends</h1>

      <GlassCard className="privacy-banner">
        <strong>Private by default.</strong>
        <span className="faint"> You share moments on purpose — never raw numbers.</span>
      </GlassCard>

      <div className="section-row">
        <span className="section-label">Recent moments</span>
      </div>

      <div className="friends-feed">
        {mockPosts.map((p) => {
          const f = mockFriends.find((x) => x.id === p.friendId)!;
          return (
            <GlassCard key={p.id} className="feed-card">
              <Avatar label={initials(f.name)} src={f.avatar} size={44} />
              <div className="feed-body">
                <div className="feed-top">
                  <strong>{f.name}</strong>
                  <span className="faint">{p.when}</span>
                </div>
                <div className="feed-text">{p.text}</div>
                <div className="feed-react">
                  <span className="react-chip">👏</span>
                  <span className="react-chip">💚</span>
                  <span className="react-chip">🙌</span>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="coming-next faint">More social features coming next.</div>
    </div>
  );
}
