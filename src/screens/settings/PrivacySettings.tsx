import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { SettingsHeader } from './SettingsHeader';
import type { Visibility } from '../../types';

const OPTS: { id: Visibility; label: string }[] = [
  { id: 'me', label: 'Only me' },
  { id: 'friends', label: 'Friends' },
  { id: 'everyone', label: 'Everyone' },
];

// Settings → Privacy. Default audience segmented control lives here now.
export function PrivacySettings() {
  const navigate = useNavigate();
  const current = useStore((s) => s.profile.privacyDefault);
  const setPrivacy = useStore((s) => s.setPrivacyDefault);

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="Privacy" onBack={() => navigate('/you')} />

      <div className="section-row">
        <span className="section-label">Default audience</span>
      </div>
      <div className="privacy-opts">
        {OPTS.map((o) => (
          <button
            key={o.id}
            className={`priv-opt ${current === o.id ? 'active' : ''}`}
            onClick={() => setPrivacy(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <p className="settings-helper faint">
        Your public profile never shows weight, calories, food logs, raw 1–10s, tasks, or calendar
        unless you explicitly share a moment.
      </p>
    </div>
  );
}
