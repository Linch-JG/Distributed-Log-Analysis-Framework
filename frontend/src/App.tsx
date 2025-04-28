import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import RedirectToDefault from './components/RedirectToDefault';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAppSelector } from './hooks/redux';
import './App.css';

function App() {
  const defaultView = useAppSelector(state => state.settings.defaultView);
  
  // Map the default view setting to a valid route path
  const getDefaultRoute = () => {
    switch (defaultView) {
      case 'logs':
        return '/logs';
      case 'analysis':
        return '/analysis';
      case 'settings':
        return '/settings';
      case 'dashboard':
      default:
        return '/dashboard';
    }
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<RedirectToDefault />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="logs" element={<Logs />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
