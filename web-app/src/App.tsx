import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Leads from './pages/LeadBoard';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Agenda from './pages/Agenda';
import TeamManagement from './pages/TeamManagement';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="leads" element={<Leads />} />
                    <Route path="agenda" element={<Agenda />} />
                    <Route path="team" element={<TeamManagement />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
            <ConnectionStatus />
        </BrowserRouter>
    );
}

export default App;
