import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useChatStore } from '../../../store/chatStore';

interface UseCallCleanupProps {
  chatId: string;
  isIncoming: boolean;
  recipientUsername: string;
  currentUsername: string;
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  remoteStreamRef: React.MutableRefObject<MediaStream | null>;
  peerConnectionRef: React.MutableRefObject<RTCPeerConnection | null>;
  callChannelRef: React.MutableRefObject<any>;
  stopCallTimer: () => void;
  stopRingtone: () => void;
  onClose: () => void;
}

export function useCallCleanup({
  chatId,
  isIncoming,
  recipientUsername,
  currentUsername,
  localStreamRef,
  remoteStreamRef,
  peerConnectionRef,
  callChannelRef,
  stopCallTimer,
  stopRingtone,
  onClose
}: UseCallCleanupProps) {
  const [isClosing, setIsClosing] = useState(false);

  const cleanup = async () => {
    if (isClosing) return; // Prevent multiple cleanup calls
    setIsClosing(true);
    
    try {
      // First stop timers and audio
      stopCallTimer();
      stopRingtone();
      
      // Then stop media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        localStreamRef.current = null;
      }

      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        remoteStreamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Unsubscribe from channel
      if (callChannelRef.current) {
        await callChannelRef.current.unsubscribe();
        callChannelRef.current = null;
      }

      // Delete active call record
      await supabase
        .from('active_calls')
        .delete()
        .match({
          chat_id: chatId,
          caller_username: isIncoming ? recipientUsername : currentUsername,
          recipient_username: isIncoming ? currentUsername : recipientUsername
        });

      // Clear incoming call state
      useChatStore.getState().setIncomingCall(null);
      
      // Finally call the onClose callback
      onClose();
    } catch (error) {
      console.error('Error during call cleanup:', error);
      // Still try to call onClose even if there was an error
      onClose();
    }
  };

  return {
    isClosing,
    cleanup
  };
}