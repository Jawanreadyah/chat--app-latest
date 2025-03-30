import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCallState } from './call/hooks/useCallState';
import { useWebRTC } from './call/hooks/useWebRTC';
import { CallDisplay } from './call/CallDisplay';
import { CallControls } from './call/CallControls';
import { useChatStore } from '../store/chatStore';
import { useNavigate } from 'react-router-dom';

interface VoiceCallProps {
  chatId: string;
  recipientUsername: string;
  currentUsername: string;
  onClose: () => void;
  isIncoming?: boolean;
  isVideo?: boolean;
}

export function VoiceCall({ 
  chatId, 
  recipientUsername, 
  currentUsername, 
  onClose, 
  isIncoming = false, 
  isVideo = false 
}: VoiceCallProps) {
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { sendMessage } = useChatStore();
  const isCleaningUp = useRef(false);

  const callState = useCallState(
    chatId,
    recipientUsername,
    currentUsername,
    isIncoming,
    isVideo,
    onClose
  );

  useWebRTC(
    chatId,
    recipientUsername,
    currentUsername,
    isIncoming,
    callState.isVideoEnabled,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    callState
  );

  // Play ringtone for incoming calls
  useEffect(() => {
    if (isIncoming && callState.callStatus === 'ringing') {
      callState.ringtoneRef.current = new Audio(callState.RINGTONE_URL);
      callState.ringtoneRef.current.loop = true;
      callState.ringtoneRef.current.play().catch(error => {
        console.error('Failed to play ringtone:', error);
      });
    }

    return () => {
      callState.stopRingtone();
    };
  }, [isIncoming, callState.callStatus]);

  // Handle call end and cleanup
  const handleEndCall = async () => {
    // Prevent multiple cleanup attempts
    if (isCleaningUp.current) {
      return;
    }
    
    isCleaningUp.current = true;
    
    try {
      // Send refresh signal to both users before cleanup
      if (callState.callChannelRef.current) {
        await callState.callChannelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'refresh-page',
            from: currentUsername,
            to: recipientUsername,
            chatId: chatId
          }
        });
      }

      // Wait a moment for the signal to be sent
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then cleanup
      await callState.cleanup();
      
      const duration = callState.callDuration;
      const callType = isVideo ? 'Video' : 'Voice';
      
      // Send system message about call duration
      const systemMessage = `[System] ${callType} call ended • ${formatDuration(duration)}`;
      await sendMessage(chatId, systemMessage, true);
      
      // Force refresh the page after a short delay
      setTimeout(() => {
        window.location.href = `/chat/${chatId}`;
      }, 200);
    } catch (error) {
      console.error('Error during call end:', error);
      window.location.href = `/chat/${chatId}`;
    }
  };

  // Format duration helper
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Handle close button click
  const handleCloseClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Prevent multiple clicks from triggering multiple cleanups
    if (isCleaningUp.current) {
      return;
    }
    
    await handleEndCall();
  };

  // Listen for refresh signal
  useEffect(() => {
    if (callState.callChannelRef.current) {
      const handleSignal = async (payload: any) => {
        if (payload.type === 'refresh-page' && (payload.to === currentUsername || payload.from === recipientUsername)) {
          // Prevent multiple refreshes
          if (isCleaningUp.current) {
            return;
          }
          isCleaningUp.current = true;
          
          // Small delay to ensure both users get the signal
          await new Promise(resolve => setTimeout(resolve, 200));
          window.location.href = `/chat/${chatId}`;
        }
      };

      callState.callChannelRef.current.on('broadcast', { event: 'signal' }, ({ payload }: any) => {
        handleSignal(payload).catch(console.error);
      });

      return () => {
        if (callState.callChannelRef.current) {
          callState.callChannelRef.current.off('broadcast');
        }
      };
    }
  }, [chatId, currentUsername, recipientUsername]);

  // Handle permission errors
  useEffect(() => {
    if (callState.error && callState.error.includes('permission')) {
      const timer = setTimeout(async () => {
        if (!isCleaningUp.current) {
          await handleEndCall();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [callState.error]);

  // Ensure cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (!isCleaningUp.current) {
        try {
          callState.cleanup();
        } catch (error) {
          console.error('Error during unmount cleanup:', error);
        }
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-[#2a2b2e] rounded-lg shadow-xl p-6 ${callState.isVideoEnabled ? 'w-[800px]' : 'w-96'}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            {isIncoming ? `Incoming ${callState.isVideoEnabled ? 'Video' : 'Voice'} Call` : `${callState.isVideoEnabled ? 'Video' : 'Voice'} Call`}
          </h3>
          <button
            onClick={handleCloseClick}
            className="text-gray-400 hover:text-gray-300 z-50 p-2 rounded-full hover:bg-[#1a1b1e] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {callState.error ? (
          <div className="text-red-400 text-center mb-4">{callState.error}</div>
        ) : (
          <CallDisplay
            callStatus={callState.callStatus}
            isIncoming={isIncoming}
            isVideoEnabled={callState.isVideoEnabled}
            recipientUsername={recipientUsername}
            callDuration={callState.callDuration}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            hasRemoteVideo={callState.hasRemoteVideo}
          />
        )}

        <audio ref={remoteAudioRef} autoPlay playsInline />

        <CallControls
          callStatus={callState.callStatus}
          isIncoming={isIncoming}
          isVideoEnabled={callState.isVideoEnabled}
          isMuted={callState.isMuted}
          isCameraOn={callState.isCameraOn}
          toggleMute={callState.toggleMute}
          toggleVideo={callState.toggleVideo}
          acceptCall={callState.acceptCall}
          declineCall={callState.declineCall}
          endCall={handleEndCall}
          troubleshootVideo={callState.troubleshootVideo}
          hasRemoteVideo={callState.hasRemoteVideo}
        />
        
        {callState.isVideoEnabled && !callState.hasRemoteVideo && callState.callStatus === 'connected' && (
          <div className="mt-4 text-center text-yellow-400 text-sm">
            <p>Can't see the other person? Try the troubleshoot button above to fix the video connection.</p>
          </div>
        )}
      </div>
    </div>
  );
}