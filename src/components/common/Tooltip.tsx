import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'right' | 'left';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || <HelpCircle className="w-3.5 h-3.5 text-lab-dim hover:text-lab-muted transition-colors cursor-help" />}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses} z-50 w-52 p-2 bg-[#121622] border border-lab-border text-xs text-lab-muted rounded shadow-xl pointer-events-none transition-opacity duration-150 leading-relaxed`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

