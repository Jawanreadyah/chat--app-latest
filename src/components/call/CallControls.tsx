import React from 'react';
import { Mic, MicOff, PhoneOff, Phone, Video, VideoOff, Camera, CameraOff, RefreshCw } from 'lucide-react';

interface CallControlsProps {
  callStatus: 'initiating' | 'ringing' | 'connected' | 'declined' | 'ended';
  isIncoming: boolean;
  isVideoEnabled: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  toggleMute: () => void;
  toggleVideo: () => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  troubleshootVideo?: () => void;
  hasRemoteVideo?: boolean;
}

export function CallControls({
  callStatus,
  isIncoming,
  isVideoEnabled,
  isMuted,
  isCameraOn,
  toggleMute,
  toggleVideo,
  acceptCall,
  declineCall,
  endCall,
  troubleshootVideo,
  hasRemoteVideo
}: CallControlsProps) {
  if (isIncoming && callStatus === 'ringing') {
    return (
      <div className="flex justify-center space-x-4">
        <button
          onClick={acceptCall}
          className="p-4 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
        >
          {isVideoEnabled ? <Video className="w-6 h-6 text-white" /> : <Phone className="w-6 h-6 text-white" />}
        </button>
        <button
          onClick={declineCall}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    );
  } 
  
  if (callStatus === 'connected') {
    return (
      <div className="flex justify-center space-x-4">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition-colors ${
            isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {isMuted ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>
        
        {isVideoEnabled && (
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              !isCameraOn ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {isCameraOn ? (
              <Camera className="w-6 h-6 text-white" />
            ) : (
              <CameraOff className="w-6 h-6 text-white" />
            )}
          </button>
        )}
        
        {isVideoEnabled && troubleshootVideo && (
          <button
            onClick={troubleshootVideo}
            className={`p-4 rounded-full transition-colors ${
              !hasRemoteVideo ? 'bg-yellow-500 hover:bg-yellow-600 animate-pulse' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            title="Troubleshoot video connection"
          >
            <RefreshCw className="w-6 h-6 text-white" />
          </button>
        )}
        
        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    );
  } 
  
  if (callStatus === 'ringing') {
    return (
      <div className="flex justify-center">
        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    );
  }
  
  return null;
}