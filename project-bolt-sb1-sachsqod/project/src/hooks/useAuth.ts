import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  story_count: number;
  total_recording_time: number;
  subscription_status: string;
  subscription_id: string | null;
  subscription_end_date: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        (async () => {
          setUser(session?.user ?? null);
          if (session?.user) {
            await loadUserProfile(session.user.id);
          } else {
            setUserProfile(null);
          }
        })();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadUserProfile(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
  };

  const updateRecordingTime = async (seconds: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          total_recording_time: (userProfile?.total_recording_time || 0) + seconds,
        })
        .eq('id', user.id);

      if (error) throw error;

      if (userProfile) {
        setUserProfile({
          ...userProfile,
          total_recording_time: userProfile.total_recording_time + seconds,
        });
      }
    } catch (error) {
      console.error('Error updating recording time:', error);
    }
  };

  const canCreateStory = () => {
    if (!userProfile) return true;
    if (userProfile.subscription_status === 'active') return true;
    return userProfile.story_count < 15 && userProfile.total_recording_time < 300;
  };

  return {
    user,
    userProfile,
    loading,
    logout,
    updateRecordingTime,
    canCreateStory,
    refreshProfile: () => user && loadUserProfile(user.id),
  };
}
