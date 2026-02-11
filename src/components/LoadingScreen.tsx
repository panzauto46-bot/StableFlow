import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#142038] to-[#1e3a5f]">
      <div className="text-center">
        {/* Logo Animation */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto relative">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-[#d4a940]/20"></div>
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#d4a940] animate-spin"></div>
            {/* Inner content */}
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#d4a940] to-[#f5d77e] flex items-center justify-center shadow-lg shadow-[#d4a940]/30">
              <svg 
                className="w-8 h-8 text-[#0a1628]" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl font-bold mb-2">
          <span className="gold-text">Stable</span>
          <span className="text-white">Flow</span>
        </h1>
        
        {/* Loading Text */}
        <p className="text-white/60 text-sm animate-pulse-gold">
          Memuat aplikasi...
        </p>

        {/* Loading Dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          <div className="w-2 h-2 rounded-full bg-[#d4a940] animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-[#d4a940] animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-[#d4a940] animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
