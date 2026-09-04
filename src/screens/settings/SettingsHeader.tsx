// Shared back header for pushed Settings screens.
export function SettingsHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="settings-header">
      <button className="settings-back" onClick={onBack} aria-label="Back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <h1 className="settings-title">{title}</h1>
    </header>
  );
}
