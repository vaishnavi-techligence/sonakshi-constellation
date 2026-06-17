import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X } from 'lucide-react';

interface WishData {
  id: number;
  author: string;
  relation: string;
  message: string;
  polaroidEmoji: string;
  polaroidText: string;
  polaroidBg: string;
  voiceNoteChime: number[]; // frequencies to play
  audioFile?: string; // optional actual audio file
  authorImage?: string; // optional photo to display beside voice note
}

interface LilyTreeProps {
  unlockedWishes: boolean[];
  setUnlockedWishes: React.Dispatch<React.SetStateAction<boolean[]>>;
}

const wishes: WishData[] = [
  {
    id: 0,
    author: "Vaish",
    relation: "Note Form Vaishu",
    message: "Happy Birthday to my favorite human! Through late night vents, cramming for exams, and endless gossip, you've been my constant. Here's to more memories, coffee runs, and laughing till our stomachs hurt! 🤍",
    polaroidEmoji: "✨🌸👭",
    polaroidText: "For Ms.Law&Order",
    polaroidBg: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
    voiceNoteChime: [261.63, 329.63, 392.00, 523.25], // C maj arpeggio
    audioFile: "/happy bday voice note from vaish.mp4",
    authorImage: "/Tape/WhatsApp Image 2026-06-17 at 6.26.21 PM.jpeg"
  },
  {
    id: 1,
    author: "Jungkook (Cosmic Wish)",
    relation: "Your Galaxy",
    message: "Wishing you a day filled with stardust and your favorite playlists. Keep skating through life with that incredible grace. You are the brightest star in our constellation! Stay gold! 💜",
    polaroidEmoji: "🐰🎵🌌",
    polaroidText: "Microcosmos 06.13",
    polaroidBg: "linear-gradient(135deg, #e9d5ff 0%, #c084fc 100%)",
    voiceNoteChime: [349.23, 440.00, 523.25, 698.46] // F maj arpeggio
  },
  {
    id: 2,
    author: "The Hoop Squad",
    relation: "Court Crew",
    message: "Happy Birthday, Sonakshi! To the person who makes every game a highlight reel. You've got ice in your veins on the ice, and you shoot absolute buckets on the court! Keep balling! 🏀🔥",
    polaroidEmoji: "🏀⚡🏆",
    polaroidText: "Clutch Bucket Getter",
    polaroidBg: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)",
    voiceNoteChime: [293.66, 349.23, 440.00, 587.33] // D min arpeggio
  },
  {
    id: 3,
    author: "Mom & Dad",
    relation: "First Fans",
    message: "Watching you grow into the graceful, passionate, and cooking-loving person you are today has been our greatest joy. May your year be filled with sweet recipes, success, and all the happiness you deserve. We love you!",
    polaroidEmoji: "🏡🥞🎂",
    polaroidText: "Cozy Kitchen Mornings",
    polaroidBg: "linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)",
    voiceNoteChime: [261.63, 329.63, 392.00, 493.88] // Cmaj7 arpeggio
  },
  {
    id: 4,
    author: "Maya",
    relation: "Skating Partner",
    message: "Wishing a beautiful birthday to my favorite skater! The frozen crystal lake has nothing on the trails of stardust you leave behind. Let's conquer new routines and share more double chocolate pancakes soon! ⛸️🤍",
    polaroidEmoji: "⛸️❄️🥞",
    polaroidText: "Ice Trails 2026",
    polaroidBg: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    voiceNoteChime: [261.63, 293.66, 349.23, 392.00] // Pentatonic slide
  },
  {
    id: 5,
    author: "The Secret Lily",
    relation: "A Silent Admirer",
    message: "Some people leave simple footprints, but you truly leave constellations. The world became a whole lot brighter and gentler the day you arrived. Keep shining, keep dreaming, and never lose your magic. Happy Birthday Sonakshi! 🌸",
    polaroidEmoji: "🌿🕯️🤍",
    polaroidText: "Twining Lily Garden",
    polaroidBg: "linear-gradient(135deg, #fcfbfa 0%, #e2dfd3 100%)",
    voiceNoteChime: [329.63, 392.00, 523.25, 659.25] // E min to C arpeggio
  },
  {
    id: 6,
    author: "Vaibhav",
    relation: "A Special Bond",
    message: "Many And Maniest  Happy Returns of the Day Didi!! It's your birthday the special day of your life and I wish that this day goes amazing and full gifts and love I hope God bless you and gives you  all the strength to conquer your problems I am really thankful to you for helping me out in every tough moment for guiding me for making me feel good around you and supporting me a lot and I hope our bind remains the same And I wish you great succes in your career 🎂🎊❤️ Love you ❤️🥳",
    polaroidEmoji: "🐼🎈❤️",
    polaroidText: "For My Panda",
    polaroidBg: "linear-gradient(135deg, #d1fae5 0%, #10b981 100%)",
    voiceNoteChime: [261.63, 329.63, 392.00, 523.25],
    authorImage: "/panda.png"
  }
];

