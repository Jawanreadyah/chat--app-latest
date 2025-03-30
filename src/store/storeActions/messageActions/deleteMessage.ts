import { supabase } from '../../../lib/supabase';

export const deleteMessage = async (chatId: string, messageId: string, get: any, set: any) => {
  const currentUser = get().currentUser;
  if (!currentUser) throw new Error('User not logged in');
  if (!chatId) throw new Error('Chat ID is required');
  if (!messageId) throw new Error('Message ID is required');

  try {
    // Delete the message from the database
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;

    // Remove the message from the local state
    set(state => {
      const chatMessages = state.messages[chatId] || [];
      const updatedMessages = chatMessages.filter(msg => msg.id !== messageId);
      
      return {
        messages: {
          ...state.messages,
          [chatId]: updatedMessages
        }
      };
    });

    // Update the last message in the chat if needed
    const { data: lastMessage, error: lastMessageError } = await supabase
      .from('messages')
      .select('content')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastMessageError && lastMessage) {
      await supabase
        .from('chats')
        .update({ last_message: lastMessage.content })
        .eq('id', chatId);
    } else {
      // If there are no messages left, update to empty
      await supabase
        .from('chats')
        .update({ last_message: null })
        .eq('id', chatId);
    }

    // Reload chats to update the sidebar
    await get().loadChats();

  } catch (error) {
    console.error('Failed to delete message:', error);
    throw error;
  }
};