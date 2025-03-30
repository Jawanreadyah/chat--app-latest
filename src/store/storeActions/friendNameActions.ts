import { supabase } from '../../lib/supabase';

export const friendNameActions = {
  setFriendName: async (chatId: string, username: string, customName: string, get: any, set: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('User not logged in');
    if (!chatId) throw new Error('Chat ID is required');
    if (!username) throw new Error('Username is required');
    if (!customName.trim()) throw new Error('Custom name is required');

    try {
      // Check if a custom name already exists for this user by this setter
      const { data: existingName, error: checkError } = await supabase
        .from('friend_names')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_username', username)
        .eq('set_by', currentUser.username)
        .maybeSingle();

      if (checkError) throw checkError;

      let result;
      
      if (existingName) {
        // Update existing custom name
        const { data, error } = await supabase
          .from('friend_names')
          .update({ 
            custom_name: customName.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingName.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Create new custom name
        const { data, error } = await supabase
          .from('friend_names')
          .insert([{
            chat_id: chatId,
            user_username: username,
            custom_name: customName.trim(),
            set_by: currentUser.username
          }])
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }

      // Update local state
      set(state => {
        const chatFriendNames = state.friendNames[chatId] || [];
        const updatedFriendNames = existingName
          ? chatFriendNames.map(name => 
              name.id === existingName.id ? result : name
            )
          : [...chatFriendNames, result];
        
        return {
          friendNames: {
            ...state.friendNames,
            [chatId]: updatedFriendNames
          }
        };
      });

      return result;
    } catch (error) {
      console.error('Failed to set friend name:', error);
      throw error;
    }
  },

  loadFriendNames: async (chatId: string, get: any, set: any) => {
    if (!chatId) throw new Error('Chat ID is required');

    try {
      const { data, error } = await supabase
        .from('friend_names')
        .select('*')
        .eq('chat_id', chatId);

      if (error) throw error;

      // Update local state
      set(state => ({
        friendNames: {
          ...state.friendNames,
          [chatId]: data || []
        }
      }));

      // Set up subscription for friend names changes
      const friendNamesChannel = supabase.channel('friend_names_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friend_names',
            filter: `chat_id=eq.${chatId}`
          },
          () => {
            // Reload friend names when changes occur
            friendNameActions.loadFriendNames(chatId, get, set);
          }
        )
        .subscribe();

      return () => {
        friendNamesChannel.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to load friend names:', error);
      throw error;
    }
  },

  getFriendName: (chatId: string, username: string, get: any) => {
    const currentUser = get().currentUser;
    if (!currentUser || !chatId || !username) return null;

    const chatFriendNames = get().friendNames[chatId] || [];
    const customName = chatFriendNames.find(
      name => name.user_username === username && name.set_by === currentUser.username
    );

    return customName ? customName.custom_name : null;
  }
};