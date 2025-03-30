import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FeatureCard({ title, description, icon, className, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
      viewport={{ once: true }}
      whileHover={{ 
        transform: 'translateY(-5px)',
        boxShadow: '0 30px 60px -12px rgba(50, 50, 93, 0.25), 0 18px 36px -18px rgba(0, 0, 0, 0.3)'
      }}
      className={cn(
        "relative bg-gradient-to-br from-[#1e1f23] to-[#17181c] rounded-xl p-6 transition-all duration-300",
        "shadow-[inset_-8px_-8px_12px_rgba(70,70,70,0.1),inset_8px_8px_12px_rgba(0,0,0,0.4),_6px_6px_10px_rgba(0,0,0,0.3),_-6px_-6px_10px_rgba(70,70,70,0.08)]",
        "border border-[#2a2b2e]/20 backdrop-blur-sm",
        className
      )}
    >
      {/* Control dots */}
      <div className="flex space-x-1.5 absolute top-3 left-3">
        <div className="w-2 h-2 rounded-full bg-red-500/70"></div>
        <div className="w-2 h-2 rounded-full bg-yellow-500/70"></div>
        <div className="w-2 h-2 rounded-full bg-green-500/70"></div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-gradient-to-br from-purple-600/20 to-purple-800/20 text-purple-500 shadow-[inset_2px_2px_3px_rgba(0,0,0,0.3),inset_-2px_-2px_3px_rgba(255,255,255,0.05)]">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </motion.div>
  );
}