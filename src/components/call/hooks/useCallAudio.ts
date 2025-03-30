import { useRef, useEffect } from 'react';

interface UseCallAudioProps {
  playingAudio: string | null;
  setPlayingAudio: (id: string | null) => void;
  RINGTONE_URL: string;
}

export function useCallAudio({ playingAudio, setPlayingAudio, RINGTONE_URL }: UseCallAudioProps) {
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current = null;
    }
  };

  const playRingtone = () => {
    stopRingtone();
    ringtoneRef.current = new Audio(RINGTONE_URL);
    ringtoneRef.current.loop = true;
    ringtoneRef.current.play().catch(error => {
      console.error('Failed to play ringtone:', error);
    });
  };

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      stopRingtone();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    ringtoneRef,
    progressIntervalRef,
    stopRingtone,
    playRingtone
  };
}