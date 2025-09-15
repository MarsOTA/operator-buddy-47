import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock } from "lucide-react";
import { useAppStore } from "@/store/appStore";

interface EventDashboardProps {
  eventId: string;
}

const EventDashboard = ({ eventId }: EventDashboardProps) => {
  const shifts = useAppStore(s => s.getShiftsByEvent(eventId));
  
  // Calculate total operators assigned
  const totalOperators = shifts.reduce((total, shift) => {
    return total + shift.operatorIds.length;
  }, 0);

  // Calculate total hours
  const totalHours = shifts.reduce((total, shift) => {
    if (shift.startTime && shift.endTime) {
      const [startHour, startMinute] = shift.startTime.split(':').map(Number);
      const [endHour, endMinute] = shift.endTime.split(':').map(Number);
      
      const startInMinutes = startHour * 60 + startMinute;
      const endInMinutes = endHour * 60 + endMinute;
      
      let diffInMinutes = endInMinutes - startInMinutes;
      
      // Handle overnight shifts
      if (diffInMinutes < 0) {
        diffInMinutes += 24 * 60;
      }
      
      const hours = diffInMinutes / 60;
      return total + (hours * shift.operatorIds.length);
    }
    return total;
  }, 0);

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-brand-accent" />
              <span className="text-sm font-medium">Operatori assegnati</span>
            </div>
            <div className="text-2xl font-bold">{totalOperators}</div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-brand-accent" />
              <span className="text-sm font-medium">Ore totali</span>
            </div>
            <div className="text-lg font-semibold">{totalHours.toFixed(1)} ore</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventDashboard;