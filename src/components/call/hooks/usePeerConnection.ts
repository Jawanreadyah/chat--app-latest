const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

interface UsePeerConnectionProps {
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onTrack: (track: MediaStreamTrack) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange: (state: RTCIceConnectionState) => void;
}

export function usePeerConnection({
  onIceCandidate,
  onTrack,
  onConnectionStateChange,
  onIceConnectionStateChange
}: UsePeerConnectionProps) {
  
  const createPeerConnection = (): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    // Handle incoming tracks
    pc.ontrack = (event) => {
      onTrack(event.track);
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      onConnectionStateChange(pc.connectionState);
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      onIceConnectionStateChange(pc.iceConnectionState);
    };
    
    return pc;
  };

  const addTracksToConnection = (pc: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach(track => {
      console.log(`Adding ${track.kind} track to peer connection`);
      pc.addTrack(track, stream);
    });
  };

  return {
    createPeerConnection,
    addTracksToConnection
  };
}