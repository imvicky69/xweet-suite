import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { WorkspaceProvider } from '@/context/WorkspaceContext';

import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import AuthPage from './pages/Auth';

function Layout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function App() {
  return (
    <WorkspaceProvider>
      <Router>
        <Routes>
          {/* Standalone Auth Routes (Upwork Style) */}
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/signup" element={<AuthPage initialMode="signup" />} />

          {/* Main App Workspace */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </WorkspaceProvider>
  );
}

export default App;
