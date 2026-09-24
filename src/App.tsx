import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';

import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Tasks from './pages/Tasks';

function Layout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="tasks" element={<Tasks />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
