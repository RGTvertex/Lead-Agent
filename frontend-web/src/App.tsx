import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Layout from './components/layout/Layout';
import NewCampaign from './pages/NewCampaign';
import CampaignDetails from './pages/CampaignDetails';
import Leads from './pages/Leads';
import Approvals from './pages/Approvals';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "PASTE_YOUR_CLIENT_ID_HERE";

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={clientId}>
        <AuthProvider>
          <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="campaigns" element={<Navigate to="/dashboard" replace />} />
              <Route path="campaigns/new" element={<NewCampaign />} />
              <Route path="campaigns/:id" element={<CampaignDetails />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

