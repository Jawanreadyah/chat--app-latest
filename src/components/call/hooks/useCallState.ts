import { useState, useRef } from 'react';
import { useCallDuration } from './useCallDuration';
import { useCallAudio } from './useCallAudio';
import { useCallControls } from './useCallControls';
import { useCallActions } from './useCallActions';
import { useCallCleanup } from './useCallCleanup';

type CallStatus = 'initiating' | 'ringing' | 'connected' | 'declined' | 'ended';

export function useCallState(
  chatId: string,
  recipientUsername: string,
  currentUsername: string,
  isIncoming: boolean,
  isVideo: boolean,
  onClose: () => void
) {
  // State
  const [isVideoEnabled] = useState(isVideo);
  const [callStatus, setCallStatus] = useState<CallStatus>(isIncoming ? 'ringing' : 'initiating');
  const [error, setError] = useState<string | null>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  
  // Refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callChannelRef = useRef<any>(null);
  
  // Constants
  const RINGTONE_URL = 'https://od.lk/s/OTBfNDM3OTg2MjZf/android.mp3';

  // Custom hooks
  const { 
    callDuration, 
    callStartTimeRef, 
    startCallTimer, 
    stopCallTimer 
  } = useCallDuration();
  
  const { 
    ringtoneRef, 
    stopRingtone 
  } = useCallAudio({ 
    playingAudio: null, 
    setPlayingAudio: () => {}, 
    RINGTONE_URL 
  });
  
  const { 
    isClosing, 
    cleanup 
  } = useCallCleanup({
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
  });
  
  const { 
    isMuted, 
    isCameraOn, 
    isTroubleshooting,
    toggleMute, 
    toggleVideo, 
    troubleshootVideo,
    setIsTroubleshooting
  } = useCallControls({
    localStreamRef,
    callChannelRef,
    currentUsername,
    recipientUsername
  });
  
  const { 
    acceptCall, 
    declineCall, 
    endCall 
  } = useCallActions({
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
  });

  // Wrapper for troubleshootVideo to include the required refs
  const handleTroubleshootVideo = async () => {
    await troubleshootVideo(
      peerConnectionRef,
      remoteStreamRef,
      hasRemoteVideo,
      setHasRemoteVideo,
      setError
    );
  };

  return {
    // State
    isMuted,
    isVideoEnabled,
    isCameraOn,
    callStatus,
    error,
    callDuration,
    hasRemoteVideo,
    isTroubleshooting,
    
    // Refs
    localStreamRef,
    remoteStreamRef,
    peerConnectionRef,
    callChannelRef,
    ringtoneRef,
    
    // Constants
    RINGTONE_URL,
    
    // Methods
    toggleMute,
    toggleVideo,
    troubleshootVideo: handleTroubleshootVideo,
    acceptCall,
    declineCall,
    endCall,
    cleanup,
    startCallTimer,
    stopRingtone,
    setCallStatus,
    setError,
    setHasRemoteVideo,
    setIsTroubleshooting
  };
}