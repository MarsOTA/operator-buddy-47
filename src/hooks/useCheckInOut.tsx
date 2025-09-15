import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRole } from './useRole';
import { toast } from 'sonner';

interface CheckIn {
  id: string;
  shift_id: string;
  operator_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  location_lat: number | null;
  location_lng: number | null;
  notes: string | null;
}

export const useCheckInOut = (shiftId: string) => {
  const { user } = useAuth();
  const { profile } = useRole();
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile?.operator_id || !shiftId) return;

    const fetchCheckIn = async () => {
      try {
        const { data, error } = await supabase
          .from('shift_checkins')
          .select('*')
          .eq('shift_id', shiftId)
          .eq('operator_id', profile.operator_id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching check-in:', error);
          return;
        }

        setCheckIn(data);
      } catch (err) {
        console.error('Error in fetchCheckIn:', err);
      }
    };

    fetchCheckIn();
  }, [profile?.operator_id, shiftId]);

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Resolve with null coordinates if location fails
          resolve({ lat: 0, lng: 0 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  const checkInShift = async (notes?: string) => {
    if (!profile?.operator_id) {
      toast.error('Profile non trovato');
      return { error: 'Profile not found' };
    }

    setLoading(true);
    try {
      const location = await getCurrentLocation();
      
      const checkInData = {
        shift_id: shiftId,
        operator_id: profile.operator_id,
        check_in_time: new Date().toISOString(),
        location_lat: location.lat,
        location_lng: location.lng,
        notes: notes || null
      };

      const { data, error } = await supabase
        .from('shift_checkins')
        .insert([checkInData])
        .select()
        .single();

      if (error) {
        console.error('Error checking in:', error);
        toast.error('Errore durante il check-in');
        return { error: error.message };
      }

      setCheckIn(data);
      toast.success('Check-in effettuato con successo');
      return { error: null };
    } catch (err) {
      console.error('Error in checkInShift:', err);
      toast.error('Errore durante il check-in');
      return { error: 'Failed to check in' };
    } finally {
      setLoading(false);
    }
  };

  const checkOutShift = async (notes?: string) => {
    if (!checkIn) {
      toast.error('Nessun check-in trovato');
      return { error: 'No check-in found' };
    }

    setLoading(true);
    try {
      const location = await getCurrentLocation();
      
      const { data, error } = await supabase
        .from('shift_checkins')
        .update({
          check_out_time: new Date().toISOString(),
          location_lat: location.lat,
          location_lng: location.lng,
          notes: notes || checkIn.notes
        })
        .eq('id', checkIn.id)
        .select()
        .single();

      if (error) {
        console.error('Error checking out:', error);
        toast.error('Errore durante il check-out');
        return { error: error.message };
      }

      setCheckIn(data);
      toast.success('Check-out effettuato con successo');
      return { error: null };
    } catch (err) {
      console.error('Error in checkOutShift:', err);
      toast.error('Errore durante il check-out');
      return { error: 'Failed to check out' };
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = checkIn?.check_in_time && !checkIn?.check_out_time;
  const isCheckedOut = checkIn?.check_in_time && checkIn?.check_out_time;

  return {
    checkIn,
    loading,
    isCheckedIn,
    isCheckedOut,
    checkInShift,
    checkOutShift
  };
};