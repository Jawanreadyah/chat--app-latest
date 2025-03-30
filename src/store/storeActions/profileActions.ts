import { supabase } from '../../lib/supabase';
import { ProfileVisibility } from '../../types/store';

export const profileActions = {
  updateAvatar: async (avatar: string, get: any, set: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('User not logged in');
    if (!avatar) throw new Error('Avatar is required');

    set({ isUpdatingProfile: true, profileUpdateError: null });

    try {
      // Update avatar in database
      const { error } = await supabase
        .from('users')
        .update({ 
          avatar,
          last_profile_update: new Date().toISOString()
        })
        .eq('username', currentUser.username);

      if (error) throw error;

      // Track the update
      await supabase
        .from('profile_updates')
        .insert([{
          username: currentUser.username,
          field_name: 'avatar',
          old_value: currentUser.avatar,
          new_value: avatar
        }]);

      // Update local storage for current user
      const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({
        ...storedUser,
        avatar,
        last_profile_update: new Date().toISOString()
      }));

      // Update avatar cache
      localStorage.setItem(`avatar_${currentUser.username}`, avatar);

      // Update current user and profiles in store
      set(state => ({ 
        currentUser: {
          ...currentUser,
          avatar,
          last_profile_update: new Date().toISOString()
        },
        userProfiles: {
          ...state.userProfiles,
          [currentUser.username]: {
            ...state.userProfiles[currentUser.username],
            avatar,
            last_profile_update: new Date().toISOString()
          }
        },
        isUpdatingProfile: false
      }));

      // Broadcast profile update to all users
      await supabase.channel('profile_updates').send({
        type: 'broadcast',
        event: 'profile_update',
        payload: {
          username: currentUser.username,
          field: 'avatar',
          value: avatar,
          timestamp: new Date().toISOString()
        }
      });

      return avatar;
    } catch (error: any) {
      console.error('Failed to update avatar:', error);
      set({ 
        isUpdatingProfile: false,
        profileUpdateError: error.message || 'Failed to update avatar'
      });
      throw error;
    }
  },

  getUserProfile: async (username: string, get: any, set: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, avatar, display_name, bio, location, last_profile_update')
        .eq('username', username)
        .single();

      if (error) throw error;

      if (data) {
        // Cache the profile data
        set(state => ({
          userProfiles: {
            ...state.userProfiles,
            [username]: data
          }
        }));

        // Cache the avatar
        if (data.avatar) {
          localStorage.setItem(`avatar_${username}`, data.avatar);
        }

        return data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  },

  updateProfileField: async (field: string, value: string, get: any, set: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('User not logged in');
    if (!field) throw new Error('Field name is required');

    const allowedFields = ['bio', 'location', 'display_name'];
    if (!allowedFields.includes(field)) {
      throw new Error(`Cannot update field: ${field}. Allowed fields are: ${allowedFields.join(', ')}`);
    }

    set({ isUpdatingProfile: true, profileUpdateError: null });

    try {
      // Store old value for tracking
      const oldValue = currentUser[field];

      // Update field in database
      const { error } = await supabase
        .from('users')
        .update({ 
          [field]: value,
          last_profile_update: new Date().toISOString()
        })
        .eq('username', currentUser.username);

      if (error) throw error;

      // Track the update
      await supabase
        .from('profile_updates')
        .insert([{
          username: currentUser.username,
          field_name: field,
          old_value: oldValue || null,
          new_value: value
        }]);

      // Update current user in store
      set({ 
        currentUser: {
          ...currentUser,
          [field]: value,
          last_profile_update: new Date().toISOString()
        },
        isUpdatingProfile: false
      });

      // Broadcast profile update
      await supabase.channel('profile_updates').send({
        type: 'broadcast',
        event: 'profile_update',
        payload: {
          username: currentUser.username,
          field,
          value,
          timestamp: new Date().toISOString()
        }
      });

      return value;
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      set({ 
        isUpdatingProfile: false,
        profileUpdateError: error.message || `Failed to update ${field}`
      });
      throw error;
    }
  },

  loadProfileVisibility: async (get: any, set: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    try {
      // Get profile visibility settings
      const { data, error } = await supabase
        .from('profile_visibility')
        .select('*')
        .eq('username', currentUser.username)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default settings
      if (!data) {
        const defaultSettings: Omit<ProfileVisibility, 'updated_at'> = {
          username: currentUser.username,
          is_public: true,
          show_status: true,
          show_last_seen: true,
          show_bio: true,
          show_location: true
        };

        const { data: newData, error: insertError } = await supabase
          .from('profile_visibility')
          .insert([defaultSettings])
          .select()
          .single();

        if (insertError) throw insertError;

        set({ profileVisibility: newData });
      } else {
        set({ profileVisibility: data });
      }

      // Subscribe to profile visibility changes
      const channel = supabase.channel('profile_visibility_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profile_visibility',
            filter: `username=eq.${currentUser.username}`
          },
          (payload) => {
            set({ profileVisibility: payload.new });
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to load profile visibility:', error);
      throw error;
    }
  },

  updateProfileVisibility: async (settings: Partial<ProfileVisibility>, get: any, set: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('User not logged in');

    set({ isUpdatingProfile: true, profileUpdateError: null });

    try {
      const { data, error } = await supabase
        .from('profile_visibility')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('username', currentUser.username)
        .select()
        .single();

      if (error) throw error;

      set({ 
        profileVisibility: data,
        isUpdatingProfile: false
      });

      return data;
    } catch (error) {
      console.error('Failed to update profile visibility:', error);
      set({ 
        isUpdatingProfile: false,
        profileUpdateError: error.message || 'Failed to update profile visibility'
      });
      throw error;
    }
  },

  loadProfileUpdates: async (get: any, set: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('profile_updates')
        .select('*')
        .eq('username', currentUser.username)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      set({ profileUpdates: data || [] });

      // Subscribe to profile updates
      const channel = supabase.channel('profile_updates_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'profile_updates',
            filter: `username=eq.${currentUser.username}`
          },
          () => {
            // Reload profile updates when changes occur
            profileActions.loadProfileUpdates(get, set);
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to load profile updates:', error);
      throw error;
    }
  }
};