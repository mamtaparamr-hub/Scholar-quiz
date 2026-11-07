import React, { useState } from 'react';
import { X, Palette, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { StorageService, ROVER_SKINS, ROVER_TRAILS } from '../services/storage';
import { PlayerStats } from '../types/game';
import { soundEngine } from '../services/audio';

interface WorkshopModalProps {
  playerStats: PlayerStats;
  onClose: () => void;
  onStatsUpdated: (stats: PlayerStats) => void;
}

export const WorkshopModal: React.FC<WorkshopModalProps> = ({
  playerStats,
  onClose,
  onStatsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'trails'>('skins');

  const handleUnlockSkin = (skinId: string, cost: number) => {
    if (playerStats.coins < cost) return;
    const stats = StorageService.getStats();
    stats.coins -= cost;
    stats.unlockedSkins.push(skinId);
    stats.equippedSkin = skinId;
    StorageService.saveStats(stats);
    soundEngine.playSuccess();
    onStatsUpdated(stats);
  };

  const handleEquipSkin = (skinId: string) => {
    const stats = StorageService.getStats();
    stats.equippedSkin = skinId;
    StorageService.saveStats(stats);
    soundEngine.playClick();
    onStatsUpdated(stats);
  };

  const handleUnlockTrail = (trailId: string, cost: number) => {
    if (playerStats.coins < cost) return;
    const stats = StorageService.getStats();
    stats.coins -= cost;
    stats.unlockedTrails.push(trailId);
    stats.equippedTrail = trailId;
    StorageService.saveStats(stats);
    soundEngine.playSuccess();
    onStatsUpdated(stats);
  };

  const handleEquipTrail = (trailId: string) => {
    const stats = StorageService.getStats();
    stats.equippedTrail = trailId;
    StorageService.saveStats(stats);
    soundEngine.playClick();
    onStatsUpdated(stats);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-3xl flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Inventor's Prototype Workshop</h2>
              <p className="text-xs text-slate-400">Upgrade and customize your research rover chassis & particle trails</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-semibold tabular-nums">
              <span>🪙</span>
              <span>{playerStats.coins} Coins</span>
            </div>

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('skins');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'skins'
                ? 'border-purple-500 text-purple-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Rover Chassis Alloys
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('trails');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'trails'
                ? 'border-purple-500 text-purple-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Thruster Exhaust Trails
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'skins' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {ROVER_SKINS.map((skin) => {
                const isUnlocked = playerStats.unlockedSkins.includes(skin.id);
                const isEquipped = playerStats.equippedSkin === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                      isEquipped
                        ? 'bg-purple-950/20 border-purple-500 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Visual Preview */}
                      <div className="h-24 rounded-lg bg-slate-900 flex items-center justify-center mb-3 relative overflow-hidden border border-slate-800">
                        <div
                          className="w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center relative"
                          style={{ backgroundColor: skin.color }}
                        >
                          <div className="w-4 h-6 rounded-full bg-slate-950 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                          </div>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1">{skin.name}</h4>
                      <p className="text-xs text-slate-400 leading-normal mb-3">{skin.desc}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      {isUnlocked ? (
                        isEquipped ? (
                          <span className="flex items-center gap-1 text-xs text-purple-400 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Equipped</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEquipSkin(skin.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                          >
                            Equip
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleUnlockSkin(skin.id, skin.cost)}
                          disabled={playerStats.coins < skin.cost}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                            playerStats.coins >= skin.cost
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <span>🪙 {skin.cost}</span>
                          <span>Unlock</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'trails' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ROVER_TRAILS.map((trail) => {
                const isUnlocked = playerStats.unlockedTrails.includes(trail.id);
                const isEquipped = playerStats.equippedTrail === trail.id;

                return (
                  <div
                    key={trail.id}
                    className={`flex items-start justify-between p-4 rounded-xl border transition-all ${
                      isEquipped
                        ? 'bg-purple-950/20 border-purple-500 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: trail.color }}
                        />
                        <h4 className="text-sm font-bold text-white">{trail.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{trail.desc}</p>
                    </div>

                    <div className="shrink-0 ml-4">
                      {isUnlocked ? (
                        isEquipped ? (
                          <span className="flex items-center gap-1 text-xs text-purple-400 font-bold">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEquipTrail(trail.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                          >
                            Equip
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleUnlockTrail(trail.id, trail.cost)}
                          disabled={playerStats.coins < trail.cost}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                            playerStats.coins >= trail.cost
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <span>🪙 {trail.cost}</span>
                          <span>Unlock</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
