// src/components/ai/AIAssistantButton.tsx
import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import AIAssistantPanel from './AIAssistantPanel';

interface AIAssistantButtonProps {
  context?: {
    type: 'lead' | 'follow-up' | 'general';
    data?: any;
  };
  className?: string;
}

const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({ 
  context = { type: 'general' },
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-40
          bg-primary hover:bg-primary/90 text-white
          rounded-full p-4 shadow-lg
          transition-all duration-200
          hover:scale-110 active:scale-95
          ${className}
        `}
        aria-label="Open AI Assistant"
      >
        <SparklesIcon className="h-6 w-6" />
      </button>

      {/* Panel */}
      <AIAssistantPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={context}
      />
    </>
  );
};

export default AIAssistantButton;

