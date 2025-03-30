import { supabase } from '../../../lib/supabase';

interface UseWebRTCSignalingProps {
  chatId: string;
  recipientUsername: string;
  currentUsername: string;
  isIncoming: boolean;
  isVideoEnabled: boolean;
  peerConnection: RTCPeerConnection;
  localStream: MediaStream;
  onCallAccepted: () => void;
  onCallDeclined: () => void;
  onCallEnded: () => void;
  onRemoteTrack: (track: MediaStreamTrack) => void;
  onCameraToggle: (isCameraOn: boolean) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange: (state: RTCIceConnectionState) => void;
}

export function useWebRTCSignaling({
  chatId,
  recipientUsername,
  currentUsername,
  isIncoming,
  isVideoEnabled,
  peerConnection,
  localStream,
  onCallAccepted,
  onCallDeclined,
  onCallEnded,
  onRemoteTrack,
  onCameraToggle,
  onConnectionStateChange,
  onIceConnectionStateChange
}: UseWebRTCSignalingProps) {
  
  const setupSignalingChannel = async () => {
    // Create and subscribe to signaling channel
    const channel = supabase.channel(`call:${chatId}`);
    
    channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      if (payload.to !== currentUsername || !peerConnection) return;

      try {
        console.log('Received signal:', payload.type, 'from:', payload.from);
        
        switch (payload.type) {
          case 'offer':
            console.log('Processing offer from peer');
            if (!peerConnection.remoteDescription) {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              console.log('Set remote description from offer');
              
              const answer = await peerConnection.createAnswer();
              console.log('Created answer');
              
              await peerConnection.setLocalDescription(answer);
              console.log('Set local description (answer)');
              
              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                  type: 'answer',
                  sdp: answer,
                  from: currentUsername,
                  to: payload.from
                }
              });
              console.log('Sent answer to peer');
            }
            break;

          case 'answer':
            console.log('Processing answer from peer');
            if (!peerConnection.remoteDescription) {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
              console.log('Set remote description from answer');
            }
            break;

          case 'ice-candidate':
            console.log('Processing ICE candidate from peer');
            if (payload.candidate) {
              try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
                console.log('Added ICE candidate successfully');
              } catch (err) {
                console.error('Error adding received ICE candidate', err);
              }
            }
            break;

          case 'call-accepted':
            console.log('Call accepted by recipient');
            onCallAccepted();
            break;

          case 'call-declined':
            console.log('Call declined by recipient');
            onCallDeclined();
            break;

          case 'call-ended':
            console.log('Call ended by peer');
            onCallEnded();
            break;
            
          case 'camera-toggle':
            console.log('Camera toggle event received:', payload.isCameraOn);
            onCameraToggle(payload.isCameraOn);
            break;

          case 'troubleshoot-video':
            console.log('Received troubleshoot video request');
            // If we're the sender, make sure our video is enabled and send a new offer
            if (isVideoEnabled && localStream) {
              // Ensure video tracks are enabled
              localStream.getVideoTracks().forEach(track => {
                track.enabled = true;
              });
              
              // Create a new offer to restart media
              const troubleshootOffer = await peerConnection.createOffer();
              await peerConnection.setLocalDescription(troubleshootOffer);
              
              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                  type: 'offer',
                  sdp: troubleshootOffer,
                  from: currentUsername,
                  to: payload.from
                }
              });
              
              console.log('Sent new offer in response to troubleshoot request');
            }
            break;
            
          case 'request-video-tracks':
            console.log('Received request for video tracks');
            // If we have video tracks, make sure they're enabled
            if (isVideoEnabled && localStream) {
              const videoTracks = localStream.getVideoTracks();
              if (videoTracks.length > 0) {
                videoTracks.forEach(track => {
                  track.enabled = true;
                });
                
                // Notify the other party that our camera is on
                channel.send({
                  type: 'broadcast',
                  event: 'signal',
                  payload: {
                    type: 'camera-toggle',
                    from: currentUsername,
                    to: payload.from,
                    isCameraOn: true
                  }
                });
                
                console.log('Enabled video tracks and notified peer');
              }
            }
            break;
            
          case 'request-enable-video':
            console.log('Received request to enable video');
            if (isVideoEnabled && localStream) {
              localStream.getVideoTracks().forEach(track => {
                track.enabled = true;
              });
              console.log('Enabled video tracks');
            }
            break;
            
          case 'reconnect-video':
            console.log('Received reconnect video request - attempting full reconnection');
            // Try to restart ICE and renegotiate
            try {
              const reconnectOffer = await peerConnection.createOffer({ iceRestart: true });
              await peerConnection.setLocalDescription(reconnectOffer);
              
              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                  type: 'offer',
                  sdp: reconnectOffer,
                  from: currentUsername,
                  to: payload.from
                }
              });
              
              console.log('Sent reconnection offer with ICE restart');
            } catch (error) {
              console.error('Error creating reconnection offer:', error);
            }
            break;
        }
      } catch (err) {
        console.error('Error handling signal:', err);
      }
    });

    await channel.subscribe();
    console.log('Subscribed to signaling channel');
    
    return channel;
  };

  const initiateOutgoingCall = async (channel: any) => {
    if (!isIncoming) {
      console.log('Initiating outgoing call');
      
      // Clean up any existing calls
      await supabase
        .from('active_calls')
        .delete()
        .eq('caller_username', currentUsername)
        .eq('recipient_username', recipientUsername);

      // Create a new active call record
      const { error: callError } = await supabase
        .from('active_calls')
        .insert([{
          chat_id: chatId,
          caller_username: currentUsername,
          recipient_username: recipientUsername,
          status: 'pending',
          video_enabled: isVideoEnabled
        }]);

      if (callError) throw callError;
      console.log('Created active call record in database');

      // Notify the recipient about the incoming call
      await supabase.channel('incoming_calls').send({
        type: 'broadcast',
        event: 'incoming_call',
        payload: {
          from: currentUsername,
          to: recipientUsername,
          chatId: chatId,
          isVideo: isVideoEnabled
        }
      });
      console.log('Sent incoming call notification to recipient');

      // Create and send an offer immediately for both audio and video calls
      try {
        console.log('Creating initial offer for outgoing call');
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log('Set local description (initial offer)');
        
        // Send the offer to the recipient
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
        console.log('Sent initial offer to recipient');
      } catch (offerError) {
        console.error('Error creating initial offer:', offerError);
      }
    }
  };

  const sendIceCandidate = (channel: any, candidate: RTCIceCandidate) => {
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
  };

  return {
    setupSignalingChannel,
    initiateOutgoingCall,
    sendIceCandidate
  };
}