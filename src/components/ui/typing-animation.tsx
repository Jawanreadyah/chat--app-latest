import { useEffect, useState } from "react";

// Helper function to join class names
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface TypingAnimationProps {
  text: string;
  duration?: number;
  className?: string;
  repeat?: boolean;
}

export function TypingAnimation({
  text,
  duration = 200,
  className,
  repeat = false
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState<string>("");
  const [i, setI] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const typingEffect = setInterval(() => {
      if (isPaused) return;

      if (!isDeleting && i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        setI(i + 1);
      } else if (!isDeleting && i >= text.length) {
        if (repeat) {
          setIsPaused(true);
          setTimeout(() => {
            setIsDeleting(true);
            setIsPaused(false);
          }, 2000);
        }
      } else if (isDeleting && i > 0) {
        setDisplayedText(text.substring(0, i - 1));
        setI(i - 1);
      } else if (isDeleting && i === 0) {
        setIsDeleting(false);
        setIsPaused(true);
        setTimeout(() => {
          setIsPaused(false);
        }, 1000);
      }
    }, duration);

    return () => {
      clearInterval(typingEffect);
    };
  }, [duration, i, text, isDeleting, repeat, isPaused]);

  return (
    <h1
      className={cn(
        "font-display text-center text-4xl font-bold leading-[5rem] tracking-[-0.02em] drop-shadow-sm",
        className,
      )}
    >
      {displayedText}
      <span className="animate-pulse">|</span>
    </h1>
  );
}