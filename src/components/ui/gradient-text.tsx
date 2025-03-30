import React from 'react';
import { cn } from '../../lib/utils';

interface GradientTextProps {
  text: string;
  className?: string;
  gradientClassName?: string;
}

export function GradientText({ 
  text, 
  className, 
  gradientClassName = "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
}: GradientTextProps) {
  return (
    <h1 
      className={cn(
        "text-4xl sm:text-6xl font-bold bg-clip-text text-transparent", 
        gradientClassName,
        className
      )}
    >
      {text}
    </h1>
  );
}