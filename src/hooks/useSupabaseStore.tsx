import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useSupabaseStore = () => {
  const { user, loading: authLoading } = useAuth();
  const { setCurrentOperator } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [operatorData, setOperatorData] = useState(null);

  useEffect(() => {
    const loadOperatorData = async () => {
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      try {
        // Get the user's profile to find linked operator
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('operator_id')
          .eq('id', user.id)
          .single();

        if (profileError || !profile?.operator_id) {
          console.log('No operator linked to user profile');
          setLoading(false);
          return;
        }

        // Get operator data
        const { data: operator, error: operatorError } = await supabase
          .from('operators')
          .select('*')
          .eq('id', profile.operator_id)
          .single();

        if (operatorError) {
          console.error('Error loading operator:', operatorError);
          setLoading(false);
          return;
        }

        if (operator) {
          setOperatorData(operator);
          setCurrentOperator(operator.id);
        }

      } catch (error) {
        console.error('Error in useSupabaseStore:', error);
        toast({
          title: "Errore caricamento dati",
          description: "Impossibile caricare i dati dell'operatore",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadOperatorData();
  }, [user, authLoading, setCurrentOperator]);

  const sendNotification = async (operatorId: string, title: string, message: string, type: 'shift_assignment' | 'shift_update' | 'shift_cancellation', eventId?: string, shiftId?: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          operatorId,
          title,
          body: message,
          type,
          eventId,
          shiftId
        }
      });

      if (error) {
        console.error('Error sending notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error invoking notification function:', error);
      return false;
    }
  };

  return {
    loading,
    operatorData,
    sendNotification
  };
};