import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BackgroundBeams } from './ui/background-beams';
import { MessageCircle, Users } from 'lucide-react';
import { HeroPill } from './ui/hero-pill';
import { SocialCard } from './ui/social-card';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
  duration?: number;
}

export function LoadingScreen({ onLoadingComplete, duration = 8000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateProgress = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      
      setProgress(newProgress);
      
      if (currentTime < endTime) {
        requestAnimationFrame(updateProgress);
      } else {
        setIsComplete(true);
        setTimeout(() => {
          onLoadingComplete();
        }, 500); // Small delay after reaching 100%
      }
    };

    const animationFrame = requestAnimationFrame(updateProgress);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [duration, onLoadingComplete]);

  // Sample user data for social cards
  const users = [
    {
      name: "Zoey Lang",
      username: "@zoeylang",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      bio: "Frontend developer and UI/UX enthusiast. Join me on this coding adventure!",
      hashtag: "#FrontendWithZoey",
      emoji: "💻",
      following: 4,
      followers: "97.1K"
    },
    {
      name: "Alex Morgan",
      username: "@alexmorgan",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      bio: "Full-stack developer with a passion for clean code and scalable architecture.",
      hashtag: "#CodeWithAlex",
      emoji: "🚀",
      following: 12,
      followers: "45.3K"
    },
    {
      name: "Mia Chen",
      username: "@miachen",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
      bio: "Mobile app developer specializing in React Native. Creating beautiful, functional apps.",
      hashtag: "#MobileWithMia",
      emoji: "📱",
      following: 8,
      followers: "76.5K"
    },
    {
      name: "Jordan Lee",
      username: "@jordanlee",
      avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
      bio: "Backend developer and cloud architecture specialist. AWS certified.",
      hashtag: "#CloudWithJordan",
      emoji: "☁️",
      following: 15,
      followers: "32.8K"
    },
    {
      name: "Taylor Swift",
      username: "@taylorswift",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      bio: "DevOps engineer focused on CI/CD pipelines and infrastructure as code.",
      hashtag: "#DevOpsWithTaylor",
      emoji: "⚙️",
      following: 6,
      followers: "88.2K"
    },
    {
      name: "Sam Wilson",
      username: "@samwilson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      bio: "Data scientist and machine learning engineer. Turning data into insights.",
      hashtag: "#DataWithSam",
      emoji: "📊",
      following: 9,
      followers: "54.7K"
    }
  ];

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060606]"
      initial={{ opacity: 1 }}
      animate={{ opacity: isComplete ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative z-10 flex w-full h-full max-w-7xl mx-auto">
        {/* Left side with original content */}
        <div className="w-full md:w-1/2 flex flex-col items-start justify-center px-8 relative">
          <div className="mb-8 text-purple-500">
            <MessageCircle size={64} />
          </div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-white mb-4 text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            ChatLinks
          </motion.h1>
          
          <div className="mb-8">
            <HeroPill 
              href="#"
              label="App is still in beta"
              announcement="📣 Announcement"
              className="bg-purple-500/20 ring-purple-400 [&_div]:bg-purple-400 [&_div]:text-purple-900 [&_p]:text-purple-300"
            />
          </div>
          
          <motion.p 
            className="text-gray-400 max-w-md mb-12 text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            We're working hard to bring you the best chat experience. Some features may be unstable or incomplete.
          </motion.p>
          
          {/* Loading bar */}
          <div className="w-full max-w-md bg-gray-800 rounded-full h-2.5 mb-4 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-500"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
          
          <p className="text-gray-500 text-sm">
            Loading... {Math.round(progress)}%
          </p>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-gray-700/30 mx-4 my-16 self-stretch"></div>

        {/* Right side with social cards */}
        <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center px-4 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[80vh] overflow-y-auto p-4">
            {users.map((user, index) => (
              <motion.div
                key={user.username}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              >
                <SocialCard 
                  name={user.name}
                  username={user.username}
                  avatar={user.avatar}
                  bio={user.bio}
                  hashtag={user.hashtag}
                  emoji={user.emoji}
                  following={user.following}
                  followers={user.followers}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      <BackgroundBeams className="opacity-40" />
    </motion.div>
  );
}