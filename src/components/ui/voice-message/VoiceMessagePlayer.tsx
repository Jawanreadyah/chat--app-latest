import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  username: string;
  avatar?: string;
  timestamp: string;
  isCurrentUser: boolean;
  hideAvatar?: boolean;
}

export function VoiceMessagePlayer({ 
  audioUrl, 
  username, 
  avatar, 
  timestamp,
  isCurrentUser,
  hideAvatar = false
}: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      setError('Failed to load audio');
      setIsLoading(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError as EventListener);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    
    try {
      // Get audio data from the message content if it's a voice note
      if (audioUrl.startsWith('[VoiceNote]')) {
        const base64Data = audioUrl.replace('[VoiceNote]', '');
        
        // Create a blob from the base64 data
        const byteCharacters = atob(base64Data.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
        audio.src = url;
        
        // Clean up the old URL when component unmounts
        return () => {
          URL.revokeObjectURL(url);
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('error', handleError as EventListener);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('canplay', handleCanPlay);
          audio.pause();
          audio.src = '';
          setIsPlaying(false);
          setCurrentTime(0);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        };
      } else {
        // Direct URL case
        audio.src = audioUrl;
      }
    } catch (error) {
      console.error('Failed to process audio data:', error);
      setError('Failed to process audio data');
      setIsLoading(false);
    }
    
    audio.load();
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError as EventListener);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      audio.src = '';
      setIsPlaying(false);
      setCurrentTime(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl]);
  
  const togglePlayback = () => {
    if (!audioRef.current || isLoading) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setError(null);
              
              const updateProgress = () => {
                if (audioRef.current) {
                  setCurrentTime(audioRef.current.currentTime);
                  animationFrameRef.current = requestAnimationFrame(updateProgress);
                }
              };
              
              animationFrameRef.current = requestAnimationFrame(updateProgress);
            })
            .catch(error => {
              console.error('Playback failed:', error);
              setError('Failed to play audio');
              setIsPlaying(false);
            });
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || isLoading || error) return;
    
    try {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newTime = clickPosition * duration;
      
      if (isFinite(newTime) && newTime >= 0 && newTime <= duration) {
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    } catch (error) {
      console.error('Error setting playback position:', error);
    }
  };
  
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className={`flex items-start space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
      
      {/* Avatar - Only show if hideAvatar is false */}
      {!hideAvatar && (
        <div className="flex-shrink-0">
          {avatar ? (
            <img 
              src={avatar} 
              alt={username} 
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<div class="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white">${username[0].toUpperCase()}</div>`;
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white">
              {username[0].toUpperCase()}
            </div>
          )}
        </div>
      )}
      
      {/* Voice message player */}
      <div className={`flex-1 max-w-xs ${isCurrentUser ? 'bg-purple-600' : 'bg-[#2a2b2e]'} rounded-lg p-3`}>
        <div className="flex items-center space-x-3 mb-2">
          <button
            onClick={togglePlayback}
            disabled={isLoading || !!error}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isCurrentUser 
                ? 'bg-purple-700 hover:bg-purple-800 text-white' 
                : 'bg-[#1a1b1e] hover:bg-[#252629] text-gray-200'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
          
          <div className="flex-1">
            <div 
              className={`h-2 ${isCurrentUser ? 'bg-purple-700' : 'bg-[#1a1b1e]'} rounded-full cursor-pointer overflow-hidden`}
              onClick={handleProgressClick}
            >
              <motion.div 
                className={`h-full ${isCurrentUser ? 'bg-white' : 'bg-purple-500'}`}
                style={{ width: `${progressPercentage}%` }}
                initial={{ width: '0%' }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={`text-xs ${isCurrentUser ? 'text-purple-200' : 'text-gray-400'}`}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <span className={`text-xs ${isCurrentUser ? 'text-purple-200' : 'text-gray-400'}`}>
            {timestamp}
          </span>
        </div>
        
        {error && (
          <p className="text-red-400 text-xs mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}