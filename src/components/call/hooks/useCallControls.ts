import { useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

interface UseCallControlsProps {
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  callChannelRef: React.MutableRefObject<any>;
  currentUsername: string;
  recipientUsername: string;
}

export function useCallControls({
  localStreamRef,
  callChannelRef,
  currentUsername,
  recipientUsername
}: UseCallControlsProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isTroubleshooting, setIsTroubleshooting] = useState(false);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn(!isCameraOn);

      // Notify the other party about camera state change
      callChannelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'camera-toggle',
          from: currentUsername,
          to: recipientUsername,
          isCameraOn: !isCameraOn
        }
      });
    }
  };

  const troubleshootVideo = async (
    peerConnectionRef: React.MutableRefObject<RTCPeerConnection | null>,
    remoteStreamRef: React.MutableRefObject<MediaStream | null>,
    hasRemoteVideo: boolean,
    setHasRemoteVideo: (has: boolean) => void,
    setError: (error: string | null) => void
  ) => {
    if (isTroubleshooting) return;
    setIsTroubleshooting(true);
    
    try {
      console.log('Troubleshooting video connection...');
      
      // Notify the other party that we're troubleshooting
      callChannelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'troubleshoot-video',
          from: currentUsername,
          to: recipientUsername
        }
      });
      
      // Check if we have a peer connection
      if (!peerConnectionRef.current) {
        console.log('No peer connection found during troubleshooting');
        setError('Connection error. Please try ending the call and calling again.');
        setIsTroubleshooting(false);
        return;
      }
      
      // Check if we have a remote stream
      if (!remoteStreamRef.current) {
        console.log('No remote stream found during troubleshooting');
        
        // Create a new offer to restart ICE
        try {
          const offer = await peerConnectionRef.current.createOffer({ iceRestart: true });
          await peerConnectionRef.current.setLocalDescription(offer);
          
          // Send the offer to the other party
          callChannelRef.current?.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'offer',
              sdp: offer,
              from: currentUsername,
              to: recipientUsername
            }
          });
          
          console.log('Sent new offer with ICE restart');
        } catch (error) {
          console.error('Error creating new offer:', error);
        }
      } else {
        // Check if we have video tracks in the remote stream
        const videoTracks = remoteStreamRef.current.getVideoTracks();
        console.log(`Remote stream has ${videoTracks.length} video tracks`);
        
        if (videoTracks.length === 0) {
          // Request video tracks specifically
          callChannelRef.current?.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'request-video-tracks',
              from: currentUsername,
              to: recipientUsername
            }
          });
          
          console.log('Requested video tracks from peer');
        } else {
          // Check if video tracks are enabled
          const allDisabled = videoTracks.every(track => !track.enabled);
          if (allDisabled) {
            console.log('All video tracks are disabled');
            
            // Request to enable video tracks
            callChannelRef.current?.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: 'request-enable-video',
                from: currentUsername,
                to: recipientUsername
              }
            });
          } else {
            console.log('Video tracks exist and are enabled, but might not be showing');
            
            // Force a renegotiation
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            
            callChannelRef.current?.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: 'offer',
                sdp: offer,
                from: currentUsername,
                to: recipientUsername
              }
            });
            
            console.log('Sent renegotiation offer');
          }
        }
      }
      
      // Set a timeout to check if troubleshooting worked
      setTimeout(() => {
        if (!hasRemoteVideo) {
          console.log('Troubleshooting did not resolve the issue');
          // Try one more time with a complete reconnection approach
          callChannelRef.current?.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'reconnect-video',
              from: currentUsername,
              to: recipientUsername
            }
          });
        } else {
          console.log('Troubleshooting appears to have worked');
        }
        setIsTroubleshooting(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error during video troubleshooting:', error);
      setError('Failed to troubleshoot video. Please try ending the call and calling again.');
      setIsTroubleshooting(false);
    }
  };

  return {
    isMuted,
    isCameraOn,
    isTroubleshooting,
    toggleMute,
    toggleVideo,
    troubleshootVideo,
    setIsTroubleshooting
  };
}