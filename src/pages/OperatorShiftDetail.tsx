import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, Clock, MapPin, Users, User, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CheckInOutCard } from '@/components/operator/CheckInOutCard';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ShiftDetail {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  activity_type: string | null;
  required_operators: number;
  notes: string | null;
  event: {
    id: string;
    title: string;
    address: string;
    notes: string | null;
    client: {
      name: string;
      vat_number: string;
    };
    brand: {
      name: string;
    };
  };
  team_leader: {
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
  operators: Array<{
    name: string;
    phone: string | null;
    email: string | null;
  }>;
}

export default function OperatorShiftDetail() {
  const { shiftId } = useParams<{ shiftId: string }>();
  const navigate = useNavigate();
  const [shift, setShift] = useState<ShiftDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shiftId) return;

    const fetchShiftDetail = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('shifts')
          .select(`
            id,
            date,
            start_time,
            end_time,
            activity_type,
            required_operators,
            notes,
            events!inner (
              id,
              title,
              address,
              notes,
              clients!inner (
                name,
                vat_number
              ),
              brands!inner (
                name
              )
            ),
            team_leader:operators!shifts_team_leader_id_fkey (
              name,
              phone,
              email
            ),
            shift_assignments!inner (
              operators!inner (
                name,
                phone,
                email
              )
            )
          `)
          .eq('id', shiftId)
          .single();

        if (error) {
          console.error('Error fetching shift detail:', error);
          return;
        }

        // Transform the data
        const transformedShift: ShiftDetail = {
          id: data.id,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          activity_type: data.activity_type,
          required_operators: data.required_operators,
          notes: data.notes,
          event: {
            id: data.events.id,
            title: data.events.title,
            address: data.events.address,
            notes: data.events.notes,
            client: {
              name: data.events.clients.name,
              vat_number: data.events.clients.vat_number
            },
            brand: {
              name: data.events.brands.name
            }
          },
          team_leader: data.team_leader,
          operators: data.shift_assignments?.map((assignment: any) => assignment.operators) || []
        };

        setShift(transformedShift);
      } catch (err) {
        console.error('Error in fetchShiftDetail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShiftDetail();
  }, [shiftId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Turno non trovato</h3>
            <p className="text-muted-foreground mb-4">
              Il turno richiesto non esiste o non hai i permessi per visualizzarlo.
            </p>
            <Button onClick={() => navigate('/operator')}>
              Torna alla dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE dd MMMM yyyy', { locale: it });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/operator')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
        <h1 className="text-2xl font-bold">Dettagli Turno</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Information */}
        <Card>
          <CardHeader>
            <CardTitle>{shift.event.title}</CardTitle>
            <p className="text-muted-foreground">
              {shift.event.client.name} - {shift.event.brand.name}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(shift.date)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{shift.event.address}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{shift.required_operators} operatori richiesti</span>
              </div>
            </div>

            {shift.activity_type && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Tipo di attività</h4>
                  <Badge variant="outline">{shift.activity_type}</Badge>
                </div>
              </>
            )}

            {(shift.event.notes || shift.notes) && (
              <>
                <Separator />
                <div className="space-y-2">
                  {shift.event.notes && (
                    <div>
                      <h4 className="font-medium mb-1">Note evento</h4>
                      <p className="text-sm text-muted-foreground">{shift.event.notes}</p>
                    </div>
                  )}
                  {shift.notes && (
                    <div>
                      <h4 className="font-medium mb-1">Note turno</h4>
                      <p className="text-sm text-muted-foreground">{shift.notes}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Check-in/Check-out */}
        <CheckInOutCard
          shiftId={shift.id}
          shiftDate={formatDate(shift.date)}
          shiftTime={`${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`}
          eventTitle={shift.event.title}
          location={shift.event.address}
        />
      </div>

      {/* Team Information */}
      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {shift.team_leader && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Team Leader
              </h4>
              <div className="pl-6 space-y-1">
                <p className="font-medium">{shift.team_leader.name}</p>
                {shift.team_leader.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <a href={`tel:${shift.team_leader.phone}`} className="hover:underline">
                      {shift.team_leader.phone}
                    </a>
                  </div>
                )}
                {shift.team_leader.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <a href={`mailto:${shift.team_leader.email}`} className="hover:underline">
                      {shift.team_leader.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {shift.operators.length > 0 && (
            <>
              {shift.team_leader && <Separator />}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Altri Operatori ({shift.operators.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {shift.operators.map((operator, index) => (
                    <div key={index} className="pl-6 space-y-1">
                      <p className="font-medium">{operator.name}</p>
                      <div className="space-y-1">
                        {operator.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${operator.phone}`} className="hover:underline">
                              {operator.phone}
                            </a>
                          </div>
                        )}
                        {operator.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${operator.email}`} className="hover:underline">
                              {operator.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}