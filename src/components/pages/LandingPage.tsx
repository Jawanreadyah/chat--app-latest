import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Lock, Search, Settings, Sparkles, MessageCircle } from 'lucide-react';
import { GlowingEffect } from '../ui/glowing-effect';
import { cn } from '../../lib/utils';
import { Squares } from '../ui/squares-background';
import { GridPattern } from '../ui/grid-pattern';
import { HoverBorderGradient } from '../ui/hover-border-gradient';
import { motion } from 'framer-motion';

export function LandingPage() {
  const navigate = useNavigate();

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };

  return (
    <div className="min-h-screen bg-[#060606] relative overflow-hidden">
      {/* Grid Pattern Background */}
      <GridPattern
        width={40}
        height={40}
        strokeDasharray="4"
        className="absolute inset-0 [mask-image:radial-gradient(900px_circle_at_center,white,transparent)] opacity-40"
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-white">ChatLinks</span>
            </div>
            <span className="text-xs text-gray-400 ml-10">by Azur</span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/auth')}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Login
            </button>
            <HoverBorderGradient
              onClick={() => navigate('/auth')}
              containerClassName="rounded-full"
              className="dark:bg-black bg-black text-white flex items-center space-x-2"
            >
              Sign Up
            </HoverBorderGradient>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-center mb-8">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                Connect Instantly,
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">
                Chat Seamlessly
              </span>
            </h1>
          </motion.div>
          <motion.p 
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-lg text-gray-400 text-center max-w-2xl mx-auto mb-16"
          >
            Experience real-time communication reimagined. Create private chat rooms, 
            share instantly with friends, and stay connected with crystal-clear voice calls.
          </motion.p>

          {/* Grid Cards */}
          <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
            <GridItem
              area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
              icon={<Box className="h-4 w-4" />}
              title="Real-time Chat"
              description="Experience seamless real-time messaging with instant delivery and typing indicators."
            />
            <GridItem
              area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
              icon={<Settings className="h-4 w-4" />}
              title="Voice & Video Calls"
              description="Crystal-clear voice and video calls with screen sharing capabilities."
            />
            <GridItem
              area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
              icon={<Lock className="h-4 w-4" />}
              title="End-to-End Encryption"
              description="Your conversations are protected with military-grade encryption."
            />
            <GridItem
              area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
              icon={<Sparkles className="h-4 w-4" />}
              title="Rich Media Sharing"
              description="Share images, voice notes, and files with ease."
            />
            <GridItem
              area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
              icon={<Search className="h-4 w-4" />}
              title="Smart Search"
              description="Find any message, file, or conversation with powerful search capabilities."
            />
          </ul>
        </div>
      </main>
    </div>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={cn("min-h-[14rem] list-none", area)}>
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-[#404040] p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] border-[#404040] bg-[#1a1b1e] p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
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
          <div className="relative z-10 flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border-[0.75px] border-[#404040] bg-[#2a2b2e] p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-white">
                {title}
              </h3>
              <h2 className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-gray-400">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};