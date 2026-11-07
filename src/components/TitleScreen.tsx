import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX, Sparkles, Gift, Palette, Play } from 'lucide-react';
import { soundEngine } from '../services/audio';

interface TitleScreenProps {
  coins: number;
  unlockedStarsCount: number;
  isMuted: boolean;
  onStartGame: () => void;
  onOpenLevels: () => void;
  onOpenGiftHub: () => void;
  onOpenWorkshop: () => void;
  onToggleSound: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  coins,
  unlockedStarsCount,
  isMuted,
  onStartGame,
  onOpenLevels,
  onOpenGiftHub,
  onOpenWorkshop,
  onToggleSound,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keyboard shortcut listener (Space or Enter starts)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        soundEngine.playClick();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStartGame]);

  // Ambient interactive background simulation on Title Screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    interface FloatingOrb {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      label: string;
    }

    const orbs: FloatingOrb[] = [
      { x: 120, y: 150, vx: 0.25, vy: -0.15, radius: 24, color: '#38bdf8', label: 'Physics' },
      { x: 680, y: 180, vx: -0.2, vy: 0.18, radius: 28, color: '#a855f7', label: 'Optics' },
      { x: 200, y: 480, vx: 0.18, vy: 0.2, radius: 26, color: '#f59e0b', label: 'Lexicon' },
      { x: 740, y: 440, vx: -0.25, vy: -0.12, radius: 25, color: '#10b981', label: 'Biology' },
      { x: 420, y: 120, vx: 0.12, vy: 0.22, radius: 22, color: '#ec4899', label: 'Primes' },
      { x: 500, y: 520, vx: -0.15, vy: -0.18, radius: 26, color: '#06b6d4', label: 'Logic' },
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      time += 0.015;
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cybernetic blueprint grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.035)';
      ctx.lineWidth = 1;
      const step = 60;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw dynamic laser beam connecting random orbs
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < orbs.length; i++) {
        const next = orbs[(i + 1) % orbs.length];
        ctx.moveTo(orbs[i].x, orbs[i].y);
        ctx.lineTo(next.x, next.y);
      }
      ctx.stroke();

      // Render floating concept orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < 50 || orb.x > canvas.width - 50) orb.vx *= -1;
        if (orb.y < 50 || orb.y > canvas.height - 50) orb.vy *= -1;

        // Glow
        const grad = ctx.createRadialGradient(orb.x, orb.y, 4, orb.x, orb.y, orb.radius * 2);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(orb.label, orb.x, orb.y);
      });

      // Animated hero rover centerpiece
      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.42;
      const bob = Math.sin(time * 2.5) * 8;

      // Glow halo
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.beginPath();
      ctx.arc(centerX, centerY + bob, 58, 0, Math.PI * 2);
      ctx.fill();

      // Main bot body
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(centerX, centerY + bob, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Visor
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.ellipse(centerX + 8, centerY + bob, 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing friendly eyes
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.arc(centerX + 12, centerY + bob - 4, 3, 0, Math.PI * 2);
      ctx.arc(centerX + 12, centerY + bob + 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Animated golden spark antenna
      const sparkPulse = Math.sin(time * 6) * 3;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + bob - 32);
      ctx.lineTo(centerX, centerY + bob - 50);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(centerX, centerY + bob - 52, 6 + sparkPulse, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none">
      {/* Interactive Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 w-full px-8 py-5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
            <span>SparkLab Academy</span>
            <span aria-hidden="true">·</span>
            <span>Creative STEM & Arts</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Spark Coins Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-600/30 text-amber-300 text-sm font-semibold tabular-nums shadow-sm">
            <span className="text-amber-400">🪙</span>
            <span>{coins}</span>
            <span className="text-xs text-amber-500/80 font-normal">Spark Coins</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleSound();
            }}
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup & 35% Negative Space */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 mt-10 pointer-events-none">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="w-full max-w-[620px] mb-4">
          <svg viewBox="0 0 600 130" className="w-full h-auto drop-shadow-2xl">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Title Glow Text */}
            <text
              x="300"
              y="68"
              textAnchor="middle"
              className="font-extrabold tracking-wider"
              fill="url(#titleGrad)"
              filter="url(#glow)"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "56px",
                letterSpacing: "0.08em",
              }}
            >
              SPARK LAB
            </text>

            {/* Subtitle Accent Line */}
            <text
              x="300"
              y="108"
              textAnchor="middle"
              className="font-medium tracking-widest text-slate-300"
              fill="#cbd5e1"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "14px",
                letterSpacing: "0.32em",
              }}
            >
              STUDENT CREATIVE ODYSSEY
            </text>
          </svg>
        </div>

        <p className="max-w-xl text-slate-300 text-base leading-relaxed mb-8">
          Explore progressive puzzle laboratories across physics, optics, word alchemy, biology, and math. Solve creative contraptions, earn Spark Coins, and gift them to classmates to unlock collaborative boosters.
        </p>

        {/* Primary Action Row */}
        <div className="flex items-center justify-center gap-4 pointer-events-auto">
          <button
            onClick={() => {
              soundEngine.playClick();
              onStartGame();
            }}
            className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Adventure</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenLevels();
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Levels ({unlockedStarsCount} ★)</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenGiftHub();
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-sm transition-all"
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Gift Coins</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenWorkshop();
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm transition-all"
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span>Workshop</span>
          </button>
        </div>
      </div>

      {/* Flat Control-Hint Line & Footer */}
      <div className="relative z-10 w-full py-4 text-center border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-sm pointer-events-none">
        <p className="text-xs font-mono text-slate-400 tracking-wider">
          WASD Move · Space Boost · E/Click Rotate Mirror · Esc Pause · Enter / Space to Start
        </p>
      </div>
    </div>
  );
};
