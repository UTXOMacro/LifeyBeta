import { NavLink } from 'react-router-dom';
import { useStore } from '../store';

// Four destinations only (PRD): Lifey · Today · My Life · Me.
// Conversation-first — "Lifey" is the front door. No center capture button
// (capture is conversational now), no social tab (social is Post-MVP).
export function BottomNav() {
  const goHome = useStore((s) => s.goHome);

  // Tapping Lifey always lands you on a fresh composer (“home”), never stuck
  // inside the last chat you had open. Recent chats stay one tap away.
  return (
    <nav className="tab-bar glass">
      <NavLink to="/" className="tab-item" end onClick={() => goHome()}>
        {({ isActive }) => (
          <>
            <Icon name="lifey" active={isActive} />
            <span className="tab-label">Lifey</span>
          </>
        )}
      </NavLink>
      <NavLink to="/today" className="tab-item">
        {({ isActive }) => (
          <>
            <Icon name="today" active={isActive} />
            <span className="tab-label">Today</span>
          </>
        )}
      </NavLink>
      <NavLink to="/my-life" className="tab-item">
        {({ isActive }) => (
          <>
            <Icon name="mylife" active={isActive} />
            <span className="tab-label">My Life</span>
          </>
        )}
      </NavLink>
      <NavLink to="/me" className="tab-item">
        {({ isActive }) => (
          <>
            <Icon name="me" active={isActive} />
            <span className="tab-label">Me</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}

function Icon({ name, active }: { name: string; active: boolean }) {
  const common = {
    width: 23,
    height: 23,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `tab-icon ${active ? 'active' : ''}`,
  };
  switch (name) {
    case 'lifey':
      // Conversation — the primary surface.
      return (
        <svg {...common}>
          <path d="M4 5h16v11H8l-4 3.5z" />
        </svg>
      );
    case 'today':
      // A focused "today" mark — sun/day glance, not a calendar grid.
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
        </svg>
      );
    case 'mylife':
      // Plans / routines / progress — layered stack.
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      );
    case 'me':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    default:
      return null;
  }
}
