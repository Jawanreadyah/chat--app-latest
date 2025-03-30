import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceMessageSendingProps {
  progress: number;
  isCurrentUser: boolean;
}

export function VoiceMessageSending({ progress, isCurrentUser }: VoiceMessageSendingProps) {
  const [dots, setDots] = useState('.');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '.';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={`flex items-start space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white opacity-50">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </div>
      
      {/* Voice message sending indicator */}
      <div className={`flex-1 max-w-xs ${isCurrentUser ? 'bg-purple-600/50' : 'bg-[#2a2b2e]/50'} rounded-lg p-3`}>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Loader2 className={`w-4 h-4 animate-spin ${isCurrentUser ? 'text-purple-200' : 'text-gray-400'}`} />
            <span className={`text-sm ${isCurrentUser ? 'text-purple-200' : 'text-gray-400'}`}>
              Sending voice message{dots}
            </span>
          </div>
          
          <div className={`h-2 ${isCurrentUser ? 'bg-purple-700/50' : 'bg-[#1a1b1e]/50'} rounded-full overflow-hidden`}>
            <motion.div 
              className={`h-full ${isCurrentUser ? 'bg-white/70' : 'bg-purple-500/70'}`}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}