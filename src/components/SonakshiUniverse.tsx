import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ==========================================
// ISLAND 1: JUNGKOOK CONSTELLATION
// ==========================================
interface JungkookIslandProps {
  audioCtx: AudioContext | null;
  ambientPlaying: boolean;
  setAmbientPlaying: (playing: boolean) => void;
  onEnterJungkookConstellation: () => void;
}

const JungkookIsland: React.FC<JungkookIslandProps> = ({ audioCtx, ambientPlaying, setAmbientPlaying, onEnterJungkookConstellation }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasClicked, setCanvasClicked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasAmbientPlaying = useRef(false);

  useEffect(() => {
    const handleStopAll = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.origin !== 'jungkook') {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      }
    };
    window.addEventListener('stop-all-audio', handleStopAll);
    return () => {
      window.removeEventListener('stop-all-audio', handleStopAll);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      if (wasAmbientPlaying.current) {
        setAmbientPlaying(true);
      }
    } else {
      if (!audioRef.current) {
        const audio = new Audio('/still_with_you.webm');
        audio.preload = 'none';
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          if (wasAmbientPlaying.current) {
            setAmbientPlaying(true);
          }
        });
        audioRef.current = audio;
      }

      window.dispatchEvent(new CustomEvent('stop-all-audio', { detail: { origin: 'jungkook' } }));

      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      wasAmbientPlaying.current = ambientPlaying;
      if (ambientPlaying) {
        setAmbientPlaying(false);
      }
      audioRef.current.play().catch(err => {
        console.error('Failed to play Still With You:', err);
      });
      setIsPlaying(true);
    }
  };
  
  const stars = [
    { x: 150, y: 70 },  // Ear 1 tip
    { x: 165, y: 120 }, // Ear 1 base
    { x: 195, y: 120 }, // Ear 2 base
    { x: 210, y: 70 },  // Ear 2 tip
    { x: 180, y: 150 }, // Head top
    { x: 140, y: 180 }, // Left cheek
    { x: 220, y: 180 }, // Right cheek
    { x: 180, y: 210 }, // Chin
    { x: 160, y: 240 }, // Left paw
    { x: 200, y: 240 }, // Right paw
    { x: 180, y: 270 }  // Tail/body base
  ];

  interface GalaxyParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    type: 'particle' | 'note' | 'heart';
    char?: string;
  }

  const particlesRef = useRef<GalaxyParticle[]>([]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    setCanvasClicked(true);

    // Spawn galaxy explosion
    const purpleColors = ['#e5ccff', '#c084fc', '#d8b4fe', '#a855f7', '#f472b6'];
    const notes = ['🎵', '🎶', '💜', '✨', '🐰'];

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const isSpecial = Math.random() < 0.25;

      particlesRef.current.push({
        x: clickX,
        y: clickY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size: isSpecial ? 12 : Math.random() * 3 + 1.5,
        color: purpleColors[Math.floor(Math.random() * purpleColors.length)],
        alpha: 1.0,
        type: isSpecial ? 'note' : 'particle',
        char: isSpecial ? notes[Math.floor(Math.random() * notes.length)] : undefined
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background cosmic dust
      ctx.fillStyle = 'rgba(15, 12, 30, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Constellation Lines (glow white-gold)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(242, 227, 198, 0.25)';
      ctx.lineWidth = 1.2;
      
      // Connect ear 1
      ctx.moveTo(stars[0].x, stars[0].y);
      ctx.lineTo(stars[1].x, stars[1].y);
      ctx.lineTo(stars[4].x, stars[4].y);
      // Connect ear 2
      ctx.moveTo(stars[3].x, stars[3].y);
      ctx.lineTo(stars[2].x, stars[2].y);
      ctx.lineTo(stars[4].x, stars[4].y);
      // Head contour
      ctx.lineTo(stars[5].x, stars[5].y);
      ctx.lineTo(stars[7].x, stars[7].y);
      ctx.lineTo(stars[6].x, stars[6].y);
      ctx.lineTo(stars[4].x, stars[4].y);
      // Paw details
      ctx.moveTo(stars[5].x, stars[5].y);
      ctx.lineTo(stars[8].x, stars[8].y);
      ctx.lineTo(stars[10].x, stars[10].y);
      ctx.moveTo(stars[6].x, stars[6].y);
      ctx.lineTo(stars[9].x, stars[9].y);
      ctx.lineTo(stars[10].x, stars[10].y);
      
      ctx.shadowColor = '#f2e3c6';
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw Stars
      stars.forEach((star) => {
        // Star glow pulsing
        const glow = Math.sin(Date.now() * 0.003 + star.x) * 3 + 4;
        ctx.beginPath();
        ctx.arc(star.x, star.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#f2e3c6';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = glow;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Update & Draw Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.015;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.type === 'note' && p.char) {
          ctx.font = `${p.size}px Montserrat`;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillText(p.char, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.fill();
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', background: 'linear-gradient(145deg, rgba(20, 15, 35, 0.5), rgba(10, 8, 20, 0.8))', borderTop: '1px solid rgba(168, 85, 247, 0.15)', borderBottom: '1px solid rgba(168, 85, 247, 0.15)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      <div className="responsive-island-content" style={{ padding: '48px 24px', display: 'flex', gap: '48px', alignItems: 'center', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <span style={{ color: 'var(--purple-accent)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>ISLAND I</span>
        <h3 style={{ margin: '12px 0 16px', fontSize: '2.2rem', color: '#fff', fontFamily: 'var(--font-serif-display)', letterSpacing: '0.02em', textShadow: '0 2px 10px rgba(168, 85, 247, 0.2)' }}>Jungkook Constellation</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          A starry path dedicated to Sonakshi's favorite artist. Hover to light up the rabbit stars, and click the cosmic canvas to trigger music notes and a purple galaxy bloom.
        </p>
        <blockquote className="serif-quote" style={{ borderLeft: '2px solid var(--purple-accent)', paddingLeft: '16px', color: 'var(--purple-accent)', fontStyle: 'italic', fontSize: '1.05rem' }}>
          "The playlist that survived every mood. 💜"
        </blockquote>
        
        {/* Actions Button Group */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>

          <button
            onClick={onEnterJungkookConstellation}
            className="magic-btn interactive"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.3))',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '0.75rem',
              transition: 'all 0.3s ease'
            }}
          >
            Enter The Constellation →
          </button>
        </div>
          
          {canvasClicked && !isPlaying && (
            <p className="animate-fade-in" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tap canvas to spawn galaxy stars & music notes 🐰
            </p>
          )}
        </div>
      <div style={{ position: 'relative', border: '1px solid rgba(229, 204, 255, 0.15)', borderRadius: '12px', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={360}
          height={320}
          onClick={handleCanvasClick}
          className="interactive"
          style={{ display: 'block', background: '#080512', cursor: 'crosshair' }}
        />
      </div>
      </div>
    </div>
  );
};

// ==========================================
// ==========================================
// ISLAND 2: SKATING PARTNER ICE TRAILS
// ==========================================
interface SkatingIslandProps {
  audioCtx: AudioContext | null;
  ambientPlaying: boolean;
  setAmbientPlaying: (playing: boolean) => void;
}

// Drag Path Bridge to End Lyrics Data
const lyricsData = [
  { start: 184.3, end: 188.3, text: "Can you, can you..." },
  { start: 188.3, end: 193.3, text: "Can you, can you?" },
  { start: 193.3, end: 197.3, text: "A drag path etched in the surface" },
  { start: 197.3, end: 202.3, text: "As evidence I left there on purpose" },
  { start: 202.3, end: 207.3, text: "A sad sack laying on the surface" },
  { start: 207.3, end: 212.3, text: "Can you find me?" },
  { start: 212.3, end: 217.3, text: "I dug my heels into the gravel" },
  { start: 217.3, end: 222.3, text: "As evidence for you to unravel" },
  { start: 222.3, end: 227.3, text: "A drag path etched in the surface" },
  { start: 227.3, end: 232.3, text: "Can you find me?" },
  { start: 232.3, end: 237.3, text: "Can you find me? (Can you find me?)" },
  { start: 237.3, end: 242.3, text: "Can you find me? (Can you find me?)" },
  { start: 242.3, end: 252.3, text: "Can you find me?..." },
  { start: 252.3, end: 265.0, text: "❤️ Skating together in every life... ❤️" }
];

const SkatingIsland: React.FC<SkatingIslandProps> = ({ audioCtx, ambientPlaying, setAmbientPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lyricContainerRef = useRef<HTMLDivElement | null>(null);
  const [skatingState, setSkatingState] = useState<'separated' | 'meeting' | 'skating'>('separated');

  const skater1Pos = useRef({ x: 50, y: 160 }); // Me (starts on the left)
  const skater2Pos = useRef({ x: 310, y: 160 }); // Her (starts on the right)
  const mousePos = useRef({ x: 180, y: 160 });
  const isInside = useRef(false);
  const [skatingStarted, setSkatingStarted] = useState(false);

  // Auto skating target for randomized performance pathing (non-looping)
  const autoTarget = useRef({ x: 180, y: 160 });
  const selectNewAutoTarget = () => {
    autoTarget.current = {
      x: Math.random() * 310 + 25, // x bounds on 360 width: 25 to 335
      y: Math.random() * 260 + 30  // y bounds on 320 height: 30 to 290
    };
  };

  // Drag Path Song State
  const [isSkatingActive, setIsSkatingActive] = useState(false);
  const [songProgress, setSongProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasAmbientPlaying = useRef(false);

  // Auto clean up and global stop listener on unmount
  useEffect(() => {
    const handleStopAll = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.origin !== 'skating') {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsSkatingActive(false);
        setSkatingState('separated');
        setSongProgress(0);
      }
    };
    window.addEventListener('stop-all-audio', handleStopAll);
    return () => {
      window.removeEventListener('stop-all-audio', handleStopAll);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startSkatingAudio = () => {
    // Audio is already preloaded by toggleSkatingPlay user click handler!
    const audio = audioRef.current;
    if (!audio) return;

    window.dispatchEvent(new CustomEvent('stop-all-audio', { detail: { origin: 'skating' } }));

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    wasAmbientPlaying.current = ambientPlaying;
    if (ambientPlaying) {
      setAmbientPlaying(false);
    }
    audio.currentTime = 187; // start at bridge
    audio.play().catch(err => {
      console.error('Failed to play skating song:', err);
    });
    setIsSkatingActive(true);
  };

  const toggleSkatingPlay = () => {
    if (isSkatingActive || skatingState === 'meeting') {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsSkatingActive(false);
      setSkatingState('separated');
      setSongProgress(0);
      skater1Pos.current = { x: 50, y: 160 };
      skater2Pos.current = { x: 310, y: 160 };
      if (wasAmbientPlaying.current) {
        setAmbientPlaying(true);
      }
    } else {
      // Warm up / preload the audio element instantly on user click gesture!
      if (!audioRef.current) {
        const audio = new Audio('/drag_path.m4a');
        audio.preload = 'none';

        audio.addEventListener('ended', () => {
          setIsSkatingActive(false);
          setSkatingState('separated');
          setSongProgress(0);
          skater1Pos.current = { x: 50, y: 160 };
          skater2Pos.current = { x: 310, y: 160 };
          if (wasAmbientPlaying.current) {
            setAmbientPlaying(true);
          }
        });

        audio.addEventListener('timeupdate', () => {
          const duration = audio.duration || 265.31;
          const start = 187; // Bridge starts around 3:07 (187 seconds)
          const current = audio.currentTime;

          // Update song progress
          if (current < start) {
            setSongProgress(0);
          } else {
            const progress = ((current - start) / (duration - start)) * 100;
            setSongProgress(Math.min(100, Math.max(0, progress)));
          }
        });

        audioRef.current = audio;
      }

      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      setSkatingState('meeting');
    }
  };
  const accumulatedDistance = useRef(0);
  const songIndex = useRef(0);
  const songNotes = [
    349.23, // F4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    440.00, // A4
    523.25, // C5
    587.33, // D5
    698.46, // F5
    587.33, // D5
    523.25, // C5
    440.00, // A4
    392.00, // G4
    349.23, // F4
    293.66, // D4
    349.23, // F4
    392.00  // G4
  ];

  interface SkaterTrail {
    x: number;
    y: number;
    alpha: number;
    type: 'ice' | 'petal' | 'ripple' | 'heart';
    angle?: number;
    size: number;
    color?: string;
  }

  const trailsRef = useRef<SkaterTrail[]>([]);

  // Synthesize soft bell note on dragging
  const playDragPathNote = (freq: number) => {
    const ctx = audioCtx;
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.12, ctx.currentTime); // Soft background volume
      master.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.5, ctx.currentTime); // fifth overtone

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, ctx.currentTime);

      // Ambient echo delay
      const delay = ctx.createDelay();
      delay.delayTime.setValueAtTime(0.3, ctx.currentTime);
      const feedback = ctx.createGain();
      feedback.gain.setValueAtTime(0.25, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      // Feed delay loop
      gain.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(master);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.3);
      osc2.stop(ctx.currentTime + 1.3);
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ice background color
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Frozen crystal shine
      ctx.strokeStyle = 'rgba(208, 240, 255, 0.08)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 50, canvas.height);
        ctx.stroke();
      }

      // 1. Move Skater 1 and Skater 2 target calculations
      let targetX1 = mousePos.current.x;
      let targetY1 = mousePos.current.y;
      let targetX2 = mousePos.current.x + 35;
      let targetY2 = mousePos.current.y + 10;

      const userGuiding = isInside.current;

      if (userGuiding) {
        // If the user starts guiding manually, force transition to skating phase
        if (skatingState !== 'skating') {
          setSkatingState('skating');
          if (!skatingStarted) {
            setSkatingStarted(true);
          }
        }
      }

      if (skatingState === 'separated' && !userGuiding) {
        // Skater 1 gentle drift on left
        const timeVal = Date.now() * 0.0015;
        targetX1 = 60 + Math.sin(timeVal) * 15;
        targetY1 = 160 + Math.cos(timeVal) * 10;

        // Skater 2 gentle drift on right
        targetX2 = 300 + Math.cos(timeVal) * 15;
        targetY2 = 160 + Math.sin(timeVal) * 10;
      } 
      else if (skatingState === 'meeting' && !userGuiding) {
        // Both glide to center meeting point
        targetX1 = 175;
        targetY1 = 160;
        targetX2 = 185;
        targetY2 = 160;

        if (!skatingStarted) {
          setSkatingStarted(true);
        }

        // Check if close enough to trigger meeting
        const meetDist = Math.hypot(skater1Pos.current.x - skater2Pos.current.x, skater1Pos.current.y - skater2Pos.current.y);
        if (meetDist < 20) {
          setSkatingState('skating');
          startSkatingAudio();

          // Spawn burst of stardust & hearts
          for (let k = 0; k < 25; k++) {
            trailsRef.current.push({
              x: 180 + (Math.random() - 0.5) * 20,
              y: 160 + (Math.random() - 0.5) * 20,
              alpha: 1.0,
              type: 'heart',
              size: Math.random() * 5 + 4
            });
            trailsRef.current.push({
              x: 180 + (Math.random() - 0.5) * 20,
              y: 160 + (Math.random() - 0.5) * 20,
              alpha: 1.0,
              type: 'petal',
              angle: Math.random() * Math.PI * 2,
              size: Math.random() * 4 + 3.5,
              color: '#f2e3c6'
            });
          }
        }
      } 
      else if (skatingState === 'skating' && !userGuiding) {
        // Automatic skating (using randomized target steering instead of repeating loop)
        targetX1 = autoTarget.current.x;
        targetY1 = autoTarget.current.y;

        // Check if skater 1 is close to autoTarget.current
        const distToTarget = Math.hypot(skater1Pos.current.x - autoTarget.current.x, skater1Pos.current.y - autoTarget.current.y);
        if (distToTarget < 35) {
          selectNewAutoTarget();
        }

        if (!skatingStarted) {
          setSkatingStarted(true);
        }
      }

      // Compute actual deltas and glide skater 1
      const dx1 = targetX1 - skater1Pos.current.x;
      const dy1 = targetY1 - skater1Pos.current.y;
      const dist1 = Math.hypot(dx1, dy1);

      if (dist1 > 0.5) {
        skater1Pos.current.x += dx1 * 0.06;
        skater1Pos.current.y += dy1 * 0.06;

        // Sound trigger based on distance path dragged (only when not auto-skating show)
        if (!isSkatingActive && skatingState === 'skating') {
          accumulatedDistance.current += dist1 * 0.06;
          if (accumulatedDistance.current > 55) {
            playDragPathNote(songNotes[songIndex.current]);
            songIndex.current = (songIndex.current + 1) % songNotes.length;
            accumulatedDistance.current = 0;
          }
        }

        // Leave ice trails for Skater 1 (crystal blue)
        if (Math.random() < (isSkatingActive ? 0.18 : 0.12)) {
          trailsRef.current.push({
            x: skater1Pos.current.x,
            y: skater1Pos.current.y,
            alpha: 1.0,
            type: 'ice',
            size: Math.random() * (isSkatingActive ? 3.5 : 2) + 1,
            color: 'rgba(208, 240, 255, 1)'
          });
        }
      }

      // Compute actual deltas and glide skater 2
      let dx2 = 0;
      let dy2 = 0;

      if ((skatingState === 'separated' || skatingState === 'meeting') && !userGuiding) {
        dx2 = targetX2 - skater2Pos.current.x;
        dy2 = targetY2 - skater2Pos.current.y;
      } else {
        // Skater 2 follows Skater 1 in coordination
        const angle = Math.atan2(skater1Pos.current.y - skater2Pos.current.y, skater1Pos.current.x - skater2Pos.current.x);
        const targetX2_follow = skater1Pos.current.x - Math.cos(angle) * 45 + Math.sin(angle) * 25;
        const targetY2_follow = skater1Pos.current.y - Math.sin(angle) * 45 - Math.cos(angle) * 25;
        dx2 = targetX2_follow - skater2Pos.current.x;
        dy2 = targetY2_follow - skater2Pos.current.y;
      }

      const dist2 = Math.hypot(dx2, dy2);
      const isMoving = dist1 > 1 || dist2 > 1;

      if (dist2 > 0.5) {
        skater2Pos.current.x += dx2 * 0.05;
        skater2Pos.current.y += dy2 * 0.05;

        // Leave ice trails for Skater 2 (rose pink)
        if (Math.random() < (isSkatingActive ? 0.18 : 0.12)) {
          trailsRef.current.push({
            x: skater2Pos.current.x,
            y: skater2Pos.current.y,
            alpha: 1.0,
            type: 'ice',
            size: Math.random() * (isSkatingActive ? 3.5 : 2) + 1,
            color: 'rgba(253, 164, 175, 1)' // rose pink
          });
        }
      }

      // Leave sparkling lily petals between them
      if (isMoving && Math.random() < (isSkatingActive ? 0.08 : 0.03)) {
        trailsRef.current.push({
          x: (skater1Pos.current.x + skater2Pos.current.x) / 2,
          y: (skater1Pos.current.y + skater2Pos.current.y) / 2,
          alpha: 0.85,
          type: 'petal',
          angle: Math.random() * Math.PI * 2,
          size: Math.random() * (isSkatingActive ? 6 : 4) + 3.5,
        });
      }

      // Leave heart sparkles between them when moving
      if (isMoving && Math.random() < (isSkatingActive ? 0.06 : 0.02)) {
        trailsRef.current.push({
          x: (skater1Pos.current.x + skater2Pos.current.x) / 2 + (Math.random() - 0.5) * 30,
          y: (skater1Pos.current.y + skater2Pos.current.y) / 2 + (Math.random() - 0.5) * 20,
          alpha: 1.0,
          type: 'heart',
          size: Math.random() * 4 + 4.5
        });
      }

      // Leave expanding ice ripples when moving
      if (isMoving && Math.random() < (isSkatingActive ? 0.015 : 0.005)) {
        trailsRef.current.push({
          x: skater1Pos.current.x,
          y: skater1Pos.current.y,
          alpha: 1.0,
          type: 'ripple',
          size: 4
        });
        trailsRef.current.push({
          x: skater2Pos.current.x,
          y: skater2Pos.current.y,
          alpha: 1.0,
          type: 'ripple',
          size: 4
        });
      }

      // Add extra stardust sparkles during active performance
      if (isSkatingActive && Math.random() < 0.08) {
        trailsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          alpha: 1.0,
          type: 'petal',
          angle: Math.random() * Math.PI * 2,
          size: Math.random() * 2 + 1.5,
          color: `rgba(242, 227, 198, ${Math.random() * 0.5 + 0.4})` // golden spark
        });
      }

      // Update & Draw Trails
      const trails = trailsRef.current;
      for (let i = trails.length - 1; i >= 0; i--) {
        const t = trails[i];
        
        if (t.type === 'ice') {
          t.alpha -= 0.06;
        } else if (t.type === 'ripple') {
          t.alpha -= 0.09;
          t.size += 1.8;
        } else if (t.type === 'heart') {
          t.alpha -= 0.06;
          t.y -= 1.0; // float up
        } else {
          t.alpha -= 0.06;
        }

        if (t.alpha <= 0) {
          trails.splice(i, 1);
          continue;
        }

        if (t.type === 'ice') {
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
          const rgb = t.color || 'rgba(208, 240, 255, 1)';
          ctx.fillStyle = rgb.replace('1)', `${t.alpha})`);
          ctx.shadowColor = rgb.replace('1)', '0.5)');
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (t.type === 'ripple') {
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(208, 240, 255, ${t.alpha * 0.45})`;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = 'rgba(208, 240, 255, 0.3)';
          ctx.shadowBlur = 6;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (t.type === 'heart') {
          ctx.save();
          ctx.translate(t.x, t.y);
          ctx.scale(t.size / 10, t.size / 10);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-5, -5, -5, 5, 0, 8);
          ctx.bezierCurveTo(5, 5, 5, -5, 0, 0);
          ctx.fillStyle = `rgba(244, 63, 94, ${t.alpha})`;
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.restore();
        } else {
          // Petal/Sparkle trail
          ctx.save();
          ctx.translate(t.x, t.y);
          ctx.rotate(t.angle || 0);
          ctx.beginPath();
          ctx.moveTo(0, -t.size);
          ctx.quadraticCurveTo(t.size * 0.6, 0, 0, t.size);
          ctx.quadraticCurveTo(-t.size * 0.6, 0, 0, -t.size);
          ctx.closePath();
          ctx.fillStyle = t.color || `rgba(252, 251, 250, ${t.alpha})`;
          ctx.shadowColor = t.color || 'rgba(220, 225, 255, 0.4)';
          ctx.shadowBlur = 5;
          ctx.fill();
          ctx.restore();
        }
      }

      // 3. Draw Connecting Red String of Fate (holding hands)
      let h1x = skater1Pos.current.x;
      let h2x = skater2Pos.current.x;

      if (skatingState === 'separated') {
        h1x += 16; // facing right towards Her
        h2x -= 12; // facing left towards Me
      } else {
        h1x += (dx1 < 0 ? -16 : 16);
        h2x += (dx1 < 0 ? -12 : 12);
      }

      const h1y = skater1Pos.current.y - 16;
      const h2y = skater2Pos.current.y - 10;

      ctx.beginPath();
      if (skatingState === 'separated') {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)'; // Faint, sagged string when separated
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 0;
        ctx.moveTo(h1x, h1y);
        const midX = (h1x + h2x) / 2;
        const midY = (h1y + h2y) / 2 + 35; // hang low
        ctx.quadraticCurveTo(midX, midY, h2x, h2y);
      } else {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.95)'; // Red String of Fate
        ctx.lineWidth = isSkatingActive ? 3.5 : 2.0;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = isSkatingActive ? (12 + Math.sin(Date.now() * 0.01) * 4) : 8;
        ctx.moveTo(h1x, h1y);
        const midX = (h1x + h2x) / 2;
        const midY = (h1y + h2y) / 2 + (skatingState === 'meeting' ? 15 : 7); // curves depending on distance
        ctx.quadraticCurveTo(midX, midY, h2x, h2y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Draw Skater 1 Silhouette (Me - Crystal blue glide)
      const sx1 = skater1Pos.current.x;
      const sy1 = skater1Pos.current.y;

      ctx.save();
      ctx.translate(sx1, sy1);
      if (dx1 < 0) ctx.scale(-1, 1);

      ctx.beginPath();
      ctx.arc(0, -22, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#d0f0ff';
      ctx.shadowColor = '#d0f0ff';
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = '#d0f0ff';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(0, -17);
      ctx.lineTo(0, -6);
      ctx.lineTo(-12, 5);
      ctx.lineTo(-18, 4);
      ctx.moveTo(0, -6);
      ctx.lineTo(2, 4);
      ctx.lineTo(0, 12);
      ctx.moveTo(0, -14);
      ctx.lineTo(16, -16);
      ctx.moveTo(0, -14);
      ctx.lineTo(-8, -19);
      ctx.stroke();

      // DRAW SKATES (standing boot & blade)
      ctx.beginPath();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.moveTo(0, 12);
      ctx.lineTo(3, 12); // boot
      ctx.moveTo(-2, 13);
      ctx.lineTo(5, 13); // blade

      // raised foot skate
      ctx.moveTo(-18, 4);
      ctx.lineTo(-21, 6); // boot
      ctx.moveTo(-22, 7);
      ctx.lineTo(-17, 5); // blade
      ctx.stroke();

      ctx.restore();

      // 5. Draw Skater 2 Silhouette (Her - Rose pink spiral)
      const sx2 = skater2Pos.current.x;
      const sy2 = skater2Pos.current.y;

      ctx.save();
      ctx.translate(sx2, sy2);
      if (dx1 < 0) ctx.scale(-1, 1);

      ctx.beginPath();
      ctx.arc(0, -20, 4.0, 0, Math.PI * 2);
      ctx.fillStyle = '#fda4af';
      ctx.shadowColor = '#fda4af';
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 3.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(0, -16);
      ctx.lineTo(0, -6);
      ctx.lineTo(-14, -4); // Arched back leg raised high
      ctx.lineTo(-20, -8);
      ctx.moveTo(0, -6);
      ctx.lineTo(2, 6);
      ctx.lineTo(0, 14);
      ctx.moveTo(0, -13);
      ctx.lineTo(12, -10);
      ctx.moveTo(0, -13);
      ctx.lineTo(-10, -15);
      ctx.stroke();

      // DRAW SKATES (standing boot & blade)
      ctx.beginPath();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.moveTo(0, 14);
      ctx.lineTo(3, 14); // boot
      ctx.moveTo(-2, 15);
      ctx.lineTo(5, 15); // blade

      // raised foot skate
      ctx.moveTo(-20, -8);
      ctx.lineTo(-23, -11); // boot
      ctx.moveTo(-24, -12);
      ctx.lineTo(-19, -9); // blade
      ctx.stroke();

      ctx.restore();

      // 6. Update Lyrics overlay text in real-time at 60fps
      if (lyricContainerRef.current) {
        if (isSkatingActive && audioRef.current) {
          const current = audioRef.current.currentTime;
          const active = lyricsData.find(item => current >= item.start && current < item.end);
          if (active && active.text) {
            if (lyricContainerRef.current.textContent !== active.text) {
              lyricContainerRef.current.textContent = active.text;
            }
            lyricContainerRef.current.style.display = 'block';
          } else {
            lyricContainerRef.current.style.display = 'none';
            lyricContainerRef.current.textContent = '';
          }
        } else {
          lyricContainerRef.current.style.display = 'none';
          lyricContainerRef.current.textContent = '';
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [skatingState, isSkatingActive, ambientPlaying]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (!skatingStarted) {
      setSkatingStarted(true);
    }
  };

  const handleMouseEnter = () => {
    isInside.current = true;
  };

  const handleMouseLeave = () => {
    isInside.current = false;
  };



  return (
    <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.5), rgba(8, 12, 24, 0.8))', borderTop: '1px solid rgba(208, 240, 255, 0.15)', borderBottom: '1px solid rgba(208, 240, 255, 0.15)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      <div className="responsive-island-content" style={{ padding: '48px 24px', display: 'flex', gap: '48px', alignItems: 'center', width: '100%', maxWidth: '900px', margin: '0 auto', flexDirection: 'row-reverse' }}>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <span style={{ color: 'var(--crystal-blue)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>ISLAND II</span>
        <h3 style={{ margin: '12px 0 16px', fontSize: '2.2rem', color: '#fff', fontFamily: 'var(--font-serif-display)', letterSpacing: '0.02em', textShadow: '0 2px 10px rgba(208, 240, 255, 0.2)' }}>Partner Skating Crystal Lake</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Move your cursor over the frozen lake. Watch as you and Sonakshi skate hand-in-hand, connected by the red string of fate. Drag your path to play the soundtrack of your journey.
        </p>
        <blockquote className="serif-quote" style={{ borderLeft: '2px solid var(--crystal-blue)', paddingLeft: '16px', color: 'var(--crystal-blue)', fontStyle: 'italic', fontSize: '1.05rem' }}>
          "Two paths, holding hands, tracing stardust on the crystal lake."
        </blockquote>

        {/* Start Skating Button & Progress Overlay */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            onClick={toggleSkatingPlay}
            className="magic-btn interactive"
            style={{
              alignSelf: 'flex-start',
              background: isSkatingActive || skatingState === 'meeting'
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(253, 164, 175, 0.2))'
                : 'linear-gradient(135deg, rgba(208, 240, 255, 0.15), rgba(253, 164, 175, 0.15))',
              border: isSkatingActive || skatingState === 'meeting'
                ? '1px solid rgba(253, 164, 175, 0.5)'
                : '1px solid rgba(208, 240, 255, 0.4)',
              boxShadow: isSkatingActive || skatingState === 'meeting'
                ? '0 0 15px rgba(253, 164, 175, 0.3)'
                : 'var(--glass-shadow)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '0.75rem'
            }}
          >
            {skatingState === 'meeting' ? (
              <>
                <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f2e3c6', display: 'inline-block' }} />
                Meeting... 🌸
              </>
            ) : isSkatingActive ? (
              <>
                <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fda4af', display: 'inline-block' }} />
                Stop Skating
              </>
            ) : (
              'Start Skating ⛸️'
            )}
          </button>

          {(isSkatingActive || skatingState === 'meeting') && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#fda4af' }}>
                <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-serif-text)' }}>
                  {skatingState === 'meeting' ? "Approaching each other..." : "Playing: Drag Path..."}
                </span>
                <span>{Math.round(songProgress)}%</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${songProgress}%`, height: '100%', background: 'linear-gradient(to right, #d0f0ff, #fda4af)', transition: 'width 0.2s linear' }} />
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ position: 'relative', border: '1px solid rgba(208, 240, 255, 0.25)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        {/* Cute Message overlay */}
        {(skatingStarted || isSkatingActive) && (
          <div
            className="animate-fade-in"
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              color: '#ffe4e6',
              backdropFilter: 'blur(8px)',
              zIndex: 5,
              pointerEvents: 'none',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              fontFamily: 'var(--font-serif-text)',
              fontStyle: 'italic'
            }}
          >
            "We would be skating together in every life... ❤️"
          </div>
        )}

        {/* Dynamic Lyrics Overlay */}
        {(isSkatingActive || skatingState === 'meeting') && (
          <div
            ref={lyricContainerRef}
            className="animate-fade-in-up"
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              width: 'calc(100% - 32px)',
              boxSizing: 'border-box',
              background: 'rgba(10, 15, 30, 0.82)',
              border: '1px solid rgba(208, 240, 255, 0.25)',
              padding: '10px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              color: 'var(--crystal-blue)',
              backdropFilter: 'blur(10px)',
              zIndex: 10,
              pointerEvents: 'none',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
              fontFamily: 'var(--font-serif-text)',
              fontStyle: 'italic',
              textShadow: '0 0 8px rgba(208, 240, 255, 0.5)',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              animation: 'pulse-slow 2s infinite ease-in-out',
              display: 'none'
            }}
          />
        )}

        <canvas
          ref={canvasRef}
          width={360}
          height={320}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="interactive"
          style={{ display: 'block', background: '#0a0f1d', cursor: 'none' }}
        />
      </div>
      </div>
    </div>
  );
};

// Typing animation helper component for goal celebration overlay
interface TypingTextProps {
  text: string;
  delay: number;
  speed?: number;
  style?: React.CSSProperties;
}

const TypingText: React.FC<TypingTextProps> = ({ text, delay, speed = 50, style }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let timeoutId: any;
    let index = 0;

    const startTyping = () => {
      const type = () => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
          timeoutId = setTimeout(type, speed);
        }
      };
      type();
    };

    timeoutId = setTimeout(startTyping, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [text, delay, speed]);

  return <div style={style}>{displayedText}</div>;
};

