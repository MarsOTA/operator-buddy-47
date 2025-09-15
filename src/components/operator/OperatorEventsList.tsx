import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Users, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCheckInOut } from '@/hooks/useCheckInOut';
import { useOperatorShifts } from '@/hooks/useOperatorShifts';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface AssignedShift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  activity_type: string | null;
  required_operators: number;
  event: {
    id: string;
    title: string;
    address: string;
    client: {
      name: string;
    };
    brand: {
      name: string;
    };
  };
}

const CheckInButton = ({ shiftId }: { shiftId: string }) => {
  const { isCheckedIn, isCheckedOut, checkInShift, checkOutShift, loading } = useCheckInOut(shiftId);

  const handleCheckIn = async () => {
    await checkInShift('');
  };

  const handleCheckOut = async () => {
    await checkOutShift('');
  };

  if (isCheckedOut) {
    return (
      <Button variant="outline" disabled className="flex-1">
        <LogOut className="h-4 w-4 mr-2" />
        Completato
      </Button>
    );
  }

  if (isCheckedIn) {
    return (
      <Button 
        onClick={handleCheckOut}
        disabled={loading}
        variant="secondary"
        className="flex-1"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Check-out
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleCheckIn}
      disabled={loading}
      className="flex-1"
    >
      <LogIn className="h-4 w-4 mr-2" />
      Check-in
    </Button>
  );
};

export const OperatorEventsList = () => {
  const navigate = useNavigate();
  const { shifts, loading, error } = useOperatorShifts();

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: it });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5); // HH:mm format
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date(new Date().toDateString());
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Errore nel caricamento</h3>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (shifts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nessun turno assegnato</h3>
          <p className="text-muted-foreground">
            Non hai turni assegnati al momento. Controlla più tardi per nuovi incarichi.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">I tuoi turni</h2>
      
      {shifts.map((shift) => (
        <Card key={shift.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{shift.event.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {shift.event.client.name} - {shift.event.brand.name}
                </p>
              </div>
              <Badge variant={isUpcoming(shift.date) ? 'default' : 'secondary'}>
                {isUpcoming(shift.date) ? 'Prossimo' : 'Passato'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(shift.date)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{shift.event.address}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{shift.required_operators} operatori</span>
              </div>
            </div>
            
            {shift.activity_type && (
              <div className="pt-2 border-t">
                <Badge variant="outline">{shift.activity_type}</Badge>
              </div>
            )}
            
            <div className="pt-2 border-t flex gap-2">
              <CheckInButton shiftId={shift.id} />
              <Button 
                onClick={() => navigate(`/operator/shift/${shift.id}`)}
                variant="outline"
                className="flex-1"
              >
                Vedi dettagli
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};