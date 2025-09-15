import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useAppBadge } from '@/hooks/useAppBadge';
import { OperatorEventsList } from '@/components/operator/OperatorEventsList';
import { Card, CardContent } from '@/components/ui/card';
import { User, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OperatorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: roleLoading, isOperator } = useRole();
  const navigate = useNavigate();
  
  // Initialize app badge for PWA notifications
  useAppBadge();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      // If user is admin, redirect to admin dashboard
      if (profile?.role === 'admin') {
        navigate('/');
        return;
      }
    }
  }, [user, profile, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse">Caricamento...</div>
        </div>
      </div>
    );
  }

  if (!user || !isOperator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Accesso negato</h3>
            <p className="text-muted-foreground mb-4">
              Non hai i permessi per accedere a questa sezione.
            </p>
            <Button onClick={() => navigate('/auth')}>
              Effettua il login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Operatore</h1>
          <p className="text-muted-foreground">
            Benvenuto, gestisci i tuoi turni e visualizza gli eventi assegnati.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/operator/profile')}
          >
            <User className="h-4 w-4 mr-2" />
            Profilo
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/notification-settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Notifiche
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Turni Oggi</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-secondary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prossimi Turni</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <User className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stato</p>
                <p className="text-lg font-semibold text-green-600">Disponibile</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <OperatorEventsList />
    </div>
  );
}