import { useEffect, useState } from 'react';
import { useMediaStream } from './useMediaStream';
import { usePeerConnection } from './usePeerConnection';
import { useWebRTCSignaling } from './useWebRTCSignaling';

export function useWebRTC(
  chatId: string,
  recipientUsername: string,
  currentUsername: string,
  isIncoming: boolean,
  isVideoEnabled: boolean,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>,
  remoteAudioRef: React.RefObject<HTMLAudioElement>,
  callState: any
) {
  const [isCleanedUp, setIsCleanedUp] = useState(false);

  // Get media stream
  const { getLocalStream } = useMediaStream({
    isVideoEnabled,
    onError: callState.setError
  });

  useEffect(() => {
    let pc: RTCPeerConnection | null = null;
    let localStream: MediaStream | null = null;
    let channel: any = null;

    const initializeWebRTC = async () => {
      try {
        console.log('Initializing WebRTC with video enabled:', isVideoEnabled);
        
        // Create peer connection
        const { createPeerConnection, addTracksToConnection } = usePeerConnection({
          onIceCandidate: (candidate) => {
            if (channel) {
              console.log('Sending ICE candidate to peer');
              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                  type: 'ice-candidate',
                  candidate,
                  from: currentUsername,
                  to: recipientUsername
                }
              });
            }
          },
          onTrack: (track) => {
            console.log('Received remote track:', track.kind);
            
            // Create remote stream if it doesn't exist
            if (!callState.remoteStreamRef.current) {
              callState.remoteStreamRef.current = new MediaStream();
              console.log('Created new remote stream');
            }
            
            // Add the track to our remote stream
            callState.remoteStreamRef.current.addTrack(track);
            console.log(`Added ${track.kind} track to remote stream`);
            
            // Update remote video element
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = callState.remoteStreamRef.current;
              console.log('Set remote video element source');
            }
            
            // Update remote audio element
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = callState.remoteStreamRef.current;
              console.log('Set remote audio element source');
            }
            
            // Set hasRemoteVideo if we receive a video track
            if (track.kind === 'video') {
              console.log('Remote video track received, setting hasRemoteVideo to true');
              callState.setHasRemoteVideo(true);
            }
          },
          onConnectionStateChange: (state) => {
            console.log('Connection state changed:', state);
            if (state === 'connected') {
              console.log('WebRTC connection established successfully');
              callState.setCallStatus('connected');
              callState.startCallTimer();
              callState.stopRingtone();
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
              console.log('WebRTC connection ended or failed');
              if (!isCleanedUp) {
                callState.setCallStatus('ended');
                callState.endCall();
              }
            }
          },
          onIceConnectionStateChange: (state) => {
            console.log('ICE connection state changed:', state);
            if (state === 'disconnected' || state === 'failed' || state === 'closed') {
              console.log('ICE connection failed or closed');
              if (!isCleanedUp) {
                callState.setCallStatus('ended');
                callState.endCall();
              }
            }
          }
        });
        
        pc = createPeerConnection();
        callState.peerConnectionRef.current = pc;

        // Get local media stream
        localStream = await getLocalStream();
        if (!localStream) return;
        
        callState.localStreamRef.current = localStream;

        // Set local video stream if video is enabled
        if (isVideoEnabled && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          console.log('Local video stream set to video element');
        }

        // Add tracks to peer connection
        addTracksToConnection(pc, localStream);

        // Set up signaling
        const { setupSignalingChannel, initiateOutgoingCall } = useWebRTCSignaling({
          chatId,
          recipientUsername,
          currentUsername,
          isIncoming,
          isVideoEnabled,
          peerConnection: pc,
          localStream,
          onCallAccepted: () => {
            callState.setCallStatus('connected');
            callState.startCallTimer();
            callState.stopRingtone();
            
            // Create and send offer immediately after call is accepted
            const createOfferAfterAcceptance = async () => {
              console.log('Creating offer after call acceptance');
              const offer = await pc!.createOffer();
              await pc!.setLocalDescription(offer);
              console.log('Set local description (offer)');
              
              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                  type: 'offer',
                  sdp: offer,
                  from: currentUsername,
                  to: recipientUsername
                }
              });
              console.log('Sent offer to peer after call acceptance');
            };
            
            createOfferAfterAcceptance();
          },
          onCallDeclined: () => {
            callState.setCallStatus('declined');
            if (!isCleanedUp) {
              setIsCleanedUp(true);
              callState.cleanup();
            }
          },
          onCallEnded: () => {
            callState.setCallStatus('ended');
            if (!isCleanedUp) {
              setIsCleanedUp(true);
              callState.cleanup();
            }
          },
          onRemoteTrack: (track) => {
            // This is handled by the onTrack callback in usePeerConnection
          },
          onCameraToggle: (isCameraOn) => {
            console.log('Camera toggle event received:', isCameraOn);
            // Update UI to reflect the other user's camera state
            if (isCameraOn === false) {
              callState.setHasRemoteVideo(false);
            } else if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
              // Check if we actually have video tracks
              const videoTracks = (remoteVideoRef.current.srcObject as MediaStream).getVideoTracks();
              callState.setHasRemoteVideo(videoTracks.length > 0 && videoTracks[0].enabled);
            }
          },
          onConnectionStateChange: () => {
            // This is handled by the onConnectionStateChange callback in usePeerConnection
          },
          onIceConnectionStateChange: () => {
            // This is handled by the onIceConnectionStateChange callback in usePeerConnection
          }
        });

        // Set up signaling channel
        channel = await setupSignalingChannel();
        callState.callChannelRef.current = channel;

        // For the caller (not incoming), initiate the call process
        if (!isIncoming) {
          await initiateOutgoingCall(channel);
        }

      } catch (err: any) {
        console.error('Failed to initialize WebRTC:', err);
        callState.setError(err.message || 'Failed to initialize call');
        
        // Reload page after a short delay if there's an initialization error
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    };

    initializeWebRTC();

    return () => {
      console.log('Cleaning up WebRTC resources');
      setIsCleanedUp(true);
      
      // Stop all media tracks
      if (localStream) {
        localStream.getTracks().forEach(track => {
          console.log(`Stopping ${track.kind} track`);
          track.stop();
        });
      }
      
      // Close peer connection
      if (pc) {
        console.log('Closing peer connection');
        pc.close();
      }
      
      // Unsubscribe from channel
      if (channel) {
        console.log('Unsubscribing from signaling channel');
        channel.unsubscribe();
      }
      
      // Run cleanup function
      callState.cleanup();
    };
  }, [chatId, currentUsername, recipientUsername, isIncoming, isVideoEnabled]);
}