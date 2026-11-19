import React, { useRef, useEffect } from 'react';

interface AmbientWorkspaceProps {
  isGenerating: boolean;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  color: string;
  depth: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface FloatingFragment {
  text: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  targetAlpha: number;
  lifespan: number;
  maxLife: number;
  scale: number;
}

const FRAGMENT_WORDS = [
  'token', 'infer', 'ctx', '101', 'prompt', 'vector',
  'temperature', 'logits', 'generate()', 'response', '{ }', 'AI'
];

export const AmbientWorkspace: React.FC<AmbientWorkspaceProps> = ({ isGenerating }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<AmbientParticle[]>([]);
  const fragmentsRef = useRef<FloatingFragment[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const animFrameRef = useRef<number | null>(null);
  const gridOffsetRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const isMobile = width < 768;
    const particleCount = isMobile ? 22 : 48;

    // Initialize particles
    const particles: AmbientParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const isGreen = Math.random() > 0.4;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.6 + 0.6,
        baseAlpha: Math.random() * 0.25 + 0.1,
        alpha: 0.1,
        color: isGreen ? '#00F5A0' : Math.random() > 0.5 ? '#ffffff' : '#94a3b8',
        depth: Math.random() * 0.8 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;

    // Initialize initial token fragments
    const fragments: FloatingFragment[] = [];
    const fragmentCount = isMobile ? 3 : 6;
    for (let i = 0; i < fragmentCount; i++) {
      fragments.push({
        text: FRAGMENT_WORDS[Math.floor(Math.random() * FRAGMENT_WORDS.length)],
        x: Math.random() * width,
        y: Math.random() * (height * 0.85) + height * 0.08,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.12,
        alpha: 0,
        targetAlpha: Math.random() * 0.18 + 0.08,
        lifespan: Math.random() * 400 + 200,
        maxLife: 600,
        scale: Math.random() * 0.2 + 0.85,
      });
    }
    fragmentsRef.current = fragments;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', handleResize);
    canvas.parentElement?.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement?.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // ---------------- LAYER 1: AMBIENT RADIAL GLOWS ----------------
      const now = performance.now() * 0.0006;
      const glow1X = cx + Math.sin(now) * (width * 0.18);
      const glow1Y = cy + Math.cos(now * 0.8) * (height * 0.14);

      const glow2X = cx + Math.cos(now * 0.7) * (width * 0.22);
      const glow2Y = cy + Math.sin(now * 0.9) * (height * 0.18);

      const boost = isGenerating ? 1.6 : 1.0;

      // Glow 1: Center-soft green
      const rad1 = ctx.createRadialGradient(glow1X, glow1Y, 0, glow1X, glow1Y, Math.min(width, height) * 0.55);
      rad1.addColorStop(0, `rgba(0, 245, 160, ${0.035 * boost})`);
      rad1.addColorStop(0.5, `rgba(0, 245, 160, ${0.012 * boost})`);
      rad1.addColorStop(1, 'rgba(8, 9, 12, 0)');
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, width, height);

      // Glow 2: Offset subtle secondary glow
      const rad2 = ctx.createRadialGradient(glow2X, glow2Y, 0, glow2X, glow2Y, Math.min(width, height) * 0.45);
      rad2.addColorStop(0, `rgba(0, 212, 255, ${0.02 * boost})`);
      rad2.addColorStop(0.6, `rgba(0, 245, 160, ${0.006 * boost})`);
      rad2.addColorStop(1, 'rgba(8, 9, 12, 0)');
      ctx.fillStyle = rad2;
      ctx.fillRect(0, 0, width, height);

      // ---------------- LAYER 3: PERSPECTIVE COMPUTATIONAL GRID ----------------
      // Faint perspective floor disappearing towards horizon
      const horizonY = height * 0.58;
      const floorH = height - horizonY;
      gridOffsetRef.current = (gridOffsetRef.current + (isGenerating ? 0.35 : 0.12)) % 40;

      ctx.save();
      // Linear gradient mask for fading grid toward horizon
      ctx.beginPath();
      ctx.rect(0, horizonY, width, floorH);
      ctx.clip();

      const gridGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      gridGrad.addColorStop(0, 'rgba(0, 245, 160, 0)');
      gridGrad.addColorStop(0.3, `rgba(0, 245, 160, ${0.025 * boost})`);
      gridGrad.addColorStop(1, `rgba(0, 245, 160, ${0.06 * boost})`);
      ctx.strokeStyle = gridGrad;
      ctx.lineWidth = 0.6;

      // Perspective vanishing lines from horizon center
      const numPerspectiveLines = isMobile ? 12 : 24;
      for (let i = -numPerspectiveLines; i <= numPerspectiveLines; i++) {
        const spread = (i / numPerspectiveLines) * width * 1.4;
        ctx.beginPath();
        ctx.moveTo(cx, horizonY);
        ctx.lineTo(cx + spread, height);
        ctx.stroke();
      }

      // Horizontal lines with exponential perspective compression
      const numHozLines = 14;
      for (let i = 1; i <= numHozLines; i++) {
        // Perspective distance spacing
        const ratio = Math.pow(i / numHozLines, 2.2);
        const y = horizonY + ratio * floorH + (gridOffsetRef.current * ratio * 0.15);
        if (y <= height) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
      ctx.restore();

      // ---------------- LAYER 2: PARTICLES FIELD ----------------
      particlesRef.current.forEach((p) => {
        p.pulsePhase += p.pulseSpeed;
        const currentAlpha = p.baseAlpha * (0.8 + 0.4 * Math.sin(p.pulsePhase)) * boost;

        // Reactive motion during generation: subtle inward drift
        if (isGenerating) {
          const dx = cx - p.x;
          const dy = cy - p.y;
          p.x += dx * 0.0012;
          p.y += dy * 0.0012;
        } else {
          p.x += p.vx * p.depth;
          p.y += p.vy * p.depth;
        }

        // Mouse gentle parallax repulsion
        if (mouseRef.current.active) {
          const mdx = p.x - mouseRef.current.x;
          const mdy = p.y - mouseRef.current.y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < 140 && mDist > 0) {
            const force = (140 - mDist) / 140 * 0.3;
            p.x += (mdx / mDist) * force;
            p.y += (mdy / mDist) * force;
          }
        }

        // Screen wrap
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.depth, 0, Math.PI * 2);
        ctx.fillStyle = p.color === '#00F5A0'
          ? `rgba(0, 245, 160, ${currentAlpha})`
          : `rgba(255, 255, 255, ${currentAlpha * 0.7})`;
        ctx.fill();
      });

