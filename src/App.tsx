import { useCallback, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AppScaffold } from './components/ui';
import { HomeScreen } from './screens/HomeScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { ConnectScreen } from './screens/ConnectScreen';
import { YouScreen } from './screens/YouScreen';
import { ModulesSettings } from './screens/settings/ModulesSettings';
import { IntegrationsSettings } from './screens/settings/IntegrationsSettings';
import { EvidenceSettings } from './screens/settings/EvidenceSettings';
import { PrivacySettings } from './screens/settings/PrivacySettings';
import { CaptureSheet } from './screens/CaptureSheet';

export default function App() {
  const navigate = useNavigate();
  const [captureOpen, setCaptureOpen] = useState(false);
  // Seed passed from Home (Lifey Now / header / tile taps) into Connect.
  const [connectSeed, setConnectSeed] = useState<string | undefined>();

  // Lifey Now + tile taps all land in the same Connect thread.
  const openConnect = useCallback(
    (seed?: string) => {
      setConnectSeed(seed);
      navigate('/connect');
    },
    [navigate],
  );

  return (
    <AppScaffold onCapture={() => setCaptureOpen(true)}>
      <Routes>
        <Route path="/" element={<HomeScreen onOpenConnect={openConnect} />} />
        <Route path="/friends" element={<FriendsScreen />} />
        <Route
          path="/connect"
          element={<ConnectScreen seed={connectSeed} onSeedConsumed={() => setConnectSeed(undefined)} />}
        />
        <Route path="/you" element={<YouScreen />} />
        <Route path="/settings/modules" element={<ModulesSettings />} />
        <Route path="/settings/integrations" element={<IntegrationsSettings />} />
        <Route path="/settings/evidence" element={<EvidenceSettings />} />
        <Route path="/settings/privacy" element={<PrivacySettings />} />
      </Routes>

      <CaptureSheet open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </AppScaffold>
  );
}
