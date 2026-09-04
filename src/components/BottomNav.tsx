import { NavLink } from 'react-router-dom';

// Floating frosted tab bar: Home · Friends · mint + · Connect · You
// Center + is the Capture sheet, visually raised and overlapping the bar.
export function BottomNav({ onCapture }: { onCapture: () => void }) {
  return (
    <nav className="tab-bar glass">
      <NavLink to="/" className="tab-item" end>
        {({ isActive }) => (
          <>
            <Icon name="home" active={isActive} />
            <span className="tab-label">Home</span>
          </>
        )}
      </NavLink>
      <NavLink to="/friends" className="tab-item">
        {({ isActive }) => (
          <>
            <Icon name="friends" active={isActive} />
            <span className="tab-label">Friends</span>
          </>
        )}
      </NavLink>

      <button className="tab-capture" onClick={onCapture} aria-label="Capture">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#06110e" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <NavLink to="/connect" className="tab-item">
        {({ isActive }) => (
          <>
            <Icon name="connect" active={isActive} />
            <span className="tab-label">Connect</span>
          </>
        )}
      </NavLink>
      <NavLink to="/you" className="tab-item">
        {({ isActive }) => (
          <>
            <Icon name="you" active={isActive} />
            <span className="tab-label">You</span>
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
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      );
    case 'friends':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
          <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17 20a5.5 5.5 0 0 0-2.2-4.4" />
        </svg>
      );
    case 'connect':
      return (
        <svg {...common}>
          <path d="M4 5h16v11H8l-4 3.5z" />
        </svg>
      );
    case 'you':
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
