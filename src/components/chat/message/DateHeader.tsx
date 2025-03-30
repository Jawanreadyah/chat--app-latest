import React from 'react';
import { Calendar } from 'lucide-react';

interface DateHeaderProps {
  date: string;
}

export function DateHeader({ date }: DateHeaderProps) {
  return (
    <div className="flex justify-center my-4">
      <div className="bg-[#2a2b2e] px-3 py-1 rounded-full text-xs text-gray-400 flex items-center">
        <Calendar className="w-3 h-3 mr-1" />
        {new Date(date).toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
    </div>
  );
}