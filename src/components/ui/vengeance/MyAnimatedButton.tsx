import React, { useState } from 'react';
import { soundService } from '../../../services/sound';

export interface MyAnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const MyAnimatedButton: React.FC<MyAnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  className = '',
  disabled,
  onClick,
  children,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    soundService.playKeyClick();
    if (onClick) onClick(e);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs font-medium',
    lg: 'px-5 py-2.5 text-sm font-semibold',
  }[size];

  const variantClasses = {
    primary:
      'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow active:bg-brand-700 border border-brand-600/30',
    secondary:
      'bg-surface-secondary hover:bg-surface-secondary/80 text-content-primary border border-border hover:border-border-hover',
    ghost:
      'bg-transparent hover:bg-surface-secondary text-content-secondary hover:text-content-primary',
  }[variant];

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        relative inline-flex items-center justify-center gap-2 rounded-md
        transition-all duration-150 ease-out select-none
        ${sizeClasses}
        ${variantClasses}
        ${isPressed ? 'scale-[0.98]' : 'hover:scale-[1.005]'}
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Vengeance UI fluid hover sheen gradient */}
      <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
      </div>

      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
