import React, { useRef, useState, useEffect } from 'react';

export const TokenCore: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Subtle mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (e.clientX - centerX) / (window.innerWidth / 2);
      const dy = (e.clientY - centerY) / (window.innerHeight / 2);
      setMouseOffset({
        x: Math.max(-12, Math.min(12, dx * 10)),
        y: Math.max(-12, Math.min(12, dy * 10)),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center select-none"
      style={{
        transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
        transition: 'transform 0.2s cubic-bezier(0.2, 0, 0.4, 1)',
      }}
    >
      {/* Ambient Backdrop Glow */}
      <div className="absolute inset-0 bg-[#00F5A0]/10 rounded-full blur-2xl animate-pulse-glow pointer-events-none" />

      {/* SVG Vector Orbital System */}
      <svg
        viewBox="0 0 160 160"
        className="w-full h-full relative z-10 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Radial Gradient for Core Glow */}
          <radialGradient id="tokenCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00F5A0" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#00F5A0" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00F5A0" stopOpacity="0" />
          </radialGradient>

          {/* Central Nucleus Linear Gradient */}
          <linearGradient id="nucleusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#00F5A0" />
            <stop offset="100%" stopColor="#00b875" />
          </linearGradient>

          {/* Ring Filter for subtle illumination */}
          <filter id="coreGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Halo Circle */}
        <circle cx="80" cy="80" r="42" fill="url(#tokenCoreGlow)" />

        {/* Outer Orbital Ring 1 (Tilted 30 deg) */}
        <g className="animate-[spin_18s_linear_infinite]" style={{ transformOrigin: '80px 80px' }}>
          <ellipse
            cx="80"
            cy="80"
            rx="64"
            ry="24"
            fill="none"
            stroke="rgba(0, 245, 160, 0.25)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          {/* Orbiting Node 1 */}
          <circle cx="144" cy="80" r="2.5" fill="#00F5A0" filter="url(#coreGlowFilter)" />
          {/* Orbiting Node 2 */}
          <circle cx="16" cy="80" r="1.8" fill="#ffffff" />
        </g>

        {/* Middle Orbital Ring 2 (Tilted -45 deg) */}
        <g className="animate-[spin_12s_linear_infinite_reverse]" style={{ transformOrigin: '80px 80px' }}>
          <ellipse
            cx="80"
            cy="80"
            rx="52"
            ry="20"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
          />
          {/* Orbiting Node on Ring 2 */}
          <circle cx="80" cy="100" r="2.2" fill="#00F5A0" filter="url(#coreGlowFilter)" />
        </g>

        {/* Inner Orbital Ring 3 (Tilted 65 deg) */}
        <g className="animate-[spin_8s_linear_infinite]" style={{ transformOrigin: '80px 80px' }}>
          <ellipse
            cx="80"
            cy="80"
            rx="36"
            ry="14"
            fill="none"
            stroke="rgba(0, 245, 160, 0.45)"
            strokeWidth="1.2"
          />
          {/* Orbiting Node on Ring 3 */}
          <circle cx="116" cy="80" r="2" fill="#ffffff" />
        </g>

        {/* Central Geometric Computational Artifact */}
        <g className="animate-[pulse_3s_ease-in-out_infinite]" style={{ transformOrigin: '80px 80px' }}>
          {/* Diamond Facet Backing */}
          <polygon
            points="80,62 96,80 80,98 64,80"
            fill="rgba(0, 245, 160, 0.15)"
            stroke="rgba(0, 245, 160, 0.7)"
            strokeWidth="1.2"
          />

          {/* Internal Cross Coordinate Grid */}
          <line x1="80" y1="62" x2="80" y2="98" stroke="rgba(0, 245, 160, 0.5)" strokeWidth="0.8" />
          <line x1="64" y1="80" x2="96" y2="80" stroke="rgba(0, 245, 160, 0.5)" strokeWidth="0.8" />

          {/* Solid Glowing Nucleus */}
          <circle cx="80" cy="80" r="6" fill="url(#nucleusGrad)" filter="url(#coreGlowFilter)" />
          <circle cx="80" cy="80" r="2.5" fill="#ffffff" />
        </g>

        {/* Corner Telemetry Marks */}
        <path d="M 40,36 L 36,36 L 36,40" fill="none" stroke="rgba(0, 245, 160, 0.4)" strokeWidth="1" />
        <path d="M 120,36 L 124,36 L 124,40" fill="none" stroke="rgba(0, 245, 160, 0.4)" strokeWidth="1" />
        <path d="M 40,124 L 36,124 L 36,120" fill="none" stroke="rgba(0, 245, 160, 0.4)" strokeWidth="1" />
        <path d="M 120,124 L 124,124 L 124,120" fill="none" stroke="rgba(0, 245, 160, 0.4)" strokeWidth="1" />
      </svg>
    </div>
  );
};
