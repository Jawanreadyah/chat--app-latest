import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Trash2, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceMessageRecorderProps {
  onSend: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export function VoiceMessageRecorder({ onSend, onCancel }: VoiceMessageRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Maximum recording time in seconds
  const MAX_RECORDING_TIME = 300; // 5 minutes
  
  useEffect(() => {
    // Clean up function to ensure all resources are properly released
    return () => {
      // Stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.error('Error stopping recorder:', error);
        }
      }

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Stop and release media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.error('Error stopping track:', error);
          }
        });
      }

      // Clear animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Create and configure MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        
        if (audioBlob.size > 0) {
          setAudioBlob(audioBlob);
          
          // Create audio element for playback
          const audioURL = URL.createObjectURL(audioBlob);
          if (audioRef.current) {
            audioRef.current.src = audioURL;
            // Clean up old URL if it exists
            const oldSrc = audioRef.current.src;
            if (oldSrc) {
              URL.revokeObjectURL(oldSrc);
            }
          }
        } else {
          console.error('No audio data recorded');
        }
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Start timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      // Clean up any partially initialized resources
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      throw error;
    }
  };
  
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };
  
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };
  
  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false);
        
        // Stop and clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      // Attempt to clean up even if there was an error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      throw error;
    }
  };
  
  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
    }
  };
  
  const handleCancel = () => {
    // Stop recording if in progress
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
    
    // Reset state
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
    
    onCancel();
  };
  
  const togglePlayback = () => {
    if (!audioRef.current || !audioBlob) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      } else {
        audioRef.current.play()
          .catch(error => {
            console.error('Playback failed:', error);
            setIsPlaying(false);
          });
        
        setIsPlaying(true);
        
        const updatePlaybackTime = () => {
          if (audioRef.current) {
            setPlaybackTime(audioRef.current.currentTime);
            animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
          }
        };
        
        animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          setPlaybackTime(0);
          
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
        };
      }
    } catch (error) {
      console.error('Playback error:', error);
      setIsPlaying(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getProgressPercentage = () => {
    if (!audioRef.current || !isPlaying) return 0;
    return (playbackTime / audioRef.current.duration) * 100;
  };
  
  return (
    <div className="bg-[#1a1b1e] rounded-lg p-4 w-full">
      <audio ref={audioRef} className="hidden" />
      
      <AnimatePresence mode="wait">
        {isRecording ? (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white font-medium">Recording</span>
              </div>
              <span className="text-gray-300">{formatTime(recordingTime)}</span>
            </div>
            
            {/* Waveform visualization */}
            <div className="h-12 bg-[#2a2b2e] rounded-lg flex items-center justify-center space-x-1 px-2">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{
                    animationDelay: `${i * 0.05}s`
                  }}
                />
              ))}
            </div>
            
            <div className="flex justify-between space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                <span>Cancel</span>
              </button>
              
              {isPaused ? (
                <button
                  onClick={resumeRecording}
                  className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Play className="w-5 h-5 mr-2" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={pauseRecording}
                  className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 py-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  <span>Pause</span>
                </button>
              )}
              
              <button
                onClick={stopRecording}
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Square className="w-5 h-5 mr-2" />
                <span>Stop</span>
              </button>
            </div>
          </motion.div>
        ) : audioBlob ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={togglePlayback}
                  className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <span className="text-white font-medium">Voice Message</span>
              </div>
              <span className="text-gray-300">{formatTime(recordingTime)}</span>
            </div>
            
            {/* Playback progress bar */}
            <div className="h-3 bg-[#2a2b2e] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-100"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            
            <div className="flex justify-between space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                <span>Cancel</span>
              </button>
              
              <button
                onClick={handleSend}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Send className="w-5 h-5 mr-2" />
                <span>Send</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-center"
          >
            <button
              onClick={startRecording}
              className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full transition-colors flex items-center justify-center"
            >
              <Mic className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}