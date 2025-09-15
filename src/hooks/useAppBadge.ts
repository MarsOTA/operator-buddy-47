import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/hooks/useRole';

export const useAppBadge = () => {
  const { profile } = useRole();

  const updateBadge = useCallback(async (count: number) => {
    if ('setAppBadge' in navigator) {
      try {
        if (count > 0) {
          await navigator.setAppBadge(count);
        } else {
          await navigator.clearAppBadge();
        }
      } catch (error) {
        console.error('Failed to update app badge:', error);
      }
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!profile?.operator_id) return 0;

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('operator_id', profile.operator_id)
        .eq('read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in fetchUnreadCount:', error);
      return 0;
    }
  }, [profile?.operator_id]);

  const refreshBadge = useCallback(async () => {
    const count = await fetchUnreadCount();
    await updateBadge(count);
  }, [fetchUnreadCount, updateBadge]);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!profile?.operator_id) return;

    const channel = supabase
      .channel('notifications-badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `operator_id=eq.${profile.operator_id}`
        },
        () => {
          // Refresh badge when notifications change
          refreshBadge();
        }
      )
      .subscribe();

    // Initial badge update
    refreshBadge();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.operator_id, refreshBadge]);

  // Clear badge when app becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Small delay to allow notification state to update
        setTimeout(() => {
          refreshBadge();
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshBadge]);

  return {
    updateBadge,
    refreshBadge,
    fetchUnreadCount
  };
};