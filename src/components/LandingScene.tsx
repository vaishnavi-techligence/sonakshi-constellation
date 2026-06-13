import React, { useState, useEffect, useRef } from 'react';

interface LandingSceneProps {
  onComplete: () => void;
  startMusic: (ctx: AudioContext) => void;
}

interface Lily {
  id: number;
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  petalCount: number;
  openness: number;
  rotation: number;
  glowIntensity: number;
  pulseOffset: number;
  shadowFactor: number;
  isSpecial?: boolean; // focal point lily flag
}

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  amplitude: number;
  decay: number;
  speed: number;
}

interface Letter {
  char: string;
  x: number;
  y: number;
  opacity: number;
  targetOpacity: number;
  dissolved: boolean;
  petalSpawned: boolean;
  width: number;
}

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  swaySpeed: number;
  swayWidth: number;
  swayOffset: number;
  rotation: number;
  rotSpeed: number;
  isBlurred?: boolean; // blurred flag for the falling petals
}

interface DandelionSeed {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  swayOffset: number;
  swaySpeed: number;
  swayWidth: number;
  isWishSeed: boolean;
  hasTransformed: boolean;
}

interface MemoryNote {
  x: number;
  y: number;
  message: string;
  fadeAlpha: number; // for proximity-based sparkle reveal
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
}

interface MistCloud {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  speedX: number;
}

interface SkyWisp {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
}

interface ShoreMist {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  speedX: number; // positive = drifting right, negative = drifting left
  alpha: number;
  maxX: number;   // maximum x before stopping (capped at 40% of canvas width from each shore)
}

// Personal lily messages — one per lily (discoverable on hover)
const LILY_MESSAGES = [
  "Always aiming higher.",          // 0 - Basketball
  "Grace in motion.",               // 1 - Skating
  "Creating happiness one recipe at a time.", // 2 - Cooking
  "Purple hearts and favourite songs.",       // 3 - Jungkook
  "You make ordinary days brighter.",         // 4 - Warmth
  "The world is softer with you in it.",      // 5 - Softness
  "You are loved more than you know.",        // 6 - Special focal
  "Stay exactly this wonderfully you.",       // 7 - Identity
];

