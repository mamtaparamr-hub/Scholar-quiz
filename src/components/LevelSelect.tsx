import React, { useState } from 'react';
import { ArrowLeft, Star, Lock, Play, Zap } from 'lucide-react';
import { GAME_LEVELS } from '../services/levels';
import { LevelConfig, PlayerStats } from '../types/game';
import { soundEngine } from '../services/audio';

interface LevelSelectProps {
  playerStats: PlayerStats;
  onSelectLevel: (level: LevelConfig) => void;
  onBack: () => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({
  playerStats,
  onSelectLevel,
  onBack,
}) => {
  const [filter, setFilter] = useState<'all' | 'stem' | 'creative'>('all');

  // Calculate total stars collected
  const totalStars = Object.values(playerStats.starsByLevel).reduce((sum, s) => sum + s, 0);

  const filteredLevels = GAME_LEVELS.filter((lvl) => {
    if (filter === 'stem') {
      return ['physics', 'optics', 'math', 'space', 'logic'].includes(lvl.domain);
    }
    if (filter === 'creative') {
      return ['lexicon', 'biology', 'acoustics', 'invention'].includes(lvl.domain);
    }
    return true;
  });

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto select-none p-6 md:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              soundEngine.playClick();
              onBack();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Title Menu</span>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Innovation Laboratories</h1>
            <p className="text-xs text-slate-400">Unlock creative levels through inventive problem-solving</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Total Stars Count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold tabular-nums">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{totalStars}</span>
            <span className="text-xs text-slate-400 font-normal">Stars</span>
          </div>

          {/* Spark Coins Count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-950/40 border border-yellow-600/30 text-yellow-400 text-sm font-semibold tabular-nums">
            <span>🪙</span>
            <span>{playerStats.coins}</span>
            <span className="text-xs text-yellow-500/80 font-normal">Coins</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 my-6 shrink-0">
        <button
          onClick={() => {
            soundEngine.playClick();
            setFilter('all');
          }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-sky-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Laboratories (9)
        </button>
        <button
          onClick={() => {
            soundEngine.playClick();
            setFilter('stem');
          }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'stem'
              ? 'bg-sky-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          STEM & Physics
        </button>
        <button
          onClick={() => {
            soundEngine.playClick();
            setFilter('creative');
          }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            filter === 'creative'
              ? 'bg-sky-500 text-slate-950 font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Arts & Creative Alchemy
        </button>
      </div>

      {/* Level Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
        {filteredLevels.map((lvl) => {
          const isUnlocked = totalStars >= lvl.requiredStarsToUnlock;
          const starsEarned = playerStats.starsByLevel[lvl.id] || 0;
          const highScore = playerStats.highScores[lvl.id] || 0;

          return (
            <div
              key={lvl.id}
              className={`relative flex flex-col justify-between p-5 rounded-xl border transition-all ${
                isUnlocked
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-65'
              }`}
            >
              <div>
                {/* Domain & Level Index Header */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase tracking-wider" style={{ color: lvl.accentColor }}>
                      {lvl.domainLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Level {lvl.id}</span>
                  </div>

                  {/* Stars Display */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-3.5 h-3.5 ${
                          starIdx <= starsEarned
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Level Title */}
                <h3 className="text-base font-bold text-white mb-1">{lvl.title}</h3>
                <p className="text-xs text-slate-400 mb-3">{lvl.subtitle}</p>

                {/* Description */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
                  {lvl.description}
                </p>

                {/* Educational Takeaway Kicker */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-normal mb-4">
                  <span className="text-sky-400 font-semibold">Core Concept: </span>
                  <span>{lvl.creativeConcept}</span>
                </div>
              </div>

              {/* Card Footer: Reward & Play Button */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs tabular-nums text-slate-400">
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <span>🪙</span>
                    <span>+{lvl.rewardCoins}</span>
                  </span>
                  {highScore > 0 && (
                    <span>High: {highScore} pts</span>
                  )}
                </div>

                {isUnlocked ? (
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectLevel(lvl);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold text-xs shadow-md transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Enter Lab</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Need {lvl.requiredStarsToUnlock} Stars</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
