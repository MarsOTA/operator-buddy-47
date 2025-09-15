import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from './useRole';

interface OperatorStats {
  todayShifts: number;
  upcomingShifts: number;
  totalShifts: number;
}

export const useOperatorStats = () => {
  const { profile } = useRole();
  const [stats, setStats] = useState<OperatorStats>({
    todayShifts: 0,
    upcomingShifts: 0,
    totalShifts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.operator_id) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);

        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // Fetch all assigned shifts for this operator
        const { data: assignments, error } = await supabase
          .from('shift_assignments')
          .select(`
            shift_id,
            shifts!inner (
              id,
              date
            )
          `)
          .eq('operator_id', profile.operator_id);

        if (error) {
          console.error('Error fetching operator stats:', error);
          return;
        }

        const shifts = assignments?.map(a => a.shifts).flat() || [];
        
        // Calculate statistics
        const todayShifts = shifts.filter(shift => shift.date === today).length;
        const upcomingShifts = shifts.filter(shift => shift.date >= tomorrowStr).length;
        const totalShifts = shifts.length;

        setStats({
          todayShifts,
          upcomingShifts,
          totalShifts
        });

      } catch (err) {
        console.error('Error calculating operator stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Set up real-time subscription for shift assignments
    const subscription = supabase
      .channel('operator-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_assignments',
          filter: `operator_id=eq.${profile.operator_id}`
        },
        () => {
          // Refetch stats when assignments change
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile?.operator_id]);

  return { stats, loading };
};