// ==========================================
// ISLAND 3: BASKETBALL PHYSICS
// ==========================================
interface BasketballIslandProps {
  audioCtx: AudioContext | null;
  ambientPlaying: boolean;
  setAmbientPlaying: (playing: boolean) => void;
}

const BasketballIsland: React.FC<BasketballIslandProps> = ({ audioCtx, ambientPlaying, setAmbientPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [showGoalText, setShowGoalText] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 180, y: 160 });
  const [isHovering, setIsHovering] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<any | null>(null);
  const wasAmbientPlaying = useRef<boolean>(false);

  interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    bounceCount: number;
    color: string;
    scored: boolean;
  }

  interface GoalParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
  }

  const ballsRef = useRef<Ball[]>([]);
  const goalParticlesRef = useRef<GoalParticle[]>([]);
  const goalTimeoutRef = useRef<any | null>(null);
  const onGoalScoredRef = useRef<(() => void) | null>(null);

  // Sync the latest goal handler to avoid stale closures in animate
  onGoalScoredRef.current = () => {
    setScore(s => {
      const newScore = s >= 3 ? 1 : s + 1;
      
      // Goal celebration triggers ONLY at the 3rd goal milestone
      if (newScore === 3) {
        setIsFadingOut(false);
        setShowGoalText(true);

        const audio = audioRef.current;
        if (audio) {
          window.dispatchEvent(new CustomEvent('stop-all-audio', { detail: { origin: 'basketball' } }));

          if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
          }

          wasAmbientPlaying.current = ambientPlaying;
          if (ambientPlaying) {
            setAmbientPlaying(false);
          }

          audio.volume = 1.0;
          audio.currentTime = 14; // Start at the main riff drop (~14s)
          audio.play().catch(err => {
            console.error('Failed to play Killswitch Lullaby:', err);
          });
        }

        if (goalTimeoutRef.current) {
          clearTimeout(goalTimeoutRef.current);
        }
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
        }

        // Show celebration for 16.5 seconds, then initiate fade out
        goalTimeoutRef.current = setTimeout(() => {
          setIsFadingOut(true);
          
          let vol = 1.0;
          fadeIntervalRef.current = setInterval(() => {
            vol -= 0.05;
            if (vol <= 0) {
              vol = 0;
              clearInterval(fadeIntervalRef.current);
              if (audioRef.current) {
                audioRef.current.pause();
              }
              setShowGoalText(false);
              setIsFadingOut(false);
              setScore(0);
              if (wasAmbientPlaying.current) {
                setAmbientPlaying(true);
              }
            } else {
              if (audioRef.current) {
                audioRef.current.volume = vol;
              }
            }
          }, 75); // fades out audio smoothly over ~1.5s
        }, 16500);
      }
      
      return newScore;
    });
  };

  useEffect(() => {
    // Preload audio removed for optimization
    const audio = new Audio('/killswitch_lullaby.webm');
    audio.preload = 'none';
    audio.addEventListener('ended', () => {
      setShowGoalText(false);
      setIsFadingOut(false);
      if (wasAmbientPlaying.current) {
        setAmbientPlaying(true);
      }
    });
    audioRef.current = audio;

    const handleStopAll = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.origin !== 'basketball') {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setShowGoalText(false);
        setIsFadingOut(false);
      }
    };
    window.addEventListener('stop-all-audio', handleStopAll);

    return () => {
      window.removeEventListener('stop-all-audio', handleStopAll);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (goalTimeoutRef.current) {
        clearTimeout(goalTimeoutRef.current);
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const handleShootBall = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Do not shoot if clicking below launcher
    if (clickY >= 300) return;

    const dx = clickX - 180;
    const dy = clickY - 310;

    // Shoot from bottom launcher center towards the click position
    ballsRef.current.push({
      x: 180,
      y: 310,
      vx: dx * 0.038,
      vy: dy * 0.038,
      radius: 9.5, // slightly smaller ball size for clean swishes
      bounceCount: 0,
      color: '#f97316',
      scored: false
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const gravity = 0.23;
    const elasticity = 0.72;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dusk background
      ctx.fillStyle = '#131024';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Court lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(180, 320, 80, Math.PI, 0); // key circle
      ctx.stroke();

      // 1. Draw Basketball Backboard
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 3;
      ctx.strokeRect(120, 20, 120, 80);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(120, 20, 120, 80);
      
      // Inner square above rim
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(155, 55, 50, 30);

      // Support metal
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(180, 80);
      ctx.lineTo(180, 95);
      ctx.stroke();

      // 2. Draw Net (hanging crossed grid)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      
      const netTopY = 80;
      const netBotY = 115;
      const netLeftX1 = 156;
      const netRightX1 = 204;
      const netLeftX2 = 168;
      const netRightX2 = 192;
      
      // Vertical net grid lines
      for (let j = 0; j <= 6; j++) {
        const ratio = j / 6;
        const xTop = netLeftX1 + (netRightX1 - netLeftX1) * ratio;
        const xBot = netLeftX2 + (netRightX2 - netLeftX2) * ratio;
        ctx.beginPath();
        ctx.moveTo(xTop, netTopY);
        ctx.lineTo(xBot, netBotY);
        ctx.stroke();
      }
      // Horizontal net rings
      for (let j = 1; j <= 3; j++) {
        const ratio = j / 3;
        const curY = netTopY + (netBotY - netTopY) * ratio;
        const xL = netLeftX1 + (netLeftX2 - netLeftX1) * ratio;
        const xR = netRightX1 + (netRightX2 - netRightX1) * ratio;
        ctx.beginPath();
        ctx.moveTo(xL, curY);
        ctx.lineTo(xR, curY);
        ctx.stroke();
      }

      // 3. Draw Rim (glowing orange ellipse)
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(180, 80, 24, 6, 0, 0, Math.PI * 2);
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset glow

      // 4. Draw Ball Launcher pad at bottom center
      ctx.beginPath();
      ctx.arc(180, 318, 16, Math.PI, 0); 
      ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Launcher ball preview
      ctx.beginPath();
      ctx.arc(180, 310, 9.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(249, 115, 22, 0.7)';
      ctx.fill();

      // 5. Draw Dotted Aiming Guide Line
      if (isHovering && mousePos.y < 300) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 6]);
        ctx.moveTo(180, 310);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.restore();
      }

      // Update & Draw Balls
      const balls = ballsRef.current;
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        
        // Capture position before physics update
        const oldX = b.x;
        const oldY = b.y;
        
        // Physics update
        b.vy += gravity;
        b.x += b.vx;
        b.y += b.vy;

        // Rim Point Collisions (points 156, 80 and 204, 80)
        const distLeft = Math.hypot(b.x - 156, b.y - 80);
        const distRight = Math.hypot(b.x - 204, b.y - 80);
        const colRadius = b.radius + 1.5;
        
        if (distLeft < colRadius) {
          const nx = (b.x - 156) / distLeft;
          const ny = (b.y - 80) / distLeft;
          const dot = b.vx * nx + b.vy * ny;
          b.vx = (b.vx - 2 * dot * nx) * 0.55;
          b.vy = (b.vy - 2 * dot * ny) * 0.55;
          b.x = 156 + nx * colRadius;
          b.y = 80 + ny * colRadius;
        } else if (distRight < colRadius) {
          const nx = (b.x - 204) / distRight;
          const ny = (b.y - 80) / distRight;
          const dot = b.vx * nx + b.vy * ny;
          b.vx = (b.vx - 2 * dot * nx) * 0.55;
          b.vy = (b.vy - 2 * dot * ny) * 0.55;
          b.x = 204 + nx * colRadius;
          b.y = 80 + ny * colRadius;
        }

        // Backboard bounce collision (only bounce when heading towards/rising against the board)
        if (b.y >= 20 && b.y <= 76 && b.x >= 120 && b.x <= 240) {
          if (b.vy < 0) {
            b.vy = -b.vy * 0.6; // bounce downwards
            b.y = 76 + b.radius;
          }
        }

        // Continuous Collision Detection for goal scoring (crossing y = 80 downwards)
        if (!b.scored && b.vy > 0 && oldY < 80 && b.y >= 80) {
          const ratio = (80 - oldY) / (b.y - oldY);
          const intersectX = oldX + (b.x - oldX) * ratio;
          
          if (intersectX >= 156 && intersectX <= 204) {
            b.scored = true;
            b.vx *= 0.35; // slow down in net
            b.vy *= 0.35;
            
            if (onGoalScoredRef.current) {
              onGoalScoredRef.current();
            }

            // Spawn stardust celebration particles
            for (let k = 0; k < 25; k++) {
              goalParticlesRef.current.push({
                x: intersectX,
                y: 85,
                vx: (Math.random() - 0.5) * 5,
                vy: Math.random() * 4 + 1.5,
                size: Math.random() * 3 + 2,
                color: k % 2 === 0 ? '#fbbf24' : '#f97316',
                alpha: 1.0
              });
            }
          }
        }

        // Apply continuous drag while the ball is inside the net boundaries
        if (b.scored && b.y >= 80 && b.y <= 115 && b.x >= 156 && b.x <= 204) {
          b.vx *= 0.85;
          b.vy *= 0.85;
        }

        // Wall collisions
        if (b.x - b.radius < 0) {
          b.x = b.radius;
          b.vx = -b.vx * elasticity;
        } else if (b.x + b.radius > canvas.width) {
          b.x = canvas.width - b.radius;
          b.vx = -b.vx * elasticity;
        }

        // Floor collision
        if (b.y + b.radius > canvas.height) {
          b.y = canvas.height - b.radius;
          b.vy = -b.vy * elasticity;
          b.bounceCount += 1;
        }

        // Delete rolled/stuck/decayed balls
        if (b.bounceCount > 6 || (Math.abs(b.vy) < 0.25 && b.y + b.radius >= canvas.height - 1)) {
          balls.splice(i, 1);
          continue;
        }

        // Draw Ball
        ctx.save();
        ctx.translate(b.x, b.y);

        // Core Glow
        ctx.beginPath();
        ctx.arc(0, 0, b.radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(249, 115, 22, 0.18)';
        ctx.fill();

        // Ball body
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#fdba74';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Basketball lines
        ctx.strokeStyle = '#311100';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-b.radius, 0);
        ctx.lineTo(b.radius, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -b.radius);
        ctx.lineTo(0, b.radius);
        ctx.stroke();

        ctx.restore();
      }

      // Update & Draw Goal Celebration Particles
      const goalParticles = goalParticlesRef.current;
      for (let i = goalParticles.length - 1; i >= 0; i--) {
        const gp = goalParticles[i];
        gp.x += gp.vx;
        gp.y += gp.vy;
        gp.alpha -= 0.025;
        
        if (gp.alpha <= 0) {
          goalParticles.splice(i, 1);
          continue;
        }
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(gp.x, gp.y, gp.size, 0, Math.PI * 2);
        ctx.fillStyle = gp.color;
        ctx.globalAlpha = gp.alpha;
        ctx.shadowColor = gp.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isHovering, mousePos]);

  return (
    <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', background: 'linear-gradient(145deg, rgba(30, 20, 45, 0.5), rgba(15, 10, 25, 0.8))', borderTop: '1px solid rgba(249, 115, 22, 0.15)', borderBottom: '1px solid rgba(249, 115, 22, 0.15)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      <div className="responsive-island-content" style={{ padding: '48px 24px', display: 'flex', gap: '48px', alignItems: 'center', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      {showGoalText && createPortal(
        <div
          key={`goal-overlay-${score}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(8, 7, 18, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9990, // below custom cursor
            pointerEvents: 'none',
            animation: isFadingOut
              ? 'fade-out 0.8s ease-in forwards'
              : 'fade-in 0.8s ease-out forwards'
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(20, 15, 35, 0.95), rgba(10, 5, 20, 0.98))',
              border: '2px solid #f97316',
              padding: '36px 48px',
              borderRadius: '24px',
              textAlign: 'center',
              boxShadow: '0 0 50px rgba(249, 115, 22, 0.6)',
              maxWidth: '600px',
              width: '90%',
              animation: isFadingOut
                ? 'fade-out-down 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                : 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, pulse-slow 2s infinite ease-in-out 0.8s'
            }}
          >
            <TypingText
              text="That's the basketball champion we all know"
              delay={400}
              speed={85}
              style={{
                fontFamily: 'var(--font-serif-display)',
                fontWeight: 800,
                fontSize: '2.0rem',
                color: '#fff',
                textShadow: '0 0 15px rgba(249, 115, 22, 0.6), 0 0 30px rgba(249, 115, 22, 0.3)',
                marginBottom: '16px',
                letterSpacing: '0.08em',
                lineHeight: '1.4',
                textTransform: 'uppercase',
                textAlign: 'center',
                width: '100%',
                minHeight: '80px'
              }}
            />
            <TypingText
              text="it's NOT TOOO LATE, Sonakshi!"
              delay={4200}
              speed={95}
              style={{
                fontFamily: 'var(--font-serif-text)',
                fontSize: '1.65rem',
                color: '#fbbf24',
                fontWeight: 700,
                fontStyle: 'italic',
                textShadow: '0 0 20px rgba(251, 191, 36, 0.8), 0 0 35px rgba(249, 115, 22, 0.4)',
                textAlign: 'center',
                width: '100%',
                minHeight: '50px'
              }}
            />
          </div>
        </div>,
        document.body
      )}

      <div style={{ flex: 1, textAlign: 'left' }}>
        <span style={{ color: '#f97316', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>ISLAND III</span>
        <h3 style={{ margin: '12px 0 16px', fontSize: '2.2rem', color: '#fff', fontFamily: 'var(--font-serif-display)', letterSpacing: '0.02em', textShadow: '0 2px 10px rgba(249, 115, 22, 0.2)' }}>Magical Hoop Dusk</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Aim with your cursor and click to shoot glowing basketballs from the launch pad. Make the shot into the net to trigger a celebration!
        </p>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
          <div style={{
            background: 'rgba(249, 115, 22, 0.12)',
            border: '1px solid rgba(249, 115, 22, 0.35)',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#fdba74'
          }}>
            Goals Scored: {score} 🏀
          </div>
          {score >= 3 && (
            <button
              onClick={() => {
                setScore(0);
                if (audioRef.current) {
                  audioRef.current.pause();
                }
                setShowGoalText(false);
                setIsFadingOut(false);
                if (wasAmbientPlaying.current) {
                  setAmbientPlaying(true);
                }
              }}
              className="interactive"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--text-secondary)',
                fontSize: '0.7rem',
                padding: '6px 12px',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>
      
      <div style={{ position: 'relative', border: '1px solid rgba(249, 115, 22, 0.25)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <canvas
          ref={canvasRef}
          width={360}
          height={320}
          onClick={handleShootBall}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="interactive"
          style={{ display: 'block', background: '#131024', cursor: 'crosshair' }}
        />
      </div>
      </div>
    </div>
  );
};

// ==========================================
// ISLAND 4: MAGICAL WATERMELON
// ==========================================
interface WatermelonIslandProps {
  ambientPlaying: boolean;
  setAmbientPlaying: (playing: boolean) => void;
}

const WatermelonIsland: React.FC<WatermelonIslandProps> = ({ ambientPlaying, setAmbientPlaying }) => {
  const [isAwakened, setIsAwakened] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeIntervalRef = useRef<any | null>(null);
  
  const handleAwaken = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    if (isAwakened) {
      setIsAwakened(false);
      if (audioRef.current) {
        let vol = audioRef.current.volume;
        fadeIntervalRef.current = setInterval(() => {
          if (vol > 0.05) {
            vol -= 0.05;
            if (audioRef.current) audioRef.current.volume = vol;
          } else {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.volume = 0;
            }
          }
        }, 150);
      }
      return;
    }
    setIsAwakened(true);
    
    // Stop ambient if it's playing
    if (ambientPlaying) {
      setAmbientPlaying(false);
    }
    
    // Play the song
    if (audioRef.current) {
      audioRef.current.volume = 0;
      audioRef.current.play().then(() => {
        // Fade in
        let vol = 0;
        fadeIntervalRef.current = setInterval(() => {
          if (vol < 0.8) {
            vol += 0.05;
            if (audioRef.current) audioRef.current.volume = vol;
          } else {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          }
        }, 150);
      }).catch(e => console.log('Audio play failed:', e));
    }
  };
  
  // Create sparks for the click
  const [sparks, setSparks] = useState<{id: number, left: string, top: string, anim: string, tx: string, ty: string}[]>([]);
  useEffect(() => {
    if (isAwakened) {
      const newSparks = [...Array(40)].map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 200;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        return {
          id: i,
          left: '50%',
          top: '50%',
          anim: `spark-burst-${i} 1.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
          tx: `${tx}px`,
          ty: `${ty}px`
        };
      });
      setSparks(newSparks);
    }
  }, [isAwakened]);


  return (
    <div className={`watermelon-container ${isAwakened ? 'island-awakened' : ''}`} style={{ padding: '60px 20px', width: '100%' }}>
      
      {/* Invisible Audio Element */}
      <audio ref={audioRef} src="/Shining.mp3" loop />
      
      {/* Flashback Video */}
      {isAwakened && (
        <video 
          src="/music/videoplayback.mp4" 
          autoPlay 
          muted 
          loop 
          playsInline
          className="watermelon-flashback-video"
        />
      )}
      
      <style>
        {`
          ${sparks.map(s => `
            @keyframes ${s.anim.split(' ')[0]} {
              0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              100% { transform: translate(calc(-50% + ${s.tx}), calc(-50% + ${s.ty})) scale(0); opacity: 0; }
            }
          `).join('\\n')}
        `}
      </style>

      {/* The Hero Object */}
      <div 
        className={`watermelon-wrapper ${isAwakened ? 'awakened' : ''}`}
        onClick={handleAwaken}
      >
        <div className="golden-vines" />
        <div className="watermelon-core">
          {isAwakened && (
            <div className="watermelon-inner-text">
              <p>In your life someone will recommend you to watch "Twinkling Watermelon".</p>
              <p style={{marginTop: '12px'}}>It's really important to listen to them.</p>
            </div>
          )}
        </div>
        <div className="watermelon-rind top"><div className="watermelon-skin" /></div>
        <div className="watermelon-rind bottom"><div className="watermelon-skin" /></div>
        <div className="watermelon-stem" />
        <div className="watermelon-tag">To Sonakshi</div>
        
        <div className="orbiting-leaves">
          <div className="leaf leaf-1" />
          <div className="leaf leaf-2" />
          <div className="leaf leaf-3" />
        </div>

        {isAwakened && <div className="watermelon-shockwave fire" />}
      </div>
      
      {/* Sparks */}
      {sparks.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: s.left, top: s.top, 
          width: '6px', height: '6px', background: '#fff', borderRadius: '50%',
          boxShadow: '0 0 10px rgba(255, 100, 150, 0.9)',
          animation: s.anim, pointerEvents: 'none', zIndex: 10
        }} />
      ))}
      
      
      
      <div style={{ textAlign: 'center', marginTop: '120px', zIndex: 10 }}>
        <span style={{ color: 'var(--gold-accent)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>ISLAND IV</span>
        <h3 style={{ margin: '12px 0 12px', fontSize: '2rem', color: '#fff', fontFamily: 'var(--font-serif-display)', letterSpacing: '0.02em', textShadow: '0 2px 10px rgba(255, 100, 150, 0.2)' }}>
          TWINKLING WATERMELON
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>
          Viva La Vida, Watermelon Sugar!
        </p>
        <div style={{ height: '20px', marginTop: '8px' }}>
          {!isAwakened && <span style={{fontSize: '0.8rem', opacity: 0.5, letterSpacing: '0.05em'}}>Click the watermelon to awaken it.</span>}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ISLAND 5: MEMORY LANE (VINTAGE TAPE)
// ==========================================
const tapeMedia = [
  "IMG-20250323-WA0112.jpg",
  "IMG_20250323_164218.jpg",
  "IMG_20250323_171200.jpg",
  "Sylus.mp4",
  "VID-20250323-WA0011.mp4",
  "VID_20250622_052346_938.mp4",
  "WhatsApp Image 2025-03-23 at 22.58.20_f3643cc4.jpg",
  "WhatsApp Image 2026-06-17 at 6.24.29 PM.jpeg",
  "WhatsApp Image 2026-06-17 at 6.24.38 PM.jpeg",
  "WhatsApp Image 2026-06-17 at 6.24.56 PM.jpeg",
  "WhatsApp Image 2026-06-17 at 6.25.07 PM.jpeg",
  "WhatsApp Image 2026-06-17 at 6.25.52 PM.jpeg",
  "WhatsApp Image 2026-06-17 at 6.26.21 PM.jpeg",
  "WhatsApp Image 2026-06-17 at 6.27.42 PM.jpeg",
  "WhatsApp Image 2026-06-17 at 6.28.47 PM.jpeg",
  "WhatsApp Image 2026-06-17 at 6.38.03 PM.jpeg"
];

interface MemoryLaneIslandProps {
  audioCtx: AudioContext | null;
  ambientPlaying: boolean;
  setAmbientPlaying: (playing: boolean) => void;
}

const MemoryLaneIsland: React.FC<MemoryLaneIslandProps> = ({ audioCtx, ambientPlaying, setAmbientPlaying }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasAmbientPlaying = useRef(false);
  const fadeIntervalRef = useRef<any | null>(null);
  const sourceConnected = useRef(false);

  useEffect(() => {
    const handleStopAll = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.origin !== 'memory') {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.volume = 1;
        }
        setIsPlaying(false);
      }
    };
    window.addEventListener('stop-all-audio', handleStopAll);
    return () => {
      window.removeEventListener('stop-all-audio', handleStopAll);
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        let vol = audioRef.current.volume;
        fadeIntervalRef.current = setInterval(() => {
          if (vol > 0.05) {
            vol -= 0.05;
            if (audioRef.current) audioRef.current.volume = vol;
          } else {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.volume = 1;
            }
            if (wasAmbientPlaying.current) {
              setAmbientPlaying(true);
            }
          }
        }, 100);
      } else {
        if (wasAmbientPlaying.current) {
          setAmbientPlaying(true);
        }
      }
    } else {
      if (!audioRef.current) {
        const audio = new Audio('/slipping.mp4');
        audio.preload = 'none';
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          if (wasAmbientPlaying.current) {
            setAmbientPlaying(true);
          }
        });
        audioRef.current = audio;
      }

      if (audioCtx && audioRef.current && !sourceConnected.current) {
        try {
          const source = audioCtx.createMediaElementSource(audioRef.current);
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = 2.5; // Boost volume by 250%
          source.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          sourceConnected.current = true;
        } catch (e) {
          console.error("Audio routing error:", e);
        }
      }

      window.dispatchEvent(new CustomEvent('stop-all-audio', { detail: { origin: 'memory' } }));

      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      wasAmbientPlaying.current = ambientPlaying;
      if (ambientPlaying) {
        setAmbientPlaying(false);
      }
      
      setIsPlaying(true);
      audioRef.current.volume = 0;
      audioRef.current.play().then(() => {
        let vol = 0;
        fadeIntervalRef.current = setInterval(() => {
          if (vol < 0.95) {
            vol += 0.05;
            if (audioRef.current) audioRef.current.volume = vol;
          } else {
            if (audioRef.current) audioRef.current.volume = 1;
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          }
        }, 100);
      }).catch(err => {
        console.error('Failed to play slipping song:', err);
      });
    }
  };

  const handleBgVideoEnded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    video.currentTime = 4;
    video.play();
  };

  return (
    <div className="memory-lane-island" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background Flashback Video */}
      <video 
        src="/Tape/My therapy.mp4#t=4"
        autoPlay 
        muted 
        playsInline 
        onEnded={handleBgVideoEnded}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.5,
          filter: 'sepia(0.6) blur(1px) contrast(1.1)',
          zIndex: 0,
          pointerEvents: 'none',
          mixBlendMode: 'screen'
        }}
      />

      <div style={{ textAlign: 'center', marginBottom: '40px', zIndex: 20, position: 'relative' }}>
        <span style={{ color: '#d4c5b0', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>ISLAND V</span>
        <h3 style={{ margin: '12px 0 12px', fontSize: '2.5rem', color: '#f5eadd', fontFamily: 'var(--font-serif-display)', letterSpacing: '0.05em', textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)' }}>
          Memory Lane
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontStyle: 'italic', margin: 0, textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>
          A vintage reel of golden moments.
        </p>
      </div>

      <div className="vintage-film-container">
        {/* Grain and Sepia Overlays */}
        <div className="film-grain"></div>
        <div className="sepia-overlay"></div>

        {/* Tape Cassette Detail */}
        <div className={`tape-cassette-detail ${isPlaying ? 'playing' : ''}`} onClick={togglePlay} style={{ cursor: 'pointer' }} title="Click to play tape">
          <div className="tape-label">
            <div className="tape-stripes"></div>
            <span className="tape-title">Summer '96</span>
          </div>
          <div className="bridge"></div>
        </div>
        {isPlaying && (
          <div className="projector-flicker" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.03)', pointerEvents: 'none', zIndex: 15 }}></div>
        )}

        {/* Film Strip Photos */}
        <div className="film-strip-wrapper">
          <div className={`film-strip-track ${isPlaying ? 'playing' : ''}`}>
            {/* Group 1 */}
            {tapeMedia.map((filename, index) => {
              const isVideo = filename.endsWith('.mp4');
              const mediaSrc = `/Tape/${filename}${filename === 'Sylus.mp4' ? '#t=5' : ''}`;
              return (
                <div className="vintage-polaroid" key={`g1-${index}`}>
                  {isVideo ? (
                    <video src={mediaSrc} className="media-content" loop muted playsInline preload="none" controls />
                  ) : (
                    <img src={mediaSrc} className="media-content" alt={`Memory ${index}`} loading="lazy" />
                  )}
                </div>
              );
            })}
            {/* Group 2 for seamless looping */}
            {tapeMedia.map((filename, index) => {
              const isVideo = filename.endsWith('.mp4');
              const mediaSrc = `/Tape/${filename}${filename === 'Sylus.mp4' ? '#t=5' : ''}`;
              return (
                <div className="vintage-polaroid" key={`g2-${index}`}>
                  {isVideo ? (
                    <video src={mediaSrc} className="media-content" loop muted playsInline preload="none" controls />
                  ) : (
                    <img src={mediaSrc} className="media-content" alt={`Memory ${index}`} loading="lazy" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SonakshiUniverseProps {
  audioCtx: AudioContext | null;
  ambientPlaying: boolean;
  setAmbientPlaying: (playing: boolean) => void;
  onEnterJungkookConstellation: () => void;
}

export const SonakshiUniverse: React.FC<SonakshiUniverseProps> = ({ audioCtx, ambientPlaying, setAmbientPlaying, onEnterJungkookConstellation }) => {
  return (
    <div
      style={{
        background: 'linear-gradient(to bottom, var(--bg-dark) 0%, var(--bg-garden) 50%, var(--bg-dark) 100%)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '120px',
        padding: '120px 24px',
        position: 'relative',
        zIndex: 5
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '600px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '3rem', color: '#fff', marginBottom: '16px', fontFamily: 'var(--font-serif-display)', letterSpacing: '0.02em', textShadow: '0 2px 15px rgba(255,255,255,0.1)' }}>Sonakshi's Universe</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Explore the twilight paths of her personality. Hover and interact with each island to experience its unique magic.
        </p>
      </div>

      <JungkookIsland 
        audioCtx={audioCtx} 
        ambientPlaying={ambientPlaying} 
        setAmbientPlaying={setAmbientPlaying} 
        onEnterJungkookConstellation={onEnterJungkookConstellation}
      />
      <SkatingIsland 
        audioCtx={audioCtx} 
        ambientPlaying={ambientPlaying} 
        setAmbientPlaying={setAmbientPlaying} 
      />
      <BasketballIsland 
        audioCtx={audioCtx} 
        ambientPlaying={ambientPlaying} 
        setAmbientPlaying={setAmbientPlaying} 
      />
      <WatermelonIsland ambientPlaying={ambientPlaying} setAmbientPlaying={setAmbientPlaying} />
      <MemoryLaneIsland audioCtx={audioCtx} ambientPlaying={ambientPlaying} setAmbientPlaying={setAmbientPlaying} />
    </div>
  );
};
