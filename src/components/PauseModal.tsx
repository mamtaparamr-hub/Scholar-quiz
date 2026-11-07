import React from 'react';
import { Play, RotateCcw, Map, Volume2, VolumeX, X } from 'lucide-react';
import { LevelConfig } from '../types/game';
import { soundEngine } from '../services/audio';

interface PauseModalProps {
  level: LevelConfig;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  level,
  isMuted,
  onResume,
  onRestart,
  onLevelSelect,
  onToggleSound,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 flex flex-col items-center text-center">
        <h3 className="text-lg font-bold text-white mb-1">Laboratory Paused</h3>
        <p className="text-xs text-slate-400 mb-6">{level.title} · Level {level.id}</p>

        {/* Action List */}
        <div className="w-full flex flex-col gap-2.5 mb-6">
          <button
            onClick={() => {
              soundEngine.playClick();
              onResume();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-bold text-xs shadow-md transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume Experiment</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Level</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onLevelSelect();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Exit to Level Map</span>
          </button>
        </div>

        {/* Audio Toggle */}
        <div className="w-full pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Synthesizer Audio</span>
          <button
            onClick={() => {
              soundEngine.playClick();
              onToggleSound();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Muted' : 'Enabled'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
