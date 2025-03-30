import React from 'react';
import { Clock } from 'lucide-react';

interface CallDisplayProps {
  callStatus: 'initiating' | 'ringing' | 'connected' | 'declined' | 'ended';
  isIncoming: boolean;
  isVideoEnabled: boolean;
  recipientUsername: string;
  callDuration: number;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  hasRemoteVideo: boolean;
}

export function CallDisplay({
  callStatus,
  isIncoming,
  isVideoEnabled,
  recipientUsername,
  callDuration,
  localVideoRef,
  remoteVideoRef,
  hasRemoteVideo
}: CallDisplayProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}`
      : `${minutes}`;
  };

  return (
    <div className="text-center mb-6">
      {isVideoEnabled ? (
        <div className="relative mb-4">
          {/* Remote Video (Large) */}
          <div className="w-full h-[400px] bg-gray-900 rounded-lg overflow-hidden relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${hasRemoteVideo ? 'block' : 'hidden'}`}
            />
            {!hasRemoteVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-3xl text-white font-semibold">
                    {recipientUsername[0].toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Local Video (Small Overlay) */}
          <div className="absolute bottom-4 right-4 w-[160px] h-[90px] bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white font-semibold">
              {recipientUsername[0].toUpperCase()}
            </span>
          </div>
          <p className="text-white text-lg mb-2">{recipientUsername}</p>
        </>
      )}
      
      <p className="text-gray-400">
        {callStatus === 'initiating' && 'Initializing call...'}
        {callStatus === 'ringing' && (isIncoming ? 'Incoming call...' : 'Ringing...')}
        {callStatus === 'connected' && (
          <span className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            {formatDuration(callDuration)} min
          </span>
        )}
        {callStatus === 'declined' && 'Call declined'}
        {callStatus === 'ended' && 'Call ended'}
      </p>
    </div>
  );
}