import { useCallback, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AppScaffold } from './components/ui';
import { HomeScreen } from './screens/HomeScreen';
import { TodayScreen } from './screens/TodayScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { ConnectScreen } from './screens/ConnectScreen';
import { YouScreen } from './screens/YouScreen';
import { ModulesSettings } from './screens/settings/ModulesSettings';
import { IntegrationsSettings } from './screens/settings/IntegrationsSettings';
import { EvidenceSettings } from './screens/settings/EvidenceSettings';
import { PrivacySettings } from './screens/settings/PrivacySettings';
import { PulseHistoryScreen } from './screens/PulseHistoryScreen';

// ─────────────────────────────────────────────────────────────
// Four destinations only (PRD): Lifey · Today · My Life · Me.
//   Lifey   "/"          → conversation (the front door)
//   Today   "/today"     → what matters most today
//   My Life "/my-life"   → plans, routines, progress overview
//   Me      "/me"        → profile, goals, memory, settings
// Social (Friends) is Post-MVP: route kept but off the tab bar.
// Legacy paths (/connect, /you, /home) redirect so internal links hold.
// ─────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  // Seed passed into the Lifey conversation (from Today / tile taps / etc).
  const [connectSeed, setConnectSeed] = useState<string | undefined>();

  // Anything that wants to "talk to Lifey" lands in the same thread.
  const openLifey = useCallback(
    (seed?: string) => {
      setConnectSeed(seed);
      navigate('/');
    },
    [navigate],
  );

  return (
    <AppScaffold>
      <Routes>
        {/* Lifey — conversation, the primary surface */}
        <Route
          path="/"
          element={<ConnectScreen seed={connectSeed} onSeedConsumed={() => setConnectSeed(undefined)} />}
        />

        {/* Today — glanceable, a few useful actions */}
        <Route path="/today" element={<TodayScreen onOpenConnect={openLifey} />} />

        {/* My Life — plans, routines, progress (the old rich Home overview) */}
        <Route path="/my-life" element={<HomeScreen onOpenConnect={openLifey} />} />

        {/* Me — profile / goals / memory / permissions */}
        <Route path="/me" element={<YouScreen />} />

        {/* Non-tab routes */}
        <Route path="/friends" element={<FriendsScreen />} />
        <Route path="/settings/modules" element={<ModulesSettings />} />
        <Route path="/settings/integrations" element={<IntegrationsSettings />} />
        <Route path="/settings/evidence" element={<EvidenceSettings />} />
        <Route path="/settings/privacy" element={<PrivacySettings />} />
        <Route path="/pulse/history" element={<PulseHistoryScreen />} />

        {/* Legacy redirects so existing internal navigate() calls still work */}
        <Route path="/connect" element={<Navigate to="/" replace />} />
        <Route path="/home" element={<Navigate to="/my-life" replace />} />
        <Route path="/you" element={<Navigate to="/me" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppScaffold>
  );
}
