import { supabase } from '../../lib/supabase';

export const pinnedMessageActions = {
  pinMessage: async (chatId: string, messageId: string, get: any, set: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('User not logged in');
    if (!chatId) throw new Error('Chat ID is required');
    if (!messageId) throw new Error('Message ID is required');

    try {
      // Check if message is already pinned
      const { data: existingPin, error: checkError } = await supabase
        .from('pinned_messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('message_id', messageId)
        .maybeSingle();

      if (checkError) throw checkError;
      
      // If already pinned, return early without error
      if (existingPin) {
        return existingPin;
      }

      // Pin the message
      const { data: pinnedMessage, error } = await supabase
        .from('pinned_messages')
        .insert([{
          chat_id: chatId,
          message_id: messageId,
          pinned_by: currentUser.username
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set(state => {
        const chatPinnedMessages = state.pinnedMessages[chatId] || [];
        
        // Update messages to mark as pinned
        const chatMessages = state.messages[chatId] || [];
        const updatedMessages = chatMessages.map(msg => 
          msg.id === messageId ? { ...msg, is_pinned: true } : msg
        );
        
        return {
          pinnedMessages: {
            ...state.pinnedMessages,
            [chatId]: [...chatPinnedMessages, pinnedMessage]
          },
          messages: {
            ...state.messages,
            [chatId]: updatedMessages
          }
        };
      });

      // Reload pinned messages to ensure consistency
      await pinnedMessageActions.loadPinnedMessages(chatId, get, set);
      
      return pinnedMessage;
    } catch (error) {
      console.error('Failed to pin message:', error);
      throw error;
    }
  },

  unpinMessage: async (chatId: string, messageId: string, get: any, set: any) => {
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('User not logged in');
    if (!chatId) throw new Error('Chat ID is required');
    if (!messageId) throw new Error('Message ID is required');

    try {
      // Unpin the message
      const { error } = await supabase
        .from('pinned_messages')
        .delete()
        .eq('chat_id', chatId)
        .eq('message_id', messageId);

      if (error) throw error;

      // Update local state
      set(state => {
        const chatPinnedMessages = state.pinnedMessages[chatId] || [];
        const updatedPinnedMessages = chatPinnedMessages.filter(
          pin => pin.message_id !== messageId
        );
        
        // Update messages to unmark as pinned
        const chatMessages = state.messages[chatId] || [];
        const updatedMessages = chatMessages.map(msg => 
          msg.id === messageId ? { ...msg, is_pinned: false } : msg
        );
        
        return {
          pinnedMessages: {
            ...state.pinnedMessages,
            [chatId]: updatedPinnedMessages
          },
          messages: {
            ...state.messages,
            [chatId]: updatedMessages
          }
        };
      });

      // Reload pinned messages to ensure consistency
      await pinnedMessageActions.loadPinnedMessages(chatId, get, set);
    } catch (error) {
      console.error('Failed to unpin message:', error);
      throw error;
    }
  },

  loadPinnedMessages: async (chatId: string, get: any, set: any) => {
    if (!chatId) throw new Error('Chat ID is required');

    try {
      const { data, error } = await supabase
        .from('pinned_messages')
        .select('*')
        .eq('chat_id', chatId);

      if (error) throw error;

      // Update local state
      set(state => ({
        pinnedMessages: {
          ...state.pinnedMessages,
          [chatId]: data || []
        }
      }));

      // Mark pinned messages in the messages array
      if (data && data.length > 0) {
        const pinnedMessageIds = new Set(data.map(pin => pin.message_id));
        
        set(state => {
          const chatMessages = state.messages[chatId] || [];
          const updatedMessages = chatMessages.map(msg => 
            pinnedMessageIds.has(msg.id) ? { ...msg, is_pinned: true } : msg
          );
          
          return {
            messages: {
              ...state.messages,
              [chatId]: updatedMessages
            }
          };
        });
      }

      // Set up subscription for pinned messages changes
      const pinnedChannel = supabase.channel(`pinned_messages_${chatId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pinned_messages',
            filter: `chat_id=eq.${chatId}`
          },
          () => {
            // Reload pinned messages when changes occur
            pinnedMessageActions.loadPinnedMessages(chatId, get, set);
          }
        )
        .subscribe();

      return () => {
        pinnedChannel.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
      throw error;
    }
  }
};