import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'operator';

interface Profile {
  id: string;
  operator_id: string | null;
  role: UserRole;
}

export const useRole = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, operator_id, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setError(error.message);
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        setError('Failed to fetch user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const isAdmin = profile?.role === 'admin';
  const isOperator = profile?.role === 'operator';

  const updateRole = async (newRole: UserRole) => {
    if (!user || !profile) return { error: 'No user or profile found' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating role:', error);
        return { error: error.message };
      }

      setProfile({ ...profile, role: newRole });
      return { error: null };
    } catch (err) {
      console.error('Error in updateRole:', err);
      return { error: 'Failed to update role' };
    }
  };

  return {
    profile,
    role: profile?.role || 'operator',
    isAdmin,
    isOperator,
    loading,
    error,
    updateRole
  };
};