export const LilyTree: React.FC<LilyTreeProps> = ({ unlockedWishes, setUnlockedWishes }) => {
  const [activeWish, setActiveWish] = useState<WishData | null>(null);
  const [playingVoiceNote, setPlayingVoiceNote] = useState<number | null>(null);
  const [audioDuration, setAudioDuration] = useState<string>("0:04");
  const galaxyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const realAudioRef = useRef<HTMLAudioElement | null>(null);
  const count = unlockedWishes.filter(Boolean).length;
  const hasPlayedSurprise = useRef(false);

  useEffect(() => {
    if (activeWish?.audioFile) {
      const audio = new Audio(activeWish.audioFile);
      audio.onloadedmetadata = () => {
        const mins = Math.floor(audio.duration / 60);
        const secs = Math.floor(audio.duration % 60);
        setAudioDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
      };
    } else if (activeWish) {
      const durationMs = activeWish.voiceNoteChime.length * 250 + 1000;
      const secs = Math.floor(durationMs / 1000);
      setAudioDuration(`0:${secs.toString().padStart(2, '0')}`);
    }
  }, [activeWish]);
  
  useEffect(() => {
    return () => {
      if (realAudioRef.current) {
        realAudioRef.current.pause();
        realAudioRef.current = null;
      }
    };
  }, []);



  // Render reactive galaxy canvas behind the tree
  useEffect(() => {
    const canvas = galaxyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = 600;

    interface CosmicSparkle {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      speed: number;
    }

    const sparkles: CosmicSparkle[] = [];
    const colors = ['#f2e3c6', '#e5ccff', '#d0f0ff', '#ffffff'];

    // Spawn initial particles based on unlocked count
    const baseCount = count * 20 + 10;
    for (let i = 0; i < baseCount; i++) {
      sparkles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(Math.random() * 0.3 + 0.1),
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.3,
        speed: Math.random() * 0.02 + 0.01
      });
    }

    let animId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Galaxy glow background overlay matching count
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        50,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.6
      );

      const glowOpacity = count * 0.08;
      grad.addColorStop(0, `rgba(229, 204, 255, ${glowOpacity * 0.4})`);
      grad.addColorStop(0.5, `rgba(242, 227, 198, ${glowOpacity * 0.2})`);
      grad.addColorStop(1, 'rgba(11, 12, 22, 0)');
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animate stardust sparkles
      sparkles.forEach((s) => {
        s.y += s.vy;
        s.x += s.vx;
        s.alpha += Math.sin(Date.now() * s.speed) * 0.05;

        // Wrap around screen
        if (s.y < 0) s.y = canvas.height;
        if (s.x < 0 || s.x > canvas.width) s.x = Math.random() * canvas.width;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1.0, s.alpha));
        ctx.shadowColor = s.color;
        ctx.shadowBlur = count > 3 ? 5 : 2;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Special high speed galaxy particles if fully unlocked
      if (count === 7 && Math.random() < 0.2) {
        sparkles.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 80,
          y: canvas.height / 2 + (Math.random() - 0.5) * 80,
          size: Math.random() * 2 + 1.5,
          vx: (Math.random() - 0.5) * 2.5,
          vy: (Math.random() - 0.5) * 2.5,
          color: '#e5ccff',
          alpha: 1.0,
          speed: 0.05
        });
        if (sparkles.length > 200) sparkles.shift();
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = 600;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [count]);

  const handleBudClick = (wish: WishData) => {
    // Mark as unlocked
    const newUnlocked = [...unlockedWishes];
    newUnlocked[wish.id] = true;
    setUnlockedWishes(newUnlocked);
    setActiveWish(wish);
  };

  const playVoiceNote = (wish: WishData) => {
    if (playingVoiceNote === wish.id) {
      // Pause currently playing voice note
      if (wish.audioFile && realAudioRef.current) {
        realAudioRef.current.pause();
      }
      setPlayingVoiceNote(null);
      return;
    }

    if (playingVoiceNote !== null) {
      if (realAudioRef.current) {
        realAudioRef.current.pause();
      }
    }

    setPlayingVoiceNote(wish.id);

    if (wish.audioFile) {
      if (realAudioRef.current) {
        realAudioRef.current.pause();
      }
      const audio = new Audio(wish.audioFile);
      realAudioRef.current = audio;
      
      window.dispatchEvent(new CustomEvent('stop-all-audio', { detail: { origin: 'lily' } }));

      audio.play().catch(e => console.error("Error playing voice note", e));
      audio.onended = () => setPlayingVoiceNote(null);
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.3, ctx.currentTime);
    master.connect(ctx.destination);

    const delay = ctx.createDelay();
    delay.delayTime.setValueAtTime(0.4, ctx.currentTime);
    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.3, ctx.currentTime);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(master);

    // Play chords arpeggio
    wish.voiceNoteChime.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.25;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

      osc.connect(noteGain);
      noteGain.connect(master);
      noteGain.connect(delay);

      osc.start(startTime);
      osc.stop(startTime + 1.3);
    });

    setTimeout(() => {
      setPlayingVoiceNote(null);
    }, wish.voiceNoteChime.length * 250 + 1000);
  };

  // Branch bud coordinates on our SVG (relative to 800 x 600 viewbox)
  const budCoords = [
    { x: 280, y: 340, label: "Vaishu" }, // Left lower branch
    { x: 520, y: 340, label: "Galaxy Path" },    // Right lower branch
    { x: 230, y: 240, label: "Clutch Hoop" },    // Left upper branch
    { x: 570, y: 240, label: "Cozy Kitchen" },   // Right upper branch
    { x: 340, y: 150, label: "Ice Trails" },     // Center left top
    { x: 460, y: 150, label: "Secret Lily" },     // Center right top
    { x: 400, y: 90, label: "vaibhav" }       // Top center
  ];

  return (
    <section
      className="garden-section"
      style={{
        background: 'var(--bg-dark)',
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 24px'
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '600px', zIndex: 10, marginBottom: '24px' }}>
        <span style={{ color: 'var(--gold-accent)', fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Main Magical Element</span>
        <h2 style={{ fontSize: '2.2rem', color: '#fff', margin: '12px 0 16px' }}>The Lily Wishing Tree</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          At the heart of the garden stands a tree made of pure starlight and lilies. Touch the glowing buds along the branches to bloom each lily and unlock personal birthday wishes.
        </p>
        <p style={{ color: 'var(--gold-accent)', fontSize: '0.9rem', marginTop: '12px', fontWeight: 500 }}>
          Lilies Bloomed: {count} of 7
        </p>
      </div>

      {/* Lily Tree Display container */}
      <div
        className="lily-tree-container"
        style={{
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          position: 'relative',
          overflow: 'hidden',
          background: 'rgba(5, 5, 12, 0.6)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Dynamic canvas stardust background */}
        <canvas ref={galaxyCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

        <div className="tree-aspect-ratio" style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          {/* Tree SVG */}
          <svg
            viewBox="0 0 800 600"
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 2,
              filter: `drop-shadow(0 0 ${10 + count * 5}px rgba(220, 225, 255, ${0.1 + count * 0.12}))`,
              transition: 'filter 1s ease'
            }}
          >
            {/* Main Trunk & Branches (Starlight paths) */}
            <path
              d="M 400,580 C 400,500 380,480 380,420 C 380,360 410,320 410,280 C 410,230 390,210 390,180 C 390,150 400,100 400,90"
              fill="none"
              stroke="url(#trunkGrad)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Branch 1 Left Lower */}
            <path d="M 385,410 C 340,390 310,380 280,340" fill="none" stroke="url(#trunkGrad)" strokeWidth="6" strokeLinecap="round" />
            {/* Branch 2 Right Lower */}
            <path d="M 400,400 C 460,390 490,380 520,340" fill="none" stroke="url(#trunkGrad)" strokeWidth="6" strokeLinecap="round" />
            {/* Branch 3 Left Upper */}
            <path d="M 390,290 C 340,280 280,270 230,240" fill="none" stroke="url(#trunkGrad)" strokeWidth="5" strokeLinecap="round" />
            {/* Branch 4 Right Upper */}
            <path d="M 410,270 C 460,260 520,270 570,240" fill="none" stroke="url(#trunkGrad)" strokeWidth="5" strokeLinecap="round" />
            {/* Branch 5 Left Top */}
            <path d="M 395,200 C 360,180 350,170 340,150" fill="none" stroke="url(#trunkGrad)" strokeWidth="4" strokeLinecap="round" />
            {/* Branch 6 Right Top */}
            <path d="M 405,190 C 440,170 450,170 460,150" fill="none" stroke="url(#trunkGrad)" strokeWidth="4" strokeLinecap="round" />

            {/* Dynamic SVG Definitions */}
            <defs>
              <linearGradient id="trunkGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="40%" stopColor="#312e81" />
                <stop offset="80%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#e9eaff" />
              </linearGradient>
            </defs>
          </svg>

          {/* Floating Interactive Buds Overlay */}
          {budCoords.map((coord, idx) => {
            const wish = wishes[idx];
            const isUnlocked = unlockedWishes[wish.id];

            return (
              <div
                key={wish.id}
                onClick={() => handleBudClick(wish)}
                className="interactive"
                style={{
                  position: 'absolute',
                  left: `${(coord.x / 800) * 100}%`,
                  top: `${(coord.y / 600) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {/* Blooming / Glowing Visual representation */}
                <div
                  style={{
                    width: isUnlocked ? '36px' : '20px',
                    height: isUnlocked ? '36px' : '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: isUnlocked
                      ? 'radial-gradient(circle, #ffffff 0%, #fefcf3 60%, #e2dfd3 100%)'
                      : 'radial-gradient(circle, #f2e3c6 0%, rgba(242, 227, 198, 0.4) 60%, transparent 100%)',
                    boxShadow: isUnlocked
                      ? '0 0 25px 8px rgba(255,255,255,0.7), 0 0 10px var(--gold-accent)'
                      : '0 0 15px 4px rgba(242, 227, 198, 0.8), 0 0 3px #fff',
                    border: isUnlocked ? '2px solid var(--gold-accent)' : '1px solid rgba(255,255,255,0.6)',
                    transition: 'all 0.8s cubic-bezier(0.19, 1, 0.22, 1)',
                    transform: isUnlocked ? 'scale(1) rotate(45deg)' : 'scale(1) rotate(0deg)',
                    animation: !isUnlocked ? 'pulse-slow 2s infinite ease-in-out' : 'none'
                  }}
                >
                  {/* Visual Petals inside bloomed state */}
                  {isUnlocked && (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <div style={{ position: 'absolute', top: '2px', left: '16px', width: '4px', height: '12px', background: 'var(--gold-accent)', borderRadius: '50%' }} />
                      <div style={{ position: 'absolute', top: '16px', left: '2px', width: '12px', height: '4px', background: 'var(--gold-accent)', borderRadius: '50%' }} />
                    </div>
                  )}
                </div>
                <p
                  style={{
                    color: isUnlocked ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginTop: '8px',
                    fontWeight: isUnlocked ? 600 : 400,
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  {coord.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wish Details Glassmorphism Modal */}
      {activeWish && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(5, 5, 12, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9998,
            padding: '24px',
            animation: 'fade-in 0.3s ease-out'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '680px',
              padding: '40px',
              position: 'relative',
              background: 'rgba(25, 25, 35, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              animation: 'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Close Button */}
            <div
              onClick={() => setActiveWish(null)}
              className="interactive"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                background: 'rgba(0,0,0,0.3)'
              }}
            >
              <X size={16} />
            </div>

            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              {/* Polaroid Frame */}
              <div
                style={{
                  width: '200px',
                  background: '#fefcf8',
                  padding: '12px 12px 28px 12px',
                  borderRadius: '4px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: 'rotate(-3deg)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  alignSelf: 'center'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '160px',
                    background: activeWish.polaroidBg,
                    borderRadius: '2px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '3.5rem',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                  }}
                >
                  {activeWish.authorImage ? (
                    <img src={activeWish.authorImage} alt={activeWish.author} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    activeWish.polaroidEmoji
                  )}
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif-text)',
                    fontSize: '0.85rem',
                    color: '#4a4437',
                    marginTop: '12px',
                    fontWeight: 500
                  }}
                >
                  {activeWish.polaroidText}
                </p>
              </div>

              {/* Wish Text & Content */}
              <div style={{ flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ color: 'var(--gold-accent)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {activeWish.relation}
                  </span>
                  <h3 style={{ fontSize: '1.6rem', color: '#fff', margin: '4px 0 16px' }}>
                    From {activeWish.author}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '24px' }}>
                    {activeWish.message}
                  </p>
                </div>

                {/* Simulated Voice Note Card */}
                <div
                  className="glass-panel"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <button
                    onClick={() => playVoiceNote(activeWish)}
                    className="interactive"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--gold-accent)',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer',
                      outline: 'none',
                      boxShadow: '0 0 10px rgba(242, 227, 198, 0.4)'
                    }}
                  >
                    {playingVoiceNote === activeWish.id ? (
                      <Pause size={16} fill="#38332a" stroke="#38332a" />
                    ) : (
                      <Play size={16} fill="#38332a" stroke="none" style={{ marginLeft: '2px' }} />
                    )}
                  </button>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.75rem', color: '#fff', margin: 0, fontWeight: 500 }}>Play Voice Note</p>
                    {/* Simulated Waveform Visualizer */}
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginTop: '6px', height: '14px' }}>
                      {[8, 12, 6, 14, 10, 4, 12, 16, 8, 10, 6, 14, 8, 10, 6].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            width: '2px',
                            height: playingVoiceNote === activeWish.id ? `${h}px` : '4px',
                            background: playingVoiceNote === activeWish.id ? 'var(--gold-accent)' : 'var(--text-muted)',
                            borderRadius: '1px',
                            transition: 'height 0.15s ease',
                            animation: playingVoiceNote === activeWish.id ? `pulse-slow ${0.4 + i * 0.05}s infinite alternate` : 'none'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{audioDuration}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
