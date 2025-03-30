import { useRef, useState } from 'react';

export function useCallDuration() {
  const [callDuration, setCallDuration] = useState(0);
  const callStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCallTimer = () => {
    if (!callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - callStartTimeRef.current!) / 1000);
        setCallDuration(duration);
      }, 1000);
    }
  };

  const stopCallTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    callStartTimeRef.current = null;
  };

  return {
    callDuration,
    callStartTimeRef,
    durationIntervalRef,
    startCallTimer,
    stopCallTimer
  };
}