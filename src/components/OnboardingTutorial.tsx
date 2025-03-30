import React, { useState, useEffect } from 'react';
import { X, User, MessageSquarePlus, LogOut, Camera } from 'lucide-react';

interface TutorialStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  offset?: { x: number; y: number };
  arrow?: boolean;
}

const tutorialSteps: TutorialStep[] = [
  {
    target: '[data-avatar]',
    title: 'Customize Your Avatar',
    description: 'Click your profile picture to upload a custom avatar or use a letter avatar.',
    position: 'right',
    arrow: true
  },
  {
    target: '[data-create-chat]',
    title: 'Create or Join Chats',
    description: 'Click here to create a new chat room or join an existing one using a friend code.',
    position: 'top',
    offset: { x: 0, y: -20 },
    arrow: true
  },
  {
    target: '[data-logout]',
    title: 'Logout',
    description: 'Click here to sign out of your account.',
    position: 'top',
    offset: { x: 0, y: -20 },
    arrow: true
  }
];

export function OnboardingTutorial({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Add highlight class to current target
    const targetElement = document.querySelector(tutorialSteps[currentStep].target);
    if (targetElement) {
      targetElement.classList.add('ring-4', 'ring-purple-500', 'ring-offset-2', 'ring-offset-[#1a1b1e]', 'z-50');
    }

    return () => {
      // Remove highlight class when step changes
      if (targetElement) {
        targetElement.classList.remove('ring-4', 'ring-purple-500', 'ring-offset-2', 'ring-offset-[#1a1b1e]', 'z-50');
      }
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const currentTutorialStep = tutorialSteps[currentStep];
  const targetElement = document.querySelector(currentTutorialStep.target);
  const targetRect = targetElement?.getBoundingClientRect();

  if (!targetRect) return null;

  // Calculate tooltip position with viewport boundaries check
  const calculateTooltipPosition = () => {
    const tooltipWidth = 300;
    const tooltipHeight = 150;
    const margin = 20;
    let left = 0;
    let top = 0;
    const offset = currentTutorialStep.offset || { x: 0, y: 0 };

    switch (currentTutorialStep.position) {
      case 'top':
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2) + offset.x;
        top = targetRect.top - tooltipHeight - margin + offset.y;
        break;
      case 'bottom':
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2) + offset.x;
        top = targetRect.bottom + margin + offset.y;
        break;
      case 'left':
        left = targetRect.left - tooltipWidth - margin + offset.x;
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2) + offset.y;
        break;
      case 'right':
        left = targetRect.right + margin + offset.x;
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2) + offset.y;
        break;
    }

    // Adjust horizontal position to keep tooltip within viewport
    if (left < margin) {
      left = margin;
    } else if (left + tooltipWidth > window.innerWidth - margin) {
      left = window.innerWidth - tooltipWidth - margin;
    }

    // Adjust vertical position to keep tooltip within viewport
    if (top < margin) {
      top = margin;
    } else if (top + tooltipHeight > window.innerHeight - margin) {
      top = window.innerHeight - tooltipHeight - margin;
    }

    return { left, top };
  };

  const tooltipPosition = calculateTooltipPosition();

  // Calculate arrow position
  const getArrowStyles = () => {
    if (!currentTutorialStep.arrow) return null;

    const arrowSize = 10;
    let arrowStyles = {
      position: 'absolute',
      width: '0',
      height: '0',
      border: `${arrowSize}px solid transparent`,
    };

    switch (currentTutorialStep.position) {
      case 'top':
        return {
          ...arrowStyles,
          bottom: `-${arrowSize * 2}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          borderTop: `${arrowSize}px solid #2a2b2e`,
          borderBottom: 'none',
        };
      case 'bottom':
        return {
          ...arrowStyles,
          top: `-${arrowSize * 2}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          borderBottom: `${arrowSize}px solid #2a2b2e`,
          borderTop: 'none',
        };
      case 'left':
        return {
          ...arrowStyles,
          right: `-${arrowSize * 2}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          borderLeft: `${arrowSize}px solid #2a2b2e`,
          borderRight: 'none',
        };
      case 'right':
        return {
          ...arrowStyles,
          left: `-${arrowSize * 2}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          borderRight: `${arrowSize}px solid #2a2b2e`,
          borderLeft: 'none',
        };
    };
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleSkip} />

      {/* Tooltip */}
      <div
        className="fixed w-[300px] bg-[#2a2b2e] rounded-xl shadow-lg border border-[#404040] p-4 z-50"
        style={{
          left: `${tooltipPosition.left}px`,
          top: `${tooltipPosition.top}px`,
        }}
      >
        {/* Arrow */}
        {currentTutorialStep.arrow && (
          <div
            style={{
              ...getArrowStyles(),
              position: 'absolute',
              width: 0,
              height: 0,
            }}
          />
        )}

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">
            {currentTutorialStep.title}
          </h3>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-300 mb-4">
          {currentTutorialStep.description}
        </p>
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            Skip tutorial
          </button>
          <button
            onClick={handleNext}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}