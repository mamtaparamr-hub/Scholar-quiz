import React from 'react';
import { Star, Gift, Play, RotateCcw, Map, Award } from 'lucide-react';
import { LevelConfig } from '../types/game';
import { soundEngine } from '../services/audio';

interface VictoryModalProps {
  level: LevelConfig;
  stars: number;
  score: number;
  timeSpentSec: number;
  coinsEarned: number;
  onNextLevel: () => void;
  onRetry: () => void;
  onLevelSelect: () => void;
  onOpenGiftHub: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  stars,
  score,
  timeSpentSec,
  coinsEarned,
  onNextLevel,
  onRetry,
  onLevelSelect,
  onOpenGiftHub,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 flex flex-col items-center text-center">
        {/* Domain Accent Kicker */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
          <Award className="w-4 h-4" />
          <span>Laboratory Breakthrough</span>
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-2">{level.title} Completed!</h2>
        <p className="text-xs text-slate-400 mb-6">{level.subtitle}</p>

        {/* Stars Celebration */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`p-3 rounded-2xl border transition-all transform ${
                starIdx <= stars
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 scale-110 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-700'
              }`}
            >
              <Star
                className={`w-8 h-8 ${
                  starIdx <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center mb-6">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Score</span>
            <span className="text-sm font-bold text-white tabular-nums">{score} pts</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Time</span>
            <span className="text-sm font-bold text-white tabular-nums">{timeSpentSec}s</span>
          </div>
          <div>
            <span className="text-[10px] text-amber-400 uppercase font-semibold block">Reward</span>
            <span className="text-sm font-bold text-amber-400 tabular-nums">+{coinsEarned} 🪙</span>
          </div>
        </div>

        {/* Educational Takeaway Callout */}
        <div className="w-full p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 text-left mb-6">
          <span className="text-xs font-bold text-sky-400 block mb-1">What You Discovered:</span>
          <p className="text-xs text-slate-300 leading-relaxed">{level.educationalTakeaway}</p>
        </div>

        {/* Peer Gifting Callout CTA */}
        <div className="w-full p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between mb-6">
          <div className="text-left">
            <span className="text-xs font-bold text-amber-300 block">Classmate Care Package</span>
            <span className="text-[11px] text-slate-400">Share some coins with a friend who is building prototypes!</span>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenGiftHub();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-colors shrink-0 ml-3"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Gift Coins</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playClick();
              onLevelSelect();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Level Map</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onRetry();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onNextLevel();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold text-xs shadow-md transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Next Lab</span>
          </button>
        </div>
      </div>
    </div>
  );
};
