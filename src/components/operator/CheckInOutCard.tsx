import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, LogIn, LogOut } from 'lucide-react';
import { useCheckInOut } from '@/hooks/useCheckInOut';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface CheckInOutCardProps {
  shiftId: string;
  shiftDate: string;
  shiftTime: string;
  eventTitle: string;
  location: string;
}

export const CheckInOutCard = ({ shiftId, shiftDate, shiftTime, eventTitle, location }: CheckInOutCardProps) => {
  const { checkIn, loading, isCheckedIn, isCheckedOut, checkInShift, checkOutShift } = useCheckInOut(shiftId);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const handleCheckIn = async () => {
    const { error } = await checkInShift(notes);
    if (!error) {
      setNotes('');
      setShowNotes(false);
    }
  };

  const handleCheckOut = async () => {
    const { error } = await checkOutShift(notes);
    if (!error) {
      setNotes('');
      setShowNotes(false);
    }
  };

  const formatTime = (isoString: string) => {
    return format(new Date(isoString), 'HH:mm', { locale: it });
  };

  const formatDate = (isoString: string) => {
    return format(new Date(isoString), 'dd/MM/yyyy', { locale: it });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Check-in/Check-out
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium">{eventTitle}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {location}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {shiftDate} - {shiftTime}
          </div>
        </div>

        {checkIn && (
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Stato:</span>
              <Badge variant={isCheckedOut ? 'default' : isCheckedIn ? 'secondary' : 'outline'}>
                {isCheckedOut ? 'Completato' : isCheckedIn ? 'In corso' : 'Non iniziato'}
              </Badge>
            </div>
            
            {checkIn.check_in_time && (
              <div className="flex items-center justify-between text-sm">
                <span>Check-in:</span>
                <span className="font-mono">
                  {formatDate(checkIn.check_in_time)} - {formatTime(checkIn.check_in_time)}
                </span>
              </div>
            )}
            
            {checkIn.check_out_time && (
              <div className="flex items-center justify-between text-sm">
                <span>Check-out:</span>
                <span className="font-mono">
                  {formatDate(checkIn.check_out_time)} - {formatTime(checkIn.check_out_time)}
                </span>
              </div>
            )}
            
            {checkIn.notes && (
              <div className="space-y-1">
                <span className="text-sm font-medium">Note:</span>
                <p className="text-sm text-muted-foreground">{checkIn.notes}</p>
              </div>
            )}
          </div>
        )}

        {!isCheckedOut && (
          <div className="space-y-3">
            {showNotes && (
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Note (opzionali)
                </label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Aggiungi note sul turno..."
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-2">
              {!isCheckedIn && !isCheckedOut && (
                <>
                  <Button 
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="flex-1"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Check-in
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNotes(!showNotes)}
                  >
                    Note
                  </Button>
                </>
              )}

              {isCheckedIn && (
                <>
                  <Button 
                    onClick={handleCheckOut}
                    disabled={loading}
                    variant="secondary"
                    className="flex-1"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Check-out
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNotes(!showNotes)}
                  >
                    Note
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};