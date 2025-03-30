import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { Globe } from '../ui/globe';
import { TypingAnimation } from '../ui/typing-animation';
import { AnimatedShinyText } from '../ui/animated-shiny-text';
import { Squares } from '../ui/squares-background';
import { useDeviceType } from '../../lib/utils';
import { ButtonColorful } from '../ui/button-colorful';
import { AnimatedText } from '../ui/animated-underline-text-one';
import { Marquee } from '../ui/marquee';
import { CompanyLogos } from '../ui/CompanyLogos';
import { GradientText } from '../ui/gradient-text';
import { BugReportButton } from '../ui/BugReportButton';

export function ChatHome() {
  const navigate = useNavigate();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  const handleStartChat = () => {
    navigate('/create');
  };

  return (
    <div className="h-screen bg-[#060606] flex flex-col overflow-hidden relative">
      {/* Bug Report Button */}
      <BugReportButton />
      
      {/* Squares Background */}
      <div className="absolute inset-0 z-0">
        <Squares 
          direction="diagonal"
          speed={0.5}
          squareSize={40}
          borderColor="#333" 
          hoverFillColor="#222"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <div className="max-w-4xl mx-auto text-center">
          <GradientText 
            text="Start Chatting Now"
            className="mb-6"
            gradientClassName="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
          />
          <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Create a new chat room or join an existing one to start communicating with friends and colleagues.
          </p>
          <ButtonColorful
            onClick={handleStartChat}
            label="Create New Chat"
            className="mx-auto px-8 py-4 h-auto text-lg"
          />
        </div>
      </div>
    </div>
  );
}