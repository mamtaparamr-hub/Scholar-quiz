import { LevelConfig, Particle, FloatingText, LaserMirror, LaserTarget, OrbCollectible, PhysicsObstacle, PlayerStats } from '../types/game';
import { soundEngine } from '../services/audio';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number) => void;
  onCoinCollected: (amount: number) => void;
  onLevelComplete: (score: number, timeSpentSec: number) => void;
  onObjectiveUpdate: (text: string) => void;
  onFrequencyChange?: (hz: number) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Level configuration & callbacks
  private level: LevelConfig;
  private playerStats: PlayerStats;
  private callbacks: GameEngineCallbacks;

  // Camera & viewport
  private width: number = 800;
  private height: number = 600;
  private cameraShake: number = 0;
  private hitstopTimer: number = 0;

  // Player state
  public player = {
    x: 100,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 18,
    speed: 380,
    baseFriction: 0.90,
    squashX: 1,
    squashY: 1,
    rotation: 0,
    hasShield: false,
    magnetRadius: 100,
  };

  // Input states (continuous held vs edge-triggered)
  private heldKeys: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();
  private virtualAxes = { x: 0, y: 0 };
  private virtualActionJustPressed: boolean = false;

  // Level specific entities
  private orbs: OrbCollectible[] = [];
  private obstacles: PhysicsObstacle[] = [];
  private mirrors: LaserMirror[] = [];
  private targets: LaserTarget[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Puzzle specific state
  private score: number = 0;
  private timeElapsed: number = 0;
  private currentWordProgress: string = '';
  private currentWordIndex: number = 0;
  private currentPrimeTarget: number = 15;
  private primeCollectedFactors: number[] = [];
  private soundFrequency: number = 220;
  private crystalsShattered: number = 0;
  private logicInputs = { A: false, B: false, C: false };
  private gravityWells: Array<{ x: number; y: number; mass: number; radius: number; color: string }> = [];
  private exitPortal = { x: 720, y: 300, radius: 26, active: false, pulse: 0 };

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelConfig,
    playerStats: PlayerStats,
    callbacks: GameEngineCallbacks
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.level = level;
    this.playerStats = playerStats;
    this.callbacks = callbacks;

    this.setupInputs();
    this.initLevelEntities();
  }

  private setupInputs() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.canvas.addEventListener('click', this.handleCanvasClick);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!this.heldKeys.has(e.code)) {
      this.justPressedKeys.add(e.code);
    }
    this.heldKeys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
  };

  private handleBlur = () => {
    this.heldKeys.clear();
    this.justPressedKeys.clear();
    this.virtualAxes = { x: 0, y: 0 };
  };

  private handleCanvasClick = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check interaction with mirrors
    for (const mirror of this.mirrors) {
      const dist = Math.hypot(clickX - mirror.x, clickY - mirror.y);
      if (dist < 40) {
        mirror.angle += Math.PI / 4; // Rotate 45 degrees
        soundEngine.playLaserHum();
        this.addSparks(mirror.x, mirror.y, '#38bdf8', 10);
        return;
      }
    }

    // Check interaction with logic switches
    for (const obs of this.obstacles) {
      if (obs.type === 'switch') {
        if (
          clickX >= obs.x &&
          clickX <= obs.x + obs.width &&
          clickY >= obs.y &&
          clickY <= obs.y + obs.height
        ) {
          obs.activated = !obs.activated;
          soundEngine.playBounce();
          this.triggerLogicCheck();
          return;
        }
      }
    }
  };

  public setVirtualAxes(x: number, y: number) {
    this.virtualAxes.x = x;
    this.virtualAxes.y = y;
  }

  public triggerVirtualAction() {
    this.virtualActionJustPressed = true;
  }

  public adjustFrequency(delta: number) {
    this.soundFrequency = Math.max(100, Math.min(1000, this.soundFrequency + delta));
    if (this.callbacks.onFrequencyChange) {
      this.callbacks.onFrequencyChange(this.soundFrequency);
    }
  }

  // Initialize level based on puzzle type
  private initLevelEntities() {
    this.orbs = [];
    this.obstacles = [];
    this.mirrors = [];
    this.targets = [];
    this.particles = [];
    this.floatingTexts = [];
    this.gravityWells = [];
    this.score = 0;
    this.timeElapsed = 0;
    this.currentWordProgress = '';
    this.currentWordIndex = 0;
    this.crystalsShattered = 0;
    this.soundFrequency = 220;

    // Apply booster effects
    let speedMult = 1.0;
    let magnetMult = 1.0;
    this.player.hasShield = false;

    this.playerStats.activeBoosters.forEach((b) => {
      if (b.effect === 'speed') speedMult *= b.multiplier;
      if (b.effect === 'magnet') magnetMult *= b.multiplier;
      if (b.effect === 'shield') this.player.hasShield = true;
    });

    this.player.speed = 380 * speedMult;
    this.player.magnetRadius = 100 * magnetMult;

    // Player initial position
    this.player.x = 80;
    this.player.y = 300;
    this.player.vx = 0;
    this.player.vy = 0;
    this.exitPortal = { x: 730, y: 300, radius: 28, active: false, pulse: 0 };

    // Common boundary bumpers
    this.obstacles.push(
      { x: 10, y: 10, width: 780, height: 16, type: 'wall', color: '#1e293b' },
      { x: 10, y: 574, width: 780, height: 16, type: 'wall', color: '#1e293b' },
      { x: 10, y: 26, width: 16, height: 548, type: 'wall', color: '#1e293b' },
      { x: 774, y: 26, width: 16, height: 548, type: 'wall', color: '#1e293b' }
    );

    // Setup specific level content
    switch (this.level.puzzleType) {
      case 'physics_launch':
        this.setupPhysicsLevel();
        break;
      case 'optics_laser':
        this.setupOpticsLevel();
        break;
      case 'word_alchemy':
        this.setupWordAlchemyLevel();
        break;
      case 'ecosystem_balance':
        this.setupEcosystemLevel();
        break;
      case 'prime_locks':
        this.setupPrimeLevel();
        break;
      case 'gravity_orbit':
        this.setupGravityLevel();
        break;
      case 'logic_gates':
        this.setupLogicLevel();
        break;
      case 'sound_resonance':
        this.setupSoundLevel();
        break;
      case 'contraption_chain':
        this.setupContraptionLevel();
        break;
    }

    this.callbacks.onObjectiveUpdate(this.level.learningGoal);
  }

  // LEVEL 1: Physics launch & momentum
  private setupPhysicsLevel() {
    // Add velocity bounce pads
    this.obstacles.push(
      { x: 220, y: 180, width: 28, height: 140, type: 'bounce_pad', color: '#38bdf8', label: 'ACCELERATOR' },
      { x: 440, y: 280, width: 28, height: 140, type: 'bounce_pad', color: '#38bdf8', label: 'ACCELERATOR' },
      { x: 300, y: 350, width: 160, height: 20, type: 'wall', color: '#334155' }
    );

    // Kinetic switch that must be struck at high velocity
    this.obstacles.push({
      x: 600,
      y: 120,
      width: 44,
      height: 44,
      type: 'switch',
      color: '#f59e0b',
      activated: false,
      label: 'KINETIC SWITCH',
    });

    // Spark orbs
    this.orbs.push(
      { id: 'orb_1', x: 200, y: 120, radius: 14, type: 'coin', value: 20, collected: false, pulseOffset: 0 },
      { id: 'orb_2', x: 380, y: 200, radius: 14, type: 'coin', value: 20, collected: false, pulseOffset: 1 },
      { id: 'orb_3', x: 520, y: 440, radius: 14, type: 'coin', value: 20, collected: false, pulseOffset: 2 },
      { id: 'orb_4', x: 620, y: 280, radius: 16, type: 'star', value: 50, collected: false, pulseOffset: 3 }
    );
  }

  // LEVEL 2: Optics & laser reflection
  private setupOpticsLevel() {
    this.player.x = 80;
    this.player.y = 120;

    // Mirrors that can be rotated
    this.mirrors = [
      { id: 'm1', x: 280, y: 300, angle: Math.PI / 4, type: 'reflect', interactive: true },
      { id: 'm2', x: 500, y: 300, angle: (3 * Math.PI) / 4, type: 'reflect', interactive: true },
      { id: 'm3', x: 500, y: 140, angle: Math.PI / 4, type: 'reflect', interactive: true },
    ];

    // Sensor Targets
    this.targets = [
      { id: 't1', x: 680, y: 140, radius: 22, color: '#ef4444', activated: false, requiredColor: '#ef4444' },
      { id: 't2', x: 280, y: 480, radius: 22, color: '#06b6d4', activated: false, requiredColor: '#06b6d4' },
    ];

    // Decorative guidance walls
    this.obstacles.push(
      { x: 380, y: 80, width: 20, height: 200, type: 'wall', color: '#1e293b' },
      { x: 380, y: 340, width: 20, height: 200, type: 'wall', color: '#1e293b' }
    );

    // Coins
    this.orbs.push(
      { id: 'o1', x: 180, y: 220, radius: 14, type: 'coin', value: 25, collected: false, pulseOffset: 0 },
      { id: 'o2', x: 420, y: 260, radius: 14, type: 'coin', value: 25, collected: false, pulseOffset: 1 },
      { id: 'o3', x: 620, y: 460, radius: 14, type: 'coin', value: 25, collected: false, pulseOffset: 2 }
    );
  }

  // LEVEL 3: Lexicon Bridge & Word Alchemy
  private setupWordAlchemyLevel() {
    this.currentWordIndex = 0;
    this.currentWordProgress = '';
    const letters = ['S', 'P', 'A', 'R', 'K'];
    const positions = [
      { x: 180, y: 180 },
      { x: 280, y: 380 },
      { x: 400, y: 200 },
      { x: 500, y: 400 },
      { x: 620, y: 220 },
    ];

    letters.forEach((char, idx) => {
      this.orbs.push({
        id: `letter_${idx}`,
        x: positions[idx].x,
        y: positions[idx].y,
        radius: 18,
        type: 'letter',
        value: char,
        collected: false,
        pulseOffset: idx,
      });
    });

    // Central chasm requiring bridge
    this.obstacles.push(
      { x: 340, y: 40, width: 80, height: 180, type: 'hazard', color: '#0f172a' },
      { x: 340, y: 380, width: 80, height: 180, type: 'hazard', color: '#0f172a' }
    );
  }

  // LEVEL 4: Biodome Ecosystem Circuit
  private setupEcosystemLevel() {
    // 3 solar chloroplast nodes and 3 bloom petals
    this.orbs.push(
      { id: 'sun_1', x: 220, y: 160, radius: 16, type: 'energy', value: 'SUN', collected: false, pulseOffset: 0 },
      { id: 'sun_2', x: 340, y: 440, radius: 16, type: 'energy', value: 'H2O', collected: false, pulseOffset: 1 },
      { id: 'sun_3', x: 520, y: 220, radius: 16, type: 'energy', value: 'CO2', collected: false, pulseOffset: 2 },
      { id: 'coin_bio_1', x: 400, y: 150, radius: 14, type: 'coin', value: 30, collected: false, pulseOffset: 3 },
      { id: 'coin_bio_2', x: 400, y: 450, radius: 14, type: 'coin', value: 30, collected: false, pulseOffset: 4 }
    );

    // Eco reactor in the center
    this.obstacles.push({
      x: 360,
      y: 260,
      width: 80,
      height: 80,
      type: 'switch',
      color: '#10b981',
      activated: false,
      label: 'BIODOME CORE',
    });
  }

  // LEVEL 5: Prime Factor Dynamo
  private setupPrimeLevel() {
    this.currentPrimeTarget = 15; // 3 x 5
    this.primeCollectedFactors = [];

    // Prime numbers: 2, 3, 5, 7. Composites: 4, 6, 9
    const primes = [
      { val: 3, x: 220, y: 180, prime: true },
      { val: 5, x: 360, y: 420, prime: true },
      { val: 2, x: 500, y: 180, prime: true },
      { val: 7, x: 620, y: 420, prime: true },
      { val: 4, x: 220, y: 420, prime: false },
      { val: 9, x: 500, y: 420, prime: false },
    ];

    primes.forEach((p, idx) => {
      this.orbs.push({
        id: `prime_${idx}`,
        x: p.x,
        y: p.y,
        radius: 17,
        type: 'prime',
        value: p.val,
        collected: false,
        pulseOffset: idx,
      });
    });
  }

  // LEVEL 6: Gravitational Slingshot
  private setupGravityLevel() {
    this.player.x = 60;
    this.player.y = 500;
    this.player.vx = 150;
    this.player.vy = -180;

    // Gravity planets
    this.gravityWells = [
      { x: 240, y: 360, mass: 28000, radius: 32, color: '#3b82f6' }, // Blue planet
      { x: 500, y: 220, mass: 36000, radius: 38, color: '#8b5cf6' }, // Violet giant
    ];

    this.exitPortal = { x: 710, y: 140, radius: 30, active: true, pulse: 0 };

    this.orbs.push(
      { id: 'star_1', x: 240, y: 220, radius: 15, type: 'star', value: 50, collected: false, pulseOffset: 0 },
      { id: 'star_2', x: 500, y: 380, radius: 15, type: 'star', value: 50, collected: false, pulseOffset: 1 },
      { id: 'coin_g1', x: 360, y: 290, radius: 14, type: 'coin', value: 30, collected: false, pulseOffset: 2 }
    );
  }

  // LEVEL 7: Boolean Logic Matrix
  private setupLogicLevel() {
    this.logicInputs = { A: false, B: false, C: false };

    // 3 switches representing logic inputs
    this.obstacles.push(
      { x: 120, y: 140, width: 50, height: 50, type: 'switch', color: '#06b6d4', activated: false, label: 'INPUT A' },
      { x: 120, y: 280, width: 50, height: 50, type: 'switch', color: '#06b6d4', activated: false, label: 'INPUT B' },
      { x: 120, y: 420, width: 50, height: 50, type: 'switch', color: '#06b6d4', activated: false, label: 'INPUT C' }
    );

    this.orbs.push(
      { id: 'logic_coin_1', x: 300, y: 210, radius: 14, type: 'coin', value: 25, collected: false, pulseOffset: 0 },
      { id: 'logic_coin_2', x: 520, y: 350, radius: 14, type: 'coin', value: 25, collected: false, pulseOffset: 1 }
    );
  }

  // LEVEL 8: Soundwave Resonance
  private setupSoundLevel() {
    this.soundFrequency = 220;
    this.crystalsShattered = 0;

    // Resonant targets at 220Hz, 440Hz, 880Hz
    this.targets = [
      { id: 'res_1', x: 260, y: 300, radius: 26, color: '#f97316', activated: false },
      { id: 'res_2', x: 440, y: 300, radius: 26, color: '#f97316', activated: false },
      { id: 'res_3', x: 620, y: 300, radius: 26, color: '#f97316', activated: false },
    ];
  }

  // LEVEL 9: Grand Polymath Sandbox Contraption
  private setupContraptionLevel() {
    this.mirrors = [
      { id: 'm9_1', x: 280, y: 200, angle: Math.PI / 4, type: 'reflect', interactive: true },
      { id: 'm9_2', x: 520, y: 200, angle: (3 * Math.PI) / 4, type: 'reflect', interactive: true },
    ];

    this.targets = [
      { id: 't9', x: 520, y: 460, radius: 26, color: '#eab308', activated: false },
    ];

    this.obstacles.push(
      { x: 320, y: 320, width: 44, height: 44, type: 'switch', color: '#eab308', activated: false, label: 'MASTER COG' },
      { x: 180, y: 400, width: 28, height: 120, type: 'bounce_pad', color: '#38bdf8', label: 'SPRING' }
    );

    this.orbs.push(
      { id: 'c9_1', x: 180, y: 260, radius: 14, type: 'coin', value: 40, collected: false, pulseOffset: 0 },
      { id: 'c9_2', x: 400, y: 160, radius: 14, type: 'coin', value: 40, collected: false, pulseOffset: 1 },
      { id: 'c9_3', x: 620, y: 320, radius: 16, type: 'star', value: 80, collected: false, pulseOffset: 2 }
    );
  }

  // Switch or logic check
  private triggerLogicCheck() {
    if (this.level.puzzleType === 'logic_gates') {
      const switchA = this.obstacles.find((o) => o.label === 'INPUT A')?.activated || false;
      const switchB = this.obstacles.find((o) => o.label === 'INPUT B')?.activated || false;
      const switchC = this.obstacles.find((o) => o.label === 'INPUT C')?.activated || false;

      // Logic rules:
      // AND gate: switchA && switchB
      // XOR gate: (switchB && !switchC) || (!switchB && switchC)
      const andOk = switchA && switchB;
      const xorOk = (switchB && !switchC) || (!switchB && switchC);

      if (andOk && xorOk) {
        this.exitPortal.active = true;
        soundEngine.playSuccess();
        this.addFloatingText(this.exitPortal.x, this.exitPortal.y - 40, 'MAINFRAME UNLOCKED!', '#06b6d4');
        this.addSparks(this.exitPortal.x, this.exitPortal.y, '#06b6d4', 30);
      }
    }
  }

  // Main 60fps Loop
  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.canvas.removeEventListener('click', this.handleCanvasClick);
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    // Delta time calculation clamped to 50ms (0.05s) to prevent physics explosion on lag spikes
    const rawDt = (currentTime - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
      } else {
        this.update(dt);
      }
    }

    this.render();

    // Clear edge-triggered keys after loop frame
    this.justPressedKeys.clear();
    this.virtualActionJustPressed = false;

    this.animId = requestAnimationFrame(this.loop);
  };

  // UPDATE STEP
  private update(dt: number) {
    this.timeElapsed += dt;

    // Decay camera shake
    if (this.cameraShake > 0) {
      this.cameraShake *= 0.90;
      if (this.cameraShake < 0.2) this.cameraShake = 0;
    }

    // Input handling
    let moveX = this.virtualAxes.x;
    let moveY = this.virtualAxes.y;

    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) moveX -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) moveX += 1;
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) moveY -= 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) moveY += 1;

    // Normalize diagonal input
    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
      moveX /= len;
      moveY /= len;
      this.player.rotation = Math.atan2(moveY, moveX);
    }

    // Thruster acceleration
    this.player.vx += moveX * this.player.speed * dt * 4;
    this.player.vy += moveY * this.player.speed * dt * 4;

    // Sound frequency tuning via Q / E or Left / Right in sound level
    if (this.level.puzzleType === 'sound_resonance') {
      if (this.heldKeys.has('KeyQ') || this.heldKeys.has('BracketLeft')) {
        this.adjustFrequency(-120 * dt);
      }
      if (this.heldKeys.has('KeyE') || this.heldKeys.has('BracketRight')) {
        this.adjustFrequency(120 * dt);
      }
    }

    // Space action: impulse boost or mirror interact
    if (this.justPressedKeys.has('Space') || this.virtualActionJustPressed) {
      this.player.vx += Math.cos(this.player.rotation) * 160;
      this.player.vy += Math.sin(this.player.rotation) * 160;
      this.player.squashX = 1.35;
      this.player.squashY = 0.7;
      soundEngine.playBounce();
      this.addSparks(this.player.x, this.player.y, '#38bdf8', 12);
    }

    // Apply gravity wells (Level 6)
    for (const well of this.gravityWells) {
      const dx = well.x - this.player.x;
      const dy = well.y - this.player.y;
      const distSq = Math.max(dx * dx + dy * dy, 600);
      const dist = Math.sqrt(distSq);
      const force = (well.mass / distSq) * 12;
      this.player.vx += (dx / dist) * force * dt;
      this.player.vy += (dy / dist) * force * dt;
    }

    // Friction & velocity damping
    this.player.vx *= Math.pow(this.player.baseFriction, dt * 60);
    this.player.vy *= Math.pow(this.player.baseFriction, dt * 60);

    // Update position
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Squash & stretch recovery
    this.player.squashX += (1 - this.player.squashX) * 0.15;
    this.player.squashY += (1 - this.player.squashY) * 0.15;

    // Emit rover thruster trail particles
    if (len > 0.1 || Math.hypot(this.player.vx, this.player.vy) > 30) {
      this.emitTrailParticle();
    }

    // Magnetic pull for orbs
    for (const orb of this.orbs) {
      if (orb.collected) continue;
      const dx = this.player.x - orb.x;
      const dy = this.player.y - orb.y;
      const dist = Math.hypot(dx, dy);

      if (dist < this.player.magnetRadius) {
        const pull = (1 - dist / this.player.magnetRadius) * 220;
        orb.x += (dx / dist) * pull * dt;
        orb.y += (dy / dist) * pull * dt;
      }

      // Collect orb
      if (dist < this.player.radius + orb.radius) {
        this.collectOrb(orb);
      }
    }

    // Obstacle collisions
    for (const obs of this.obstacles) {
      // Circle vs AABB collision
      const nearestX = Math.max(obs.x, Math.min(this.player.x, obs.x + obs.width));
      const nearestY = Math.max(obs.y, Math.min(this.player.y, obs.y + obs.height));
      const distX = this.player.x - nearestX;
      const distY = this.player.y - nearestY;
      const dist = Math.hypot(distX, distY);

      if (dist < this.player.radius) {
        // Resolve overlap
        const overlap = this.player.radius - dist;
        const normX = dist > 0 ? distX / dist : 1;
        const normY = dist > 0 ? distY / dist : 0;

        this.player.x += normX * overlap;
        this.player.y += normY * overlap;

        if (obs.type === 'bounce_pad') {
          // Launch velocity with elastic multiplier
          this.player.vx = normX * 520;
          this.player.vy = normY * 520;
          this.cameraShake = 5;
          this.player.squashX = 1.4;
          this.player.squashY = 0.6;
          soundEngine.playBounce();
          this.addSparks(nearestX, nearestY, obs.color, 15);
        } else if (obs.type === 'switch') {
          if (!obs.activated) {
            obs.activated = true;
            soundEngine.playSuccess();
            this.addFloatingText(obs.x, obs.y - 20, 'ACTIVATED!', '#f59e0b');
            this.addSparks(obs.x + obs.width / 2, obs.y + obs.height / 2, '#f59e0b', 20);
            this.triggerLogicCheck();
            if (this.level.puzzleType === 'physics_launch' || this.level.puzzleType === 'ecosystem_balance') {
              this.exitPortal.active = true;
            }
          }
        } else {
          // Standard wall rebound
          this.player.vx = -this.player.vx * 0.4;
          this.player.vy = -this.player.vy * 0.4;
          if (Math.hypot(this.player.vx, this.player.vy) > 100) {
            soundEngine.playImpact();
            this.cameraShake = 2;
          }
        }
      }
    }

    // Laser tracing for optics level
    if (this.level.puzzleType === 'optics_laser' || this.level.puzzleType === 'contraption_chain') {
      this.traceLasers();
    }

    // Acoustic resonance checking
    if (this.level.puzzleType === 'sound_resonance') {
      this.checkResonance();
    }

    // Exit portal check
    if (this.exitPortal.active) {
      const dx = this.player.x - this.exitPortal.x;
      const dy = this.player.y - this.exitPortal.y;
      const dist = Math.hypot(dx, dy);

      if (dist < this.player.radius + this.exitPortal.radius) {
        this.completeLevel();
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 30 * dt;
      ft.alpha -= dt * 0.8;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // Laser raycasting simulation
  private traceLasers() {
    let rayX = 80;
    let rayY = 300;
    let rayAngle = 0; // Pointing right

    const maxBounces = 6;
    let bounces = 0;

    // Reset targets activation
    this.targets.forEach((t) => (t.activated = false));

    while (bounces < maxBounces) {
      bounces++;
      const stepDist = 8;
      let hit = false;

      for (let s = 0; s < 100; s++) {
        rayX += Math.cos(rayAngle) * stepDist;
        rayY += Math.sin(rayAngle) * stepDist;

        // Check mirror collision
        for (const mirror of this.mirrors) {
          const dist = Math.hypot(rayX - mirror.x, rayY - mirror.y);
          if (dist < 22) {
            // Law of reflection: θr = 2 * mirrorAngle - θi
            rayAngle = 2 * mirror.angle - rayAngle;
            hit = true;
            this.addLaserSpark(rayX, rayY, '#38bdf8');
            break;
          }
        }

        // Check targets
        for (const target of this.targets) {
          const dist = Math.hypot(rayX - target.x, rayY - target.y);
          if (dist < target.radius) {
            if (!target.activated) {
              target.activated = true;
              soundEngine.playSuccess();
              this.addFloatingText(target.x, target.y - 20, 'TARGET ENERGIZED!', target.color);
              this.addSparks(target.x, target.y, target.color, 15);
            }
            hit = true;
            break;
          }
        }

        // Check boundary walls
        if (rayX < 20 || rayX > 780 || rayY < 20 || rayY > 580) {
          hit = true;
          break;
        }

        if (hit) break;
      }

      if (!hit) break;
    }

    // If all targets activated, open portal
    const allTargetsHit = this.targets.length > 0 && this.targets.every((t) => t.activated);
    if (allTargetsHit && !this.exitPortal.active) {
      this.exitPortal.active = true;
      soundEngine.playSuccess();
      this.addFloatingText(this.exitPortal.x, this.exitPortal.y - 40, 'OPTIC PORTAL OPEN!', '#a855f7');
      this.addSparks(this.exitPortal.x, this.exitPortal.y, '#a855f7', 25);
    }
  }

  // Acoustic resonance check
  private checkResonance() {
    // Frequencies: 220Hz, 440Hz, 880Hz
    const freqs = [220, 440, 880];

    freqs.forEach((targetFreq, idx) => {
      const target = this.targets[idx];
      if (!target || target.activated) return;

      const diff = Math.abs(this.soundFrequency - targetFreq);
      if (diff < 12) {
        target.activated = true;
        this.crystalsShattered++;
        soundEngine.playSuccess();
        this.addFloatingText(target.x, target.y - 30, `RESONANCE! ${targetFreq}Hz`, '#f97316');
        this.addSparks(target.x, target.y, '#f97316', 30);
      }
    });

    if (this.crystalsShattered >= 3 && !this.exitPortal.active) {
      this.exitPortal.active = true;
      this.addFloatingText(this.exitPortal.x, this.exitPortal.y - 40, 'SOUND BARRIER SHATTERED!', '#f97316');
      soundEngine.playSuccess();
    }
  }

  // Collect orb handler
  private collectOrb(orb: OrbCollectible) {
    orb.collected = true;

    if (orb.type === 'coin') {
      const val = Number(orb.value) || 20;
      this.score += val * 10;
      soundEngine.playCoin();
      this.callbacks.onCoinCollected(val);
      this.callbacks.onScoreUpdate(this.score);
      this.addFloatingText(orb.x, orb.y, `+${val} Coins`, '#eab308');
      this.addSparks(orb.x, orb.y, '#eab308', 12);
    } else if (orb.type === 'star') {
      const val = Number(orb.value) || 50;
      this.score += val * 10;
      soundEngine.playCoin();
      this.callbacks.onScoreUpdate(this.score);
      this.addFloatingText(orb.x, orb.y, `+${val} Star Pts`, '#f59e0b');
      this.addSparks(orb.x, orb.y, '#f59e0b', 16);
    } else if (orb.type === 'letter') {
      const char = String(orb.value);
      this.currentWordProgress += char;
      this.score += 80;
      soundEngine.playBounce();
      this.callbacks.onScoreUpdate(this.score);
      this.addFloatingText(orb.x, orb.y, char, '#f59e0b');
      this.addSparks(orb.x, orb.y, '#f59e0b', 14);

      if (this.currentWordProgress === 'SPARK') {
        this.exitPortal.active = true;
        soundEngine.playSuccess();
        this.addFloatingText(400, 300, 'LEXICON BRIDGE MATERIALIZED!', '#f59e0b');
        this.addSparks(400, 300, '#f59e0b', 30);
      }
    } else if (orb.type === 'energy') {
      this.score += 100;
      soundEngine.playSuccess();
      this.callbacks.onScoreUpdate(this.score);
      this.addFloatingText(orb.x, orb.y, `${orb.value} Assimilated!`, '#10b981');
      this.addSparks(orb.x, orb.y, '#10b981', 16);

      const allEnergy = this.orbs.filter((o) => o.type === 'energy').every((o) => o.collected);
      if (allEnergy) {
        this.exitPortal.active = true;
        this.addFloatingText(this.exitPortal.x, this.exitPortal.y - 30, 'BIOSPHERE EQUILIBRIUM!', '#10b981');
      }
    } else if (orb.type === 'prime') {
      const val = Number(orb.value);
      this.primeCollectedFactors.push(val);
      this.score += 100;

      // Check product
      const product = this.primeCollectedFactors.reduce((a, b) => a * b, 1);
      if (product === this.currentPrimeTarget) {
        this.exitPortal.active = true;
        soundEngine.playSuccess();
        this.addFloatingText(orb.x, orb.y, `PRIME LOCK CRACKED (${product})!`, '#ec4899');
        this.addSparks(this.exitPortal.x, this.exitPortal.y, '#ec4899', 25);
      } else {
        soundEngine.playBounce();
        this.addFloatingText(orb.x, orb.y, `Factor: ${val}`, '#ec4899');
      }
    }
  }

  // Emit trail particle
  private emitTrailParticle() {
    const angle = this.player.rotation + Math.PI + (Math.random() - 0.5) * 0.5;
    const speed = 40 + Math.random() * 40;
    const trailColor = this.playerStats.equippedTrail === 'trail_flame' ? '#f97316' : '#38bdf8';

    this.particles.push({
      x: this.player.x - Math.cos(this.player.rotation) * 14,
      y: this.player.y - Math.sin(this.player.rotation) * 14,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 3,
      color: trailColor,
      alpha: 0.8,
      decay: 2.2,
      shape: 'spark',
    });
  }

  private addSparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3.5,
        color,
        alpha: 1,
        decay: 1.5 + Math.random(),
        shape: 'spark',
      });
    }
  }

  private addLaserSpark(x: number, y: number, color: string) {
    if (Math.random() > 0.4) return;
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40,
      size: 2,
      color,
      alpha: 0.7,
      decay: 4.0,
      shape: 'circle',
    });
  }

  private addFloatingText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      x,
      y,
      text,
      color,
      alpha: 1,
      life: 1.2,
    });
  }

  // Level Complete
  private completeLevel() {
    if (!this.isRunning) return;
    this.isRunning = false;
    soundEngine.playVictory();
    this.addSparks(this.exitPortal.x, this.exitPortal.y, '#eab308', 50);
    this.callbacks.onLevelComplete(this.score, Math.round(this.timeElapsed));
  }

  // RENDERING ENGINE
  private render() {
    // Handle DPI and dimension sync
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    if (this.canvas.width !== rect.width * dpr || this.canvas.height !== rect.height * dpr) {
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
    }

    this.ctx.save();
    this.ctx.scale(dpr, dpr);

    // Coordinate mapping (scale from virtual 800x600 to client rect)
    const scaleX = rect.width / this.width;
    const scaleY = rect.height / this.height;
    this.ctx.scale(scaleX, scaleY);

    // Apply camera shake
    if (this.cameraShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.cameraShake * 2;
      const shakeY = (Math.random() - 0.5) * this.cameraShake * 2;
      this.ctx.translate(shakeX, shakeY);
    }

    // Dark sleek lab background
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Blueprint grid lines
    this.renderGrid();

    // Render gravity wells
    this.renderGravityWells();

    // Render obstacles
    this.renderObstacles();

    // Render mirrors and laser rays
    this.renderOptics();

    // Render collectible orbs
    this.renderOrbs();

    // Render exit portal
    this.renderExitPortal();

    // Render particles
    this.renderParticles();

    // Render player rover
    this.renderPlayer();

    // Render floating popups
    this.renderFloatingText();

    this.ctx.restore();
  }

  private renderGrid() {
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
    this.ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < this.width; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  private renderGravityWells() {
    for (const well of this.gravityWells) {
      // Gravitational gradient field
      const grad = this.ctx.createRadialGradient(well.x, well.y, 10, well.x, well.y, well.radius * 2.5);
      grad.addColorStop(0, well.color);
      grad.addColorStop(0.5, 'rgba(99, 102, 241, 0.2)');
      grad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(well.x, well.y, well.radius * 2.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Planet body
      this.ctx.fillStyle = well.color;
      this.ctx.beginPath();
      this.ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderObstacles() {
    for (const obs of this.obstacles) {
      if (obs.type === 'bounce_pad') {
        this.ctx.fillStyle = obs.color;
        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        // Striped pattern for spring pad
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(obs.x + 2, obs.y + 2, obs.width - 4, obs.height - 4);
      } else if (obs.type === 'switch') {
        this.ctx.fillStyle = obs.activated ? '#10b981' : '#334155';
        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        this.ctx.strokeStyle = obs.activated ? '#34d399' : '#64748b';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

        if (obs.label) {
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(obs.label, obs.x + obs.width / 2, obs.y + obs.height / 2 + 3);
        }
      } else {
        // Standard wall
        this.ctx.fillStyle = obs.color;
        this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
      }
    }
  }

  private renderOptics() {
    // Draw laser beam
    if (this.level.puzzleType === 'optics_laser' || this.level.puzzleType === 'contraption_chain') {
      let rayX = 80;
      let rayY = 300;
      let rayAngle = 0;
      const maxBounces = 6;
      let bounces = 0;

      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 3;
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.moveTo(rayX, rayY);

      while (bounces < maxBounces) {
        bounces++;
        const stepDist = 8;
        let hit = false;

        for (let s = 0; s < 100; s++) {
          rayX += Math.cos(rayAngle) * stepDist;
          rayY += Math.sin(rayAngle) * stepDist;

          for (const mirror of this.mirrors) {
            const dist = Math.hypot(rayX - mirror.x, rayY - mirror.y);
            if (dist < 22) {
              this.ctx.lineTo(rayX, rayY);
              rayAngle = 2 * mirror.angle - rayAngle;
              hit = true;
              break;
            }
          }

          for (const target of this.targets) {
            const dist = Math.hypot(rayX - target.x, rayY - target.y);
            if (dist < target.radius) {
              this.ctx.lineTo(rayX, rayY);
              hit = true;
              break;
            }
          }

          if (rayX < 20 || rayX > 780 || rayY < 20 || rayY > 580) {
            this.ctx.lineTo(rayX, rayY);
            hit = true;
            break;
          }

          if (hit) break;
        }

        if (!hit) {
          this.ctx.lineTo(rayX, rayY);
          break;
        }
      }

      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }

    // Draw mirrors
    for (const mirror of this.mirrors) {
      this.ctx.save();
      this.ctx.translate(mirror.x, mirror.y);
      this.ctx.rotate(mirror.angle);

      // Mirror base
      this.ctx.fillStyle = '#1e293b';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 16, 0, Math.PI * 2);
      this.ctx.fill();

      // Mirror reflective bar
      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.fillRect(-22, -3, 44, 6);
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(-22, -3, 44, 6);

      this.ctx.restore();
    }

    // Draw targets
    for (const target of this.targets) {
      this.ctx.fillStyle = target.activated ? target.color : '#334155';
      this.ctx.beginPath();
      this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = target.color;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Inner sensor core
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(target.x, target.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderOrbs() {
    const time = this.timeElapsed * 4;
    for (const orb of this.orbs) {
      if (orb.collected) continue;
      const pulse = Math.sin(time + orb.pulseOffset) * 3;

      this.ctx.save();
      this.ctx.translate(orb.x, orb.y);

      if (orb.type === 'coin') {
        this.ctx.fillStyle = '#eab308';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, orb.radius + pulse, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fef08a';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = '#713f12';
        this.ctx.font = 'bold 11px JetBrains Mono, monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('¢', 0, 1);
      } else if (orb.type === 'star') {
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, orb.radius + pulse, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('★', 0, 1);
      } else if (orb.type === 'letter') {
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, orb.radius + pulse, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 14px Plus Jakarta Sans, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(String(orb.value), 0, 1);
      } else if (orb.type === 'prime') {
        this.ctx.fillStyle = '#ec4899';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, orb.radius + pulse, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 13px JetBrains Mono, monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(String(orb.value), 0, 1);
      } else {
        this.ctx.fillStyle = '#10b981';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, orb.radius + pulse, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(String(orb.value), 0, 1);
      }

      this.ctx.restore();
    }
  }

  private renderExitPortal() {
    const pulse = Math.sin(this.timeElapsed * 5) * 4;
    this.ctx.save();
    this.ctx.translate(this.exitPortal.x, this.exitPortal.y);

    if (this.exitPortal.active) {
      // Active glowing portal vortex
      const grad = this.ctx.createRadialGradient(0, 0, 5, 0, 0, this.exitPortal.radius + pulse);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#38bdf8');
      grad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.exitPortal.radius + pulse, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.exitPortal.radius, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.fillStyle = '#0f172a';
      this.ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('EXIT', 0, 1);
    } else {
      // Inactive locked portal
      this.ctx.strokeStyle = '#475569';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.exitPortal.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      this.ctx.fillStyle = '#64748b';
      this.ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('LOCKED', 0, 1);
    }

    this.ctx.restore();
  }

  private renderParticles() {
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  private renderPlayer() {
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);
    this.ctx.rotate(this.player.rotation);
    this.ctx.scale(this.player.squashX, this.player.squashY);

    // Shield effect if active
    if (this.player.hasShield) {
      this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius + 6, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Rover chassis body
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Rover inner rim
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Cute inventor visor / eyes pointing forward
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.ellipse(6, 0, 6, 10, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#38bdf8';
    this.ctx.beginPath();
    this.ctx.arc(8, -2, 2, 0, Math.PI * 2);
    this.ctx.arc(8, 2, 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Antenna on top
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(-12, 0);
    this.ctx.stroke();

    this.ctx.fillStyle = '#f59e0b';
    this.ctx.beginPath();
    this.ctx.arc(-13, 0, 3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private renderFloatingText() {
    for (const ft of this.floatingTexts) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.fillStyle = ft.color;
      this.ctx.font = 'bold 13px Plus Jakarta Sans, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    }
  }
}
