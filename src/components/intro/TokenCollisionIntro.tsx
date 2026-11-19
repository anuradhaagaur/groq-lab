import React, { useState, useEffect, useRef } from 'react';
import { ParticleCanvas } from './ParticleCanvas';
import { soundFx } from './soundFx';
import { Volume2, VolumeX, FastForward } from 'lucide-react';

interface TokenCollisionIntroProps {
  onComplete: () => void;
}

const TOTAL_DURATION = 7.4; // seconds

const STAGE_LABELS: Record<number, string> = {
  1: 'STAGE 01 // COMPUTATIONAL VOID',
  2: 'STAGE 02 // TOKEN EMERGENCE',
  3: 'STAGE 03 // TOKEN COLLISION & CONVERGENCE',
  4: 'STAGE 04 // SYNCHRONIZED COMPILATION',
  5: 'STAGE 05 // NEURAL PROCESSING CORE',
  6: 'STAGE 06 // LPU OUTPUT STREAM',
  7: 'STAGE 07 // SYSTEM IDENTITY',
  8: 'STAGE 08 // READY TO INITIALIZE',
};

export const TokenCollisionIntro: React.FC<TokenCollisionIntroProps> = ({ onComplete }) => {
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(soundFx.getIsMuted());
  const [isSkipping, setIsSkipping] = useState(false);
  const startTimeRef = useRef<number>(0);
  const requestRef = useRef<number | null>(null);

  // Compute current stage from elapsed time
  const getStage = (t: number): number => {
    if (t < 0.7) return 1;
    if (t < 1.8) return 2;
    if (t < 3.2) return 3;
    if (t < 4.1) return 4;
    if (t < 5.2) return 5;
    if (t < 6.0) return 6;
    if (t < 6.8) return 7;
    return 8;
  };

  const currentStage = getStage(elapsed);

  // Check for reduced motion preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        onComplete();
        return;
      }
    }
  }, [onComplete]);

  // Main animation timer loop using high-precision performance.now()
  useEffect(() => {
    startTimeRef.current = performance.now();

    const loop = (now: number) => {
      const deltaSeconds = (now - startTimeRef.current) / 1000;
      setElapsed(deltaSeconds);

      if (deltaSeconds >= TOTAL_DURATION) {
        handleSkip();
      } else {
        requestRef.current = requestAnimationFrame(loop);
      }
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Keyboard shortcut listener (Esc / Space to skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSkip = () => {
    if (isSkipping) return;
    setIsSkipping(true);
    soundFx.setMuted(true); // silence immediately
    setTimeout(() => {
      onComplete();
    }, 280);
  };

  const handleToggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    soundFx.setMuted(nextState);
    if (!nextState && currentStage === 1) {
      soundFx.playVoidHum();
    }
  };

  const progressPercent = Math.min(100, (elapsed / TOTAL_DURATION) * 100);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden bg-[#050608] select-none transition-opacity duration-300 ${
        isSkipping ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 3D Particle Canvas Engine */}
      <ParticleCanvas elapsedTime={elapsed} stage={currentStage} onSkip={handleSkip} />

      {/* Top Controls Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-10 pointer-events-auto">
        {/* Stage Indicator Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[11px] font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
          <span className="tracking-wider">{STAGE_LABELS[currentStage] || 'INITIALIZING'}</span>
        </div>

        {/* Right Buttons: Sound Toggle & Skip */}
        <div className="flex items-center gap-2">
          {/* Audio Toggle (Muted by default) */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-lg bg-black/60 border border-white/10 hover:border-[#00F5A0]/40 text-zinc-400 hover:text-white backdrop-blur-md transition-colors"
            title={isMuted ? 'Enable Sound (Procedural Ambience)' : 'Mute Sound'}
            aria-label={isMuted ? 'Enable Sound' : 'Mute Sound'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#00F5A0]" />
            )}
          </button>

          {/* Skip Intro Button */}
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-[#00F5A0]/50 hover:bg-[#00F5A0]/10 text-xs font-mono text-zinc-300 hover:text-[#00F5A0] backdrop-blur-md transition-all group"
            title="Press Esc to skip"
          >
            <span>Skip Intro</span>
            <FastForward className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 bg-white/10 rounded text-[9px] text-zinc-400">
              ESC
            </kbd>
          </button>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 z-10">
        <div
          className="h-full bg-[#00F5A0] transition-all duration-75 shadow-sm shadow-[#00F5A0]/50"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

