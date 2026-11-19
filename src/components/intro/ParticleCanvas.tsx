import React, { useRef, useEffect } from 'react';
import { soundFx } from './soundFx';

interface ParticleCanvasProps {
  elapsedTime: number; // in seconds
  stage: number; // 1 to 8
  onSkip?: () => void;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  baseRadius: number;
  color: string;
  alpha: number;
  text?: string;
  isToken: boolean;
  orbitAngle?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  targetX?: number;
  targetY?: number;
  targetZ?: number;
  flickerSpeed?: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

const RAW_TOKEN_POOL = [
  'intelligence', '101', 'prompt', 'temperature', 'token', 'inference',
  'response', 'context', '0', '1', '<token>', 'AI', 'generate()',
  'vector', 'embedding', 'in', 'telli', 'gence', 'pro', 'mpt',
  'logits', 'ctx', 'temp', '->', '{}', 'top_p', 'attn'
];

const OUTPUT_TOKEN_POOL = [
  'response', 'generated', 'output', '200 OK', 'ready', 'stream', 'done'
];

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({ elapsedTime, stage }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const coreRotationRef = useRef<number>(0);
  const lastSoundStageRef = useRef<number>(0);

  // Initialize particles once on mount
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 85 : 180;
    const initialParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isToken = i < (isMobile ? 24 : 45);
      const tokenText = isToken
        ? RAW_TOKEN_POOL[Math.floor(Math.random() * RAW_TOKEN_POOL.length)]
        : undefined;

      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 500;

      initialParticles.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        z: (Math.random() - 0.5) * 600,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        vz: (Math.random() - 0.5) * 0.5,
        baseRadius: isToken ? 1.5 : Math.random() * 2 + 0.8,
        color: Math.random() > 0.25 ? '#00F5A0' : Math.random() > 0.5 ? '#ffffff' : '#64748b',
        alpha: Math.random() * 0.7 + 0.3,
        text: tokenText,
        isToken,
        flickerSpeed: Math.random() * 3 + 1,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitRadius: Math.random() * 120 + 40,
        orbitSpeed: (Math.random() - 0.5) * 0.04,
      });
    }

    particlesRef.current = initialParticles;
  }, []);

  // Sound triggers on stage transitions
  useEffect(() => {
    if (stage !== lastSoundStageRef.current) {
      lastSoundStageRef.current = stage;
      if (stage === 1) soundFx.playVoidHum();
      else if (stage === 2) soundFx.playTokenChirp(720);
      else if (stage === 3) soundFx.playCollisionPulse();
      else if (stage === 5) soundFx.playCoreActivation();
      else if (stage === 6) soundFx.playOutputSweep();
      else if (stage === 8) soundFx.playOutputSweep();
    }
  }, [stage]);

  // Main rendering canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      const cx = width / 2;
      const cy = height / 2;
      coreRotationRef.current += 0.025;

      // Clear with deep void background
      ctx.fillStyle = '#050608';
      ctx.fillRect(0, 0, width, height);

      // Camera FOV perspective projection
      const fov = 350;

      // ---------------- STAGE LOGIC ----------------

      // STAGE 1: VOID (0-0.7s) - Sparse, faint points of light appearing
      if (stage === 1) {
        const voidProgress = Math.min(1, elapsedTime / 0.7);
        particlesRef.current.forEach((p, idx) => {
          // Stagger reveal of initial light points
          if (idx / particlesRef.current.length > voidProgress) return;

          p.x += p.vx * 0.2;
          p.y += p.vy * 0.2;

          const scale = fov / (fov + p.z + 100);
          const px = cx + p.x * scale;
          const py = cy + p.y * scale;

          ctx.beginPath();
          ctx.arc(px, py, p.baseRadius * scale * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 245, 160, ${p.alpha * voidProgress * 0.6})`;
          ctx.fill();
        });
      }

      // STAGE 2: TOKEN EMERGENCE (0.7-1.8s) - Tokens float in 3D perspective
      else if (stage === 2) {
        const emergenceProgress = Math.min(1, (elapsedTime - 0.7) / 1.1);

        particlesRef.current.forEach((p) => {
          p.x += p.vx * 1.2;
          p.y += p.vy * 1.2;
          p.z += p.vz * 1.5;

          if (p.z < -fov + 20) p.z = 400;
          if (p.z > 400) p.z = -fov + 50;

          const scale = Math.max(0.1, fov / (fov + p.z));
          const px = cx + p.x * scale;
          const py = cy + p.y * scale;

          if (p.isToken && p.text) {
            ctx.font = `${Math.max(8, Math.round(11 * scale))}px "JetBrains Mono", monospace`;
            ctx.fillStyle = `rgba(0, 245, 160, ${Math.min(0.85, p.alpha * emergenceProgress)})`;
            ctx.fillText(p.text, px, py);
          } else {
            ctx.beginPath();
            ctx.arc(px, py, p.baseRadius * scale, 0, Math.PI * 2);
            ctx.fillStyle = p.color === '#00F5A0'
              ? `rgba(0, 245, 160, ${p.alpha * emergenceProgress})`
              : `rgba(255, 255, 255, ${p.alpha * emergenceProgress * 0.7})`;
            ctx.fill();
          }
        });
      }

      // STAGE 3: COLLISION (1.8-3.2s) - Inward acceleration, ripples, dramatic gathering
      else if (stage === 3) {
        const collisionProgress = Math.min(1, (elapsedTime - 1.8) / 1.4);
        // Exponential suction curve
        const pullStrength = Math.pow(collisionProgress, 2.5) * 0.2 + 0.02;

        // Trigger occasional ripples outward from center
        if (Math.random() < 0.12 && ripplesRef.current.length < 5) {
          ripplesRef.current.push({
            x: cx,
            y: cy,
            radius: 5,
            maxRadius: Math.min(width, height) * 0.6,
            alpha: 0.7,
            color: '#00F5A0',
          });
        }

        particlesRef.current.forEach((p) => {
          // Pull toward center (0, 0) in 3D
          p.x += (0 - p.x) * pullStrength;
          p.y += (0 - p.y) * pullStrength;
          p.z += (0 - p.z) * pullStrength;

          // Introduce a bit of turbulent spin as they get close
          const dist = Math.sqrt(p.x * p.x + p.y * p.y);
          if (dist > 10) {
            p.x += -p.y * 0.05 * collisionProgress;
            p.y += p.x * 0.05 * collisionProgress;
          }

          const scale = Math.max(0.2, fov / (fov + p.z));
          const px = cx + p.x * scale;
          const py = cy + p.y * scale;

          if (p.isToken && p.text && dist > 25) {
            ctx.font = `${Math.round(11 * scale)}px "JetBrains Mono", monospace`;
            ctx.fillStyle = `rgba(0, 245, 160, ${p.alpha * (1 - collisionProgress * 0.5)})`;
            ctx.fillText(p.text, px, py);
          } else {
            ctx.beginPath();
            ctx.arc(px, py, (p.baseRadius + collisionProgress * 1.5) * scale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 245, 160, ${p.alpha})`;
            ctx.fill();
          }
        });

        // Draw propagating energy ripples
        ripplesRef.current.forEach((r, idx) => {
          r.radius += 8;
          r.alpha *= 0.94;

          ctx.save();
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 245, 160, ${r.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();

          if (r.alpha < 0.02 || r.radius > r.maxRadius) {
            ripplesRef.current.splice(idx, 1);
          }
        });

        // Peak sync flash at ~3.0s
        if (elapsedTime >= 2.95 && elapsedTime <= 3.2) {
          const flashAlpha = Math.sin(((elapsedTime - 2.95) / 0.25) * Math.PI) * 0.4;
          ctx.fillStyle = `rgba(0, 245, 160, ${flashAlpha})`;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // STAGE 4: FORMATION OF THE PROMPT (3.2-4.1s) - Assembled phrase
      else if (stage === 4) {
        const formProgress = Math.min(1, (elapsedTime - 3.2) / 0.9);

        // Stabilized halo particles orbiting gently around text
        particlesRef.current.forEach((p) => {
          if (p.orbitAngle !== undefined && p.orbitRadius !== undefined && p.orbitSpeed !== undefined) {
            p.orbitAngle += p.orbitSpeed * 0.6;
            p.x = Math.cos(p.orbitAngle) * (p.orbitRadius + 140);
            p.y = Math.sin(p.orbitAngle) * (p.orbitRadius + 40);
          }

          const scale = fov / (fov + p.z);
          const px = cx + p.x * scale;
          const py = cy + p.y * scale;

          ctx.beginPath();
          ctx.arc(px, py, p.baseRadius * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 245, 160, ${p.alpha * 0.3 * formProgress})`;
          ctx.fill();
        });

        // Render the structured phrase: INPUT → TOKENS → INTELLIGENCE
        const phrase = 'INPUT → TOKENS → INTELLIGENCE';
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fontSize = Math.min(width * 0.045, 22);
        ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;

        // Subtle glowing backdrop
        ctx.shadowColor = 'rgba(0, 245, 160, 0.4)';
        ctx.shadowBlur = 16 * formProgress;
        ctx.fillStyle = `rgba(255, 255, 255, ${formProgress})`;
        ctx.fillText(phrase, cx, cy);

        // Subtitle line
        ctx.shadowBlur = 0;
        ctx.font = `400 11px "JetBrains Mono", monospace`;
        ctx.fillStyle = `rgba(0, 245, 160, ${formProgress * 0.8})`;
        ctx.fillText('[ SYNCHRONIZED COMPILATION ]', cx, cy + 32);
        ctx.restore();
      }

      // STAGE 5: PROCESSING CORE (4.1-5.2s) - Abstract geometric AI core with orbital lines & nodes
      else if (stage === 5) {
        const coreProgress = Math.min(1, (elapsedTime - 4.1) / 1.1);
        const rot = coreRotationRef.current;

        // Draw central glowing geometric processing core
        ctx.save();
        ctx.translate(cx, cy);

        // Inner core glow
        const corePulse = Math.sin(rot * 4) * 4;
        const coreRadius = 22 + corePulse;
        const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, coreRadius * 2.2);
        gradient.addColorStop(0, 'rgba(0, 245, 160, 0.9)');
        gradient.addColorStop(0.4, 'rgba(0, 245, 160, 0.35)');
        gradient.addColorStop(1, 'rgba(0, 245, 160, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, coreRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Solid central nucleus
        ctx.fillStyle = '#00F5A0';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Thin orbital rings (Ring 1)
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(0, 245, 160, ${0.4 * coreProgress})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 60, 25, rot, 0, Math.PI * 2);
        ctx.stroke();

        // Thin orbital rings (Ring 2)
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 * coreProgress})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 95, 40, -rot * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        // Thin orbital rings (Ring 3)
        ctx.strokeStyle = `rgba(0, 245, 160, ${0.25 * coreProgress})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 130, 55, rot * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Orbiting nodes on the rings
        for (let i = 0; i < 4; i++) {
          const a = rot * 1.5 + (i * Math.PI) / 2;
          const nx = Math.cos(a) * 60;
          const ny = Math.sin(a) * 25;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Particles being pulled into the core
        particlesRef.current.forEach((p) => {
          p.x += (0 - p.x) * 0.08;
          p.y += (0 - p.y) * 0.08;

          const scale = fov / (fov + p.z);
          const px = cx + p.x * scale;
          const py = cy + p.y * scale;

          ctx.beginPath();
          ctx.arc(px, py, p.baseRadius * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 245, 160, ${p.alpha * 0.6})`;
          ctx.fill();
        });
      }

      // STAGE 6: OUTPUT STREAM (5.2-6.0s) - High velocity horizontal particle & token stream
      else if (stage === 6) {
        const streamProgress = Math.min(1, (elapsedTime - 5.2) / 0.8);

        // Core dissipates and emits stream horizontally
        particlesRef.current.forEach((p, idx) => {
          // Rapid horizontal acceleration from left/center to right
          p.x += 18 + Math.random() * 8;
          if (p.x > width / 2 + 100) {
            p.x = -width / 2 - 100;
          }

          const py = cy + p.y * 0.3;
          const px = cx + p.x;

          if (p.isToken && idx % 3 === 0) {
            const outText = OUTPUT_TOKEN_POOL[idx % OUTPUT_TOKEN_POOL.length];
            ctx.font = `11px "JetBrains Mono", monospace`;
            ctx.fillStyle = `rgba(0, 245, 160, ${0.9 * streamProgress})`;
            ctx.fillText(outText, px, py);
          } else {
            // Horizontal streak line
            ctx.strokeStyle = `rgba(0, 245, 160, ${p.alpha * 0.8})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - 24, py);
            ctx.stroke();
          }
        });
      }

      // STAGE 7: GROQ LAB LOGO REVEAL (6.0-6.8s) - Particles converge into terminal >_ and GROQ.LAB
      else if (stage === 7) {
        const logoProgress = Math.min(1, (elapsedTime - 6.0) / 0.8);

        // Ambient particles slow down and gently drift
        particlesRef.current.forEach((p) => {
          p.x += p.vx * 0.3;
          p.y += p.vy * 0.3;

          const scale = fov / (fov + p.z);
          const px = cx + p.x * scale;
          const py = cy + p.y * scale;

          ctx.beginPath();
          ctx.arc(px, py, p.baseRadius * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 245, 160, ${p.alpha * 0.25})`;
          ctx.fill();
        });

        // Center Terminal Icon `>_` and GROQ.LAB wordmark
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Terminal symbol `>_`
        ctx.font = `700 28px "JetBrains Mono", monospace`;
        ctx.fillStyle = '#00F5A0';
        ctx.fillText('>_', cx, cy - 40);

        // Wordmark `GROQ.LAB`
        const fontSize = Math.min(width * 0.07, 36);
        ctx.font = `700 ${fontSize}px "Inter", sans-serif`;

        // Measure widths for split color: GROQ (off-white) + .LAB (neon green)
        const fullText = 'GROQ.LAB';
        const totalW = ctx.measureText(fullText).width;
        const groqW = ctx.measureText('GROQ').width;

        const startX = cx - totalW / 2;

        ctx.textAlign = 'left';
        ctx.fillStyle = `rgba(243, 244, 246, ${logoProgress})`;
        ctx.fillText('GROQ', startX, cy + 8);

        ctx.fillStyle = `rgba(0, 245, 160, ${logoProgress})`;
        ctx.fillText('.LAB', startX + groqW, cy + 8);

        // Subtitle: LLM EXPERIMENT STUDIO
        ctx.textAlign = 'center';
        ctx.font = `600 11px "JetBrains Mono", monospace`;
        ctx.letterSpacing = '3px';
        ctx.fillStyle = `rgba(148, 163, 184, ${logoProgress * 0.85})`;
        ctx.fillText('LLM EXPERIMENT STUDIO', cx, cy + 42);

        ctx.restore();
      }

      // STAGE 8: TRANSITION SCANLINE & DISSOLVE INTO WEBSITE (6.8s+)
      else if (stage >= 8) {
        const transProgress = Math.min(1, (elapsedTime - 6.8) / 0.7);

        // Thin green horizontal scanline sweeping down
        const scanlineY = transProgress * height;

        ctx.strokeStyle = `rgba(0, 245, 160, ${1 - transProgress * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, scanlineY);
        ctx.lineTo(width, scanlineY);
        ctx.stroke();

        // Shimmering particle burst spreading outwards
        particlesRef.current.forEach((p) => {
          p.x += (Math.random() - 0.5) * 15;
          p.y += (Math.random() - 0.5) * 15;

          const px = cx + p.x;
          const py = cy + p.y;

          ctx.beginPath();
          ctx.arc(px, py, p.baseRadius * (1 - transProgress), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 245, 160, ${(1 - transProgress) * 0.5})`;
          ctx.fill();
        });
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [stage, elapsedTime]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block pointer-events-none"
      style={{ background: '#050608' }}
    />
  );
};

