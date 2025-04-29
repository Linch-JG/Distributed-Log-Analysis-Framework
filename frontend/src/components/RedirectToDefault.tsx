import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';

const RedirectToDefault = () => {
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

  return <Navigate to={getDefaultRoute()} replace />;
};

export default RedirectToDefault; 