export const LandingScene: React.FC<LandingSceneProps> = ({ onComplete, startMusic }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [audioStarted, setAudioStarted] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);

  // Interaction states
  const [, setMoonHovered] = useState(false);
  const [, setMoonClicked] = useState(false);
  const [secretTriggered, setSecretTriggered] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Refs to avoid stale closures in the requestAnimationFrame render loop
  const moonHoveredRef = useRef(false);
  const moonClickedRef = useRef(false);
  const secretTriggeredRef = useRef(false);
  const moonImgRef = useRef<HTMLImageElement | null>(null);

  // References for animation loop coordination
  const mousePosRef = useRef({ x: -1000, y: -1000 });
  const lastRippleTimeRef = useRef(0);
  const lastInteractionTimeRef = useRef(Date.now());
  const shootingStarRef = useRef<{ x: number; y: number; vx: number; vy: number; len: number; alpha: number; active: boolean; triggered: boolean } | null>(null);
  const lastFrameTimeRef = useRef<number>(Date.now());
  const waveTimeRef = useRef<number>(0);
  // Background shooting stars pool (periodic, not idle-based)
  type ShootingStar = { x: number; y: number; vx: number; vy: number; len: number; alpha: number; active: boolean };
  const bgStarsRef = useRef<ShootingStar[]>([]);
  const lastBgStarTimeRef = useRef<number>(Date.now() + 8000); // first star after ~8s

  // Lists for simulation objects
  const liliesRef = useRef<Lily[]>([]);
  const firefliesRef = useRef<Firefly[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const lettersRef = useRef<Letter[]>([]);
  const petalsRef = useRef<Petal[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const mistRef = useRef<MistCloud[]>([]);
  const skyWispsRef = useRef<SkyWisp[]>([]);
  const shoreMistRef = useRef<ShoreMist[]>([]);
  const lilyHoverOpacitiesRef = useRef<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);

  // Simulation settings
  const waveSpeedRef = useRef(1.0);
  const fireflySpeedRef = useRef(1.0);
  const moonGlowRef = useRef(1.0);

  // Lily breathing and hover scale refs
  const lilyBreathingScaleRef = useRef(1.0);
  
  // Dandelion Wish Event state ref
  const dandelionEventRef = useRef<{
    state: 'idle' | 'triggered' | 'detaching' | 'floating' | 'wish' | 'fading';
    startTime: number;
    pauseStartTime: number;
    wishTextAlpha: number;
    selectedMessage: string;
    seeds: DandelionSeed[];
    leftRegrowthProgress: number;
    rightRegrowthProgress: number;
    clickedSide: 'left' | 'right' | null;
  }>({
    state: 'idle',
    startTime: 0,
    pauseStartTime: 0,
    wishTextAlpha: 0,
    selectedMessage: '',
    seeds: [],
    leftRegrowthProgress: 1.0,
    rightRegrowthProgress: 1.0,
    clickedSide: null,
  });

  // Preloaded wind audio reference
  const windAudioRef = useRef<HTMLAudioElement | null>(null);
  // Ref to track the active background music audio so we can duck its volume
  const activeMusicAudioRef = useRef<HTMLAudioElement | null>(null);

  // Falling Petal system refs
  const lastPetalSpawnTimeRef = useRef(Date.now() + 5000); // first petal spawn after 5s
  const petalIntervalRef = useRef(25000); // every 25s

  // Proximity-Revealed Hidden Memory Notes refs
  const memoryNotesRef = useRef<MemoryNote[]>([]);

  // React state for displaying the handwritten memory note overlay
  const [activeNoteText, setActiveNoteText] = useState<string | null>(null);
  // const lettersDissolvingRef = useRef(false);
  // const lettersDissolveIndexRef = useRef(0);
  // const lastLetterDissolveTimeRef = useRef(0);

  // Initialize Web Audio loop on first gesture
  const initAudio = () => {
    if (audioStarted) return;
    setAudioStarted(true);
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      audioCtxRef.current = ctx;
      startMusic(ctx);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (audioMuted) {
      ctx.resume();
      setAudioMuted(false);
    } else {
      ctx.suspend();
      setAudioMuted(true);
    }
  };

  // Click the moon triggers the secret sequence
  const handleMoonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    initAudio();
    if (moonClickedRef.current) return;
    setMoonClicked(true);
    moonClickedRef.current = true;
    lastInteractionTimeRef.current = Date.now();

    // Brighten moon briefly (handled by moonGlow animation in loop)
    moonGlowRef.current = 2.0;

    // After 1200ms pause, trigger the text + whispered voice audio
    setTimeout(() => {
      setSecretTriggered(true);
      secretTriggeredRef.current = true;

      // Play the moon_b audio for the text "The moon is beautiful, isn't it?"
      const voiceAudio = new Audio('/moon_b.mpeg');
      voiceAudio.volume = 0.8;
      activeMusicAudioRef.current = voiceAudio;

      let nextMusicTriggered = false;
      const playNextMusic = () => {
        if (nextMusicTriggered) return;
        nextMusicTriggered = true;

        const musicAudio = new Audio('/music/moon_song.mp3');
        musicAudio.volume = 0.7;
        activeMusicAudioRef.current = musicAudio;
        musicAudio.play().catch((err) => {
          console.error('Failed to play moon_song music:', err);
          // If playing fails, transition to the next scene to not block user
          if (!isFadingOut) {
            setIsFadingOut(true);
            setTimeout(() => onComplete(), 1200);
          }
        });

        musicAudio.addEventListener('ended', () => {
          if (!isFadingOut) {
            setIsFadingOut(true);
            setTimeout(() => onComplete(), 1200);
          }
        });

        // Fallback: navigate after 45 seconds max
        setTimeout(() => {
          musicAudio.pause();
          if (!isFadingOut) {
            setIsFadingOut(true);
            setTimeout(() => onComplete(), 1200);
          }
        }, 45000);
      };

      voiceAudio.addEventListener('ended', playNextMusic);

      voiceAudio.play().then(() => {
        // Voice starts playing successfully
      }).catch((err) => {
        console.error('Failed to play voice audio moon_b:', err);
        // Play next music directly if voice playing fails
        playNextMusic();
      });

      // Safety timeout: if voice audio hasn't ended in 10 seconds, play music anyway
      setTimeout(playNextMusic, 10000);
    }, 1200);
  };

  const dandelionHoveredRef = useRef(false);

  const handleDandelionClick = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    initAudio();

    const event = dandelionEventRef.current;
    if (event.state !== 'idle') return;

    event.state = 'triggered';
    event.startTime = Date.now();
    event.clickedSide = side;
    
    if (side === 'left') {
      event.leftRegrowthProgress = 1.0;
    } else {
      event.rightRegrowthProgress = 1.0;
    }
    
    event.wishTextAlpha = 0;

    const pool = [
      "Some people feel like home.",
      "You make ordinary days brighter.",
      "The world is softer with you in it.",
      "Some friendships feel written in the stars.",
      "A garden blooms differently when you're here.",
      "You are loved more than you know."
    ];
    event.selectedMessage = pool[Math.floor(Math.random() * pool.length)];

    // Duck background music volume
    if (activeMusicAudioRef.current) {
      activeMusicAudioRef.current.volume = 0.12;
    }

    // Play wind sound
    if (!windAudioRef.current) {
      windAudioRef.current = new Audio('/wind.wav');
    }
    windAudioRef.current.volume = 0.65;
    windAudioRef.current.currentTime = 0;
    windAudioRef.current.play().catch((err) => {
      console.log("Wind audio play failed: ", err);
    });
  };

  // Navigation is automatic: triggered by song 'ended' event in handleMoonClick.
  // Remove all scroll/wheel/touch gestures.

  // Document-wide cursor tracking and idle updates
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      lastInteractionTimeRef.current = Date.now();
      
      // Reset shooting star trigger flag when user becomes active again
      if (shootingStarRef.current) {
        shootingStarRef.current.triggered = false;
      }
    };

    const handleWindowClick = (e: MouseEvent) => {
      lastInteractionTimeRef.current = Date.now();
      if (shootingStarRef.current) {
        shootingStarRef.current.triggered = false;
      }

      // Proximity click check for hidden memory notes
      const notes = memoryNotesRef.current;
      const canvas = canvasRef.current;
      if (canvas && notes && notes.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        for (let i = 0; i < notes.length; i++) {
          const n = notes[i];
          const dist = Math.hypot(mx - n.x, my - n.y);
          // Sparkle is clickable if revealed (fadeAlpha > 0.15) and clicked near it
          if (dist < 30 && n.fadeAlpha > 0.15) {
            setActiveNoteText(n.message);
            break;
          }
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleWindowClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleWindowClick);
    };
  }, []);

  // Main canvas simulation setup and loops
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const moonX = canvas.width / 2;
      const moonY = canvas.height * 0.30;
      
      memoryNotesRef.current = [
        { x: moonX - 120, y: moonY - 30, message: "Thank you for being you.", fadeAlpha: 0 },
        { x: moonX + 120, y: moonY - 10, message: "Keep chasing the things that make your eyes shine.", fadeAlpha: 0 },
        { x: moonX - 90, y: moonY + 70, message: "You made more people smile than you realize.", fadeAlpha: 0 },
        { x: moonX + 90, y: moonY + 70, message: "Some flowers bloom only once. Yours blooms every day.", fadeAlpha: 0 }
      ];
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Preload moon texture to draw directly on canvas
    if (!moonImgRef.current) {
      const img = new Image();
      img.src = '/moon_texture.png';
      moonImgRef.current = img;
    }
    const moonImg = moonImgRef.current;

    const horizon = canvas.height * 0.42;
    const moonY = canvas.height * 0.30;

    // 1. Initialize exactly 8 side-clustered lilies (70% empty negative space in the center)
    const tempLilies: Lily[] = [];
    const lilySpans = [
      { x: 0.15, y: 0.62 }, // Left midground
      { x: 0.85, y: 0.60 }, // Right midground
      { x: 0.22, y: 0.76 }, // Left foreground
      { x: 0.78, y: 0.74 }, // Right foreground
      { x: 0.08, y: 0.88 }, // Left far foreground
      { x: 0.90, y: 0.86 }, // Right far foreground
      { x: 0.28, y: 0.82 }, // Left foreground inner (focal point special lily)
      { x: 0.72, y: 0.80 }  // Right foreground inner
    ];

    lilySpans.forEach((span, index) => {
      const isSpecial = index === 6; // left foreground inner
      const sizeFactor = (span.y - 0.42) / 0.58; // 0 near horizon, 1 at bottom
      let radius = 9 + sizeFactor * 21;
      let glowIntensity = Math.random() < 0.45 ? 0.4 + Math.random() * 0.55 : 0.0;
      
      if (isSpecial) {
        radius = radius * 1.45; // notably larger focal point
        glowIntensity = 1.1;    // strong golden inner glow
      }
      
      tempLilies.push({
        id: index,
        baseX: canvas.width * span.x,
        baseY: horizon + (canvas.height - horizon) * ((span.y - 0.42) / 0.58),
        x: canvas.width * span.x,
        y: horizon + (canvas.height - horizon) * ((span.y - 0.42) / 0.58),
        vx: 0,
        vy: 0,
        radius,
        petalCount: isSpecial ? 12 : Math.floor(Math.random() * 5) + 6,
        openness: isSpecial ? 0.95 : 0.65 + Math.random() * 0.35,
        rotation: Math.random() * Math.PI * 2,
        glowIntensity,
        pulseOffset: Math.random() * Math.PI * 2,
        shadowFactor: isSpecial ? 0.0 : Math.random() * 0.35,
        isSpecial
      });
    });
    liliesRef.current = tempLilies;

    // 2. Initialize Fireflies (20 particles, tiny and slow for silent atmosphere)
    const tempFireflies: Firefly[] = [];
    for (let i = 0; i < 20; i++) {
      tempFireflies.push({
        x: Math.random() * canvas.width,
        y: horizon + Math.random() * (canvas.height - horizon),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 1.0,
        alpha: Math.random() * 0.7,
        decay: 0.003 + Math.random() * 0.005,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    firefliesRef.current = tempFireflies;

    // 3. Initialize Clouds (drifting in the sky)
    cloudsRef.current = [
      { x: canvas.width * 0.05, y: horizon * 0.15, width: 380, height: 90, speed: 0.05, opacity: 0.08 },
      { x: canvas.width * 0.4, y: horizon * 0.22, width: 440, height: 110, speed: 0.03, opacity: 0.12 },
      { x: canvas.width * 0.75, y: horizon * 0.1, width: 320, height: 80, speed: 0.04, opacity: 0.06 }
    ];

    // 4. Initialize Mist Clouds (6 horizontal mist streaks drifting slowly across the lake surface)
    const tempMist: MistCloud[] = [];
    for (let i = 0; i < 6; i++) {
      tempMist.push({
        x: Math.random() * canvas.width,
        y: horizon + Math.random() * (canvas.height - horizon) * 0.9,
        radiusX: 300 + Math.random() * 300,
        radiusY: 10 + Math.random() * 8, // thin horizontal streaks (10px to 18px radius)
        speedX: 0.05 + Math.random() * 0.07
      });
    }
    mistRef.current = tempMist;

    // 5. Initialize Sky Wisps (thin clouds crossing near moon height)
    skyWispsRef.current = [
      { x: canvas.width * 0.05, y: moonY - 30, width: 260, height: 12, speed: 0.06, opacity: 0.15 },
      { x: canvas.width * 0.45, y: moonY + 20, width: 340, height: 16, speed: 0.04, opacity: 0.22 },
      { x: canvas.width * 0.75, y: moonY - 10, width: 220, height: 14, speed: 0.05, opacity: 0.18 }
    ];

    // 6. Initialize Shore Mist — volumetric fog banks entering from both lake shores
    const tempShoreMist: ShoreMist[] = [];
    
    // Left shore mist banks (drift rightward)
    for (let i = 0; i < 6; i++) {
      tempShoreMist.push({
        x: -(100 + Math.random() * 250),      // start off-screen left
        y: horizon + (canvas.height - horizon) * (0.05 + Math.random() * 0.85),
        radiusX: 320 + Math.random() * 230,
        radiusY: 45 + Math.random() * 35,
        speedX: 0.06 + Math.random() * 0.09,  // drift rightward
        alpha: 0.025 + Math.random() * 0.02,
        maxX: canvas.width * (0.32 + Math.random() * 0.1) // stop at 32–42% from left
      });
    }
    
    // Right shore mist banks (drift leftward)
    for (let i = 0; i < 6; i++) {
      tempShoreMist.push({
        x: canvas.width + 100 + Math.random() * 250, // start off-screen right
        y: horizon + (canvas.height - horizon) * (0.05 + Math.random() * 0.85),
        radiusX: 320 + Math.random() * 230,
        radiusY: 45 + Math.random() * 35,
        speedX: -(0.06 + Math.random() * 0.09), // drift leftward
        alpha: 0.025 + Math.random() * 0.02,
        maxX: canvas.width * (0.58 + Math.random() * 0.1) // stop at 58–68% from left (right side)
      });
    }
    shoreMistRef.current = tempShoreMist;

    // Helper: Draw a beautiful stylized SVG-like lily
    const drawLilyOnWater = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      openness: number,
      petalCount: number,
      rotation: number,
      glowAlpha: number,
      shadow: number,
      isSpecial?: boolean
    ) => {
      // Darken colors based on shadow Factor
      const shade = 1 - shadow;
      
      // Underglow
      if (glowAlpha > 0) {
        const glowGrad = c.createRadialGradient(x, y, 0, x, y, size * (isSpecial ? 3.2 : 2.8));
        if (isSpecial) {
          glowGrad.addColorStop(0, `rgba(255, 218, 120, ${glowAlpha * shade * 0.65})`);
          glowGrad.addColorStop(0.3, `rgba(255, 218, 120, ${glowAlpha * shade * 0.25})`);
        } else {
          glowGrad.addColorStop(0, `rgba(242, 227, 198, ${glowAlpha * shade * 0.45})`);
          glowGrad.addColorStop(0.3, `rgba(242, 227, 198, ${glowAlpha * shade * 0.18})`);
        }
        glowGrad.addColorStop(1, 'rgba(242, 227, 198, 0)');
        c.fillStyle = glowGrad;
        c.beginPath();
        c.arc(x, y, size * (isSpecial ? 3.2 : 2.8), 0, Math.PI * 2);
        c.fill();
      }

      // Base shadow underneath lily
      c.beginPath();
      c.ellipse(x, y + 2, size * 1.1, size * 0.35, 0, 0, Math.PI * 2);
      c.fillStyle = `rgba(3, 4, 12, ${0.45 * shade})`;
      c.fill();

      c.save();
      c.translate(x, y);
      c.rotate(rotation);

      // Draw layered petals
      const layers = [
        { scale: 1.0, count: petalCount, color: `rgba(245, 243, 238, ${0.92 * shade})` }, // outer
        { scale: 0.8, count: petalCount - 1, color: isSpecial ? `rgba(255, 245, 225, ${0.96 * shade})` : `rgba(252, 251, 248, ${0.96 * shade})` }, // mid
        { scale: 0.55, count: petalCount - 2, color: isSpecial ? `rgba(255, 235, 190, ${1.0 * shade})` : `rgba(255, 253, 250, ${1.0 * shade})` } // inner
      ];

      layers.forEach((layer) => {
        c.fillStyle = layer.color;
        const count = layer.count;
        for (let i = 0; i < count; i++) {
          c.save();
          c.rotate((i / count) * Math.PI * 2);
          
          c.beginPath();
          c.moveTo(0, 0);
          // Curved petal loops
          c.quadraticCurveTo(-size * 0.35 * layer.scale * openness, -size * 0.4 * layer.scale, 0, -size * layer.scale);
          c.quadraticCurveTo(size * 0.35 * layer.scale * openness, -size * 0.4 * layer.scale, 0, 0);
          c.closePath();
          c.fill();

          c.restore();
        }
      });

      // Center gold pistils (Double-draw glow simulation instead of shadowBlur)
      c.fillStyle = `rgba(242, 227, 198, ${0.35 * shade})`;
      c.beginPath();
      c.arc(0, 0, size * 0.3, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = `rgba(242, 227, 198, ${0.9 * shade})`;
      c.beginPath();
      c.arc(0, 0, size * 0.18, 0, Math.PI * 2);
      c.fill();

      c.restore();
      c.shadowBlur = 0;
    };

    // Main animation loop
    const animate = () => {
      const now = Date.now();
      const deltaTime = Math.min(100, now - lastFrameTimeRef.current);
      lastFrameTimeRef.current = now;
      
      const pseudoRandom = (val: number) => {
        const s = Math.sin(val * 12.9898) * 43758.5453;
        return s - Math.floor(s);
      };
      
      // Compute 45-second cycle breeze factor (ramping up and down smoothly for 6 seconds)
      const cycleTime = now % 45000;
      let breezeFactor = 0;
      if (cycleTime < 6000) {
        breezeFactor = Math.sin((cycleTime / 6000) * Math.PI);
      }

      // Update sky transitions
      if (moonClickedRef.current) {
        // Quiet mode transitions
        waveSpeedRef.current += (0.22 - waveSpeedRef.current) * 0.03;
        fireflySpeedRef.current += (0.12 - fireflySpeedRef.current) * 0.03;
        moonGlowRef.current += (0.8 - moonGlowRef.current) * 0.03;
      } else {
        // Hover glows
        const targetGlow = moonHoveredRef.current ? 1.4 : 1.0;
        moonGlowRef.current += (targetGlow - moonGlowRef.current) * 0.1;
      }

      // Lily Breathing scale and glow animation (very subtle)
      const hoverTargetScale = moonHoveredRef.current ? 1.025 : 1.0;
      lilyBreathingScaleRef.current += (hoverTargetScale - lilyBreathingScaleRef.current) * 0.08;
      
      const breathingScale = Math.sin(now * 0.0012) * 0.005; // +/- 0.5% scale
      const finalMoonScale = lilyBreathingScaleRef.current + breathingScale;

      const breathingGlow = Math.cos(now * 0.0012) * 0.06; // breathing glow shift
      const finalGlowOpacity = Math.max(0.1, moonGlowRef.current + breathingGlow);

      // Accumulate wave time smoothly without phase jumps
      const windSpeed = waveSpeedRef.current * (1.0 + breezeFactor * 0.85);
      waveTimeRef.current += deltaTime * 0.001 * windSpeed;
      const timeFactor = waveTimeRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ==========================================
      // 1. SKY GRADIENT (Adjusted bluer near horizon for silhouetted tree contrast)
      // ==========================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
      skyGrad.addColorStop(0, '#020308');
      skyGrad.addColorStop(0.6, '#060818');
      skyGrad.addColorStop(1, '#0c0e27');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, horizon);

      // ==========================================
      // 2. SPARKLING STARS
      // ==========================================
      ctx.fillStyle = '#fcfbfa';
      for (let i = 0; i < 60; i++) {
        // Pseudo-random star grid using math hashes to stay fixed
        const starX = (Math.sin(i * 927.12) * 0.5 + 0.5) * canvas.width;
        const starY = (Math.cos(i * 382.49) * 0.5 + 0.5) * (horizon - 25);
        const pulse = Math.sin(now * 0.0012 + i * 4.2) * 0.35 + 0.65;
        const starSize = (Math.sin(i * 123.45) * 0.5 + 0.5) * 1.2 + 0.5;

        ctx.globalAlpha = pulse * 0.65;
        ctx.fillRect(starX, starY, starSize, starSize);
      }
      ctx.globalAlpha = 1.0;

      // ==========================================
      // 3. FAR CLOUD LAYER (Drifting behind the moon)
      // ==========================================
      ctx.fillStyle = 'rgba(28, 30, 60, 0.05)';
      cloudsRef.current.forEach((cloud) => {
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width) {
          cloud.x = -cloud.width;
        }
        
        ctx.beginPath();
        ctx.ellipse(cloud.x + cloud.width / 2, cloud.y + cloud.height / 2, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // ==========================================
      // 4. THE CANVAS MOON (Drawn directly on canvas for volumetric depth mapping)
      // ==========================================
      const moonX = canvas.width / 2;
      const moonY = canvas.height * 0.30; // lower moon at 30% height for dramatic reflection
      const moonRadius = 110; // 35% larger (220px diameter)

      // Draw soft halo glow extending 200px beyond the moon edge
      const haloGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius * finalMoonScale + 200);
      haloGrad.addColorStop(0, `rgba(255, 253, 245, ${0.18 * finalGlowOpacity})`);
      haloGrad.addColorStop((moonRadius * finalMoonScale) / (moonRadius * finalMoonScale + 200), `rgba(242, 227, 198, ${0.08 * finalGlowOpacity})`);
      haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius * finalMoonScale + 200, 0, Math.PI * 2);
      ctx.fill();

      // Draw photographic moon texture
      if (moonImg) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.95;
        const currentRadius = moonRadius * finalMoonScale;
        ctx.drawImage(
          moonImg,
          moonX - currentRadius,
          moonY - currentRadius,
          currentRadius * 2,
          currentRadius * 2
        );
        ctx.restore();
      }

      // ==========================================
      // 4.5 THIN SKY CLOUD WISPS (Drifting crossing in front of the moon)
      // ==========================================
      skyWispsRef.current.forEach((wisp) => {
        wisp.x += wisp.speed * (1.0 + breezeFactor * 1.2);
        if (wisp.x > canvas.width) {
          wisp.x = -wisp.width;
        }
        
        ctx.fillStyle = `rgba(235, 240, 255, ${wisp.opacity * 0.4})`; // Use wisp's specific opacity
        ctx.beginPath();
        ctx.ellipse(wisp.x + wisp.width / 2, wisp.y + wisp.height / 2, wisp.width / 2, wisp.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // ==========================================
      // 5. SHIMMERING REFLECTIVE WATER PATH & AMBIENT WAVES
      // ==========================================
      // Render water gradients (Dark navy near horizon, fading to deep navy/black in foreground)
      const waterGrad = ctx.createLinearGradient(0, horizon, 0, canvas.height);
      waterGrad.addColorStop(0, '#04050d');
      waterGrad.addColorStop(0.3, '#060a1e');
      waterGrad.addColorStop(1, '#020306');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, horizon, canvas.width, canvas.height - horizon);

      // Shimmering reflection path algorithm
      const waterHeight = canvas.height - horizon;

      // Faint ambient horizontal water highlights (ripples) across the entire lake width
      for (let y = horizon + 5; y < canvas.height; y += 8) {
        const rowRatio = (y - horizon) / waterHeight;
        const numRipples = 4;
        
        for (let k = 0; k < numRipples; k++) {
          const seed = pseudoRandom(y * 31.4 + k * 87.1);
          const rx = seed * canvas.width;
          
          const waveSpeed = timeFactor * 0.3 + y * 0.01;
          const shimmer = Math.sin(waveSpeed + k * Math.PI / 2) * Math.cos(waveSpeed * 0.3);
          
          if (shimmer > 0.1) {
            const ripLen = (15 + rowRatio * 60) * (0.5 + shimmer * 0.5);
            const ripWidth = 0.5 + rowRatio * 1.0;
            
            const distToCenter = Math.abs(rx - moonX);
            const centerFactor = Math.exp(-Math.pow(distToCenter / (canvas.width * 0.25), 2));
            
            const alpha = 0.08 * (shimmer - 0.1) * (1.0 - rowRatio * 0.4) * (0.3 + centerFactor * 0.7) * (moonGlowRef.current * 0.5 + 0.5);
            
            if (alpha > 0.005) {
              ctx.strokeStyle = centerFactor > 0.4 
                ? `rgba(240, 245, 255, ${alpha * 1.5})` 
                : `rgba(160, 190, 230, ${alpha})`;
                
              ctx.lineWidth = ripWidth;
              const shiftX = Math.sin(y * 0.05 + timeFactor * 0.6) * 6;
              ctx.beginPath();
              ctx.moveTo(rx + shiftX - ripLen / 2, y);
              ctx.lineTo(rx + shiftX + ripLen / 2, y);
              ctx.stroke();
            }
          }
        }
      }

      // Shimmering reflection cone path wobble (horizontal dancing wobbles)
      const pathWobble = Math.sin(timeFactor * 0.6) * 12 + Math.cos(timeFactor * 1.3) * 6;

      // ---- Bright central spine of the reflection (anchor) ----
      for (let y = horizon + 2; y < canvas.height; y += 2) {
        const rowRatio = (y - horizon) / waterHeight;
        const spineAlpha = 0.18 * (1.0 - rowRatio * 0.55) * (moonGlowRef.current * 0.5 + 0.5);
        const spineWave = Math.sin(y * 0.1 - timeFactor * 1.4) * (1.5 + rowRatio * 3);
        ctx.strokeStyle = `rgba(255, 252, 240, ${spineAlpha})`;
        ctx.lineWidth = 1.5 + rowRatio * 2.0;
        ctx.beginPath();
        ctx.moveTo(moonX + spineWave + pathWobble * 0.15 - (2 + rowRatio * 8), y);
        ctx.lineTo(moonX + spineWave + pathWobble * 0.15 + (2 + rowRatio * 8), y);
        ctx.stroke();
      }

      // Render reflection cone segment by segment — wide silver river of light
      for (let y = horizon + 2; y < canvas.height; y += 4) {
        const rowRatio = (y - horizon) / waterHeight;
        
        // Wide cone — 28% of canvas width near the foreground (was 18%)
        const coneWidth = 15 + rowRatio * (canvas.width * 0.28);
        
        // Wind wave sine distortion
        let waveOffset = Math.sin(y * 0.08 - timeFactor * 1.5) * (2 + rowRatio * 8) +
                         Math.cos(y * 0.15 + timeFactor * 0.9) * (1 + rowRatio * 4);

        // Hover extra ripples
        if (moonHoveredRef.current) {
          waveOffset += Math.sin(y * 0.12 - timeFactor * 6.0) * 5 * (1 - rowRatio);
        }

        // Apply interactive user mouse ripples to wave distortion
        ripplesRef.current.forEach((ripple) => {
          const dy = Math.abs(y - ripple.y);
          if (dy < ripple.radius) {
            const ratio = 1 - dy / ripple.radius;
            const waveWarp = Math.sin(ripple.radius * 0.12 - dy * 0.1) * ripple.amplitude * 14 * ratio;
            waveOffset += waveWarp;
          }
        });

        // Wobbling path row center (keeps path straight beneath the moon with only subtle sway)
        const rowCenter = moonX + pathWobble * 0.15;

        // More segments in the foreground for a denser, richer look
        const segmentsInRow = Math.max(3, Math.floor(7 - rowRatio * 3));
        
        for (let j = 0; j < segmentsInRow; j++) {
          const randShift = (pseudoRandom(y * 23.7 + j * 73.1) - 0.5) * 0.95;
          const concentratedShift = Math.sign(randShift) * Math.pow(Math.abs(randShift), 1.2);
          const xOffset = concentratedShift * coneWidth;
          const px = rowCenter + xOffset + waveOffset;
          
          const shimmer = Math.sin(timeFactor * 2.5 + y * 0.15 + concentratedShift * 10.0) * 
                          Math.cos(timeFactor * 1.1 - y * 0.08 + concentratedShift * 5.0);
          
          if (shimmer > -0.3) {
            const edgeFade = 1.0 - Math.abs(concentratedShift) * 1.8;
            if (edgeFade > 0) {
              const alpha = 0.65 * (shimmer + 0.3) * edgeFade * (0.35 + (1.0 - rowRatio) * 0.65) * (moonGlowRef.current * 0.5 + 0.5);
              
              if (alpha > 0.01) {
                // Segments scale from short/thin near horizon to long/thick in foreground
                const baseSegLen = 8 + rowRatio * 120;
                const segLen = (baseSegLen + Math.sin(timeFactor * 1.8 + y * 0.2) * (2 + rowRatio * 20)) * (0.5 + shimmer * 0.5);
                const lineWidth = 0.8 + rowRatio * 3.5;
                
                ctx.strokeStyle = `rgba(235, 243, 255, ${alpha})`;
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
                ctx.moveTo(px - segLen / 2, y);
                ctx.lineTo(px + segLen / 2, y);
                ctx.stroke();
              }
            }
          }
        }
      }

      // ==========================================
      // 6. BACKGROUND SILHOUETTE FORESTS & shoreline landmass
      // ==========================================
      // Faint irregular landmass shoreline base
      ctx.fillStyle = '#010206';
      ctx.beginPath();
      ctx.moveTo(0, horizon + 2);
      for (let x = 0; x <= canvas.width; x += 40) {
        const shoreH = Math.sin(x * 0.008) * 1.5 + Math.cos(x * 0.003) * 1.0;
        ctx.lineTo(x, horizon + 1.2 - shoreH);
      }
      ctx.lineTo(canvas.width, horizon + 2);
      ctx.closePath();
      ctx.fill();

      // Dense pine tree silhouettes
      ctx.fillStyle = '#020308';
      for (let x = 0; x < canvas.width; x += 8) {
        const distToCenter = Math.abs(x - canvas.width / 2);
        const normDist = distToCenter / (canvas.width / 2);
        const edgeFactor = Math.pow(normDist, 2.5); // curved taller at screen edges, low in center
        
        const rand = pseudoRandom(x);
        const treeH = (3 + rand * 8) + edgeFactor * 34;
        const treeW = 5 + rand * 4 + edgeFactor * 9;
        
        ctx.beginPath();
        ctx.moveTo(x, horizon);
        ctx.lineTo(x - treeW / 2, horizon);
        ctx.lineTo(x, horizon - treeH);
        ctx.lineTo(x + treeW / 2, horizon);
        ctx.closePath();
        ctx.fill();
      }

      // Soft atmospheric horizon haze to blend sky/trees and water
      const hazeGrad = ctx.createLinearGradient(0, horizon - 20, 0, horizon + 15);
      hazeGrad.addColorStop(0, 'rgba(12, 14, 39, 0)');
      hazeGrad.addColorStop(0.5, 'rgba(20, 25, 55, 0.16)');
      hazeGrad.addColorStop(1, 'rgba(4, 5, 13, 0)');
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, horizon - 20, canvas.width, 35);

      // ==========================================
      // 7. RIPPLE PROPAGATION ENGINE
      // ==========================================
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.amplitude -= r.decay;

        if (r.amplitude <= 0 || r.radius > r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        
        const rx = r.radius;
        const ry = r.radius * 0.35;
        
        // 1. Draw glowing dashed ellipse for a shimmery outline (Double-draw glow simulation)
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -now * 0.05 - r.radius * 0.5;
        
        // Outer glow path
        ctx.strokeStyle = `rgba(208, 240, 255, ${r.amplitude * 0.18})`;
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner core path
        ctx.strokeStyle = `rgba(255, 255, 255, ${r.amplitude * 0.6})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // 2. Draw 6 rotating sparkling stardust particles along the ellipse circumference
        const numParticles = 6;
        const rotateSpeed = 0.002;
        const startAngle = (now * rotateSpeed) + (r.radius * 0.02);
        
        for (let j = 0; j < numParticles; j++) {
          const angle = startAngle + (j * Math.PI * 2 / numParticles);
          const px = r.x + rx * Math.cos(angle);
          const py = r.y + ry * Math.sin(angle);
          
          // Particle size fluctuates dynamically
          const pSize = (1.5 + Math.sin(now * 0.01 + j) * 0.5) * r.amplitude * 1.5;
          
          // Outer glow circle
          ctx.fillStyle = `rgba(242, 227, 198, ${r.amplitude * 0.35})`;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(1.0, pSize * 2.5), 0, Math.PI * 2);
          ctx.fill();

          // Inner core circle
          ctx.fillStyle = `rgba(255, 255, 255, ${r.amplitude * 0.95})`;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.5, pSize), 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }

      // ==========================================
      // 8. SOSEKI SECRET MESSAGE IN THE WATER REFLECTION
      // ==========================================
      if (secretTriggeredRef.current) {
        // Initialize letter arrays once if empty
        if (lettersRef.current.length === 0) {
          const textLine = "The moon is beautiful, isn't it?";
          ctx.font = "italic 600 36px 'Playfair Display', serif";
          
          let totalTextW = 0;
          const widths: number[] = [];
          for (let i = 0; i < textLine.length; i++) {
            const charW = ctx.measureText(textLine[i]).width;
            widths.push(charW);
            totalTextW += charW;
          }

          let drawStartX = moonX - totalTextW / 2;
          const tempLetters: Letter[] = [];
          
          for (let i = 0; i < textLine.length; i++) {
            tempLetters.push({
              char: textLine[i],
              x: drawStartX + widths[i] / 2,
              y: horizon + 90, // Float inside the shimmering glade
              opacity: 0,
              targetOpacity: 1.0,
              dissolved: false,
              petalSpawned: false,
              width: widths[i]
            });
            drawStartX += widths[i];
          }
          lettersRef.current = tempLetters;
        }

        // Handle letter-by-letter dissolution timings (disabled since text shouldn't disappear)
        const letters = lettersRef.current;

        // Render a soft dark glow backing for readability
        const totalTextW = letters.reduce((sum, l) => sum + l.width, 0);
        const textY = horizon + 90;
        
        ctx.save();
        const textGlow = ctx.createRadialGradient(moonX, textY - 10, 0, moonX, textY - 10, totalTextW * 0.7);
        textGlow.addColorStop(0, 'rgba(4, 5, 12, 0.85)');
        textGlow.addColorStop(0.5, 'rgba(4, 5, 12, 0.65)');
        textGlow.addColorStop(1, 'rgba(4, 5, 12, 0)');
        ctx.fillStyle = textGlow;
        ctx.beginPath();
        ctx.ellipse(moonX, textY - 10, totalTextW * 0.7, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Render letters swaying with water waves
        letters.forEach((l) => {
          // Fade in/out interpolation
          l.opacity += (l.targetOpacity - l.opacity) * 0.08;

          if (l.opacity > 0.01) {
            // Extremely subtle, slow shimmer drift (Max 0.2px Y, Max 0.4px X) for high readability & stability
            const waveYOffset = Math.sin(l.y * 0.01 + timeFactor * 0.4) * 0.2;
            const waveXOffset = Math.cos(l.y * 0.015 + timeFactor * 0.3) * 0.4;

            // Soft shimmer glow alpha
            const glowOpacity = 0.35 + Math.sin(timeFactor * 1.5 + l.x * 0.1) * 0.15;

            ctx.save();
            ctx.globalAlpha = l.opacity;
            ctx.font = "italic 600 36px 'Playfair Display', serif";
            ctx.textAlign = 'center';

            // High-contrast stroke outline
            ctx.strokeStyle = '#020308';
            ctx.lineWidth = 6;
            ctx.strokeText(l.char, l.x + waveXOffset, l.y + waveYOffset);

            // Glow backing simulation (offsets)
            ctx.fillStyle = `rgba(242, 227, 198, ${glowOpacity * l.opacity * 0.8})`;
            ctx.fillText(l.char, l.x + waveXOffset, l.y + waveYOffset);

            // Core text
            ctx.fillStyle = '#fffdf7';
            ctx.fillText(l.char, l.x + waveXOffset, l.y + waveYOffset);
            ctx.restore();
          }
        });
      }

      // ==========================================
      // 9. UNIQUE WATER LILIES (8 Side-Clustered Lilies, leaving the center clear)
      // ==========================================
      const lilies = liliesRef.current;
      lilies.forEach((lily, index) => {
        // Resolve ripple collisions
        ripplesRef.current.forEach((ripple) => {
          const dist = Math.hypot(lily.x - ripple.x, lily.y - ripple.y);
          // Check if ripple wave packet is hitting the lily boundary
          if (Math.abs(dist - ripple.radius) < 20 && dist > 10) {
            const angle = Math.atan2(lily.y - ripple.y, lily.x - ripple.x);
            // Push outwards in proportion to remaining wave amplitude
            const pushForce = ripple.amplitude * 0.28 * (1 - Math.min(1.0, dist / ripple.maxRadius));
            lily.vx += Math.cos(angle) * pushForce;
            lily.vy += Math.sin(angle) * pushForce;
          }
        });

        // Spring anchor return physics to return to base positions
        const springK = 0.0075;
        const damping = 0.925;
        
        lily.vx += (lily.baseX - lily.x) * springK;
        lily.vy += (lily.baseY - lily.y) * springK;
        
        // Apply wind sway force based on breezeFactor
        lily.vx += Math.sin(timeFactor * 4.0 + lily.id * 1.3) * breezeFactor * 0.06;
        lily.vy += Math.cos(timeFactor * 3.0 + lily.id * 0.7) * breezeFactor * 0.03;

        lily.vx *= damping;
        lily.vy *= damping;
        
        lily.x += lily.vx;
        lily.y += lily.vy;

        // Render lily with custom properties
        const glowPulse = Math.sin(timeFactor * 1.5 + lily.pulseOffset) * 0.2 + 0.8;
        // Glow is proportional to the hover opacity of this lily
        const hoverAmt = lilyHoverOpacitiesRef.current[index] || 0.0;
        const currentGlow = lily.glowIntensity * hoverAmt * glowPulse;

        drawLilyOnWater(
          ctx,
          lily.x,
          lily.y,
          lily.radius,
          lily.openness,
          lily.petalCount,
          lily.rotation,
          currentGlow,
          lily.shadowFactor,
          lily.isSpecial
        );
      });

      // ==========================================
      // 9b. DISCOVERABLE LILY HOVER MESSAGES
      // ==========================================
      const mousePos = mousePosRef.current;
      const hoverOpacities = lilyHoverOpacitiesRef.current;
      
      lilies.forEach((lily, index) => {
        const dist = Math.hypot(mousePos.x - lily.x, mousePos.y - lily.y);
        const isHovered = dist < lily.radius * 2.8;
        
        // Smooth fade in/out
        hoverOpacities[index] = hoverOpacities[index] + ((isHovered ? 1.0 : 0.0) - hoverOpacities[index]) * 0.06;
        
        const msgOpacity = hoverOpacities[index];
        if (msgOpacity < 0.01) return;
        
        const message = LILY_MESSAGES[index] || '';
        const isLeftSide = lily.x < canvas.width / 2;
        
        // Font scales with lily depth/size
        const fontSize = Math.max(14, Math.min(18, 11 + lily.radius * 0.3));
        ctx.font = `italic 600 ${fontSize}px 'Playfair Display', serif`;
        const textWidth = ctx.measureText(message).width;
        
        // Position message to the right of left lilies, left of right lilies
        const msgX = isLeftSide
          ? lily.x + lily.radius + 10
          : lily.x - lily.radius - 10 - textWidth;
        const msgY = lily.y - lily.radius * 0.4;
        
        ctx.save();
        ctx.globalAlpha = msgOpacity;
        ctx.textAlign = 'left';
        
        // High-contrast stroke outline
        ctx.strokeStyle = 'rgba(2, 3, 8, 0.95)';
        ctx.lineWidth = 4;
        ctx.strokeText(message, msgX, msgY);
        
        // Glow backing (double-draw, no shadowBlur for perf)
        const glowA = 0.65 * msgOpacity;
        ctx.fillStyle = `rgba(242, 227, 198, ${glowA})`;
        ctx.fillText(message, msgX - 1, msgY);
        ctx.fillText(message, msgX + 1, msgY);
        ctx.fillText(message, msgX, msgY - 1);
        ctx.fillText(message, msgX, msgY + 1);
        
        // Core message text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(message, msgX, msgY);
        ctx.restore();
      });

      // ==========================================
      // 10. DRIFTING FIREFLIES
      // ==========================================
      const fireflies = firefliesRef.current;
      const fireSpeed = fireflySpeedRef.current;

      fireflies.forEach((f) => {
        // Brownian motion drift
        f.vx += (Math.random() - 0.5) * 0.12;
        f.vy += (Math.random() - 0.5) * 0.08;
        
        // Gentle wind lateral drift during breeze events
        f.vx += breezeFactor * 0.025;
        
        // Cap velocities
        const maxV = 0.8 * fireSpeed;
        const speed = Math.hypot(f.vx, f.vy);
        if (speed > maxV) {
          f.vx = (f.vx / speed) * maxV;
          f.vy = (f.vy / speed) * maxV;
        }

        f.x += f.vx;
        f.y += f.vy;

        // Steer away from cursor
        const cursorDist = Math.hypot(f.x - mousePos.x, f.y - mousePos.y);
        if (cursorDist < 85 && cursorDist > 1) {
          const steerAngle = Math.atan2(f.y - mousePos.y, f.x - mousePos.x);
          const steerPower = (85 - cursorDist) * 0.025;
          f.vx += Math.cos(steerAngle) * steerPower;
          f.vy += Math.sin(steerAngle) * steerPower;
        }

        // Boundary bounce
        if (f.x < 0 || f.x > canvas.width) f.vx = -f.vx;
        if (f.y < horizon || f.y > canvas.height) f.vy = -f.vy;

        // Animate glow pulse
        f.pulsePhase += f.pulseSpeed;
        const glowOpacity = Math.sin(f.pulsePhase + f.pulsePhase) * 0.45 + 0.55;

        // Draw glowing particle
        ctx.save();
        // Draw outer glow circle
        ctx.fillStyle = `rgba(242, 227, 198, ${glowOpacity * 0.25})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw inner core circle
        ctx.fillStyle = `rgba(242, 227, 198, ${glowOpacity * 0.95})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ==========================================
      // 11. DISSOLVED STARDUST PETALS
      // ==========================================
      const petals = petalsRef.current;
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          petals.splice(i, 1);
          continue;
        }

        p.rotation += p.rotSpeed;
        
        // Sway drift physics
        p.swayOffset += p.swaySpeed;
        const swayOffset = Math.sin(p.swayOffset) * p.swayWidth * 0.05;

        p.x += p.vx + swayOffset;
        p.y += p.vy;

        // Draw petal outline
        ctx.save();
        if (p.isBlurred) {
          ctx.filter = 'blur(2.5px)';
        }
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        
        ctx.beginPath();
        // Lily-like curved petal path
        ctx.moveTo(0, -p.size);
        ctx.quadraticCurveTo(p.size * 0.6, 0, 0, p.size);
        ctx.quadraticCurveTo(-p.size * 0.6, 0, 0, -p.size);
        ctx.closePath();

        // Draw outer glow backing path
        ctx.beginPath();
        const glowSize = p.size * 1.35;
        ctx.moveTo(0, -glowSize);
        ctx.quadraticCurveTo(glowSize * 0.6, 0, 0, glowSize);
        ctx.quadraticCurveTo(-glowSize * 0.6, 0, 0, -glowSize);
        ctx.closePath();
        ctx.fillStyle = 'rgba(242, 227, 198, 0.28)';
        ctx.fill();

        // Draw inner core path
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.quadraticCurveTo(p.size * 0.6, 0, 0, p.size);
        ctx.quadraticCurveTo(-p.size * 0.6, 0, 0, -p.size);
        ctx.closePath();
        ctx.fillStyle = 'rgba(252, 251, 250, 0.85)';
        ctx.fill();
        ctx.restore();
        ctx.filter = 'none';
      }

      // ==========================================
      // 12. FOREGROUND VOLUMETRIC MIST LAYER (Hero Atmospheric Layer, horizontal flat streaks)
      // ==========================================
      ctx.fillStyle = 'rgba(180, 200, 230, 0.022)'; // soft foggy twilight white-blue
      mistRef.current.forEach((m) => {
        // Mist clouds drift faster and sway vertically during breeze
        m.x += m.speedX * (1.0 + breezeFactor * 1.5);
        m.y += Math.sin(timeFactor * 1.5 + m.x * 0.01) * breezeFactor * 0.35;
        
        if (m.x - m.radiusX > canvas.width) {
          m.x = -m.radiusX;
        }
        
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, m.radiusX, m.radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // ==========================================
      // 12b. SHORE MIST (Volumetric fog banks entering from both lake shores)
      // ==========================================
      shoreMistRef.current.forEach((sm) => {
        const driftingRight = sm.speedX > 0;
        
        // Only drift if we haven't reached the cap
        if (driftingRight && sm.x < sm.maxX) {
          sm.x += sm.speedX * (1.0 + breezeFactor * 0.8);
        } else if (!driftingRight && sm.x > sm.maxX) {
          sm.x += sm.speedX * (1.0 + breezeFactor * 0.8);
        }
        
        // Gentle vertical breathing
        const verticalDrift = Math.sin(timeFactor * 0.8 + sm.maxX * 0.01) * 0.4;
        sm.y += verticalDrift;
        // Keep mist within the lake area
        if (sm.y < horizon) sm.y = horizon;
        if (sm.y > canvas.height - sm.radiusY) sm.y = canvas.height - sm.radiusY;

        // Render 3 stacked ellipses per mist bank for volumetric softness
        for (let layer = 0; layer < 3; layer++) {
          const layerY = sm.y + (layer - 1) * sm.radiusY * 0.6;
          const layerAlpha = sm.alpha * (1.0 - layer * 0.25);
          const layerRadiusX = sm.radiusX * (1.0 - layer * 0.15);
          const layerRadiusY = sm.radiusY * (0.8 + layer * 0.25);
          
          ctx.fillStyle = `rgba(200, 215, 240, ${layerAlpha})`;
          ctx.beginPath();
          ctx.ellipse(sm.x, layerY, layerRadiusX, layerRadiusY, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ==========================================
      // 13. BACKGROUND PERIODIC SHOOTING STARS + IDLE EASTER EGG
      // ==========================================

      // -- Background periodic stars (2-3 per minute, gentle atmosphere) --
      const bgStarInterval = 22000 + pseudoRandom(Math.floor(now / 30000)) * 35000; // 22s–57s interval
      if (now - lastBgStarTimeRef.current > bgStarInterval && bgStarsRef.current.filter(s => s.active).length < 2) {
        // Spawn a new background star (traverses from upper-left to right)
        bgStarsRef.current.push({
          x: Math.random() * canvas.width * 0.6,
          y: Math.random() * horizon * 0.5,
          vx: 4.5 + Math.random() * 4.0,
          vy: 0.8 + Math.random() * 1.8,
          len: 55 + Math.random() * 60,
          alpha: 0.0,
          active: true,
        });
        lastBgStarTimeRef.current = now;
      }

      // Keep pool lean
      if (bgStarsRef.current.length > 6) {
        bgStarsRef.current = bgStarsRef.current.filter(s => s.active);
      }

      bgStarsRef.current.forEach((s) => {
        if (!s.active) return;
        s.x += s.vx;
        s.y += s.vy;
        // Fade in quickly, fade out gently
        s.alpha = s.alpha < 0.85 ? s.alpha + 0.04 : s.alpha - 0.008;

        if (s.alpha <= 0 || s.x > canvas.width || s.y > horizon) {
          s.active = false;
          return;
        }

        ctx.save();
        ctx.globalAlpha = s.alpha * 0.75; // background stars feel more distant
        const bgGrad = ctx.createLinearGradient(s.x, s.y, s.x - s.len, s.y - (s.len * (s.vy / s.vx)));
        bgGrad.addColorStop(0, '#ffffff');
        bgGrad.addColorStop(0.35, 'rgba(242, 227, 198, 0.55)');
        bgGrad.addColorStop(1, 'rgba(242, 227, 198, 0)');
        ctx.strokeStyle = bgGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.len, s.y - (s.len * (s.vy / s.vx)));
        ctx.stroke();
        ctx.restore();
      });

      // -- Idle easter-egg star (after 20s inactivity) --
      const idleTime = now - lastInteractionTimeRef.current;
      
      // Initialize shooting star if idle for 20 seconds
      if (idleTime > 20000 && (!shootingStarRef.current || (!shootingStarRef.current.active && !shootingStarRef.current.triggered))) {
        shootingStarRef.current = {
          x: Math.random() * canvas.width * 0.4,
          y: Math.random() * horizon * 0.3,
          vx: 7.5 + Math.random() * 3.5,
          vy: 2.2 + Math.random() * 1.5,
          len: 80 + Math.random() * 50,
          alpha: 1.0,
          active: true,
          triggered: true
        };
      }

      // Render shooting star
      const star = shootingStarRef.current;
      if (star && star.active) {
        star.x += star.vx;
        star.y += star.vy;
        star.alpha -= 0.012; // fades out

        if (star.alpha <= 0 || star.x > canvas.width || star.y > horizon) {
          star.active = false;
        } else {
          ctx.save();
          ctx.globalAlpha = star.alpha;
          
          // Draw star trail gradient
          const starGrad = ctx.createLinearGradient(star.x, star.y, star.x - star.len, star.y - (star.len * (star.vy / star.vx)));
          starGrad.addColorStop(0, '#ffffff');
          starGrad.addColorStop(0.3, 'rgba(242, 227, 198, 0.7)');
          starGrad.addColorStop(1, 'rgba(242, 227, 198, 0)');
          
          ctx.strokeStyle = starGrad;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x - star.len, star.y - (star.len * (star.vy / star.vx)));
          ctx.stroke();
          ctx.restore();
        }
      }

      // ==========================================
      // A. SPARKLE & BLURRED FALLING PETALS (Phase 2)
      // ==========================================
      if (now - lastPetalSpawnTimeRef.current > petalIntervalRef.current) {
        const count = Math.random() < 0.5 ? 1 : 2;
        for (let pIdx = 0; pIdx < count; pIdx++) {
          petalsRef.current.push({
            x: Math.random() * canvas.width * 0.6, // start left-middle
            y: -30 - Math.random() * 20,          // above screen
            vx: 0.5 + Math.random() * 0.4,        // drift right
            vy: 0.4 + Math.random() * 0.3,        // float down
            size: 12 + Math.random() * 8,
            alpha: 0.9,
            decay: 0.0008 + Math.random() * 0.0005,
            swaySpeed: 0.015 + Math.random() * 0.01,
            swayWidth: 4 + Math.random() * 4,
            swayOffset: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.005,
            isBlurred: true
          });
        }
        lastPetalSpawnTimeRef.current = now;
      }

      // ==========================================
      // B. DANDELION WISH EVENT UPDATES & RENDER (Phase 3)
      // ==========================================
      const dandLeftX = 150;
      const dandRightX = canvas.width - 150;
      const dandY = canvas.height - 90;
      const dandEvent = dandelionEventRef.current;

      const isLeftHovered = Math.hypot(mousePos.x - dandLeftX, mousePos.y - dandY) < 40;
      const isRightHovered = Math.hypot(mousePos.x - dandRightX, mousePos.y - dandY) < 40;

      // Draw both dandelions
      const dandelions = [
        { x: dandLeftX, progress: dandEvent.leftRegrowthProgress, hovered: isLeftHovered, side: 'left' },
        { x: dandRightX, progress: dandEvent.rightRegrowthProgress, hovered: isRightHovered, side: 'right' }
      ];

      dandelions.forEach((dand) => {
        // 1. Draw Dandelion Stem
        ctx.strokeStyle = `rgba(242, 227, 198, ${0.45 * dand.progress})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(dand.x, canvas.height);
        ctx.quadraticCurveTo(dand.x + (dand.side === 'left' ? -5 : 5), canvas.height - 35, dand.x, dandY);
        ctx.stroke();

        // 2. Draw Dandelion Head Glow
        if (dand.progress > 0.05) {
          const headGlow = ctx.createRadialGradient(dand.x, dandY, 0, dand.x, dandY, 25);
          const glowHoverFactor = dand.hovered ? 1.3 : 1.0;
          headGlow.addColorStop(0, `rgba(255, 253, 245, ${0.35 * dand.progress * glowHoverFactor})`);
          headGlow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = headGlow;
          ctx.beginPath();
          ctx.arc(dand.x, dandY, 25, 0, Math.PI * 2);
          ctx.fill();

          // Draw radiating fluff spokes
          ctx.strokeStyle = `rgba(242, 227, 198, ${0.75 * dand.progress})`;
          ctx.lineWidth = 0.8;
          const numSpokes = 18;
          for (let i = 0; i < numSpokes; i++) {
            // If detaching, don't draw the already-detached seeds
            if (dandEvent.state !== 'idle' && dandEvent.clickedSide === dand.side) {
              const timeElapsed = now - dandEvent.startTime;
              const seedIndexThreshold = Math.floor(numSpokes * (timeElapsed / 2000));
              if (i < seedIndexThreshold) continue;
            }
            const angle = (i / numSpokes) * Math.PI * 2;
            const px = dand.x + Math.cos(angle) * 14 * dand.progress;
            const py = dandY + Math.sin(angle) * 14 * dand.progress;
            
            ctx.beginPath();
            ctx.moveTo(dand.x, dandY);
            ctx.lineTo(px, py);
            ctx.stroke();
            
            // Outer fluff dot
            ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * dand.progress})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 3. Draw Whisper Hint ("make a wish")
        const mouseDist = Math.hypot(mousePos.x - dand.x, mousePos.y - dandY);
        if (mouseDist < 120 && dandEvent.state === 'idle') {
          ctx.save();
          // Pulsing faint text
          const hintAlpha = 0.25 + Math.sin(now * 0.002) * 0.12;
          ctx.fillStyle = `rgba(242, 227, 198, ${hintAlpha})`;
          ctx.font = "italic 300 13px 'Montserrat', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText("*make a wish*", dand.x, dandY - 35);
          ctx.restore();
        }
      });

      // 4. Update and Draw Dandelion Seeds
      if (dandEvent.state !== 'idle') {
        const elapsed = now - dandEvent.startTime;
        const isLeft = dandEvent.clickedSide === 'left';

        if (dandEvent.state === 'triggered') {
          // Detach seeds over 2 seconds (15 seeds)
          const expectedSeedCount = Math.min(15, Math.floor(elapsed / 130));
          const startX = isLeft ? dandLeftX : dandRightX;
          
          while (dandEvent.seeds.length < expectedSeedCount) {
            // Left goes up-right, Right goes up-left
            const angle = isLeft
              ? (-Math.PI / 4 - Math.random() * Math.PI / 4) // up-right
              : (-3 * Math.PI / 4 + Math.random() * Math.PI / 4); // up-left
            const speed = 1.0 + Math.random() * 1.5;
            const isWishSeed = dandEvent.seeds.length === 8;
            
            dandEvent.seeds.push({
              x: startX,
              y: dandY,
              vx: Math.cos(angle) * speed + (isLeft ? 0.35 : -0.35),
              vy: Math.sin(angle) * speed - 0.45,
              alpha: 0.95,
              size: 2.0 + Math.random() * 1.5,
              swayOffset: Math.random() * Math.PI * 2,
              swaySpeed: 0.02 + Math.random() * 0.02,
              swayWidth: 2.5 + Math.random() * 2.5,
              isWishSeed,
              hasTransformed: false
            });
          }
          
          // Progress regrowth of the clicked side
          if (isLeft) {
            dandEvent.leftRegrowthProgress = Math.max(0, 1.0 - (elapsed / 2000));
          } else {
            dandEvent.rightRegrowthProgress = Math.max(0, 1.0 - (elapsed / 2000));
          }

          if (elapsed > 2000) {
            dandEvent.state = 'floating';
          }
        }

        // Target center area in front of the moon
        const centerLilyX = canvas.width / 2;
        const centerLilyY = canvas.height * 0.30;

        for (let i = dandEvent.seeds.length - 1; i >= 0; i--) {
          const s = dandEvent.seeds[i];
          s.swayOffset += s.swaySpeed;
          const sway = Math.sin(s.swayOffset) * s.swayWidth * 0.03;

          s.x += s.vx + sway;
          s.y += s.vy;

          // Float diagonal up-center
          s.vy += (-0.75 - s.vy) * 0.025; // ease upwards
          s.vx += ((isLeft ? 0.65 : -0.65) - s.vx) * 0.025;  // ease towards center

          // Wish seed attraction to moon
          if (s.isWishSeed && !s.hasTransformed) {
            const dx = centerLilyX - s.x;
            const dy = centerLilyY - s.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 35) {
              s.hasTransformed = true;
              dandEvent.state = 'wish';
              dandEvent.pauseStartTime = now;
              dandEvent.seeds.splice(i, 1);
              continue;
            } else {
              s.vx += dx * 0.009;
              s.vy += dy * 0.009;
            }
          }

          // Draw floating seed
          ctx.save();
          ctx.strokeStyle = `rgba(255, 253, 245, ${s.alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 3.5, s.y - s.vy * 3.5);
          ctx.stroke();

          ctx.fillStyle = `rgba(242, 227, 198, ${s.alpha * 1.15})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 0.65, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Bound cleanup
          if (s.y < -10 || s.x > canvas.width + 10 || s.x < -10) {
            dandEvent.seeds.splice(i, 1);
          }
        }

        if (dandEvent.state === 'wish') {
          // Pause for 1 second where it hovers
          if (now - dandEvent.pauseStartTime > 1000) {
            dandEvent.state = 'fading';
            dandEvent.startTime = now;
          }
        }

        if (dandEvent.state === 'fading') {
          const fadeElapsed = now - dandEvent.startTime;
          if (fadeElapsed < 1500) {
            dandEvent.wishTextAlpha = fadeElapsed / 1500;
          } else if (fadeElapsed < 6500) {
            dandEvent.wishTextAlpha = 1.0;
          } else if (fadeElapsed < 8000) {
            dandEvent.wishTextAlpha = Math.max(0, 1.0 - (fadeElapsed - 6500) / 1500);
          } else {
            // Restore event parameters
            dandEvent.state = 'idle';
            dandEvent.wishTextAlpha = 0;
            dandEvent.seeds = [];
            
            // Set regrowth to 0 so it starts growing back
            if (isLeft) {
              dandEvent.leftRegrowthProgress = 0.0;
            } else {
              dandEvent.rightRegrowthProgress = 0.0;
            }
            dandEvent.clickedSide = null;

            // Fade background music back to normal volume
            if (activeMusicAudioRef.current) {
              activeMusicAudioRef.current.volume = activeMusicAudioRef.current.src.includes('moon_b') ? 0.8 : 0.7;
            }
          }
        }
      }

      // Regrow dandelion heads slowly when idle
      if (dandEvent.state === 'idle') {
        if (dandEvent.leftRegrowthProgress < 1.0) {
          dandEvent.leftRegrowthProgress = Math.min(1.0, dandEvent.leftRegrowthProgress + 0.0035);
        }
        if (dandEvent.rightRegrowthProgress < 1.0) {
          dandEvent.rightRegrowthProgress = Math.min(1.0, dandEvent.rightRegrowthProgress + 0.0035);
        }
      }

      // Render Wish Quote (Phase 3)
      if (dandEvent.wishTextAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = dandEvent.wishTextAlpha;
        const quoteX = canvas.width / 2;
        const quoteY = moonY + 20; // overlay right in front of the moon

        ctx.font = "italic 600 24px 'Playfair Display', serif";
        ctx.textAlign = 'center';

        // Dark backing glow for readability
        ctx.strokeStyle = 'rgba(4, 5, 12, 0.95)';
        ctx.lineWidth = 6;
        ctx.strokeText(dandEvent.selectedMessage, quoteX, quoteY);

        // Core text
        ctx.fillStyle = '#f2e3c6';
        ctx.fillText(dandEvent.selectedMessage, quoteX, quoteY);
        ctx.restore();
      }

      // ==========================================
      // C. PROXIMITY-REVEALED HIDDEN MEMORY NOTES (Phase 4)
      // ==========================================
      const notes = memoryNotesRef.current;
      let nearSparkle = false;

      notes.forEach((n) => {
        const dist = Math.hypot(mousePosRef.current.x - n.x, mousePosRef.current.y - n.y);
        
        // Proximity checks: reveal note when cursor is near (< 100px)
        const isNear = dist < 100;
        n.fadeAlpha += ((isNear ? 0.85 : 0.0) - n.fadeAlpha) * 0.08;

        if (n.fadeAlpha > 0.01) {
          ctx.save();
          ctx.globalAlpha = n.fadeAlpha;

          // Sparkle breathing pulse
          const pulseSize = 3.5 + Math.sin(now * 0.005 + n.x) * 1.5;

          // Soft gold glow
          ctx.fillStyle = `rgba(242, 227, 198, ${0.35 * n.fadeAlpha})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, pulseSize * 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Sparkle core star
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * n.fadeAlpha})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(n.x - pulseSize, n.y);
          ctx.lineTo(n.x + pulseSize, n.y);
          ctx.moveTo(n.x, n.y - pulseSize);
          ctx.lineTo(n.x, n.y + pulseSize);
          ctx.stroke();

          ctx.restore();
        }

        // If cursor is right on top of a revealed note sparkle, change cursor to pointer
        if (dist < 25 && n.fadeAlpha > 0.15) {
          nearSparkle = true;
        }
      });

      // Manage canvas 'interactive' class depending on whether hovering a sparkle
      if (nearSparkle) {
        canvas.classList.add('interactive');
      } else {
        canvas.classList.remove('interactive');
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    // Lake mouse movements ripples trigger hook
    const handleLakeMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const my = e.clientY - rect.top;
      const mx = e.clientX - rect.left;

      if (my > horizon) {
        const now = Date.now();
        // Limit ripple spawning rate to prevent flooding the physics engine
        if (now - lastRippleTimeRef.current > 150) {
          const dx = mousePosRef.current.x - mx;
          const dy = mousePosRef.current.y - my;
          const mouseSpeed = Math.hypot(dx, dy);

          // Spawn ripples only when user cursor is moving significantly
          if (mouseSpeed > 8) {
            ripplesRef.current.push({
              x: mx,
              y: my,
              radius: 4,
              maxRadius: 100 + Math.random() * 60,
              amplitude: 1.0,
              decay: 0.008 + Math.random() * 0.005,
              speed: 1.8 + Math.random() * 0.8
            });
            lastRippleTimeRef.current = now;
          }
        }
      }
    };

    window.addEventListener('mousemove', handleLakeMouseMove);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleLakeMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="landing-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        backgroundColor: '#04050a',
        zIndex: 9995,
        overflow: 'hidden',
        transition: 'opacity 1.2s ease',
      }}
    >
      {/* 3D Calming Interactive Lake Canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, display: 'block' }} />

      {/* INVISIBLE POINTER INTERACTION TARGET FOR THE CANVAS MOON */}
      <div
        className="interactive"
        onMouseEnter={() => {
          setMoonHovered(true);
          moonHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          setMoonHovered(false);
          moonHoveredRef.current = false;
        }}
        onClick={handleMoonClick}
        style={{
          position: 'absolute',
          left: '50%',
          top: '30%', // lower moon center target (corresponds to canvas y = 30%)
          transform: 'translate(-50%, -50%)',
          width: '220px', // larger moon target diameter (corresponds to canvas radius = 110)
          height: '220px',
          borderRadius: '50%',
          cursor: 'pointer',
          zIndex: 9998, // overlay target above canvas layers
          backgroundColor: 'transparent'
        }}
      />

      {/* INVISIBLE POINTER INTERACTION TARGET FOR LEFT DANDELION (Phase 3) */}
      <div
        className="interactive"
        onMouseEnter={() => {
          dandelionHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          dandelionHoveredRef.current = false;
        }}
        onClick={(e) => handleDandelionClick(e, 'left')}
        style={{
          position: 'absolute',
          left: '150px',
          bottom: '90px',
          transform: 'translate(-50%, 50%)',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          cursor: 'pointer',
          zIndex: 9998,
          backgroundColor: 'transparent'
        }}
      />

      {/* INVISIBLE POINTER INTERACTION TARGET FOR RIGHT DANDELION (Phase 3) */}
      <div
        className="interactive"
        onMouseEnter={() => {
          dandelionHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          dandelionHoveredRef.current = false;
        }}
        onClick={(e) => handleDandelionClick(e, 'right')}
        style={{
          position: 'absolute',
          right: '150px',
          bottom: '90px',
          transform: 'translate(50%, 50%)',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          cursor: 'pointer',
          zIndex: 9998,
          backgroundColor: 'transparent'
        }}
      />
      {/* CLICK THE MOON HINT — fades out once moon      {!secretTriggered && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 'calc(30% + 130px)', // just below the moon
            transform: 'translateX(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 9999,
            animation: 'fade-in 3s ease-out forwards',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#fffdf5',
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              animation: 'pulse-slow 3s ease-in-out infinite',
              display: 'block',
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.95), 0 0 8px rgba(242, 227, 198, 0.4)'
            }}
          >
            ✦ click the moon ✦
          </span>
        </div>
      )}
  
      {/* BRANDING TITLE OVERLAY */}
      {!secretTriggered && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '68%', // repositioned to 68% so it sits beautifully without falling off the page
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 9997,
            animation: 'fade-in 2.5s ease-out forwards'
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-serif-display)',
              fontSize: '2.5rem',
              fontWeight: 500,
              color: '#fff',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              textShadow: '0 3px 25px rgba(0, 0, 0, 0.95), 0 0 15px rgba(242, 227, 198, 0.15)'
            }}
          >
            Sonakshi's Lily Garden
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.05rem',
              fontWeight: 600,
              color: '#fffdf5',
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              marginTop: '12px',
              opacity: 1.0,
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.95), 0 4px 25px rgba(0, 0, 0, 0.9), 0 0 10px rgba(242, 227, 198, 0.4)'
            }}
          >
            A Universe As Beautiful As You
          </p>
        </div>
      )}

      {/* MUSIC TOGGLE BUTTON IN CORNER */}
      <div
        className="interactive"
        onClick={toggleMute}
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '48px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 10000,
          transition: 'all 0.3s'
        }}
      >
        {!audioMuted && audioStarted ? (
          // Volume2 Icon
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--gold-accent)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ) : (
          // VolumeX Icon
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--text-muted)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
      </div>

      {/* RIPPLE EXPANSION CLIP OVERLAY FOR ENTERING THE GARDEN */}
      {isFadingOut && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-dark)',
            boxShadow: '0 0 0 200vmax var(--bg-dark)',
            transition: 'box-shadow 1.2s cubic-bezier(0.76, 0, 0.24, 1)',
            zIndex: 10001,
          }}
        />
      )}

      {/* HANDWRITTEN NOTE OVERLAY (Phase 4) */}
      {activeNoteText && (
        <div
          onClick={() => setActiveNoteText(null)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(4, 5, 12, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10005,
            animation: 'fade-in 0.4s ease-out forwards',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{
              padding: '48px 40px',
              maxWidth: '450px',
              width: '90%',
              textAlign: 'center',
              border: '1px solid rgba(242, 227, 198, 0.25)',
              background: 'rgba(12, 14, 38, 0.85)',
              boxShadow: '0 15px 45px rgba(0, 0, 0, 0.6), 0 0 25px rgba(242, 227, 198, 0.15)',
              borderRadius: '20px',
              position: 'relative',
              animation: 'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveNoteText(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.6rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              ×
            </button>
            {/* Note content */}
            <p
              style={{
                fontFamily: "'Caveat', cursive, serif",
                fontSize: '2.2rem',
                color: 'var(--gold-accent)',
                lineHeight: '1.45',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                marginBottom: '15px'
              }}
            >
              "{activeNoteText}"
            </p>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              ✦ A note from the universe ✦
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
