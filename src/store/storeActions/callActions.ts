import { supabase } from '../../lib/supabase';

export const callActions = {
  checkForIncomingCalls: async (get: any, set: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('active_calls')
        .select('*')
        .eq('recipient_username', currentUser.username)
        .eq('status', 'pending');

      if (data && data.length > 0) {
        set({ 
          incomingCall: { 
            from: data[0].caller_username, 
            chatId: data[0].chat_id,
            isVideo: data[0].video_enabled
          } 
        });
      }
    } catch (error) {
      if (error.code !== 'PGRST116') {
        console.error('Failed to check for incoming calls:', error);
      }
    }
  }
};