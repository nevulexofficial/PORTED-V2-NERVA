import React, { useState } from 'react';

interface NervaCloudIconProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const NervaCloudIcon: React.FC<NervaCloudIconProps> = ({ 
  className = 'w-16 h-16', 
  size,
  glow = true 
}) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Soft atmospheric ambient pink glow */}
      {glow && (
        <div className="absolute inset-0 bg-rose-500/25 blur-xl rounded-full scale-125 pointer-events-none" />
      )}

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_4px_14px_rgba(255,60,110,0.4)]"
      >
        <defs>
          {/* Main cloud smooth coral-rose gradient */}
          <linearGradient id="cloudBodyGrad" x1="15" y1="20" x2="85" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFA4B6" />
            <stop offset="28%" stopColor="#FF688B" />
            <stop offset="68%" stopColor="#FF3868" />
            <stop offset="100%" stopColor="#E51954" />
          </linearGradient>

          {/* Left lobe subtle soft illumination */}
          <linearGradient id="cloudLeftPuffGrad" x1="12" y1="42" x2="38" y2="74" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFB3C4" />
            <stop offset="100%" stopColor="#FF5C84" />
          </linearGradient>

          {/* Center lobe subtle depth */}
          <linearGradient id="cloudCenterPuffGrad" x1="38" y1="22" x2="68" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF85A2" />
            <stop offset="100%" stopColor="#FF2E62" />
          </linearGradient>

          {/* Soft 3D drop shadow */}
          <filter id="cloudSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#8B0028" floodOpacity="0.35" />
          </filter>
        </defs>

        <g filter="url(#cloudSoftShadow)">
          {/* Main Full Cloud Base Shape */}
          <path
            d="
              M 26 73
              C 16 73 11 64 12 55
              C 13 46 20 40 28 41
              C 29 29 40 22 52 24
              C 56 18 66 16 73 21
              C 81 26 84 34 83 42
              C 90 46 94 56 90 64
              C 87 71 80 73 74 73
              Z
            "
            fill="url(#cloudBodyGrad)"
          />

          {/* Left lobe soft highlight layer */}
          <path
            d="
              M 24 71
              C 16 71 13 63 14 55
              C 15 48 21 43 29 44
              C 34 44 38 48 40 54
              C 41 62 35 70 24 71
              Z
            "
            fill="url(#cloudLeftPuffGrad)"
            opacity="0.9"
          />

          {/* Center-Top highlight puff */}
          <path
            d="
              M 34 44
              C 33 32 43 24 53 25
              C 59 26 65 31 66 38
              C 62 45 54 48 44 48
              C 38 47 35 46 34 44
              Z
            "
            fill="url(#cloudCenterPuffGrad)"
            opacity="0.65"
          />

          {/* Signature Upper-Right White Curved Highlight Arc */}
          <path
            d="M 68 40 C 70 36 74 35 77 37 C 80 39 81 42 80 46"
            stroke="#FFFFFF"
            strokeWidth="3.4"
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* Subtle Top-Center Accent Arc */}
          <path
            d="M 50 26 C 54 24 59 25 61 27"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>
      </svg>
    </div>
  );
};
