import { useState } from 'react';

interface UseMediaStreamProps {
  isVideoEnabled: boolean;
  onError: (error: string) => void;
}

export function useMediaStream({ isVideoEnabled, onError }: UseMediaStreamProps) {
  const [permissionRetryCount, setPermissionRetryCount] = useState(0);

  const getLocalStream = async (): Promise<MediaStream | null> => {
    try {
      console.log('Getting user media with video enabled:', isVideoEnabled);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: isVideoEnabled ? {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false
      });
      
      return stream;
    } catch (mediaError: any) {
      console.error('Media access error:', mediaError);
      
      // Handle permission errors
      if (mediaError.name === 'NotAllowedError' || 
          mediaError.name === 'PermissionDeniedError' ||
          mediaError.message.includes('permission')) {
        
        onError(`Camera/microphone permission denied. Please allow access and try again.`);
        
        // Retry getting permissions a few times before giving up
        if (permissionRetryCount < 2) {
          setPermissionRetryCount(prev => prev + 1);
          return null;
        } else {
          // After retries, reload the page
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          return null;
        }
      } else {
        onError(`Failed to access media: ${mediaError.message}`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return null;
      }
    }
  };

  return {
    getLocalStream
  };
}