import React, { useState, useEffect, useCallback } from 'react';
import { GameState, LevelConfig, PlayerStats } from './types/game';
import { GAME_LEVELS } from './services/levels';
import { StorageService } from './services/storage';
import { soundEngine } from './services/audio';

import { TitleScreen } from './components/TitleScreen';
import { LevelSelect } from './components/LevelSelect';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import { GiftHubModal } from './components/GiftHubModal';
import { WorkshopModal } from './components/WorkshopModal';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_SCREEN');
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(GAME_LEVELS[0]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(StorageService.getStats());
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());

  // In-game session variables
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [coinsSession, setCoinsSession] = useState<number>(0);
  const [objectiveText, setObjectiveText] = useState<string>('');
  const [soundFrequency, setSoundFrequency] = useState<number>(220);

  // Victory result storage
  const [victoryData, setVictoryData] = useState<{
    stars: number;
    score: number;
    timeSpentSec: number;
    coinsEarned: number;
  } | null>(null);

  // Modals overlay
  const [showGiftHub, setShowGiftHub] = useState<boolean>(false);
  const [showWorkshop, setShowWorkshop] = useState<boolean>(false);

  // Global sound toggle
  const handleToggleSound = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  // Global keybindings
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        handleToggleSound();
      }
      if (e.code === 'Escape') {
        if (showGiftHub) {
          setShowGiftHub(false);
          return;
        }
        if (showWorkshop) {
          setShowWorkshop(false);
          return;
        }
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        } else if (gameState === 'LEVEL_SELECT') {
          setGameState('TITLE_SCREEN');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState, showGiftHub, showWorkshop, handleToggleSound]);

  // Start selected level
  const handleStartLevel = (level: LevelConfig) => {
    setCurrentLevel(level);
    setCurrentScore(0);
    setCoinsSession(0);
    setObjectiveText(level.learningGoal);
    setSoundFrequency(level.frequencyTarget || 220);
    setVictoryData(null);
    setGameState('PLAYING');
  };

  // Level completed by engine
  const handleLevelComplete = (score: number, timeSpentSec: number) => {
    const res = StorageService.completeLevel(
      currentLevel.id,
      score,
      timeSpentSec,
      currentLevel.parTimeSeconds,
      currentLevel.rewardCoins
    );

    const updatedStats = StorageService.getStats();
    setPlayerStats(updatedStats);

    setVictoryData({
      stars: res.stars,
      score,
      timeSpentSec,
      coinsEarned: res.coinsEarned,
    });
    setGameState('VICTORY');
  };

  // Next level navigation
  const handleNextLevel = () => {
    const currentIndex = GAME_LEVELS.findIndex((l) => l.id === currentLevel.id);
    const nextLvl = GAME_LEVELS[currentIndex + 1] || GAME_LEVELS[0];
    handleStartLevel(nextLvl);
  };

  // Total stars collected count
  const totalStarsCount = Object.values(playerStats.starsByLevel).reduce((sum, s) => sum + s, 0);

  return (
    <div className="relative w-full h-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. TITLE SCREEN VIEW */}
      {gameState === 'TITLE_SCREEN' && (
        <TitleScreen
          coins={playerStats.coins}
          unlockedStarsCount={totalStarsCount}
          isMuted={isMuted}
          onStartGame={() => handleStartLevel(GAME_LEVELS[0])}
          onOpenLevels={() => setGameState('LEVEL_SELECT')}
          onOpenGiftHub={() => setShowGiftHub(true)}
          onOpenWorkshop={() => setShowWorkshop(true)}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 2. LEVEL SELECT VIEW */}
      {gameState === 'LEVEL_SELECT' && (
        <LevelSelect
          playerStats={playerStats}
          onSelectLevel={handleStartLevel}
          onBack={() => setGameState('TITLE_SCREEN')}
        />
      )}

      {/* 3. ACTIVE GAME PLAY VIEW (Isolated 60fps Canvas) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'VICTORY') && (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
          <GameCanvas
            level={currentLevel}
            playerStats={playerStats}
            isPaused={gameState === 'PAUSED'}
            onScoreUpdate={(s) => setCurrentScore(s)}
            onCoinCollected={(amt) => {
              setCoinsSession((prev) => prev + amt);
              const stats = StorageService.getStats();
              stats.coins += amt;
              stats.totalCoinsEarned += amt;
              StorageService.saveStats(stats);
              setPlayerStats(stats);
            }}
            onLevelComplete={handleLevelComplete}
            onObjectiveUpdate={(text) => setObjectiveText(text)}
            onFrequencyChange={(hz) => setSoundFrequency(hz)}
          />

          {/* Low-Occlusion HUD Overlay */}
          <GameHUD
            level={currentLevel}
            playerStats={playerStats}
            score={currentScore}
            coinsSession={coinsSession}
            objectiveText={objectiveText}
            isMuted={isMuted}
            soundFrequency={currentLevel.puzzleType === 'sound_resonance' ? soundFrequency : undefined}
            onPause={() => setGameState('PAUSED')}
            onToggleSound={handleToggleSound}
            onFrequencyChange={(delta) => setSoundFrequency((prev) => Math.max(100, Math.min(1000, prev + delta)))}
          />
        </div>
      )}

      {/* 4. PAUSE MODAL */}
      {gameState === 'PAUSED' && (
        <PauseModal
          level={currentLevel}
          isMuted={isMuted}
          onResume={() => setGameState('PLAYING')}
          onRestart={() => handleStartLevel(currentLevel)}
          onLevelSelect={() => setGameState('LEVEL_SELECT')}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 5. VICTORY MODAL */}
      {gameState === 'VICTORY' && victoryData && (
        <VictoryModal
          level={currentLevel}
          stars={victoryData.stars}
          score={victoryData.score}
          timeSpentSec={victoryData.timeSpentSec}
          coinsEarned={victoryData.coinsEarned}
          onNextLevel={handleNextLevel}
          onRetry={() => handleStartLevel(currentLevel)}
          onLevelSelect={() => setGameState('LEVEL_SELECT')}
          onOpenGiftHub={() => setShowGiftHub(true)}
        />
      )}

      {/* 6. GIFT HUB MODAL (Accessible everywhere) */}
      {showGiftHub && (
        <GiftHubModal
          playerStats={playerStats}
          onClose={() => setShowGiftHub(false)}
          onStatsUpdated={(newStats) => setPlayerStats(newStats)}
        />
      )}

      {/* 7. WORKSHOP MODAL */}
      {showWorkshop && (
        <WorkshopModal
          playerStats={playerStats}
          onClose={() => setShowWorkshop(false)}
          onStatsUpdated={(newStats) => setPlayerStats(newStats)}
        />
      )}
    </div>
  );
}