      // ---------------- LAYER 4: FLOATING TOKEN FRAGMENTS ----------------
      ctx.font = '10px "JetBrains Mono", monospace';
      fragmentsRef.current.forEach((f) => {
        f.x += f.vx;
        f.y += f.vy;
        f.lifespan++;

        // Smooth fade-in and fade-out
        if (f.lifespan < 60) {
          f.alpha = (f.lifespan / 60) * f.targetAlpha;
        } else if (f.lifespan > f.maxLife - 60) {
          f.alpha = ((f.maxLife - f.lifespan) / 60) * f.targetAlpha;
        } else {
          f.alpha = f.targetAlpha;
        }

        // Reset when lifespan ends
        if (f.lifespan >= f.maxLife) {
          f.text = FRAGMENT_WORDS[Math.floor(Math.random() * FRAGMENT_WORDS.length)];
          f.x = Math.random() * width;
          f.y = Math.random() * (height * 0.8) + height * 0.1;
          f.lifespan = 0;
          f.alpha = 0;
          f.targetAlpha = Math.random() * 0.18 + 0.08;
        }

        ctx.fillStyle = `rgba(0, 245, 160, ${f.alpha * boost})`;
        ctx.fillText(f.text, f.x, f.y);
      });

      // ---------------- REAL-TIME SCAN PULSE DURING GENERATION ----------------
      if (isGenerating) {
        const scanY = ((performance.now() * 0.12) % height);
        const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
        scanGrad.addColorStop(0, 'rgba(0, 245, 160, 0)');
        scanGrad.addColorStop(0.5, 'rgba(0, 245, 160, 0.04)');
        scanGrad.addColorStop(1, 'rgba(0, 245, 160, 0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 30, width, 60);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
      canvas.parentElement?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isGenerating]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
