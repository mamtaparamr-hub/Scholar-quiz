import React from 'react';
import { Pause, Volume2, VolumeX, Sparkles, Star, Lightbulb, Compass } from 'lucide-react';
import { LevelConfig, PlayerStats } from '../types/game';
import { soundEngine } from '../services/audio';

interface GameHUDProps {
  level: LevelConfig;
  playerStats: PlayerStats;
  score: number;
  coinsSession: number;
  objectiveText: string;
  isMuted: boolean;
  soundFrequency?: number;
  onPause: () => void;
  onToggleSound: () => void;
  onFrequencyChange?: (delta: number) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  level,
  playerStats,
  score,
  coinsSession,
  objectiveText,
  isMuted,
  soundFrequency,
  onPause,
  onToggleSound,
  onFrequencyChange,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none z-20">
      {/* Top Perimeter Status Cluster */}
      <div className="flex items-center justify-between w-full">
        {/* Top-Left: Level Title & Domain Badge */}
        <div className="flex items-center gap-3">
          <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-100 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: level.accentColor }} />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white tracking-tight">{level.title}</span>
              <span className="text-[10px] text-slate-400">{level.domainLabel}</span>
            </div>
          </div>
        </div>

        {/* Top-Right: Spark Coins, Score, and Actions */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Spark Coins readouts */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-amber-300 text-xs font-semibold tabular-nums shadow-md">
            <span className="text-amber-400">🪙</span>
            <span>{playerStats.coins}</span>
            {coinsSession > 0 && (
              <span className="text-[10px] text-amber-500 font-bold">(+{coinsSession})</span>
            )}
          </div>

          {/* Current Score */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 text-xs font-semibold tabular-nums shadow-md">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{score} pts</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleSound();
            }}
            className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onPause();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-colors shadow-md"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>
        </div>
      </div>

      {/* Acoustic Frequency Tuning HUD (Only for Level 8) */}
      {level.puzzleType === 'sound_resonance' && soundFrequency !== undefined && (
        <div className="self-center pointer-events-auto px-4 py-2 rounded-xl bg-slate-900/95 border border-orange-500/40 text-slate-100 flex items-center gap-4 shadow-xl">
          <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Tuning Frequency:</span>
          <span className="text-sm font-mono font-bold tabular-nums text-white">{Math.round(soundFrequency)} Hz</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onFrequencyChange && onFrequencyChange(-20)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold"
            >
              -20Hz
            </button>
            <button
              onClick={() => onFrequencyChange && onFrequencyChange(20)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold"
            >
              +20Hz
            </button>
          </div>
          <span className="text-[10px] text-slate-400">(Targets: 220Hz, 440Hz, 880Hz)</span>
        </div>
      )}

      {/* Bottom Perimeter HUD: Objective & Creative Tip */}
      <div className="flex items-end justify-between w-full">
        {/* Creative Learning Tip */}
        <div className="pointer-events-auto max-w-md p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-md">
          <div className="flex items-center gap-1.5 text-sky-400 font-bold mb-1">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Creative Objective</span>
          </div>
          <p className="leading-relaxed text-slate-300">{objectiveText || level.learningGoal}</p>
        </div>

        {/* Minimal Control Reminder */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono text-slate-400">
          <span>WASD Move · Space Boost · Esc Pause</span>
        </div>
      </div>
    </div>
  );
};
