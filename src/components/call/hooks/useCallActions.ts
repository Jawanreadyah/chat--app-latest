import { supabase } from '../../../lib/supabase';
import { useChatStore } from '../../../store/chatStore';

interface UseCallActionsProps {
  chatId: string;
  recipientUsername: string;
  currentUsername: string;
  isIncoming: boolean;
  callStatus: 'initiating' | 'ringing' | 'connected' | 'declined' | 'ended';
  setCallStatus: (status: 'initiating' | 'ringing' | 'connected' | 'declined' | 'ended') => void;
  startCallTimer: () => void;
  stopRingtone: () => void;
  callStartTimeRef: React.MutableRefObject<number | null>;
  callChannelRef: React.MutableRefObject<any>;
  isVideoEnabled: boolean;
  cleanup: () => Promise<void>;
}

export function useCallActions({
  chatId,
  recipientUsername,
  currentUsername,
  isIncoming,
  callStatus,
  setCallStatus,
  startCallTimer,
  stopRingtone,
  callStartTimeRef,
  callChannelRef,
  isVideoEnabled,
  cleanup
}: UseCallActionsProps) {
  const acceptCall = async () => {
    try {
      stopRingtone();
      setCallStatus('connected');
      startCallTimer();

      // Notify the caller that the call has been accepted
      callChannelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'call-accepted',
          from: currentUsername,
          to: recipientUsername
        }
      });

      // Update the call status in the database
      await supabase
        .from('active_calls')
        .update({ status: 'accepted' })
        .match({
          chat_id: chatId,
          caller_username: recipientUsername,
          recipient_username: currentUsername
        });

    } catch (err) {
      console.error('Error accepting call:', err);
      // Reload page after a short delay if there's an error
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  const declineCall = async () => {
    stopRingtone();
    
    try {
      setCallStatus('declined');
      
      // Notify the caller that the call has been declined
      callChannelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'call-declined',
          from: currentUsername,
          to: recipientUsername
        }
      });
      
      await cleanup();
      // Reload page after declining
      window.location.reload();
    } catch (error) {
      console.error('Error declining call:', error);
      window.location.reload();
    }
  };

  const endCall = async () => {
    stopRingtone();
    setCallStatus('ended');

    try {
      const duration = callStartTimeRef.current 
        ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        : null;

      // Log the call
      await supabase
        .from('call_logs')
        .insert([{
          caller_username: isIncoming ? recipientUsername : currentUsername,
          recipient_username: isIncoming ? currentUsername : recipientUsername,
          chat_id: chatId,
          status: callStatus === 'connected' ? 'completed' : 
                 callStatus === 'declined' ? 'declined' : 'missed',
          started_at: new Date(callStartTimeRef.current || Date.now()).toISOString(),
          ended_at: new Date().toISOString(),
          duration: callStatus === 'connected' ? duration : null,
          video_enabled: isVideoEnabled
        }]);
    } catch (error) {
      console.error('Failed to save call log:', error);
    }

    try {
      // Send end call signal to the other party
      callChannelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'call-ended',
          from: currentUsername,
          to: recipientUsername
        }
      });
    } catch (error) {
      console.error('Failed to send call ended signal:', error);
    }
    
    await cleanup();
  };

  return {
    acceptCall,
    declineCall,
    endCall
  };
}