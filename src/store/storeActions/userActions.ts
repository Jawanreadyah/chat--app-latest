import { supabase } from '../../lib/supabase';

export const userActions = {
  login: async (username: string, password: string, set: any, get: any) => {
    if (!username.trim() || !password) {
      throw new Error('Username and password are required');
    }

    try {
      const { data: isValid, error: checkError } = await supabase.rpc('check_password', {
        p_username: username.trim(),
        p_password: password
      });

      if (checkError) throw checkError;
      if (!isValid) throw new Error('Invalid username or password');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username, avatar, display_name, bio, location, last_profile_update')
        .eq('username', username.trim())
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

      const user = { 
        username: userData.username, 
        avatar: userData.avatar || `letter:${userData.username[0].toUpperCase()}`,
        display_name: userData.display_name,
        bio: userData.bio,
        location: userData.location,
        last_profile_update: userData.last_profile_update
      };

      // Store user data in localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem(`password_${user.username}`, password);
      
      // Cache the avatar
      if (userData.avatar) {
        localStorage.setItem(`avatar_${user.username}`, userData.avatar);
      }

      // Update store
      set(state => ({ 
        currentUser: user,
        isAuthenticated: true,
        userProfiles: {
          ...state.userProfiles,
          [user.username]: user
        }
      }));

      await get().loadUserStatuses();
      await get().updateUserStatus('online');
      
      // Load cached profiles from localStorage
      try {
        const cachedProfiles = JSON.parse(localStorage.getItem('userProfilesCache') || '{}');
        if (Object.keys(cachedProfiles).length > 0) {
          // Update avatar cache for each profile
          Object.entries(cachedProfiles).forEach(([username, profile]: [string, any]) => {
            if (profile.avatar) {
              localStorage.setItem(`avatar_${username}`, profile.avatar);
            }
          });
          
          set(state => ({
            userProfiles: {
              ...state.userProfiles,
              ...cachedProfiles
            }
          }));
        }
      } catch (e) {
        console.error('Failed to load cached user profiles:', e);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.message || 'Invalid username or password');
    }
  },

  register: async (username: string, password: string, avatar: string | undefined, get: any) => {
    if (!username.trim() || !password) {
      throw new Error('Username and password are required');
    }

    try {
      const { error } = await supabase
        .from('users')
        .insert([{
          username: username.trim(),
          password_hash: password,
          avatar: avatar || `letter:${username[0].toUpperCase()}:bg-blue-500`
        }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Username already taken');
        }
        throw error;
      }

      localStorage.setItem(`newly-registered-${username.trim()}`, 'true');

      await get().login(username.trim(), password);
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(error.message || 'Failed to register user');
    }
  },

  updateUserStatus: async (status: 'online' | 'busy' | 'away' | 'offline', get: any, set: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('user_statuses')
        .upsert({
          username: currentUser.username,
          status,
          last_updated: new Date().toISOString(),
          last_seen: status === 'offline' ? new Date().toISOString() : null
        }, {
          onConflict: 'username'
        });

      if (error) throw error;

      await supabase.channel('user_status_changes').send({
        type: 'broadcast',
        event: 'status_change',
        payload: {
          username: currentUser.username,
          status,
          lastSeen: status === 'offline' ? new Date().toISOString() : null
        }
      });

      set(state => ({
        userStatuses: [
          ...state.userStatuses.filter(s => s.username !== currentUser.username),
          { 
            username: currentUser.username, 
            status, 
            lastUpdated: new Date().toISOString(),
            lastSeen: status === 'offline' ? new Date().toISOString() : null
          }
        ]
      }));
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  },

  loadUserStatuses: async (set: any) => {
    try {
      const { data, error } = await supabase
        .from('user_statuses')
        .select('*')
        .order('last_updated', { ascending: false });

      if (error) throw error;

      if (data) {
        const now = new Date();
        const statuses = data
          .filter(item => {
            // If status is not offline, check if it was updated in the last 2 minutes
            if (item.status !== 'offline') {
              const lastUpdated = new Date(item.last_updated);
              const diffSeconds = (now.getTime() - lastUpdated.getTime()) / 1000;
              return diffSeconds <= 120; // Consider online if updated in last 2 minutes
            }
            return true; // Always include offline users
          })
          .map(item => {
            // If user hasn't updated status in 2 minutes, consider them offline
            const lastUpdated = new Date(item.last_updated);
            const diffSeconds = (now.getTime() - lastUpdated.getTime()) / 1000;
            const status = diffSeconds <= 120 ? item.status : 'offline';
            
            return {
              username: item.username,
              status,
              lastUpdated: item.last_updated,
              lastSeen: status === 'offline' ? (item.last_seen || item.last_updated) : null
            };
          });

        set({ userStatuses: statuses });
      }
    } catch (error) {
      console.error('Failed to load user statuses:', error);
    }
  },

  getUserProfile: async (username: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_profile', {
        username_param: username
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }
};