import { useState, type FormEvent, type ReactNode } from 'react';

/**
 * Lightweight client-side password gate for the private beta.
 *
 * NOTE: This is deterrence against casual/link access, not real security —
 * the check runs in the browser. For hard security use Netlify Pro password
 * protection or Cloudflare Access. Good enough to keep a private beta private.
 *
 * The password comes from the Vite build-time env var VITE_APP_PASSWORD
 * (set in Netlify → Site configuration → Environment variables).
 * A successful login is remembered in localStorage so users aren't re-prompted.
 */

const STORAGE_KEY = 'lifey.beta.unlocked';
const EXPECTED = import.meta.env.VITE_APP_PASSWORD as string | undefined;

export default function PasswordGate({ children }: { children: ReactNode }) {
  // If no password is configured at build time, don't lock anyone out.
  const gateDisabled = !EXPECTED;

  const [unlocked, setUnlocked] = useState<boolean>(
    () => gateDisabled || localStorage.getItem(STORAGE_KEY) === '1',
  );
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (value === EXPECTED) {
      localStorage.setItem(STORAGE_KEY, '1');
      setUnlocked(true);
    } else {
      setError(true);
    }
  }

  return (
    <div className="gate">
      <form className="gate-card" onSubmit={submit}>
        <h1 className="gate-title">Lifey</h1>
        <p className="gate-sub">Private beta — enter the access password.</p>
        <input
          className="gate-input"
          type="password"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          aria-label="Access password"
        />
        {error && <p className="gate-error">Incorrect password.</p>}
        <button className="gate-btn" type="submit">
          Enter
        </button>
      </form>
    </div>
  );
}
