import { useRef, useState, useEffect } from 'react';

export function useMessageAudio() {
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioDurations, setAudioDurations] = useState<Map<string, number>>(new Map());
  const [audioProgress, setAudioProgress] = useState<Map<string, number>>(new Map());
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      // Stop any playing audio when component unmounts
      if (playingAudio) {
        const audio = audioRefs.current.get(playingAudio);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
    };
  }, [playingAudio]);

  const handleAudioLoad = (messageId: string, duration: number) => {
    setAudioDurations(prev => {
      const newMap = new Map(prev);
      newMap.set(messageId, duration);
      return newMap;
    });
  };

  const toggleAudioPlayback = (messageId: string) => {
    const audioElement = audioRefs.current.get(messageId);
    if (!audioElement) return;

    if (playingAudio === messageId) {
      // Pause the currently playing audio
      audioElement.pause();
      setPlayingAudio(null);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    } else {
      // If another audio is playing, pause it first
      if (playingAudio) {
        const currentlyPlaying = audioRefs.current.get(playingAudio);
        if (currentlyPlaying) {
          currentlyPlaying.pause();
          currentlyPlaying.currentTime = 0;
          setAudioProgress(prev => {
            const newMap = new Map(prev);
            newMap.set(playingAudio, 0);
            return newMap;
          });
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }

      // Play the new audio
      audioElement.play().catch(error => {
        console.error('Failed to play audio:', error);
      });
      
      setPlayingAudio(messageId);

      // Update progress
      progressIntervalRef.current = setInterval(() => {
        setAudioProgress(prev => {
          const newMap = new Map(prev);
          newMap.set(messageId, audioElement.currentTime);
          return newMap;
        });
        
        // Check if audio has ended
        if (audioElement.ended) {
          setPlayingAudio(null);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setAudioProgress(prev => {
            const newMap = new Map(prev);
            newMap.set(messageId, 0);
            return newMap;
          });
        }
      }, 100);

      // Handle audio end
      audioElement.onended = () => {
        setPlayingAudio(null);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setAudioProgress(prev => {
          const newMap = new Map(prev);
          newMap.set(messageId, 0);
          return newMap;
        });
      };
    }
  };

  return {
    audioRefs,
    playingAudio,
    audioDurations,
    audioProgress,
    handleAudioLoad,
    toggleAudioPlayback
  };
}