import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  activity_type?: string;
  required_operators: number;
  events: {
    id: string;
    title: string;
    address: string;
    clients: {
      name: string;
    };
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  event_id?: string;
}

export default function OperatorDashboard() {
  const { user } = useAuth();
  const [operatorData, setOperatorData] = useState<any>(null);
  const [upcomingShifts, setUpcomingShifts] = useState<Shift[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadOperatorData = async () => {
      try {
        // Get operator profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('operator_id, operators(*)')
          .eq('id', user.id)
          .single();

        if (profile?.operator_id) {
          setOperatorData(profile.operators);

          // Load upcoming shifts
          const { data: shiftsData } = await supabase
            .from('shift_assignments')
            .select(`
              shifts (
                id,
                date,
                start_time,
                end_time,
                activity_type,
                required_operators,
                events (
                  id,
                  title,
                  address,
                  clients (
                    name
                  )
                )
              )
            `)
            .eq('operator_id', profile.operator_id)
            .gte('shifts.date', new Date().toISOString().split('T')[0])
            .order('shifts.date', { ascending: true })
            .limit(5);

          if (shiftsData) {
            const shifts = shiftsData.map(item => item.shifts).filter(Boolean);
            setUpcomingShifts(shifts);
          }

          // Load notifications
          const { data: notificationData } = await supabase
            .from('notifications')
            .select('*')
            .eq('operator_id', profile.operator_id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (notificationData) {
            setNotifications(notificationData);
          }
        }
      } catch (error) {
        console.error('Error loading operator data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOperatorData();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center p-8">Caricamento...</div>;
  }

  if (!operatorData) {
    return (
      <Card className="mx-4 mt-4">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Il tuo account non è ancora collegato a un operatore. Contatta l'amministratore.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Operator Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Benvenuto, {operatorData.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Ruolo:</span> {operatorData.role}
            </div>
            <div>
              <span className="font-medium">Stato:</span>{' '}
              <Badge variant={operatorData.availability === 'Disponibile' ? 'default' : 'secondary'}>
                {operatorData.availability}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Email:</span> {operatorData.email}
            </div>
            <div>
              <span className="font-medium">Telefono:</span> {operatorData.phone}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Shifts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prossimi Turni
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingShifts.length === 0 ? (
            <p className="text-muted-foreground">Nessun turno programmato</p>
          ) : (
            <div className="space-y-3">
              {upcomingShifts.map((shift) => (
                <div key={shift.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <Link 
                      to={`/events/${shift.events.id}`}
                      className="font-medium hover:underline"
                    >
                      {shift.events.title}
                    </Link>
                    <Badge variant="outline">
                      {shift.activity_type || 'Non specificato'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(shift.date), 'EEEE d MMMM yyyy', { locale: it })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {shift.start_time} - {shift.end_time}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {shift.events.address}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifiche Recenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground">Nessuna notifica</p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className={`border-l-4 pl-3 py-2 ${
                  notification.read ? 'border-muted' : 'border-primary'
                }`}>
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">{notification.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}