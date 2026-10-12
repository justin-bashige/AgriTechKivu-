import React from 'react';

interface AgriTechLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AgriTechLogo: React.FC<AgriTechLogoProps> = ({
  className = '',
  variant = 'auto',
  showText = true,
  size = 'md',
}) => {
  // Dimensions according to size
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const textColor =
    variant === 'dark'
      ? 'text-white'
      : variant === 'light'
      ? 'text-stone-900'
      : 'text-stone-900 dark:text-white';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official AgriTech Kivu Leaf in Green Rounded Square */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-[22%] bg-[#15803d] shadow-sm shrink-0`}
        style={{
          boxShadow: '0 2px 4px rgba(21, 128, 61, 0.25)',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-[66%] h-[66%] fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Leaf contour matching the official logo */}
          <path
            d="M 22 74 C 20 54 30 32 54 22 C 78 12 88 18 86 36 C 84 56 68 84 38 84 C 30 84 24 80 22 74 Z"
          />
          {/* Subtle curved inner stem slit matching official brand */}
          <path
            d="M 28 72 C 34 60 48 46 68 36"
            stroke="#15803d"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {showText && (
        <span
          className={`tracking-tight font-sans ${textSizes[size]} leading-none`}
        >
          <span className={variant === 'dark' ? 'text-white' : 'text-black font-bold'}>AgriTech</span>{' '}
          <span className="text-[#15803d] font-extrabold">Kivu</span>
        </span>
      )}
    </div>
  );
};
