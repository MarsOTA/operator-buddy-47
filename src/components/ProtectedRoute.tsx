import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { isOperator, loading: roleLoading } = useRole();
  const location = useLocation();

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with return URL
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Redirect operators to their dashboard if they try to access admin pages
  if (isOperator && (location.pathname === '/' || location.pathname.startsWith('/events') || location.pathname.startsWith('/clienti'))) {
    return <Navigate to="/operator/dashboard" replace />;
  }

  // Check if operator user needs to set up their operator link
  if (user && isOperator && location.pathname.startsWith('/operator/dashboard')) {
    // Additional check will be handled by the OperatorDashboard component itself
  }

  return <>{children}</>;
}