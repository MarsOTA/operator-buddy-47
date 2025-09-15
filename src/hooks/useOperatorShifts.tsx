import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from './useRole';

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

export const useOperatorShifts = () => {
  const { profile } = useRole();
  const [shifts, setShifts] = useState<AssignedShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = async () => {
    if (!profile?.operator_id) {
      setShifts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch shifts where the operator is assigned
      const { data, error: fetchError } = await supabase
        .from('shift_assignments')
        .select(`
          shift_id,
          shifts!inner (
            id,
            date,
            start_time,
            end_time,
            activity_type,
            required_operators,
            events!inner (
              id,
              title,
              address,
              clients!inner (
                name
              ),
              brands!inner (
                name
              )
            )
          )
        `)
        .eq('operator_id', profile.operator_id);

      if (fetchError) {
        console.error('Error fetching assigned shifts:', fetchError);
        setError(fetchError.message);
        return;
      }

      // Transform the data to match our interface
      const transformedShifts = data?.map((assignment: any) => ({
        id: assignment.shifts.id,
        date: assignment.shifts.date,
        start_time: assignment.shifts.start_time,
        end_time: assignment.shifts.end_time,
        activity_type: assignment.shifts.activity_type,
        required_operators: assignment.shifts.required_operators,
        event: {
          id: assignment.shifts.events.id,
          title: assignment.shifts.events.title,
          address: assignment.shifts.events.address,
          client: {
            name: assignment.shifts.events.clients.name
          },
          brand: {
            name: assignment.shifts.events.brands.name
          }
        }
      })) || [];

      // Sort by date (upcoming first)
      transformedShifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setShifts(transformedShifts);
    } catch (err) {
      console.error('Error in fetchShifts:', err);
      setError('Errore nel caricamento dei turni');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();

    // Set up real-time subscription for shift assignments
    let subscription: any;
    
    if (profile?.operator_id) {
      subscription = supabase
        .channel('operator-shifts')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shift_assignments',
            filter: `operator_id=eq.${profile.operator_id}`
          },
          () => {
            console.log('Shift assignment changed, refetching...');
            fetchShifts();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shifts'
          },
          () => {
            console.log('Shift data changed, refetching...');
            fetchShifts();
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [profile?.operator_id]);

  return { shifts, loading, error, refetch: fetchShifts };
};