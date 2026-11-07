import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { LevelConfig, PlayerStats } from '../types/game';

interface GameCanvasProps {
  level: LevelConfig;
  playerStats: PlayerStats;
  isPaused: boolean;
  onScoreUpdate: (score: number) => void;
  onCoinCollected: (amount: number) => void;
  onLevelComplete: (score: number, timeSpentSec: number) => void;
  onObjectiveUpdate: (text: string) => void;
  onFrequencyChange?: (hz: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  playerStats,
  isPaused,
  onScoreUpdate,
  onCoinCollected,
  onLevelComplete,
  onObjectiveUpdate,
  onFrequencyChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [touchActive, setTouchActive] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize GameEngine
    const engine = new GameEngine(canvasRef.current, level, playerStats, {
      onScoreUpdate,
      onCoinCollected,
      onLevelComplete,
      onObjectiveUpdate,
      onFrequencyChange,
    });

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [level.id]); // Re-create engine when level changes

  // Handle pause/resume from React without destroying engine
  useEffect(() => {
    if (!engineRef.current) return;
    if (isPaused) {
      engineRef.current.pause();
    } else {
      engineRef.current.resume();
    }
  }, [isPaused]);

  // Touch control handlers for mobile or laptop touchscreen
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setTouchActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || !engineRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);
    const maxDist = 50;

    if (dist > 5) {
      const clampedDist = Math.min(dist, maxDist) / maxDist;
      const angle = Math.atan2(dy, dx);
      engineRef.current.setVirtualAxes(Math.cos(angle) * clampedDist, Math.sin(angle) * clampedDist);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setTouchActive(false);
    if (engineRef.current) {
      engineRef.current.setVirtualAxes(0, 0);
    }
  };

  const handleVirtualPulse = () => {
    if (engineRef.current) {
      engineRef.current.triggerVirtualAction();
    }
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[1200px] max-h-[850px] aspect-[4/3] object-contain cursor-crosshair rounded-xl border border-slate-800 shadow-2xl"
        style={{ touchAction: 'none' }}
      />

      {/* On-screen Touch Controls (visible on touch devices or small screens) */}
      <div className="md:hidden absolute bottom-6 right-6 flex items-center gap-3 pointer-events-auto">
        <button
          onClick={handleVirtualPulse}
          className="w-16 h-16 rounded-full bg-sky-500/80 active:bg-sky-400 text-white font-bold shadow-lg flex items-center justify-center text-xs tracking-wider"
        >
          PULSE
        </button>
      </div>

      {touchActive && (
        <div className="md:hidden absolute bottom-6 left-6 w-24 h-24 rounded-full border border-sky-400/40 bg-sky-500/10 pointer-events-none flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-sky-400/80 animate-pulse" />
        </div>
      )}
    </div>
  );
};
