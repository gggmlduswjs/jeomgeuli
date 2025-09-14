import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  variant?: 'default' | 'interactive' | 'highlight';
}

export default function Card({
  title,
  description,
  icon: Icon,
  onClick,
  className = '',
  disabled = false,
  children,
  variant = 'default'
}: CardProps) {
  const baseClasses = 'card transition-all duration-200 focus:outline-none focus:ring-4';
  
  const variantClasses = {
    default: 'bg-card border-border',
    interactive: 'card-interactive hover:bg-card/80 active:scale-95 cursor-pointer',
    highlight: 'bg-accent text-black border-accent shadow-lg shadow-accent/20'
  };

  const isInteractive = variant === 'interactive' && onClick && !disabled;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={isInteractive ? 0 : -1}
      role={isInteractive ? 'button' : 'article'}
      aria-label={isInteractive ? title + (description ? ` - ${description}` : '') : undefined}
      aria-disabled={disabled}
    >
      <div className="flex items-start space-x-4">
        {Icon && (
          <div className="flex-shrink-0">
            <Icon 
              className="w-8 h-8 text-primary" 
              aria-hidden="true"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="h3 mb-2">{title}</h3>
          {description && (
            <p className="text-secondary text-base leading-relaxed">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}