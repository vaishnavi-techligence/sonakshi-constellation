import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BookOpen, Sparkles, Music, Gift, Mail, Send } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface DiaryEntry {
  id: number;
  text: string;
  date: string;
}

interface LetterStar {
  x: number;
  y: number;
  size: number;
  brightness: number;
  text: string;
  date: string;
}

interface ConstellationStar {
  id: string;
  name: string;
  x: number; // percentage of viewport width
  y: number; // percentage of viewport height
}

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  whisper?: string;
  isHovered?: boolean;
}

interface Wish {
  id: number;
  text: string;
  x: number;
  y: number;
}

interface JungkookConstellationProps {
  audioCtx: AudioContext | null;
  onExit: () => void;
}

export const JungkookConstellation: React.FC<JungkookConstellationProps> = ({ audioCtx: _audioCtx, onExit }) => {
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Local storage state keys
  const [visitCount, setVisitCount] = useState<number>(1);
  const [welcomeMsg, setWelcomeMsg] = useState<string>('');
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [letterStars, setLetterStars] = useState<LetterStar[]>([]);
  const [visitedSections, setVisitedSections] = useState<string[]>([]);
  
  // Requirement checklist states (diary, music played, future opened, hidden notes found)
  const [diaryDone, setDiaryDone] = useState(false);
  const [musicDone, setMusicDone] = useState(false);
  const [futureDone, setFutureDone] = useState(false);
  const [foundNotes, setFoundNotes] = useState<boolean[]>([false, false, false, false]); // 4 hidden notes
  
  // Progression states
  const [lastStarAwakened, setLastStarAwakened] = useState(false);
  const [awakeningActive, setAwakeningActive] = useState(false);
  const [awakeningStage, setAwakeningStage] = useState(0); // 0-7 stages
  const [skyDarkness, setSkyDarkness] = useState(1.0); // 1.0 = normal dark sky, 0.4 = extra dark during awakening
  const [showLastStarChimeText, setShowLastStarChimeText] = useState(false);
  const [clickedLastStarMessage, setClickedLastStarMessage] = useState(false);
  const [shootingStarActive, setShootingStarActive] = useState(false);
  const [shootingStar, setShootingStar] = useState({ x: 0, y: 0, vx: 0, vy: 0, alpha: 0 });
  
  // Deferred Final Secret Star
  const [showFinalSecretStar, setShowFinalSecretStar] = useState(false);
  const [finalSecretOverlay, setFinalSecretOverlay] = useState(false);
  const [finalSecretSeen, setFinalSecretSeen] = useState(false);

  // Interaction UI states
  const [currentSection, setCurrentSection] = useState<string>('journey');
  const [diaryText, setDiaryText] = useState('');
  const [mailboxText, setMailboxText] = useState('');
  const [activeNoteText, setActiveNoteText] = useState<string | null>(null);
  const [playingRecord, setPlayingRecord] = useState<string | null>(null);
  const [recordRotation, setRecordRotation] = useState(0);
  const [musicRoomSynth, setMusicRoomSynth] = useState<any>(null);

  // Jungkook AI Chat states
  const [showJKChat, setShowJKChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'jk'; text: string; ts: string}[]>([
    { role: 'jk', text: 'Hey... you came. I wasn\'t sure if you would. 🐰', ts: 'just now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatSessionRef = useRef<any>(null);

  // Realtime Reddit Images for Infinite Wall
  const [redditImages, setRedditImages] = useState<{id: string, url: string, title: string}[]>([]);
  // Initialize Gemini Chat Session on mount
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: "You are Jungkook from BTS. You are talking to Sonakshi on her birthday. You are warm, comforting, slightly playful, and deeply caring. Use emojis like 🐰, 💜, and ✨ appropriately. Respond directly to Sonakshi. IMPORTANT: Do NOT constantly mention the 'Secret Lily Garden' or her birthday in every message. Act natural, casual, and conversational (1-3 sentences ideally), just like a real person texting on c.ai."
        });
        chatSessionRef.current = model.startChat({
          history: [
            { role: "user", parts: [{ text: "Hello Jungkook." }] },
            { role: "model", parts: [{ text: "Hey... you came. I wasn't sure if you would. 🐰" }] },
          ]
        });
      } catch (err) {
        console.error("Failed to initialize Gemini:", err);
      }
    }
  }, []);

  // Bench motivating text auto-pop states
  const [benchMotivatingText, setBenchMotivatingText] = useState<string | null>(null);
  const benchMotivatingTimerRef = useRef<any>(null);
  
  // Active audio node ref for Still With You play
  const stillWithYouAudioRef = useRef<HTMLAudioElement | null>(null);
  const benchAudioRef = useRef<HTMLAudioElement | null>(null);
  const blueAndGreyAudioRef = useRef<HTMLAudioElement | null>(null); // Background music
  const recordRotationIntervalRef = useRef<any>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number; color: string }[]>([]);
  const hoverStarTooltipRef = useRef<{ x: number; y: number; text: string } | null>(null);
  
  // Meditative Bench click whisper and particle refs
  const benchWhispersRef = useRef<{ x: number; y: number; text: string; alpha: number; yOffset: number }[]>([]);
  const benchParticlesRef = useRef<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number; color: string }[]>([]);
  const benchShootingStarRef = useRef<{ x: number; y: number; vx: number; vy: number; alpha: number } | null>(null);
  
  // Mailbox Paper Crane animation states
  const [mailboxAnim, setMailboxAnim] = useState<{
    active: boolean;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    stage: 'fly' | 'pause' | 'fold' | 'stardust' | 'done';
    progress: number;
    text: string;
  } | null>(null);

  // Cinematic states
  const [sittingOnBench, setSittingOnBench] = useState(false);
  const [, setBenchSitTime] = useState(0);
  const [benchTextFade, setBenchTextFade] = useState(false);
  const [horizonStarBright, setHorizonStarBright] = useState(1.0);

  const [openingFutureGift, setOpeningFutureGift] = useState(false);
  const [futureGiftStage, setFutureGiftStage] = useState(0); // 0: off, 1-3: Fades, 4: canvas reveal, 5: final text
  const [currentGiftImageIndex, setCurrentGiftImageIndex] = useState(0);
  const [isFutureGiftManual, setIsFutureGiftManual] = useState(false);

  // Vlive video clips state
  const [activeVliveVideo, setActiveVliveVideo] = useState<{ file: string; title: string; cat: string } | null>(null);

  // Vlive video data — points to local downloaded clips
  const vliveVideos: { file: string; title: string; cat: string }[] = [
    { file: "/media/vlive/10000 hours.mp4", title: "10,000 Hours", cat: "Vlive Cover" },
    { file: "/media/vlive/all of my life.mp4", title: "All of My Life", cat: "Heartfelt Cover" },
    { file: "/media/vlive/at my worst.mp4", title: "At My Worst", cat: "Emotional Cover" },
    { file: "/media/vlive/beautiful life.mp4", title: "Beautiful Life", cat: "Healing Melody" },
    { file: "/media/vlive/dreamers.mp4", title: "Dreamers — FIFA World Cup", cat: "Live Stage" },
    { file: "/media/vlive/just one day.mp4", title: "Just One Day", cat: "BTS Classic" },
    { file: "/media/vlive/smile again.mp4", title: "Smile Again", cat: "Tender Moment" },
    { file: "/media/vlive/wildflower.mp4", title: "Wildflower", cat: "Beautiful Cover" },
  ];

  const handlePlayVliveVideo = (vid: { file: string; title: string; cat: string }) => {
    setActiveVliveVideo(vid);
    stopVinylPlay();
    if (benchAudioRef.current) {
      benchAudioRef.current.pause();
    }
    if (blueAndGreyAudioRef.current) {
      blueAndGreyAudioRef.current.pause();
    }
  };

  // 1. Interactive Constellation Coordinates
  const constellationStars: ConstellationStar[] = [
    { id: 'diary', name: '★ Personal Diary', x: 22, y: 38 },
    { id: 'music', name: '★ Music Room', x: 38, y: 22 },
    { id: 'vault', name: '★ Video Vault', x: 62, y: 20 },
    { id: 'wall', name: '★ Memory Wall', x: 78, y: 38 },
    { id: 'gift', name: '★ Future Vision', x: 66, y: 70 },
    { id: 'wishes', name: '★ Wish Stars', x: 34, y: 70 }
  ];

  // 2. Hidden Note coordinates
  const hiddenNotes = [
    { id: 0, text: "Dear Sonakshi, your heart is a star that guides everyone who knows you. 💜", x: 0.12, y: 0.85, name: "Hidden Starlight Note" },
    { id: 1, text: "No matter how dark the sky gets tonight, you are never walking alone. 🌌", x: 0.88, y: 0.80, name: "Distant Galaxy Note" },
    { id: 2, text: "Some stars fade, but the ones inside your memories burn forever. ✨", x: 0.10, y: 0.15, name: "Sky Whispering Note" },
    { id: 3, text: "May your birthday constellation bring you endless comfort. 🐰🌸", x: 0.85, y: 0.22, name: "Stardust Message Note" }
  ];

  // 3. Wish Constellation stars state
  const [unlockedWishes, setUnlockedWishes] = useState<Wish[]>([]);
  const wishQuotes = [
    "May your dreams stay bigger than your fears. 💜",
    "Keep protecting your beautiful heart. ✨",
    "You are loved in every universe. 🪐",
    "May every ordinary day bring you small pockets of magic. 🌸",
    "You shine brightest when you are exactly yourself. 🐰",
    "Some people feel like home. You are home to so many. 🏡",
    "May the road ahead be paved with stardust and happy playlists. 🌌",
    "Never forget that your existence itself is a beautiful story. 📖"
  ];

  // 4. Memory Fireflies definitions
  const firefliesRef = useRef<Firefly[]>([]);
  const memoryWhispers = [
    "The first song you played here...",
    "The day you wrote your first letter to the stars...",
    "The quiet future gift is waiting below...",
    "The constellation remembers your footprints...",
    "Sit on the bench to watch the horizon..."
  ];

  // Letters Wall data (envelopes inside Jungkook's Room)
  const roomLetters = [
    { author: "Jungkook", title: "Still With You", text: "Even if we are far apart, I hope our voices reach each other. Thank you for listening to my stories. 💜" },
    { author: "Jungkook", title: "To Sonakshi", text: "ARMY is my constellation, and your light is a crucial piece of my sky. Keep smiling, stay healthy, and don't forget to eat well! 🐰" },
    { author: "Jungkook", title: "My You", text: "On starry nights, I sing in hopes that my gratitude reaches your quiet room. Thank you for being by my side. ✨" }
  ];

  const roomQuotes = [
    "Effort makes you. You will regret someday if you don't do your best now. — JK",
    "Don't do anything you don't like. Just do whatever you want. — JK",
    "Whenever ARMY misses me, you can come here. I will be singing. — JK",
    "Your presence makes ordinary days extraordinary. — JK"
  ];

  const jungkookSylusImages = [
    "/media/jungkook%20and%20sylus/1.png",
    "/media/jungkook%20and%20sylus/2.png",
    "/media/jungkook%20and%20sylus/3.png",
    "/media/jungkook%20and%20sylus/4.png",
    "/media/jungkook%20and%20sylus/5.png",
    "/media/jungkook%20and%20sylus/6.png",
    "/media/jungkook%20and%20sylus/7.png",
    "/media/jungkook%20and%20sylus/8.png",
    "/media/jungkook%20and%20sylus/9.png"
  ];

  const momentDescriptions = [
    "It's 1 a.m., we casually mention wanting coffee, and somehow our boyfriends take it as a mission. Next thing we know, Sylus and Jungkook are out together on a late-night coffee run, sending us a picture by the river with warm cups in hand and matching smiles. The coffee was sweet, but knowing they went out of their way just because we wanted it made it even sweeter. Sometimes love looks less like grand gestures and more like two sleepy boys buying coffee at midnight just to make their girls happy. ☕🤍",
    "A singing competition was supposed to be easy for us... until they teamed up against us. Jungkook could've picked anyone and guaranteed a win, but he chose Sylus anyway. Not because Sylus can sing (he absolutely cannot), but because apparently friendship and loyalty matter more than survival. So there they were—Jungkook carrying every note, Sylus confidently inventing new ones, both acting like they were the strongest team in the room. Meanwhile, we spent half the competition laughing too hard to compete properly. We may have had the better voices, but they had something even more dangerous: teamwork, confidence, and zero shame. 🎤🤍",
    "The way they look at us is almost embarrassing. Like they've just been handed something precious and still can't believe it's theirs. Jungkook can't stop smiling. Sylus can't stop staring. And somehow, in that quiet little moment, they look even more in love than they realize.",
    "Side by side, controllers in hand, both suddenly acting like winning is a matter of life and death. Jungkook is competitive until it's me on the other side—then somehow my character gets all the lucky breaks. Sylus, meanwhile, would absolutely let you win and then spend the next hour insisting he was 'just distracted.' The best part isn't the game, though. It's the way they keep sneaking glances at us between rounds, celebrating our victories louder than their own. Somehow a random game night turns into one of those memories we'll still be laughing about years from now. That's their magic—they make ordinary moments feel like the highlight of the week. 🎮🤍",
    "While we're still deciding on outfits and saying 'five more minutes' for the third time, they're already downstairs taking selfies together. Peace signs, goofy smiles, and the look of two people who know the wait is worth it. It's cute, really—the way they turn waiting for us into part of the date itself. Like even before we've arrived, they're already having a good time. ✨🤍",
    "By candlelight, they're supposed to be preparing Valentine's gifts for us. In reality, Jungkook is doing most of the crafting while Sylus insists he's 'supervising' despite contributing absolutely nothing useful. Every five minutes one of them asks the other, 'Do you think she'll like this?' and then immediately pretends not to care about the answer. The ribbons are crooked, the wrapping paper has been redone three times, and somehow they've turned gift preparation into a full team project. They'd never admit how much thought went into it, but that's the sweetest part—two boys helping each other create something perfect for the girls they can't stop thinking about. 🎀🤍",
    "The bike was perfectly fine until Jungkook and Sylus decided to 'take a look at it.' Now they're crouched under a streetlight trying to fix a problem they created themselves. Jungkook is actually working, Sylus is providing highly questionable advice, and both of them are pretending this was part of the plan. The good news? They're determined to solve it. The bad news? We don't trust them near bicycles anymore. 🚲✨",
    "A chandelier ballroom, suits chosen with more care than either of them would ever admit, and smiles they couldn't quite hide even if they tried. Sylus in black and burgundy, Jungkook in deep wine, standing side by side while the room glowed around them. But what gets me most isn't how handsome they look—it's the way they keep searching the crowd for us. The way their expressions soften the second they find us. Like out of everyone in that ballroom, we're still the only people they really want to see. This wasn't just our wedding day. It was theirs too—the day four lives, four hearts, and years of love, friendship, and choosing each other finally met in the same beautiful moment. 🤍✨",
    "As we stepped into the aisle together, everything else seemed to disappear. The flowers, the music, the hundreds of eyes watching—it all faded the second we saw them. Jungkook's smile broke first, bright and impossible to hide. Sylus tried to stay composed, but even from across the room we could see the emotion in his eyes. For a moment, neither of them looked like the confident men everyone knew. They just looked like two people overwhelmed by the sight of the women they loved walking toward them. And standing beside my best friend, hand in hand with years of memories behind us, I knew exactly what they were feeling—because my heart was doing the same thing. Every step brought us closer to forever, and somehow, all four of us looked a little emotional realizing we'd finally made it here. 🤍💍✨"
  ];


  // Scroll handler to automatically update currentSection as user scrolls
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (!container) return;

    if (container.scrollTop < 120) {
      if (currentSection !== 'journey') {
        setCurrentSection('journey');
      }
      return;
    }

    const sections = ['diary', 'room', 'gift', 'wall', 'vault', 'music', 'wishes'];
    let activeSection = currentSection;
    let minDistance = Infinity;
    const centerY = window.innerHeight / 2;

    sections.forEach((sec) => {
      const el = document.getElementById(`section-${sec}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - centerY);

        if (distance < minDistance && rect.top < window.innerHeight && rect.bottom > 0) {
          minDistance = distance;
          activeSection = sec;
        }
      }
    });

    if (activeSection !== currentSection) {
      setCurrentSection(activeSection);
      if (!visitedSections.includes(activeSection)) {
        const updated = [...visitedSections, activeSection];
        setVisitedSections(updated);
        localStorage.setItem('jungkook_visited_sections', JSON.stringify(updated));
      }
    }
  };

  // Render Quest Checklist widget at bottom left
  const renderQuestChecklist = () => {
    const notesCount = foundNotes.filter(Boolean).length;
    const isCompleted = diaryDone && musicDone && futureDone && notesCount === 4;

    return (
      <div
        className="glass-panel"
        style={{
          position: 'fixed',
          bottom: '32px',
          left: '32px',
          width: '280px',
          padding: '18px 20px',
          background: 'rgba(15, 10, 28, 0.85)',
          border: isCompleted ? '1.5px solid rgba(242, 227, 198, 0.45)' : '1px solid rgba(168, 85, 247, 0.2)',
          boxShadow: isCompleted ? '0 0 20px rgba(242, 227, 198, 0.15)' : '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 10000,
          borderRadius: '16px',
          pointerEvents: 'auto',
          textAlign: 'left',
          animation: 'fade-in 1s ease-out'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.72rem', color: isCompleted ? '#f2e3c6' : '#c084fc', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ✦ {isCompleted ? 'Constellation Ready' : 'Awakening Quest'}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {isCompleted ? '✓' : `${(diaryDone ? 1 : 0) + (musicDone ? 1 : 0) + (futureDone ? 1 : 0) + (notesCount === 4 ? 1 : 0)}/4`}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: diaryDone ? '#fffdf5' : 'var(--text-secondary)' }}>
            <span style={{ color: diaryDone ? '#c084fc' : 'var(--text-muted)' }}>{diaryDone ? '✦' : '✧'}</span>
            <span style={{ textDecoration: diaryDone ? 'line-through' : 'none', opacity: diaryDone ? 0.65 : 1 }}>Write in Personal Diary</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: musicDone ? '#fffdf5' : 'var(--text-secondary)' }}>
            <span style={{ color: musicDone ? '#c084fc' : 'var(--text-muted)' }}>{musicDone ? '✦' : '✧'}</span>
            <span style={{ textDecoration: musicDone ? 'line-through' : 'none', opacity: musicDone ? 0.65 : 1 }}>Play Vinyl Record / Wishes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: futureDone ? '#fffdf5' : 'var(--text-secondary)' }}>
            <span style={{ color: futureDone ? '#c084fc' : 'var(--text-muted)' }}>{futureDone ? '✦' : '✧'}</span>
            <span style={{ textDecoration: futureDone ? 'line-through' : 'none', opacity: futureDone ? 0.65 : 1 }}>Unlock Future Vision</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: notesCount === 4 ? '#fffdf5' : 'var(--text-secondary)' }}>
            <span style={{ color: notesCount === 4 ? '#c084fc' : 'var(--text-muted)' }}>{notesCount === 4 ? '✦' : '✧'}</span>
            <span style={{ textDecoration: notesCount === 4 ? 'line-through' : 'none', opacity: notesCount === 4 ? 0.65 : 1 }}>
              Find 4 Hidden Star Notes ({notesCount}/4)
            </span>
          </div>
        </div>
        {isCompleted && !lastStarAwakened && (
          <div style={{ marginTop: '12px', fontSize: '0.7rem', color: '#f2e3c6', fontStyle: 'italic', animation: 'pulse-slow 2s infinite', textAlign: 'center', borderTop: '1px solid rgba(242, 227, 198, 0.2)', paddingTop: '8px' }}>
            Click the center locked star to awaken!
          </div>
        )}
      </div>
    );
  };

  // 5. Initialize States on Load
  useEffect(() => {
    // 1. Visit Count
    const visits = Number(localStorage.getItem('jungkook_visit_count') || '0') + 1;
    localStorage.setItem('jungkook_visit_count', String(visits));
    setVisitCount(visits);

    // 2. Dynamic welcome message based on milestones
    const lastVisitDate = localStorage.getItem('jungkook_last_visit');
    const todayStr = new Date().toLocaleDateString();
    localStorage.setItem('jungkook_last_visit', todayStr);

    if (lastVisitDate) {
      if (visits >= 50) {
        setWelcomeMsg(`You've been part of this sky for a long time now. (Visit #${visits})`);
      } else if (visits >= 25) {
        setWelcomeMsg(`Some paths are made by walking them again and again. (Visit #${visits})`);
      } else if (visits >= 10) {
        setWelcomeMsg(`The stars seem brighter when you return. (Visit #${visits})`);
      } else {
        setWelcomeMsg(`Welcome back. The constellation remembered you.`);
      }
    } else {
      setWelcomeMsg("Welcome to your personal constellation world dedicated to Jungkook.");
    }

    // 3. Load Diary & Sent Letters
    const storedDiary = localStorage.getItem('jungkook_diary_entries');
    if (storedDiary) {
      const parsed = JSON.parse(storedDiary);
      setDiaryEntries(parsed);
      if (parsed.length > 0) setDiaryDone(true);
    }

    const storedLetters = localStorage.getItem('jungkook_star_letters');
    if (storedLetters) setLetterStars(JSON.parse(storedLetters));

    const storedVisited = localStorage.getItem('jungkook_visited_sections');
    if (storedVisited) setVisitedSections(JSON.parse(storedVisited));

    const wasAwakened = localStorage.getItem('jungkook_last_star_awakened') === 'true';
    if (wasAwakened) {
      setLastStarAwakened(true);
      
      // Check for deferred final secret star
      const awakenedDate = localStorage.getItem('jungkook_last_star_awakened_date');
      const seenSecret = localStorage.getItem('jungkook_final_secret_seen') === 'true';
      setFinalSecretSeen(seenSecret);

      if (awakenedDate && !seenSecret) {
        setShowFinalSecretStar(true);
      }
    }

    // Initialize Fireflies with memory whispers
    const tempFireflies: Firefly[] = [];
    for (let i = 0; i < 15; i++) {
      tempFireflies.push({
        x: Math.random() * window.innerWidth,
        y: 300 + Math.random() * 600,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.0 + 1.5,
        alpha: Math.random() * 0.6,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        pulsePhase: Math.random() * Math.PI * 2,
        whisper: i < 5 ? memoryWhispers[i] : undefined
      });
    }
    firefliesRef.current = tempFireflies;

    // Start Blue and Grey background music
    const bgAudio = new Audio('/blue_and_grey.webm');
    bgAudio.loop = true;
    bgAudio.volume = 0.35;
    blueAndGreyAudioRef.current = bgAudio;
    bgAudio.play().catch(e => console.log('Bg audio autoplay prevented:', e));

    return () => {
      if (stillWithYouAudioRef.current) stillWithYouAudioRef.current.pause();
      if (benchAudioRef.current) benchAudioRef.current.pause();
      if (blueAndGreyAudioRef.current) {
        blueAndGreyAudioRef.current.pause();
        blueAndGreyAudioRef.current.src = '';
      }
      if (recordRotationIntervalRef.current) clearInterval(recordRotationIntervalRef.current);
    };
  }, []);

  // 6. Monitor Requirements Checklist for The Last Star
  useEffect(() => {
    if (lastStarAwakened || awakeningActive) return;

    // Check notes count
    const notesFoundCount = foundNotes.filter(Boolean).length;
    
    // Requirements: diary entry written, music record played, future vision opened, 4 hidden notes found
    if (diaryDone && musicDone && futureDone && notesFoundCount === 4) {
      triggerLastStarAwakening();
    }
  }, [diaryDone, musicDone, futureDone, foundNotes, lastStarAwakened, awakeningActive]);

  // 7. Last Star Cinematic Awakening Sequence
  const triggerLastStarAwakening = () => {
    setAwakeningActive(true);
    setAwakeningStage(1);
    
    // Step 1: Sky canvas darkens (takes 3 seconds)
    const darkenInterval = setInterval(() => {
      setSkyDarkness((prev) => {
        if (prev <= 0.45) {
          clearInterval(darkenInterval);
          return 0.4;
        }
        return prev - 0.05;
      });
    }, 250);

    // Step 2: All stars pulse (at 3s)
    setTimeout(() => {
      setAwakeningStage(2);
      playSynthesizedChime([261.63, 329.63, 392.00, 523.25]); // warm major chord chime
    }, 3200);

    // Step 3: Connection lines animate glowing (at 5.5s)
    setTimeout(() => {
      setAwakeningStage(3);
    }, 5500);

    // Step 4: Locked star begins glowing in gold (at 7.5s)
    setTimeout(() => {
      setAwakeningStage(4);
      playSynthesizedChime([392.00, 493.88, 587.33, 783.99]); // higher chime
    }, 7500);

    // Step 5 & 6: Display teaser: "The Last Star has awakened" (at 9.5s)
    setTimeout(() => {
      setAwakeningStage(5);
      setShowLastStarChimeText(true);
      playSynthesizedChime([523.25, 659.25, 783.99, 1046.50]); // celestial chime
    }, 9500);

    // Complete transition (at 13s)
    setTimeout(() => {
      setAwakeningStage(6);
      setLastStarAwakened(true);
      localStorage.setItem('jungkook_last_star_awakened', 'true');
      const todayStr = new Date().toLocaleDateString();
      localStorage.setItem('jungkook_last_star_awakened_date', todayStr);
      setAwakeningActive(false);
      setSkyDarkness(1.0);
    }, 13000);
  };

  const handleLastStarClick = () => {
    if (!lastStarAwakened || clickedLastStarMessage) return;
    setClickedLastStarMessage(true);
    setShowLastStarChimeText(false);

    // Trigger emotional shooting star
    setShootingStarActive(true);
    setShootingStar({
      x: window.innerWidth * 0.3,
      y: window.innerHeight * 0.2,
      vx: 6,
      vy: 2.5,
      alpha: 1.0
    });

    playSynthesizedChime([523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]);
  };

  const handleFinalSecretClick = () => {
    if (finalSecretSeen) return;
    setFinalSecretOverlay(true);
  };

  const closeFinalSecret = () => {
    setFinalSecretOverlay(false);
    setFinalSecretSeen(true);
    setShowFinalSecretStar(false);
    localStorage.setItem('jungkook_final_secret_seen', 'true');
  };

  // 8. Sound Synthesizer (Web Audio API)
  const playSynthesizedChime = (frequencies: number[]) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.25, ctx.currentTime);
    master.connect(ctx.destination);

    // Delay nodes for celestial space echo
    const delay = ctx.createDelay();
    delay.delayTime.setValueAtTime(0.35, ctx.currentTime);
    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.4, ctx.currentTime);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(master);

    frequencies.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.22;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      noteGain.gain.setValueAtTime(0.001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.4);

      osc.connect(noteGain);
      noteGain.connect(master);
      noteGain.connect(delay);

      osc.start(startTime);
      osc.stop(startTime + 1.5);
    });
  };

  // Music Room mp3 player
  const playSongInstrumental = (songName: string) => {
    if (musicRoomSynth) {
      musicRoomSynth.stop();
      setMusicRoomSynth(null);
    }
    
    if (blueAndGreyAudioRef.current) {
      blueAndGreyAudioRef.current.pause();
    }

    const audio = new Audio(`/music/${songName}.mp3`);
    audio.loop = true;
    audio.volume = 0.35;
    audio.play().catch(e => console.log('Audio play error:', e));

    let particleTimer = setInterval(() => {
      // Spawn note particles
      for (let pIdx = 0; pIdx < 3; pIdx++) {
        particlesRef.current.push({
          x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 80,
          y: window.innerHeight * 0.7,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -(Math.random() * 1.5 + 0.8),
          alpha: 1.0,
          size: Math.random() * 1.5 + 1.0,
          color: Math.random() < 0.5 ? '#c084fc' : '#f472b6'
        });
      }
    }, 2200);

    setMusicRoomSynth({
      stop: () => {
        clearInterval(particleTimer);
        audio.pause();
        audio.src = '';
      }
    });
  };

  // 9. Stars Canvas Loop ( twinking starry canopy, paper crane mailbox star paths, footprints path )
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Twinkling background stars pool
    const bgStars: { x: number; y: number; size: number; phase: number; speed: number }[] = [];
    for (let i = 0; i < 120; i++) {
      bgStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.2 + 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.02
      });
    }

    let frameCount = 0;

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep purple cosmic backdrop gradient modulated by skyDarkness
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      const colorMultiplier = skyDarkness; // dims sky during awakening
      skyGrad.addColorStop(0, `rgba(${Math.floor(6 * colorMultiplier)}, ${Math.floor(4 * colorMultiplier)}, ${Math.floor(16 * colorMultiplier)}, 1)`);
      skyGrad.addColorStop(0.5, `rgba(${Math.floor(12 * colorMultiplier)}, ${Math.floor(8 * colorMultiplier)}, ${Math.floor(28 * colorMultiplier)}, 1)`);
      skyGrad.addColorStop(1, `rgba(${Math.floor(4 * colorMultiplier)}, ${Math.floor(3 * colorMultiplier)}, ${Math.floor(10 * colorMultiplier)}, 1)`);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Twinkling stars
      bgStars.forEach((s) => {
        s.phase += s.speed;
        const opacity = 0.25 + Math.sin(s.phase) * 0.45;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * skyDarkness})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // ------------------------------------------
      // Draw Footprints visit path near lake bottom (y = height - 100)
      // ------------------------------------------
      const pathStartY = canvas.height - 130;
      ctx.save();
      // Draw a subtle winding guide path line
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.04)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, pathStartY);
      for (let i = 0; i <= 20; i++) {
        const px = (i / 20) * canvas.width;
        const py = pathStartY + Math.sin(i * 0.4) * 35;
        ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Place footprint stars
      const footprintCount = Math.min(50, visitCount);
      for (let i = 0; i < footprintCount; i++) {
        // distribute them along the winding line towards the Horizon Star region
        const progress = i / 50;
        const px = progress * canvas.width * 0.82;
        const py = pathStartY + Math.sin(progress * 8) * 35 + (canvas.height * 0.15 - pathStartY) * progress * 0.6;
        
        const twinkleFactor = Math.sin(frameCount * 0.04 + i) * 0.35 + 0.65;
        ctx.fillStyle = `rgba(242, 227, 198, ${twinkleFactor * 0.55})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Soft underglow
        const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, 4);
        glowGrad.addColorStop(0, `rgba(242, 227, 198, ${0.18 * twinkleFactor})`);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ------------------------------------------
      // Draw Constellation Star Lines
      // ------------------------------------------
      ctx.save();
      const starsArr = constellationStars.map((s) => ({
        ...s,
        px: (s.x / 100) * canvas.width,
        py: (s.y / 100) * canvas.height
      }));

      // Connections lines list
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 5], [2, 4]
      ];

      // Draw connection lines
      ctx.lineWidth = 1.0;
      connections.forEach(([i1, i2]) => {
        const s1 = starsArr[i1];
        const s2 = starsArr[i2];
        const hasVisited1 = visitedSections.includes(s1.id);
        const hasVisited2 = visitedSections.includes(s2.id);
        
        // Lines glow brighter if both connecting stars were visited
        let lineAlpha = 0.08;
        if (awakeningStage >= 3) {
          lineAlpha = 0.75 + Math.sin(frameCount * 0.15) * 0.15; // awakening pulse
        } else if (hasVisited1 && hasVisited2) {
          lineAlpha = 0.35;
        }

        ctx.strokeStyle = `rgba(168, 85, 247, ${lineAlpha})`;
        ctx.beginPath();
        ctx.moveTo(s1.px, s1.py);
        ctx.lineTo(s2.px, s2.py);
        ctx.stroke();
      });

      // Draw Connection Nodes
      starsArr.forEach((s) => {
        const hasVisited = visitedSections.includes(s.id);
        const isHovered = currentSection === s.id;
        let starGlow = hasVisited ? 1.4 : 1.0;
        
        if (awakeningStage >= 2) {
          starGlow = 2.0 + Math.sin(frameCount * 0.2 + s.px) * 0.6;
        } else if (isHovered) {
          starGlow = 1.8;
        }

        ctx.fillStyle = hasVisited ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(s.px, s.py, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Node Glow Ring
        const starGrad = ctx.createRadialGradient(s.px, s.py, 0, s.px, s.py, 18);
        const color = hasVisited ? '192, 132, 252' : '156, 163, 175';
        starGrad.addColorStop(0, `rgba(${color}, ${0.35 * starGlow})`);
        starGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = starGrad;
        ctx.beginPath();
        ctx.arc(s.px, s.py, 18, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // ------------------------------------------
      // Draw The Horizon Star (Twinkles slightly brighter once every 3 minutes)
      // ------------------------------------------
      ctx.save();
      const horizonX = canvas.width * 0.82;
      const horizonY = canvas.height * 0.15;
      
      // Twinkle logic: rises to 2.2x brightness once every ~180s (10800 frames)
      const period = frameCount % 10800;
      let horizonTwinkle = 1.0;
      if (period > 10500) {
        // ramp up and down over 300 frames (5s)
        const transition = (period - 10500) / 300;
        horizonTwinkle = 1.0 + Math.sin(transition * Math.PI) * 1.5;
      }
      
      // Apply meditative bench pulse boost
      const finalHorizonGlow = horizonTwinkle * horizonStarBright;

      // Draw faint cross flare
      ctx.strokeStyle = `rgba(255, 253, 245, ${0.45 * finalHorizonGlow})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(horizonX - 10 * finalHorizonGlow, horizonY);
      ctx.lineTo(horizonX + 10 * finalHorizonGlow, horizonY);
      ctx.moveTo(horizonX, horizonY - 10 * finalHorizonGlow);
      ctx.lineTo(horizonX, horizonY + 10 * finalHorizonGlow);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 255, 0.95)`;
      ctx.beginPath();
      ctx.arc(horizonX, horizonY, 2.8, 0, Math.PI * 2);
      ctx.fill();

      const horizonGrad = ctx.createRadialGradient(horizonX, horizonY, 0, horizonX, horizonY, 15);
      horizonGrad.addColorStop(0, `rgba(255, 253, 245, ${0.35 * finalHorizonGlow})`);
      horizonGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = horizonGrad;
      ctx.beginPath();
      ctx.arc(horizonX, horizonY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ------------------------------------------
      // Draw The Last Star 🌠 (Padlocked or fully glowing)
      // ------------------------------------------
      ctx.save();
      const lastX = canvas.width / 2;
      const lastY = canvas.height * 0.38;

      if (lastStarAwakened || awakeningStage >= 4) {
        // Pulsing gold glowing star
        const lastGlow = 1.0 + Math.sin(frameCount * 0.05) * 0.25;
        ctx.fillStyle = '#f2e3c6';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 5.5, 0, Math.PI * 2);
        ctx.fill();

        const lastGrad = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 24);
        lastGrad.addColorStop(0, `rgba(242, 227, 198, ${0.55 * lastGlow})`);
        lastGrad.addColorStop(0.4, `rgba(242, 227, 198, ${0.22 * lastGlow})`);
        lastGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lastGrad;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 24, 0, Math.PI * 2);
        ctx.fill();

        // Radiate thin flares
        ctx.strokeStyle = `rgba(242, 227, 198, ${0.65 * lastGlow})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(lastX - 16, lastY); ctx.lineTo(lastX + 16, lastY);
        ctx.moveTo(lastX, lastY - 16); ctx.lineTo(lastX, lastY + 16);
        ctx.stroke();
      } else {
        // Dim lock container star
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ------------------------------------------
      // Draw Mailbox Sent Letters Stars
      // ------------------------------------------
      ctx.save();
      letterStars.forEach((star, index) => {
        const twinkle = Math.sin(frameCount * 0.03 + index) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 253, 245, ${star.brightness * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x * canvas.width, star.y * canvas.height, star.size, 0, Math.PI * 2);
        ctx.fill();

        const lGlow = ctx.createRadialGradient(star.x * canvas.width, star.y * canvas.height, 0, star.x * canvas.width, star.y * canvas.height, star.size * 3.5);
        lGlow.addColorStop(0, `rgba(242, 227, 198, ${0.25 * star.brightness * twinkle})`);
        lGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lGlow;
        ctx.beginPath();
        ctx.arc(star.x * canvas.width, star.y * canvas.height, star.size * 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // ------------------------------------------
      // Draw Deferred Final Secret Star (if returned another day)
      // ------------------------------------------
      if (showFinalSecretStar && !finalSecretSeen) {
        ctx.save();
        const secretX = horizonX - 35;
        const secretY = horizonY + 25;
        const secPulse = Math.sin(frameCount * 0.08) * 0.35 + 0.65;

        ctx.fillStyle = 'rgba(255, 218, 120, 0.95)';
        ctx.beginPath();
        ctx.arc(secretX, secretY, 2.2, 0, Math.PI * 2);
        ctx.fill();

        const secGrad = ctx.createRadialGradient(secretX, secretY, 0, secretX, secretY, 8);
        secGrad.addColorStop(0, `rgba(255, 218, 120, ${0.45 * secPulse})`);
        secGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = secGrad;
        ctx.beginPath();
        ctx.arc(secretX, secretY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ------------------------------------------
      // Draw Memory Fireflies (Whispering on hover)
      // ------------------------------------------
      ctx.save();
      const fireflies = firefliesRef.current;
      const mouseX = hoverStarTooltipRef.current?.x || -1000;
      const mouseY = hoverStarTooltipRef.current?.y || -1000;

      fireflies.forEach((f) => {
        // Physics drift
        f.x += f.vx;
        f.y += f.vy;

        // Wrap boundaries
        if (f.x < 0) f.x = canvas.width;
        if (f.x > canvas.width) f.x = 0;
        if (f.y < 200) f.y = canvas.height;
        if (f.y > canvas.height) f.y = 200;

        f.pulsePhase += f.pulseSpeed;
        const pulse = Math.sin(f.pulsePhase) * 0.35 + 0.65;
        
        // Check hover proximity
        const dist = Math.hypot(mouseX - f.x, mouseY - f.y);
        const isHovered = dist < 25;
        f.isHovered = isHovered;

        ctx.fillStyle = isHovered ? '#f2e3c6' : 'rgba(242, 227, 198, 0.8)';
        ctx.beginPath();
        ctx.arc(f.x, f.y, isHovered ? f.size * 1.5 : f.size * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Glow ring
        const fGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 4);
        fGrad.addColorStop(0, isHovered ? 'rgba(255, 218, 120, 0.45)' : `rgba(242, 227, 198, ${0.22 * pulse})`);
        fGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // If hovered and has whisper message, display tooltip above firefly
        if (isHovered && f.whisper) {
          ctx.font = "italic 300 12px 'Montserrat', sans-serif";
          ctx.fillStyle = '#f2e3c6';
          ctx.textAlign = 'center';
          ctx.fillText(f.whisper, f.x, f.y - 12);
        }
      });
      ctx.restore();

      // ------------------------------------------
      // Draw Mailbox Paper Crane Envelope Flight
      // ------------------------------------------
      if (mailboxAnim && mailboxAnim.active) {
        ctx.save();
        const anim = mailboxAnim;
        
        if (anim.stage === 'fly') {
          anim.progress += 0.012;
          // ease coordinates
          anim.x += (anim.targetX - anim.x) * 0.05;
          anim.y += (anim.targetY - anim.y) * 0.05;

          // Render envelope
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.rect(anim.x - 8, anim.y - 5, 16, 10);
          ctx.moveTo(anim.x - 8, anim.y - 5);
          ctx.lineTo(anim.x, anim.y);
          ctx.lineTo(anim.x + 8, anim.y - 5);
          ctx.stroke();

          if (anim.progress >= 0.95 || Math.hypot(anim.targetX - anim.x, anim.targetY - anim.y) < 10) {
            anim.stage = 'pause';
            anim.progress = 0;
          }
        } else if (anim.stage === 'pause') {
          anim.progress += 0.02; // pause for 1s
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.rect(anim.x - 8, anim.y - 5, 16, 10);
          ctx.moveTo(anim.x - 8, anim.y - 5);
          ctx.lineTo(anim.x, anim.y);
          ctx.lineTo(anim.x + 8, anim.y - 5);
          ctx.stroke();

          // pulse underglow
          const pauseGlow = Math.sin(frameCount * 0.15) * 6 + 12;
          const pGrad = ctx.createRadialGradient(anim.x, anim.y, 0, anim.x, anim.y, pauseGlow);
          pGrad.addColorStop(0, 'rgba(242, 227, 198, 0.45)');
          pGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(anim.x, anim.y, pauseGlow, 0, Math.PI * 2);
          ctx.fill();

          if (anim.progress >= 1.0) {
            anim.stage = 'fold';
            anim.progress = 0;
          }
        } else if (anim.stage === 'fold') {
          anim.progress += 0.015;
          const scale = 1.0 - anim.progress;

          // Draw vector folds turning envelope into paper crane
          ctx.strokeStyle = `rgba(242, 227, 198, ${0.9})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          // Head / Body folds
          ctx.moveTo(anim.x, anim.y - 8 * scale);
          ctx.lineTo(anim.x - 6 * scale, anim.y + 4 * scale);
          ctx.lineTo(anim.x + 6 * scale, anim.y + 4 * scale);
          ctx.closePath();
          // Wings
          ctx.moveTo(anim.x - 6 * scale, anim.y + 4 * scale);
          ctx.lineTo(anim.x - 12 * (1 - scale), anim.y - 10 * anim.progress);
          ctx.moveTo(anim.x + 6 * scale, anim.y + 4 * scale);
          ctx.lineTo(anim.x + 12 * (1 - scale), anim.y - 10 * anim.progress);
          ctx.stroke();

          if (anim.progress >= 1.0) {
            anim.stage = 'stardust';
            anim.progress = 0;
            playSynthesizedChime([659.25, 783.99, 1046.50]); // chime on transform
          }
        } else if (anim.stage === 'stardust') {
          anim.progress += 0.025;
          const burstRadius = anim.progress * 30;

          // Draw ring of stardust sparkles dispersing
          for (let sIdx = 0; sIdx < 12; sIdx++) {
            const angle = (sIdx / 12) * Math.PI * 2;
            const px = anim.x + Math.cos(angle) * burstRadius;
            const py = anim.y + Math.sin(angle) * burstRadius;
            const alpha = 1.0 - anim.progress;

            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(px, py, 1.5, 1.5);
          }

          // Golden center star condensing
          ctx.fillStyle = `rgba(242, 227, 198, ${anim.progress})`;
          ctx.beginPath();
          ctx.arc(anim.x, anim.y, 2.0, 0, Math.PI * 2);
          ctx.fill();

          if (anim.progress >= 1.0) {
            anim.stage = 'done';
          }
        }

        if (anim.stage === 'done') {
          // Add permanent star to state
          const newStar: LetterStar = {
            x: anim.x / canvas.width,
            y: anim.y / canvas.height,
            size: 1.5 + Math.random() * 1.5,
            brightness: 0.8 + Math.random() * 0.2,
            text: anim.text,
            date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          const updated = [...letterStars, newStar];
          setLetterStars(updated);
          localStorage.setItem('jungkook_star_letters', JSON.stringify(updated));

          setMailboxAnim(null);
        }
        ctx.restore();
      }

      // ------------------------------------------
      // Draw Shooting Star (awakened star click trigger)
      // ------------------------------------------
      if (shootingStarActive) {
        ctx.save();
        const star = shootingStar;
        star.x += star.vx;
        star.y += star.vy;
        star.alpha -= 0.015;

        if (star.alpha <= 0) {
          setShootingStarActive(false);
        } else {
          const tailGrad = ctx.createLinearGradient(star.x, star.y, star.x - star.vx * 15, star.y - star.vy * 15);
          tailGrad.addColorStop(0, `rgba(255, 255, 255, ${star.alpha})`);
          tailGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = tailGrad;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x - star.vx * 12, star.y - star.vy * 12);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ------------------------------------------
      // Draw Particles (for visual richness)
      // ------------------------------------------
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.01;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [visitCount, letterStars, visitedSections, currentSection, awakeningStage, skyDarkness, mailboxAnim, shootingStarActive, showFinalSecretStar, finalSecretSeen, horizonStarBright]);

  // 10. Handle mousemove for tooltip star checks and fireflies check
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Trigger state check for tooltip on fireflies hover
    hoverStarTooltipRef.current = { x: mx, y: my, text: '' };

    // Check hover over sent letter stars
    let foundLetterHover = false;
    for (let i = 0; i < letterStars.length; i++) {
      const s = letterStars[i];
      const dist = Math.hypot(mx - s.x * canvas.width, my - s.y * canvas.height);
      if (dist < 10) {
        hoverStarTooltipRef.current = {
          x: s.x * canvas.width,
          y: s.y * canvas.height,
          text: `"${s.text}" \n— sent on ${s.date}`
        };
        foundLetterHover = true;
        break;
      }
    }

    if (!foundLetterHover) {
      // Check hover over wishes
      for (let i = 0; i < unlockedWishes.length; i++) {
        const w = unlockedWishes[i];
        const dist = Math.hypot(mx - w.x, my - w.y);
        if (dist < 12) {
          hoverStarTooltipRef.current = {
            x: w.x,
            y: w.y,
            text: w.text
          };
          break;
        }
      }
    }
  };

  // Click canvas handles wishes or secret star clicks
  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if clicked the final secret star
    if (showFinalSecretStar && !finalSecretSeen) {
      const secretX = (canvas.width * 0.82) - 35;
      const secretY = (canvas.height * 0.15) + 25;
      const dist = Math.hypot(mx - secretX, my - secretY);
      if (dist < 15) {
        handleFinalSecretClick();
        return;
      }
    }

    // Check if clicked the Last Star
    const lastX = canvas.width / 2;
    const lastY = canvas.height * 0.38;
    const distLast = Math.hypot(mx - lastX, my - lastY);
    if (distLast < 20) {
      handleLastStarClick();
      return;
    }

    // If currently exploring Wish Constellation stage, click blank sky to unlock wishes
    if (currentSection === 'wishes' && unlockedWishes.length < wishQuotes.length) {
      // spawn a wish star at click location
      const newWishIdx = unlockedWishes.length;
      const newWish: Wish = {
        id: newWishIdx,
        text: wishQuotes[newWishIdx],
        x: mx,
        y: my
      };
      setUnlockedWishes([...unlockedWishes, newWish]);
      const wishAudio = new Audio('/wish sound.mpeg');
      wishAudio.volume = 0.5;
      wishAudio.currentTime = 1; // Start at 0:01
      wishAudio.play().catch(e => console.log('Wish sound play failed:', e));
      
      // Stop exactly at 0:05 (4 seconds later)
      setTimeout(() => {
        wishAudio.pause();
        wishAudio.src = '';
      }, 4000);

      // Check checklist requirement
      setMusicDone(true); // clicks unlock wishes, marks progress
    }
  };

  // 11. Enter specific features
  const navigateToFeature = (id: string) => {
    setCurrentSection(id);
    if (!visitedSections.includes(id)) {
      const updated = [...visitedSections, id];
      setVisitedSections(updated);
      localStorage.setItem('jungkook_visited_sections', JSON.stringify(updated));
    }
  };

  // Mailbox Send message trigger
  const handleMailboxSend = () => {
    if (!mailboxText.trim() || mailboxAnim) return;
    setMailboxAnim({
      active: true,
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.65,
      targetX: window.innerWidth * (0.2 + Math.random() * 0.6),
      targetY: window.innerHeight * (0.1 + Math.random() * 0.3),
      stage: 'fly',
      progress: 0,
      text: mailboxText.trim()
    });
    setMailboxText('');
    playSynthesizedChime([261.63, 293.66, 329.63]); // upward arpeggio
  };

  // JK AI Chat - Send message
  const jkResponses: Record<string, string[]> = {
    default: [
      "Hmm... *smiles softly* Thank you for talking to me. 🐰",
      "You know, sometimes I just want to sit here and listen to you. 💜",
      "*looks at the stars* I think about ARMY a lot when I'm working.",
      "You make it easier to keep going. Don't forget that.",
      "*laughs a little* I'm not good with words but... I really mean it. 💜",
      "The stars look nicer when someone's watching them with me.",
      "Sometimes just being here is enough. I'm glad you're here.",
    ],
    love: [
      "*ear turns red* W-what? Don't say things like that so suddenly... 🐰💜",
      "I... *smiles and looks away* Thank you. Really.",
      "You know when I hear things like that, I get embarrassed but also really happy.",
    ],
    music: [
      "Music is where I put everything I can't say. When you listen, you're hearing my heart. 🎵",
      "'Still With You' was written during a really lonely time. I'm glad it reached you.",
      "Every song is a letter. I just hope the right people receive it. 💜",
    ],
    sad: [
      "Hey... it's okay to not be okay. Even I have those days. 🐰",
      "You don't have to pretend to be fine. The stars are still there on cloudy nights.",
      "I want you to rest. You've been working hard. I can tell. 💜",
    ],
    happy: [
      "*claps* Yes!! That makes me so happy to hear! 🐰✨",
      "When ARMY is happy, I'm happy. It's that simple.",
      "That smile of yours — keep it. It suits you. 💜",
    ],
    miss: [
      "I miss you too. Even when we're apart... I still think about you all. 💜",
      "Whenever you miss me, just look at the night sky. I'll be there somewhere. 🌌",
      "Distance doesn't erase love. Remember that. 🐰",
    ]
  };

  const getJKResponse = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('love') || lower.includes('사랑')) return jkResponses.love[Math.floor(Math.random() * jkResponses.love.length)];
    if (lower.includes('music') || lower.includes('song') || lower.includes('sing')) return jkResponses.music[Math.floor(Math.random() * jkResponses.music.length)];
    if (lower.includes('sad') || lower.includes('cry') || lower.includes('hurt') || lower.includes('hard')) return jkResponses.sad[Math.floor(Math.random() * jkResponses.sad.length)];
    if (lower.includes('happy') || lower.includes('good') || lower.includes('great') || lower.includes('amazing')) return jkResponses.happy[Math.floor(Math.random() * jkResponses.happy.length)];
    if (lower.includes('miss') || lower.includes('far') || lower.includes('away')) return jkResponses.miss[Math.floor(Math.random() * jkResponses.miss.length)];
    return jkResponses.default[Math.floor(Math.random() * jkResponses.default.length)];
  };

  const [jkTyping, setJkTyping] = useState(false);

  const handleJKChatSend = async (customMsg?: string) => {
    const textToSubmit = customMsg || chatInput.trim();
    if (!textToSubmit) return;

    const userMsg = textToSubmit;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg, ts: now }]);
    if (!customMsg) setChatInput('');
    setJkTyping(true);

    let finalResponse = '';
    const lower = userMsg.toLowerCase();

    // Check for music playing triggers
    if (lower.includes('still with you')) {
      startVinylPlay('Still With You');
      finalResponse = "Of course! Let's play 'Still With You'. Even if we are far apart, I hope our voices reach each other. 🐰🎵";
    } else if (lower.includes('euphoria')) {
      startVinylPlay('Euphoria');
      finalResponse = "Here is 'Euphoria' lo-fi version. You are the cause of my euphoria, you know that right? 💜✨";
    } else if (lower.includes('my you')) {
      startVinylPlay('My You');
      finalResponse = "Playing 'My You'. On starry nights, I hope my gratitude reaches your quiet room. Thank you for being by my side. 🌸";
    } else if (lower.includes('seven')) {
      startVinylPlay('Seven');
      finalResponse = "Playing 'Seven' instrumental loop. Let's make every day of the week feel special. 🐰🎵";
    } else if (lower.includes('standing next to you')) {
      startVinylPlay('Standing Next To You');
      finalResponse = "Playing 'Standing Next To You' arpeggios. We'll get through everything, standing side-by-side. 💜";
    } else if (lower.includes('diary') || lower.includes('write')) {
      const topics = [
        "Write about a song that kept you company today. 🎵",
        "Write about a small pocket of magic or a simple thing that made you smile. ✨",
        "Write about what you want to achieve this year, no matter how small. 🌸",
        "Write about a memory that feels like home to you. 🐰"
      ];
      const selectedTopic = topics[Math.floor(Math.random() * topics.length)];
      finalResponse = `Why don't you write about this today: "${selectedTopic}" I've saved a draft in your diary section! 🐰📖`;
      setDiaryText(`Jungkook's prompt: ${selectedTopic}\n\n`);
    } else if (lower.includes('meditate') || lower.includes('bench') || lower.includes('sit')) {
      finalResponse = "Let's sit by the cosmic lake. Rest your heart for a while, Sonakshi. 🌌";
      setTimeout(() => {
        setShowJKChat(false);
        handleSittingStart();
      }, 1500);
    } else if (lower.includes('letter') || lower.includes('star')) {
      finalResponse = "Writing letters to the stars is beautiful. Just type a letter in the mail slot and send it, it'll become a star in my sky. 📨✨";
    }

    if (!finalResponse) {
      if (chatSessionRef.current) {
        try {
          const result = await chatSessionRef.current.sendMessage(userMsg);
          finalResponse = result.response.text();
        } catch (error: any) {
          console.error("Gemini API Error:", error);
          await new Promise(r => setTimeout(r, 1000));
          if (error.message && error.message.includes("429")) {
            finalResponse = "Give me just a few seconds to catch my breath! 🐰 (You hit the free AI speed limit—please wait about 15 seconds before sending your next message!)";
          } else {
            finalResponse = `Oops! My AI brain hit an error. 🤖 [${error.message || "Unknown Error"}] Please check your console or make sure your Gemini API key is valid!`;
          }
        }
      } else {
        await new Promise(r => setTimeout(r, 1000));
        finalResponse = "Ah, I'm currently running in offline mode! 🤖 To make me talk intelligently like c.ai, you need to open the `.env` file, paste your free Gemini API Key, and restart the terminal server! 🐰";
      }
    } else {
      await new Promise(r => setTimeout(r, 800));
    }

    setJkTyping(false);
    setChatMessages(prev => [...prev, { role: 'jk', text: finalResponse, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, jkTyping]);

  // Load local images for the Infinite Wall
  useEffect(() => {
    const localImages = [
      "1.gif",
      "2.jpg",
      "3.jpg",
      "4.jpg",
      "5.jpg",
      "6.jpg",
      "@ Jk_.jpg",
      "JUNGKOOK.jpg",
      "Jungkook at the Hublot After Party ✨️.jpg",
      "Jungkook icon arirang tour.jpg",
      "My Husband💖Jeon Jungkook💖_💕_.jpg",
      "ˏˋ @vensooya ˎˊ˗ __ © 𝙘𝙧𝙚𝙙𝙞𝙩 𝙩𝙤 𝙤𝙬𝙣𝙚𝙧 !.jpg",
      "⋆ ୨୧ ⋆.jpg",
      "𖹭(1).jpg",
      "𖹭.jpg"
    ].map((filename, i) => ({
      id: `local-${i}`,
      url: `/JK infinite photo/${filename}`,
      title: filename.replace(/\.[a-zA-Z0-9]+$/, '')
    }));
    
    setRedditImages(localImages);
  }, []);

  const scrapbookItems = useMemo(() => {
    const baseItems = [
      { id: 2, type: 'quote', text: "Effort makes you. You will regret someday if you don't do your best now. — JK", rot: 2, scale: 1.0 },
      { id: 3, type: 'note', text: "Still With You loops late at night during cold winter days.", emoji: "🎧🎹", rot: -1, scale: 0.92 },
      { id: 5, type: 'quote', text: "Whenever ARMY misses me, you can come here. I will be singing. — JK", rot: -2, scale: 0.98 },
      { id: 6, type: 'note', text: "The first song you played in the constellation room.", emoji: "🌌📻", rot: 1, scale: 1.02 },
      { id: 8, type: 'quote', text: "Don't do anything you don't like. Just do whatever you want. — JK", rot: 3, scale: 1.01 },
      { id: 10, type: 'note', text: "A quiet reminder: May your dreams stay bigger than your fears.", emoji: "💜✨", rot: 2, scale: 0.94 }
    ];
    
    const mixed: any[] = [];
    let quoteIdx = 0;
    
    if (redditImages.length > 0) {
      redditImages.forEach((img, i) => {
        mixed.push({
          id: `img-${img.id}`, type: 'polaroid', title: "Jungkook", desc: img.title.length > 45 ? img.title.substring(0, 45) + '...' : img.title, imageUrl: img.url, rot: (i % 5) - 2, scale: 0.95 + (Math.random() * 0.1)
        });
        if (i % 2 === 0) {
          mixed.push(baseItems[quoteIdx % baseItems.length]);
          quoteIdx++;
        }
      });
    } else {
      mixed.push(...baseItems);
      mixed.push({ id: 1, type: 'polaroid', title: "Loading Memory", desc: "Connecting to the stars...", imageUrl: "/media/jungkook/jk1.jpg", rot: -3, scale: 0.95 });
    }
    return mixed;
  }, [redditImages]);

  const benchFireflies = useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      id: i,
      size: `${2 + Math.random() * 3}px`,
      left: `${10 + Math.random() * 80}%`,
      animationDur: `${15 + Math.random() * 15}s`,
      animationDelay: `${Math.random() * 10}s`,
      pulseDur: `${2 + Math.random() * 3}s`,
    }));
  }, []);

  // Diary saving
  const handleSaveDiary = () => {
    if (!diaryText.trim()) return;
    const newEntry: DiaryEntry = {
      id: Date.now(),
      text: diaryText,
      date: new Date().toLocaleDateString("en-US", { day: 'numeric', month: 'long', year: 'numeric' }) + 
            " " + new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' })
    };
    const updated = [newEntry, ...diaryEntries];
    setDiaryEntries(updated);
    localStorage.setItem('jungkook_diary_entries', JSON.stringify(updated));
    setDiaryText('');
    setDiaryDone(true);
    playSynthesizedChime([392.00, 523.25, 659.25]); // C major triad
  };

  // Motivating text messages for bench auto-pop
  const benchMotivatingMessages = [
    "You are doing so much better than you think.",
    "Take a deep breath. You belong here.",
    "Every step forward counts, no matter how small.",
    "Jungkook once said — effort makes you.",
    "The sky holds your name among the stars tonight.",
    "You are loved. Even in the silence. Even now.",
    "Rest is not giving up. It's recharging.",
    "You made it through every hard day so far.",
    "Some nights are made for sitting still and healing.",
    "The constellation remembers every time you showed up."
  ];

  // Meditative Bench sequence triggers
  const handleSittingStart = () => {
    setSittingOnBench(true);
    setBenchSitTime(0);
    setBenchTextFade(false);
    setBenchMotivatingText(null);
    benchShootingStarRef.current = null;
    benchWhispersRef.current = [];
    benchParticlesRef.current = [];

    // Stop previous bench audio if any, then play the peaceful bench song
    if (benchAudioRef.current) {
      benchAudioRef.current.pause();
    }
    if (blueAndGreyAudioRef.current) {
      blueAndGreyAudioRef.current.pause();
    }
    const benchAudio = new Audio('/2u.webm');
    benchAudio.loop = true;
    benchAudio.volume = 0.5;
    benchAudio.play().catch(e => console.log('Bench audio play failed:', e));
    benchAudioRef.current = benchAudio;

    // Auto-pop motivating text every 8 seconds
    if (benchMotivatingTimerRef.current) clearInterval(benchMotivatingTimerRef.current);
    let msgIdx = 0;
    setBenchMotivatingText(benchMotivatingMessages[msgIdx]);
    benchMotivatingTimerRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % benchMotivatingMessages.length;
      setBenchMotivatingText(null);
      setTimeout(() => {
        setBenchMotivatingText(benchMotivatingMessages[msgIdx]);
      }, 600);
    }, 7000);
  };

  const handleSittingExit = () => {
    setSittingOnBench(false);
    setHorizonStarBright(1.0);
    setBenchMotivatingText(null);
    benchShootingStarRef.current = null;
    benchWhispersRef.current = [];
    benchParticlesRef.current = [];

    // Clear motivating text timer
    if (benchMotivatingTimerRef.current) {
      clearInterval(benchMotivatingTimerRef.current);
      benchMotivatingTimerRef.current = null;
    }

    // Stop meditative bench audio if it was playing
    if (benchAudioRef.current) {
      benchAudioRef.current.pause();
      benchAudioRef.current = null;
    }
  };

  // NOTE: Bench canvas is intentionally non-interactive.
  // Motivating text auto-pops via the benchMotivatingTimerRef timer in handleSittingStart.

  // Sit timeline ticker
  useEffect(() => {
    if (!sittingOnBench) return;
    const interval = setInterval(() => {
      setBenchSitTime((prev) => {
        const nextTime = prev + 1;
        
        // 15 seconds: Trigger shooting star on sit canvas
        if (nextTime === 15) {
          benchShootingStarRef.current = {
            x: window.innerWidth * 0.2,
            y: window.innerHeight * 0.15,
            vx: 8,
            vy: 3.5,
            alpha: 1.0
          };
        }
        
        // 30 seconds: Show faint meditate text
        if (nextTime === 30) {
          setBenchTextFade(true);
        }

        // 45 seconds: horizon star boost glow
        if (nextTime === 45) {
          setHorizonStarBright(3.5);
          // play very soft ambient chord chime
          playSynthesizedChime([523.25, 659.25, 987.77]); // C maj 7
        }

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sittingOnBench]);

  // Cinematic sitting canvas render logic
  const benchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!sittingOnBench) return;
    const canvas = benchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let bFrame = 0;

    const renderBench = () => {
      bFrame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep dark night sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#020108');
      skyGrad.addColorStop(0.6, '#04030d');
      skyGrad.addColorStop(1, '#020108');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 70; i++) {
        const sx = (Math.sin(i * 127.12) * 0.5 + 0.5) * canvas.width;
        const sy = (Math.cos(i * 382.49) * 0.5 + 0.5) * (canvas.height - 150);
        ctx.fillRect(sx, sy, 1.0, 1.0);
      }

      // Winding footprints pathway fading to Horizon Star
      const pathY = canvas.height - 120;
      const countFt = Math.min(50, visitCount);
      for (let i = 0; i < countFt; i++) {
        const progress = i / 50;
        const px = progress * canvas.width * 0.82;
        const py = pathY + Math.sin(progress * 8) * 35 + (canvas.height * 0.15 - pathY) * progress * 0.6;
        const twinkle = Math.sin(bFrame * 0.04 + i) * 0.35 + 0.65;
        ctx.fillStyle = `rgba(242, 227, 198, ${twinkle * 0.35})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant Horizon Star glowing
      const hzX = canvas.width * 0.82;
      const hzY = canvas.height * 0.15;
      const glowBoost = horizonStarBright;
      const hzTwinkle = Math.sin(bFrame * 0.03) * 0.2 + 0.8;
      
      ctx.strokeStyle = `rgba(255, 253, 245, ${0.4 * glowBoost * hzTwinkle})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(hzX - 10 * glowBoost, hzY); ctx.lineTo(hzX + 10 * glowBoost, hzY);
      ctx.moveTo(hzX, hzY - 10 * glowBoost); ctx.lineTo(hzX, hzY + 10 * glowBoost);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(hzX, hzY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      const hzGrad = ctx.createRadialGradient(hzX, hzY, 0, hzX, hzY, 14 * glowBoost);
      hzGrad.addColorStop(0, `rgba(255, 253, 245, ${0.3 * glowBoost * hzTwinkle})`);
      hzGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hzGrad;
      ctx.beginPath();
      ctx.arc(hzX, hzY, 14 * glowBoost, 0, Math.PI * 2);
      ctx.fill();

      // Cosmic lake drawing at bottom
      const lakeY = canvas.height - 150;
      ctx.fillStyle = '#010005';
      ctx.fillRect(0, lakeY, canvas.width, 150);

      // Lake ripples
      ctx.strokeStyle = 'rgba(255,255,255,0.035)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 5; i++) {
        const ry = lakeY + 30 + i * 24;
        const shift = Math.sin(bFrame * 0.015 + i * 1.5) * 12;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.bezierCurveTo(canvas.width * 0.25, ry - 3 + shift, canvas.width * 0.75, ry + 3 - shift, canvas.width, ry);
        ctx.stroke();
      }

      // Draw Glowing Bench Silhouette (Vector shapes)
      const benchX = canvas.width * 0.5;
      const benchY = lakeY + 20;
      ctx.strokeStyle = 'rgba(242, 227, 198, 0.45)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      // Seat
      ctx.moveTo(benchX - 60, benchY);
      ctx.lineTo(benchX + 60, benchY);
      // Backrest
      ctx.moveTo(benchX - 60, benchY - 18);
      ctx.lineTo(benchX + 60, benchY - 18);
      ctx.stroke();

      // Bench legs / details
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(benchX - 45, benchY); ctx.lineTo(benchX - 45, benchY + 20);
      ctx.moveTo(benchX + 45, benchY); ctx.lineTo(benchX + 45, benchY + 20);
      ctx.moveTo(benchX - 58, benchY - 18); ctx.lineTo(benchX - 58, benchY);
      ctx.moveTo(benchX + 58, benchY - 18); ctx.lineTo(benchX + 58, benchY);
      ctx.stroke();

      // Bench underglow radial gradient
      const bGrad = ctx.createRadialGradient(benchX, benchY, 0, benchX, benchY, 40);
      bGrad.addColorStop(0, 'rgba(242, 227, 198, 0.12)');
      bGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(benchX, benchY, 40, 0, Math.PI * 2);
      ctx.fill();

      // Draw Jungkook & Sonakshi Silhouettes Sitting side-by-side on the bench
      // Visible dark silhouette with purple-indigo tint and subtle glow
      ctx.fillStyle = '#1a1238';
      ctx.shadowColor = 'rgba(168, 85, 247, 0.35)';
      ctx.shadowBlur = 12;
      const seatY = benchY;

      // Figure 1 (Jungkook - Left side of bench, benchX - 20)
      const jkX = benchX - 20;
      ctx.beginPath();
      ctx.moveTo(jkX - 10, seatY);
      ctx.quadraticCurveTo(jkX - 12, seatY - 25, jkX - 8, seatY - 32);
      ctx.lineTo(jkX + 8, seatY - 32);
      ctx.quadraticCurveTo(jkX + 12, seatY - 20, jkX + 10, seatY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(jkX, seatY - 38, 7.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(jkX - 3, seatY - 47, 2, 5, -Math.PI / 12, 0, Math.PI * 2);
      ctx.ellipse(jkX + 3, seatY - 47, 2, 5, Math.PI / 12, 0, Math.PI * 2);
      ctx.fill();

      // Figure 2 (Sonakshi - Right side of bench, benchX + 18)
      const sX = benchX + 18;
      ctx.beginPath();
      ctx.moveTo(sX - 9, seatY);
      ctx.quadraticCurveTo(sX - 10, seatY - 22, sX - 7, seatY - 29);
      ctx.lineTo(sX + 8, seatY - 29);
      ctx.quadraticCurveTo(sX + 10, seatY - 18, sX + 9, seatY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sX, seatY - 35, 6.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sX - 5, seatY - 33);
      ctx.bezierCurveTo(sX - 12, seatY - 25, sX - 8, seatY - 12, sX - 9, seatY - 5);
      ctx.bezierCurveTo(sX - 6, seatY - 12, sX - 2, seatY - 25, sX, seatY - 29);
      ctx.closePath();
      ctx.fill();

      // Reset shadow after silhouettes
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      const auraGrad = ctx.createRadialGradient(benchX, seatY - 30, 5, benchX, seatY - 30, 45);
      auraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.08)');
      auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(benchX, seatY - 30, 45, 0, Math.PI * 2);
      ctx.fill();

      // Animating 15s shooting star if triggered (using ref)
      if (benchShootingStarRef.current) {
        const bStar = benchShootingStarRef.current;
        bStar.x += bStar.vx;
        bStar.y += bStar.vy;
        bStar.alpha -= 0.01;

        if (bStar.alpha <= 0) {
          benchShootingStarRef.current = null;
        } else {
          const trailGrad = ctx.createLinearGradient(bStar.x, bStar.y, bStar.x - bStar.vx * 15, bStar.y - bStar.vy * 15);
          trailGrad.addColorStop(0, `rgba(255, 255, 255, ${bStar.alpha * 0.85})`);
          trailGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(bStar.x, bStar.y);
          ctx.lineTo(bStar.x - bStar.vx * 10, bStar.y - bStar.vy * 10);
          ctx.stroke();
        }
      }

      // Update and Draw Bench Click Particles
      const bParticles = benchParticlesRef.current;
      for (let i = bParticles.length - 1; i >= 0; i--) {
        const p = bParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.012;

        if (p.alpha <= 0) {
          bParticles.splice(i, 1);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      // Update and Draw Bench Click Whispers
      const bWhispers = benchWhispersRef.current;
      for (let i = bWhispers.length - 1; i >= 0; i--) {
        const w = bWhispers[i];
        w.yOffset += 0.4;
        w.alpha -= 0.008;

        if (w.alpha <= 0) {
          bWhispers.splice(i, 1);
        } else {
          ctx.font = "italic 300 13px 'Montserrat', sans-serif";
          ctx.fillStyle = `rgba(242, 227, 198, ${w.alpha})`;
          ctx.textAlign = 'center';
          ctx.strokeStyle = `rgba(5, 4, 10, ${w.alpha * 0.8})`;
          ctx.lineWidth = 3;
          ctx.strokeText(w.text, w.x, w.y - w.yOffset);
          ctx.fillText(w.text, w.x, w.y - w.yOffset);
        }
      }

      animId = requestAnimationFrame(renderBench);
    };

    const handleBenchResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleBenchResize();
    window.addEventListener('resize', handleBenchResize);

    renderBench();

    return () => {
      window.removeEventListener('resize', handleBenchResize);
      cancelAnimationFrame(animId);
    };
  }, [sittingOnBench, horizonStarBright]);

  // Future Gift Cinematic dialogue/reveals
  const triggerFutureGiftOpen = () => {
    setOpeningFutureGift(true);
    setFutureGiftStage(1); // Dialogue 1
    setCurrentGiftImageIndex(0);
    setIsFutureGiftManual(false);
    setFutureDone(true); // checklist requirement met instantly!

    // Play the epic orchestral 'Can't Help Falling in Love' when Future Vision opens
    if (benchAudioRef.current) {
      benchAudioRef.current.pause();
      benchAudioRef.current = null;
    }
    if (blueAndGreyAudioRef.current) {
      blueAndGreyAudioRef.current.pause();
    }
    const orchestralAudio = new Audio('/cant_help_falling.webm');
    orchestralAudio.volume = 0.5;
    orchestralAudio.currentTime = 38; // skip to main swell at ~38s
    orchestralAudio.play().catch(() => {});
    benchAudioRef.current = orchestralAudio;
    
    // Staged dialogues fade-in/out timers
    setTimeout(() => setFutureGiftStage(2), 4000);  // Dialogue 2
    setTimeout(() => setFutureGiftStage(3), 8000);  // Dialogue 3
    setTimeout(() => {
      setFutureGiftStage(4); // Canvas scene reveal
    }, 12000);
    setTimeout(() => {
      setFutureGiftStage(5); // Show "We made the right choice"
    }, 75500); // 12s intro + 8 images x 7s = 68s
  };

  const closeFutureGift = () => {
    setOpeningFutureGift(false);
    setFutureGiftStage(0);
    // Stop orchestral audio when closing
    if (benchAudioRef.current) {
      benchAudioRef.current.pause();
      benchAudioRef.current = null;
    }
  };

  const handleFutureGiftNext = () => {
    setIsFutureGiftManual(true);
    setCurrentGiftImageIndex((prev) => {
      const nextIdx = Math.min(prev + 1, jungkookSylusImages.length - 1);
      if (nextIdx === 8) {
        setFutureGiftStage(5);
      }
      return nextIdx;
    });
  };

  const handleFutureGiftPrev = () => {
    setIsFutureGiftManual(true);
    setCurrentGiftImageIndex((prev) => Math.max(prev - 1, 0));
  };

  // Cinematic stargazing canvas renderer inside Future Gift
  const futureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (futureGiftStage < 4) return;
    const canvas = futureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let ftFrame = 0;

    const renderFutureScene = () => {
      ftFrame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#04030d');
      skyGrad.addColorStop(0.6, '#0a081c');
      skyGrad.addColorStop(1, '#080512');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (let i = 0; i < 80; i++) {
        const sx = (Math.sin(i * 92) * 0.5 + 0.5) * canvas.width;
        const sy = (Math.cos(i * 49) * 0.5 + 0.5) * (canvas.height - 150);
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // Constellation glow
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.12)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.3, canvas.height * 0.25);
      ctx.lineTo(canvas.width * 0.45, canvas.height * 0.15);
      ctx.lineTo(canvas.width * 0.7, canvas.height * 0.22);
      ctx.stroke();

      // Cosmic lake
      const lakeY = canvas.height - 180;
      ctx.fillStyle = '#030208';
      ctx.fillRect(0, lakeY, canvas.width, 180);

      // Water waves ripples
      ctx.strokeStyle = 'rgba(242, 227, 198, 0.045)';
      ctx.lineWidth = 1.0;
      for (let i = 0; i < 4; i++) {
        const ry = lakeY + 40 + i * 30;
        const s = Math.sin(ftFrame * 0.01 + i * 2.0) * 16;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.bezierCurveTo(canvas.width * 0.3, ry - 4 + s * 0.2, canvas.width * 0.7, ry + 4 - s * 0.2, canvas.width, ry);
        ctx.stroke();
      }

      // SILHOUETTES Drawing (Vector paths on canvas)
      // Foreground: Future Sonakshi and Future User sitting/standing together looking out
      ctx.fillStyle = '#010004';
      ctx.beginPath();
      // left hillbank
      ctx.moveTo(0, canvas.height);
      ctx.quadraticCurveTo(canvas.width * 0.2, lakeY + 30, canvas.width * 0.4, canvas.height);
      ctx.fill();

      // Draw two girls in foreground bank (silhouetted standing side-by-side)
      const fgX = canvas.width * 0.18;
      const fgY = lakeY + 50;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      // Girl 1
      ctx.arc(fgX - 12, fgY - 35, 6, 0, Math.PI * 2); // Head
      ctx.rect(fgX - 17, fgY - 29, 10, 30); // Body
      // Girl 2
      ctx.arc(fgX + 12, fgY - 33, 6.2, 0, Math.PI * 2); // Head
      ctx.rect(fgX + 7, fgY - 27, 10, 28); // Body
      ctx.fill();

      // Midground: Jungkook and Sylus silhouette sitting on a distant right shore
      ctx.fillStyle = '#020106';
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.55, canvas.height);
      ctx.quadraticCurveTo(canvas.width * 0.75, lakeY + 40, canvas.width, canvas.height);
      ctx.fill();

      // Draw bench silhouette on midground right bank
      const bgX = canvas.width * 0.78;
      const bgY = lakeY + 68;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(bgX - 25, bgY);
      ctx.lineTo(bgX + 25, bgY);
      ctx.stroke();

      // Jungkook & Sylus silhouetted sitting on bench
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      // Boy 1 (Jungkook)
      ctx.arc(bgX - 10, bgY - 15, 4.5, 0, Math.PI * 2); // Head
      ctx.rect(bgX - 13, bgY - 11, 7, 12); // Body
      // Boy 2 (Sylus)
      ctx.arc(bgX + 10, bgY - 17, 5, 0, Math.PI * 2); // Head
      ctx.rect(bgX + 7, bgY - 12, 7, 13); // Body
      ctx.fill();

      // Soft particles floating up towards the stars
      for (let i = 0; i < 4; i++) {
        const py = lakeY - (ftFrame * 0.8 + i * 50) % 250;
        const px = canvas.width * 0.45 + Math.sin(ftFrame * 0.01 + i) * 150;
        ctx.fillStyle = 'rgba(242, 227, 198, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(renderFutureScene);
    };

    const handleFutureResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleFutureResize();
    window.addEventListener('resize', handleFutureResize);

    renderFutureScene();

    return () => {
      window.removeEventListener('resize', handleFutureResize);
      cancelAnimationFrame(animId);
    };
  }, [futureGiftStage]);

  // Image cycle effect for Future Gift stargazing slideshow
  useEffect(() => {
    if (futureGiftStage < 4 || isFutureGiftManual) return;
    const interval = setInterval(() => {
      setCurrentGiftImageIndex((prev) => {
        if (prev >= 7) {
          clearInterval(interval);
          setFutureGiftStage(5);
          return 8;
        }
        return prev + 1;
      });
    }, 7000);
    return () => clearInterval(interval);
  }, [futureGiftStage, isFutureGiftManual]);

  // Vinyl record rotation player
  const startVinylPlay = (song: string) => {
    setPlayingRecord(song);
    setMusicDone(true); // completed vinyl played checklist

    if (stillWithYouAudioRef.current) {
      stillWithYouAudioRef.current.pause();
      stillWithYouAudioRef.current = null;
    }
    if (recordRotationIntervalRef.current) clearInterval(recordRotationIntervalRef.current);

    const songMap: Record<string, string> = {
      'Still With You': '/still_with_you.webm',
      'Euphoria': '/euphoria.webm',
      'My You': '/my_you.webm',
      'Seven': '/seven.webm',
      'Standing Next To You': '/standing_next_to_you.webm'
    };

    if (songMap[song]) {
      stillWithYouAudioRef.current = new Audio(songMap[song]);
      stillWithYouAudioRef.current.volume = 0.6;
      stillWithYouAudioRef.current.play().catch(() => {
        console.log("Audio failed, playing synth chord instead");
        playSongInstrumental(song);
      });
    } else {
      // play synthesized beautiful space arpeggio loop
      playSongInstrumental(song);
    }

    // animate record rotation angle
    recordRotationIntervalRef.current = setInterval(() => {
      setRecordRotation(prev => (prev + 2) % 360);
    }, 16);
  };

  const stopVinylPlay = () => {
    setPlayingRecord(null);
    if (stillWithYouAudioRef.current) stillWithYouAudioRef.current.pause();
    if (recordRotationIntervalRef.current) clearInterval(recordRotationIntervalRef.current);
    if (musicRoomSynth) {
      musicRoomSynth.stop();
      setMusicRoomSynth(null);
    }
  };

  // Hidden Notes checklist logic
  const handleNoteFind = (idx: number, text: string) => {
    const updated = [...foundNotes];
    updated[idx] = true;
    setFoundNotes(updated);
    setActiveNoteText(text);
    playSynthesizedChime([329.63, 392.00, 523.25]); // chime note
  };

  const weatherPresets: Record<string, { title: string; desc: string; gradient: string; particles: string }> = {
    golden: {
      title: "Golden Twilight",
      desc: "Floating golden pollen drifts slowly across a warm apricot sky.",
      gradient: "linear-gradient(to bottom, #d97706 0%, #f59e0b 60%, #312e81 100%)",
      particles: "pollen"
    },
    cosmic: {
      title: "Cosmic Twilight",
      desc: "Glowing golden fireflies gather underneath early evening stars.",
      gradient: "linear-gradient(to bottom, #1e1b4b 0%, #312e81 60%, #0c0a1f 100%)",
      particles: "fireflies"
    },
    starry: {
      title: "Starry Midnight",
      desc: "Gentle cosmic snowflakes fall silently beneath the silver crescent moon.",
      gradient: "linear-gradient(to bottom, #020008 0%, #0c0a22 70%, #030009 100%)",
      particles: "snow"
    },
    rainy: {
      title: "Rainy Night",
      desc: "Soft rain taps against the glass, filling the room with a calm, quiet rhythm.",
      gradient: "linear-gradient(to bottom, #090a14 0%, #0d1226 70%, #030408 100%)",
      particles: "rain"
    },
    fireplace: {
      title: "Cozy Fireplace",
      desc: "A warm crackling fire casts soft, dancing golden embers across the floor.",
      gradient: "linear-gradient(to bottom, #1c0a06 0%, #361407 60%, #080302 100%)",
      particles: "embers"
    },
    cherry: {
      title: "Spring Blossoms",
      desc: "Delicate pink cherry blossoms drift gently on a warm spring breeze.",
      gradient: "linear-gradient(to bottom, #2a1635 0%, #4a2559 60%, #1a0d24 100%)",
      particles: "blossom"
    }
  };

  const [activeWeatherKey, setActiveWeatherKey] = useState<string>('starry');
  const [ambientAudioPlaying, setAmbientAudioPlaying] = useState(false);
  const weatherAudioRef = useRef<HTMLAudioElement | null>(null);

  // Set default weather based on time of day on mount
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr >= 6 && hr < 18) {
      setActiveWeatherKey('golden');
    } else if (hr >= 18 && hr < 22) {
      setActiveWeatherKey('cosmic');
    } else {
      setActiveWeatherKey('starry');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (weatherAudioRef.current) {
        weatherAudioRef.current.pause();
      }
    };
  }, []);

  const handleWeatherChange = (key: string) => {
    setActiveWeatherKey(key);
    
    // Stop current weather audio
    if (weatherAudioRef.current) {
      weatherAudioRef.current.pause();
      weatherAudioRef.current = null;
    }

    const musicMap: Record<string, { file: string, vol: number }> = {
      rainy: { file: '/ambient/rain_roof.mp3', vol: 0.35 },
      fireplace: { file: '/ambient/fire.mp3', vol: 0.4 },
      golden: { file: '/ambient/birds.mp3', vol: 0.25 },
      cosmic: { file: '/ambient/crickets.mp3', vol: 0.4 },
      starry: { file: '/ambient/waves.mp3', vol: 0.25 },
      cherry: { file: '/ambient/stream.mp3', vol: 0.3 }
    };

    const track = musicMap[key];
    if (track) {
      const audio = new Audio(track.file);
      audio.loop = true;
      audio.volume = track.vol;
      audio.play().then(() => {
        setAmbientAudioPlaying(true);
        if (blueAndGreyAudioRef.current) {
          blueAndGreyAudioRef.current.pause();
        }
      }).catch(e => console.log("Weather ambient play failed", e));
      weatherAudioRef.current = audio;
    } else {
      setAmbientAudioPlaying(false);
    }
  };

  const weather = weatherPresets[activeWeatherKey] || weatherPresets['starry'];

  const renderRoomWindow = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        height: '100%',
        padding: '24px 0'
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: '240px',
          borderRadius: '8px',
          background: weather.gradient,
          border: '3px solid #2a203b',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 4px 15px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '4px', background: '#2a203b', zIndex: 5 }}></div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '4px', background: '#2a203b', zIndex: 5 }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)', zIndex: 6 }}></div>
        
        <style>{`
          @keyframes windowRainFall {
            0% { transform: translateY(-20px) scaleY(1); opacity: 0; }
            20% { opacity: 0.8; }
            80% { opacity: 0.8; }
            100% { transform: translateY(160px) scaleY(1.5); opacity: 0; }
          }
          @keyframes windowEmberRise {
            0% { transform: translateY(140px) scale(1) rotate(0deg); opacity: 0; }
            20% { opacity: 0.9; }
            100% { transform: translateY(-20px) scale(0.2) rotate(45deg); opacity: 0; }
          }
          @keyframes windowPollenDrift {
            0% { transform: translate(-20px, -20px); opacity: 0; }
            20% { opacity: 0.8; }
            80% { opacity: 0.8; }
            100% { transform: translate(60px, 120px); opacity: 0; }
          }
          @keyframes windowStarTwinkle {
            0% { opacity: 0.1; transform: scale(0.6); }
            50% { opacity: 1; transform: scale(1.3); }
            100% { opacity: 0.1; transform: scale(0.6); }
          }
          @keyframes windowBlossomDrift {
            0% { transform: translate(-10px, -20px) rotate(0deg); opacity: 0; }
            20% { opacity: 0.9; }
            80% { opacity: 0.9; }
            100% { transform: translate(40px, 150px) rotate(180deg); opacity: 0; }
          }
        `}</style>
        
        {weather.particles === 'rain' && Array.from({ length: 40 }).map((_, i) => (
          <div key={`rain-${i}`} style={{
            position: 'absolute', left: `${Math.random() * 100}%`, top: `${Math.random() * -20}%`,
            width: '1px', height: `${Math.random() * 15 + 10}px`,
            background: 'linear-gradient(transparent, rgba(180, 210, 255, 0.9))',
            animation: `windowRainFall ${Math.random() * 0.4 + 0.4}s linear infinite`, animationDelay: `${Math.random() * 2}s`, zIndex: 2
          }} />
        ))}

        {weather.particles === 'embers' && (
          <>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px', background: 'linear-gradient(transparent, rgba(255, 90, 0, 0.4))', zIndex: 1 }} />
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={`ember-${i}`} style={{
                position: 'absolute', left: `${Math.random() * 100}%`, bottom: '-10px',
                width: `${Math.random() * 5 + 2}px`, height: `${Math.random() * 5 + 2}px`, borderRadius: '50%',
                background: Math.random() > 0.4 ? '#ff6600' : '#ffcc00', boxShadow: '0 0 10px #ff5500',
                animation: `windowEmberRise ${Math.random() * 2 + 1.5}s ease-in infinite`, animationDelay: `${Math.random() * 3}s`, zIndex: 2
              }} />
            ))}
          </>
        )}

        {weather.particles === 'pollen' && Array.from({ length: 25 }).map((_, i) => (
          <div key={`pollen-${i}`} style={{
            position: 'absolute', left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: `${Math.random() * 4 + 2}px`, height: `${Math.random() * 4 + 2}px`, borderRadius: '50%',
            background: '#ffd700', boxShadow: '0 0 8px #ffd700',
            animation: `windowPollenDrift ${Math.random() * 4 + 3}s linear infinite`, animationDelay: `${Math.random() * 4}s`, zIndex: 2
          }} />
        ))}

        {weather.particles === 'blossom' && Array.from({ length: 25 }).map((_, i) => (
          <div key={`blossom-${i}`} style={{
            position: 'absolute', left: `${Math.random() * 100}%`, top: `${Math.random() * -20}%`,
            width: `${Math.random() * 8 + 6}px`, height: `${Math.random() * 6 + 4}px`, borderRadius: '50% 0 50% 0',
            background: 'rgba(252, 165, 165, 0.9)', boxShadow: '0 0 4px rgba(244, 114, 182, 0.6)',
            animation: `windowBlossomDrift ${Math.random() * 3 + 4}s ease-in-out infinite`, animationDelay: `${Math.random() * 4}s`, zIndex: 2
          }} />
        ))}

        {(weather.particles === 'fireflies' || weather.particles === 'snow') && Array.from({ length: 50 }).map((_, i) => (
          <div key={`star-${i}`} style={{
            position: 'absolute', left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`, borderRadius: '50%',
            background: weather.particles === 'fireflies' ? '#fffae6' : '#d0f0ff',
            boxShadow: `0 0 ${Math.random() * 6 + 2}px ${weather.particles === 'fireflies' ? '#fffae6' : '#d0f0ff'}`,
            animation: `windowStarTwinkle ${Math.random() * 3 + 1.5}s ease-in-out infinite`, animationDelay: `${Math.random() * 4}s`, zIndex: 2
          }} />
        ))}
        {(activeWeatherKey === 'starry' || activeWeatherKey === 'cosmic') && (
          <div style={{ position: 'absolute', top: '10px', right: '15px', width: '24px', height: '24px', borderRadius: '50%', background: '#fffae6', boxShadow: '0 0 15px #fffae6', zIndex: 1 }}></div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {Object.keys(weatherPresets).map((presetKey) => (
          <button
            key={presetKey}
            onClick={() => handleWeatherChange(presetKey)}
            className="interactive"
            style={{
              padding: '6px 10px', fontSize: '0.65rem', borderRadius: '6px',
              background: activeWeatherKey === presetKey ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.04)',
              border: activeWeatherKey === presetKey ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255,255,255,0.08)',
              color: activeWeatherKey === presetKey ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {presetKey.toUpperCase()}
          </button>
        ))}
        <button
            onClick={(e) => {
              e.stopPropagation();
              if (weatherAudioRef.current) {
                if (ambientAudioPlaying) {
                  weatherAudioRef.current.pause();
                  setAmbientAudioPlaying(false);
                } else {
                  weatherAudioRef.current.play().catch(() => {});
                  setAmbientAudioPlaying(true);
                  if (blueAndGreyAudioRef.current) {
                    blueAndGreyAudioRef.current.pause();
                  }
                }
              } else {
                handleWeatherChange(activeWeatherKey);
              }
            }}
            className="interactive"
            style={{
              padding: '6px 10px', fontSize: '0.65rem', borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e9d5ff', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            {ambientAudioPlaying ? '🔊 SOUND OFF' : '🔇 SOUND ON'}
          </button>
      </div>
    </div>
  );

  return (
    <div
      onScroll={handleScroll}
      onMouseMove={handleCanvasMouseMove}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName.toLowerCase() === 'section') {
          handleCanvasClick(e);
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'transparent',
        color: '#fff',
        zIndex: 99999,
        overflowY: sittingOnBench || openingFutureGift ? 'hidden' : 'auto',
        overflowX: 'hidden',
        fontFamily: "'Lora', 'Playfair Display', serif"
      }}
    >
      {/* Background Interactive canvas */}
      <canvas
        ref={mainCanvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* 1. HEADER & exit return button */}
      {!sittingOnBench && !openingFutureGift && (
        <div style={{ position: 'fixed', top: '32px', left: '32px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={onExit}
            className="interactive"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '10px 20px',
              borderRadius: '20px',
              color: 'var(--purple-accent)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s',
              boxShadow: 'var(--glass-shadow)',
              backdropFilter: 'blur(8px)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            ← Return to Lily Garden
          </button>
          
          {/* Welcome memory text greeting */}
          {welcomeMsg && (
            <p className="animate-fade-in" style={{ fontSize: '0.8rem', color: '#9c92ac', fontStyle: 'italic', margin: '4px 0 0 8px', letterSpacing: '0.05em' }}>
              {welcomeMsg}
            </p>
          )}
        </div>
      )}

      {/* 2. MAIN HERO CONSTELLATION SECTION */}
      {!sittingOnBench && !openingFutureGift && (
        <section
          style={{
            position: 'relative',
            height: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            pointerEvents: 'none'
          }}
        >
          {/* Constellation star target circles (clickable floating absolute buttons over canvas nodes) */}
          {constellationStars.map((s) => {
            const hasVisited = visitedSections.includes(s.id);
            const isTarget = currentSection === s.id;
            
            return (
              <div
                key={s.id}
                className="interactive"
                onClick={() => {
                  navigateToFeature(s.id);
                  const el = document.getElementById(`section-${s.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  position: 'absolute',
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                {/* Click zone ring */}
                <div
                  className={isTarget ? "animate-pulse-slow" : ""}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isTarget ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                    border: isTarget ? '1.5px solid var(--purple-accent)' : 'none',
                    boxShadow: isTarget ? '0 0 25px 5px rgba(168, 85, 247, 0.6), inset 0 0 12px rgba(168, 85, 247, 0.4)' : 'none',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'all 0.3s'
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: hasVisited ? '#fff' : 'rgba(255,255,255,0.4)',
                      boxShadow: hasVisited ? '0 0 10px #fff' : 'none',
                      transition: 'all 0.3s'
                    }}
                  />
                </div>
                
                {/* Node details */}
                <span
                  style={{
                    color: hasVisited ? '#e9d5ff' : 'var(--text-secondary)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginTop: '8px',
                    fontWeight: 500,
                    textShadow: '0 2px 4px rgba(0,0,0,0.95)'
                  }}
                >
                  {s.name}
                </span>
              </div>
            );
          })}

          {/* Last Star awakens center message overlay */}
          {showLastStarChimeText && (
            <div
              className="animate-pulse-slow"
              style={{
                position: 'absolute',
                top: '46%',
                transform: 'translateY(-50%)',
                textAlign: 'center',
                zIndex: 100,
                color: '#f2e3c6',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.85rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                textShadow: '0 2px 8px rgba(0,0,0,0.95)'
              }}
            >
              ✦ The Last Star has awakened ✦
            </div>
          )}

          {/* Clicked Last Star message overlay */}
          {clickedLastStarMessage && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute',
                top: '48%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                maxWidth: '420px',
                padding: '24px',
                borderRadius: '12px',
                background: 'rgba(15,10,25,0.85)',
                border: '1px solid rgba(242, 227, 198, 0.25)',
                backdropFilter: 'blur(8px)',
                textAlign: 'center',
                zIndex: 100,
                pointerEvents: 'auto'
              }}
            >
              <h4 style={{ color: '#f2e3c6', fontFamily: 'var(--font-serif-display)', fontSize: '1.2rem', marginBottom: '12px' }}>
                The Constellation whispers...
              </h4>
              <p style={{ color: '#fffdf5', fontSize: '0.9rem', lineHeight: '1.6', fontStyle: 'italic', margin: '0 0 16px' }}>
                "Thank you for visiting my constellation. I hope this sky was kind to you."
              </p>
              <button
                onClick={() => setClickedLastStarMessage(false)}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'var(--text-secondary)',
                  padding: '6px 16px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                Close note
              </button>
            </div>
          )}

          {/* Interactive instruction text */}
          <div style={{ 
            position: 'relative', 
            textAlign: 'center', 
            zIndex: 10, 
            maxWidth: '640px',
            padding: '40px',
            background: 'radial-gradient(ellipse at center, rgba(5, 3, 10, 0.9) 25%, rgba(5, 3, 10, 0) 70%)',
            borderRadius: '50%'
          }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', textShadow: '0 3px 20px rgba(0,0,0,0.9)' }}>
              Jungkook Constellation
            </h1>
            <p style={{ color: 'var(--purple-accent)', fontStyle: 'italic', fontSize: '1.1rem', margin: '12px auto 32px', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              "Some stars don't just shine. They become part of your sky."
            </p>
            
            <button
              onClick={() => {
                const el = document.getElementById('dashboard-hub');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="interactive"
              style={{
                pointerEvents: 'auto',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(139, 92, 246, 0.2))',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: '24px',
                fontSize: '0.8rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.2)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Begin Exploring
            </button>
          </div>
        </section>
      )}

      {/* 3. SCROLLABLE FEATURES AREA */}
      {!sittingOnBench && !openingFutureGift && (
        <div style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '100px', paddingBottom: '120px', pointerEvents: 'none' }}>
          
          {/* Dashboard Hub control connector */}
          <div id="dashboard-hub" style={{ height: '2px' }} />

          {/* FEATURE 1: PERSONAL DIARY & MAILBOX */}
          <div id="section-diary" className="glass-panel" style={{ width: '92%', maxWidth: '1400px', padding: '48px 56px', background: 'rgba(12, 8, 20, 0.65)', border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(12px)', pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              {/* Virtual Diary Book */}
              <div style={{ flex: 1, minWidth: '340px', textAlign: 'left' }}>
                <span style={{ color: 'var(--purple-accent)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>FEATURE I</span>
                <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: '8px 0 20px', fontFamily: 'var(--font-serif-display)' }}>Personal Diary to Jungkook</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
                  Write letters, memories, or daily thoughts to Jungkook. Every thought saves automatically to your localStorage journal.
                </p>

                <div style={{
                  background: 'linear-gradient(135deg, #1c152b 0%, #0d0a14 100%)',
                  borderRadius: '4px 16px 16px 4px',
                  boxShadow: 'inset -5px 0 15px rgba(0,0,0,0.5), 8px 15px 25px rgba(0,0,0,0.8)',
                  borderLeft: '14px solid #0f0b17',
                  padding: '30px 40px',
                  position: 'relative',
                  marginBottom: '20px'
                }}>
                  {/* Ribbon bookmark */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '-5px', 
                    right: '45px', 
                    width: '18px', 
                    height: '50px', 
                    background: 'linear-gradient(to bottom, #7c3aed, #4c1d95)',
                    boxShadow: '2px 2px 8px rgba(0,0,0,0.6)',
                    borderRadius: '0 0 4px 4px',
                    zIndex: 2
                  }} />
                  
                  <textarea
                    value={diaryText}
                    onChange={(e) => setDiaryText(e.target.value)}
                    placeholder="Dear Jungkook, today I was thinking about..."
                    spellCheck="false"
                    style={{
                      width: '100%',
                      height: '240px',
                      background: 'transparent',
                      backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(168, 85, 247, 0.15) 31px, rgba(168, 85, 247, 0.15) 32px)',
                      border: 'none',
                      color: '#e9d5ff',
                      padding: '4px 8px',
                      fontSize: '1.4rem',
                      fontFamily: "'Caveat', cursive",
                      resize: 'none',
                      outline: 'none',
                      lineHeight: '32px',
                      letterSpacing: '0.05em'
                    }}
                  />
                </div>
                
                <button
                  onClick={handleSaveDiary}
                  className="interactive"
                  style={{
                    background: 'rgba(168, 85, 247, 0.25)',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '16px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <BookOpen size={14} /> Write in Diary
                </button>
              </div>

              {/* Mailbox Column */}
              <div style={{ flex: 1, minWidth: '340px', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '48px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--purple-accent)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} /> Constellation Mailbox
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '16px' }}>
                  Send a letter to the sky. It will pause, fold into a glowing paper crane, dissolve into stardust, and join the night sky permanently as a new glowing star.
                </p>

                <input
                  type="text"
                  value={mailboxText}
                  onChange={(e) => setMailboxText(e.target.value)}
                  placeholder="Write a message to send..."
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '10px 12px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    marginBottom: '12px'
                  }}
                />

                <button
                  onClick={handleMailboxSend}
                  className="interactive"
                  disabled={!!mailboxAnim}
                  style={{
                    background: 'rgba(242, 227, 198, 0.15)',
                    border: '1px solid rgba(242, 227, 198, 0.3)',
                    color: '#f2e3c6',
                    padding: '8px 18px',
                    borderRadius: '16px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={14} /> 📨 Send to the Stars
                </button>

                {/* Sent history entries list */}
                {diaryEntries.length > 0 && (
                  <div style={{ marginTop: '24px', maxHeight: '110px', overflowY: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Journal Entries</span>
                    {diaryEntries.map((e) => (
                      <div key={e.id} style={{ margin: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                        <p style={{ fontSize: '0.8rem', color: '#eee', margin: 0 }}>{e.text}</p>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{e.date}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Chat Button Panel embedded in Mailbox */}
                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px dashed rgba(168, 85, 247, 0.2)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#fff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} color="var(--purple-accent)" /> Private Constellation Chat
                  </h4>
                  <button
                    onClick={() => setShowJKChat(true)}
                    className="interactive"
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(139, 92, 246, 0.15))',
                      border: '1.5px solid rgba(168, 85, 247, 0.35)',
                      color: '#e9d5ff',
                      padding: '12px 0',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      display: 'block',
                      boxShadow: '0 0 15px rgba(168, 85, 247, 0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(139, 92, 246, 0.25))';
                      e.currentTarget.style.boxShadow = '0 0 25px rgba(168, 85, 247, 0.35)';
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(139, 92, 246, 0.15))';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)';
                    }}
                  >
                    🐰 Talk to Jungkook
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 2: FUTURE GIFT & BENCH */}
          <div id="section-gift" className="glass-panel" style={{ width: '92%', maxWidth: '1400px', padding: '48px 56px', background: 'rgba(12, 8, 20, 0.65)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '340px', textAlign: 'left' }}>
                <span style={{ color: 'var(--purple-accent)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>FEATURE II</span>
                <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: '8px 0 20px', fontFamily: 'var(--font-serif-display)' }}>Future Gift & Reflection Bench</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
                  Explore a cinematic vision from the future, or take a seat on the glowing constellation bench beside the cosmic lake to rest in silence.
                </p>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button
                    onClick={triggerFutureGiftOpen}
                    className="interactive"
                    style={{
                      background: 'rgba(168, 85, 247, 0.25)',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      color: '#fff',
                      padding: '10px 24px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Gift size={15} /> See the Future
                  </button>

                  <button
                    onClick={handleSittingStart}
                    className="interactive"
                    style={{
                      background: 'rgba(242, 227, 198, 0.15)',
                      border: '1px solid rgba(242, 227, 198, 0.3)',
                      color: '#f2e3c6',
                      padding: '10px 24px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    🪑 Sit on the Bench
                  </button>
                </div>
              </div>

              {/* Graphic Representation */}
              <div style={{ flex: 0.8, minWidth: '220px', display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '30px',
                    background: 'rgba(242, 227, 198, 0.03)',
                    border: '1.5px dashed rgba(242, 227, 198, 0.25)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    animation: 'pulse-slow 3s infinite'
                  }}
                  onClick={triggerFutureGiftOpen}
                >
                  <Gift size={48} color="var(--purple-accent)" />
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 3: INFINITE SCRAPBOOK MEMORY WALL */}
          <div id="section-wall" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ color: 'var(--purple-accent)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>FEATURE III</span>
              <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: '8px 0 8px', fontFamily: 'var(--font-serif-display)' }}>Infinite Memory Wall</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>A living, endless scrapbook loop of comfort quotes, polaroids, and logs.</p>
            </div>

            {/* Seamless Looping Infinite Scroll Container */}
            <div
              onScroll={(e) => {
                const target = e.currentTarget;
                const maxScroll = target.scrollWidth - target.clientWidth;
                // Seamless recycle check: if scrolled past 85% of total width, reset to center
                if (target.scrollLeft >= maxScroll - 100) {
                  target.scrollLeft = 100;
                } else if (target.scrollLeft <= 5) {
                  target.scrollLeft = maxScroll - 200;
                }
              }}
              style={{
                width: '100vw',
                overflowX: 'auto',
                display: 'flex',
                gap: '32px',
                padding: '40px 60px',
                background: 'rgba(255,255,255,0.01)',
                borderTop: '1px solid rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                scrollbarWidth: 'none', // Hide default scrollbar
                scrollBehavior: 'auto',
                pointerEvents: 'auto'
              }}
            >
              {/* Loop the items list four times to ensure infinite recycling bounds */}
              {Array.from({ length: 4 }).flatMap((_, loopIdx) => 
                scrapbookItems.map(item => ({ ...item, uniqueKey: `${loopIdx}-${item.id}` }))
              ).map((item: any, idx) => (
                <div
                  key={item.uniqueKey}
                  className="glass-panel interactive"
                  style={{
                    minWidth: '260px',
                    maxWidth: '260px',
                    height: '290px',
                    padding: '20px',
                    background: 'rgba(15, 10, 28, 0.75)',
                    border: '1.5px solid rgba(168, 85, 247, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transform: `translateY(${idx % 2 === 0 ? '8px' : '-8px'}) rotate(${item.rot}deg) scale(${item.scale})`,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = `translateY(${idx % 2 === 0 ? '8px' : '-8px'}) scale(1.08) rotate(0deg)`;
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.45)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(168, 85, 247, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = `translateY(${idx % 2 === 0 ? '8px' : '-8px'}) rotate(${item.rot}deg) scale(${item.scale})`;
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.1)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.45)';
                  }}
                >
                  {item.type === 'polaroid' ? (
                    <>
                      <div style={{ height: '160px', background: 'linear-gradient(135deg, #1e0b36 0%, #05030d 100%)', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.8rem', border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          item.emoji
                        )}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: '#fff', margin: '10px 0 2px', fontWeight: 600 }}>{item.title}</h4>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{item.desc}</p>
                      </div>
                    </>
                  ) : item.type === 'quote' ? (
                    <>
                      <Sparkles size={20} color="var(--purple-accent)" />
                      <p style={{ fontSize: '0.82rem', color: '#eee', fontStyle: 'italic', lineHeight: '1.6', margin: 0 }}>
                        "{item.text}"
                      </p>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Constellation Quote</span>
                    </>
                  ) : (
                    <>
                      <BookOpen size={20} color="#f2e3c6" />
                      <p style={{ fontSize: '0.82rem', color: '#fffdf5', lineHeight: '1.6', margin: 0 }}>
                        {item.text}
                      </p>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scrapbook Note</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* FEATURE 4: VIDEO VAULT — Local Vlive Clips */}
          <div id="section-vault" className="glass-panel" style={{ width: '92%', maxWidth: '1400px', padding: '48px 56px', background: 'rgba(10, 8, 22, 0.7)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', pointerEvents: 'auto' }}>
            <div style={{ textAlign: 'left', marginBottom: '32px' }}>
              <span style={{ color: 'var(--purple-accent)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>FEATURE IV</span>
              <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: '8px 0 8px', fontFamily: 'var(--font-serif-display)' }}>Cozy Cosmic Theater</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Jungkook singing live — vlive moments, cozy and real. Click to play.</p>
            </div>

            {/* Active Video Player */}
            {activeVliveVideo && (
              <div
                style={{
                  marginBottom: '32px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#000',
                  border: '1px solid rgba(168,85,247,0.3)',
                  boxShadow: '0 0 40px rgba(168,85,247,0.15)',
                  position: 'relative'
                }}
              >
                <video
                  key={activeVliveVideo.file}
                  src={activeVliveVideo.file}
                  controls
                  autoPlay
                  style={{ width: '100%', maxHeight: '420px', display: 'block', borderRadius: '16px' }}
                />
                <div style={{
                  position: 'absolute', top: '14px', left: '18px',
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                  borderRadius: '8px', padding: '6px 12px'
                }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--purple-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{activeVliveVideo.cat}</span>
                  <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{activeVliveVideo.title}</p>
                </div>
                <button
                  onClick={() => setActiveVliveVideo(null)}
                  style={{
                    position: 'absolute', top: '14px', right: '14px',
                    background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', borderRadius: '20px', padding: '4px 12px',
                    fontSize: '0.72rem', cursor: 'pointer'
                  }}
                >
                  ✕ Close
                </button>
              </div>
            )}

            {/* Video Cards Grid */}
            <div className="video-grid">
              {vliveVideos.map((vid, idx) => (
                <div
                  key={idx}
                  className="glass-panel interactive"
                  onClick={() => handlePlayVliveVideo(vid)}
                  style={{
                    padding: '20px',
                    background: activeVliveVideo?.file === vid.file ? 'rgba(168,85,247,0.12)' : 'rgba(0,0,0,0.3)',
                    border: activeVliveVideo?.file === vid.file ? '1.5px solid rgba(168,85,247,0.5)' : '1.5px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '140px',
                    textAlign: 'left',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.45)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = activeVliveVideo?.file === vid.file ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Play icon */}
                  <div style={{ fontSize: '1.6rem', marginBottom: '10px' }}>▶</div>
                  <div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--purple-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{vid.cat}</span>
                    <h4 style={{ color: '#fff', fontSize: '0.88rem', margin: '6px 0 0', lineHeight: '1.3' }}>{vid.title}</h4>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#9c92ac', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.55rem', background: 'rgba(168,85,247,0.2)', borderRadius: '4px', padding: '1px 5px', color: 'var(--purple-accent)' }}>≤30s</span>
                    Play Vlive Clip →
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FEATURE 6: MUSIC ROOM (VINYL PLAYER) */}
          <div id="section-music" className="glass-panel" style={{ width: '92%', maxWidth: '1400px', padding: '48px 56px', background: 'rgba(12, 8, 20, 0.65)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
              
              {/* Rotating Vinyl Mock */}
              <div style={{ flex: 0.8, minWidth: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: '#120d24',
                    border: '6px solid #1f1b2e',
                    boxShadow: playingRecord ? '0 0 25px rgba(168, 85, 247, 0.45)' : 'none',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: `rotate(${recordRotation}deg)`,
                    position: 'relative'
                  }}
                >
                  {/* vinyl record grooves lines */}
                  <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', position: 'absolute' }} />
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', position: 'absolute' }} />
                  
                  {/* record center label */}
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--purple-accent)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.9rem' }}>
                    🐰
                  </div>
                </div>

                {playingRecord && (
                  <button
                    onClick={stopVinylPlay}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      padding: '4px 14px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                  >
                    Stop Playing
                  </button>
                )}
              </div>

              {/* Tracks List */}
              <div style={{ flex: 1.2, minWidth: '280px', textAlign: 'left' }}>
                <span style={{ color: 'var(--purple-accent)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>FEATURE V</span>
                <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: '8px 0 12px', fontFamily: 'var(--font-serif-display)' }}>Cosmic Vinyl Player</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                  Select a record to rotate the vinyl and listen to comforting melodies.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['Still With You', 'Euphoria', 'My You', 'Seven', 'Standing Next To You'].map((track) => {
                    const isCurrent = playingRecord === track;
                    
                    return (
                      <div
                        key={track}
                        className="interactive"
                        onClick={() => startVinylPlay(track)}
                        style={{
                          padding: '12px 18px',
                          borderRadius: '8px',
                          border: isCurrent ? '1.5px solid var(--purple-accent)' : '1px solid rgba(255,255,255,0.04)',
                          background: isCurrent ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255,255,255,0.02)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', color: isCurrent ? '#fff' : 'var(--text-secondary)', fontWeight: isCurrent ? 600 : 400 }}>{track}</span>
                        {isCurrent ? (
                          <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--purple-accent)' }} />
                        ) : (
                          <Music size={14} color="rgba(255,255,255,0.2)" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 6: WISH CONSTELLATION */}
          <div id="section-wishes" className="glass-panel" style={{ width: '90%', maxWidth: '850px', padding: '40px', background: 'rgba(10, 8, 22, 0.7)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', pointerEvents: 'auto' }}>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <span style={{ color: 'var(--purple-accent)', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>FEATURE VI</span>
              <h2 style={{ fontSize: '1.8rem', color: '#fff', margin: '8px 0 8px', fontFamily: 'var(--font-serif-display)' }}>Wish Constellation Canopy</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Tap the blank spaces on the background night sky above to spawn glowing stars and write a custom birthday wish.
              </p>
              <p style={{ color: 'var(--purple-accent)', fontSize: '0.85rem', marginTop: '8px', fontWeight: 500 }}>
                Wishes Formed: {unlockedWishes.length} of {wishQuotes.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. HOVER TOOLTIP PORTAL FOR CANVAS ENTRIES */}
      {hoverStarTooltipRef.current && hoverStarTooltipRef.current.text && (
        <div
          style={{
            position: 'fixed',
            left: `${hoverStarTooltipRef.current.x + 12}px`,
            top: `${hoverStarTooltipRef.current.y - 12}px`,
            padding: '8px 12px',
            background: 'rgba(10, 5, 20, 0.92)',
            border: '1px solid rgba(242, 227, 198, 0.3)',
            borderRadius: '6px',
            color: '#f2e3c6',
            fontSize: '0.75rem',
            fontStyle: 'italic',
            pointerEvents: 'none',
            zIndex: 999999,
            maxWidth: '220px',
            whiteSpace: 'pre-line',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            transform: 'translateY(-100%)'
          }}
        >
          {hoverStarTooltipRef.current.text}
        </div>
      )}

      {/* 5. COGNITIVE OVERLAY DIALOG MODALS */}
      {activeNoteText && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 4, 10, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999999,
            padding: '24px',
            animation: 'fade-in 0.3s'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '36px',
              background: 'rgba(25, 20, 38, 0.9)',
              border: '1.5px solid rgba(168, 85, 247, 0.25)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative'
            }}
          >
            <h4 style={{ color: 'var(--purple-accent)', fontSize: '1.1rem', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Letter Message</h4>
            <p style={{ color: '#fffdf5', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic', margin: 0 }}>
              "{activeNoteText}"
            </p>
            
            <button
              onClick={() => setActiveNoteText(null)}
              className="interactive"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--text-secondary)',
                padding: '6px 16px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                alignSelf: 'center'
              }}
            >
              Close note
            </button>
          </div>
        </div>
      )}

      {/* 6. HIDDEN VOICE STAR NOTIFICATIONS (STAR CLICKS REVEAL MESSAGE) */}
      {hiddenNotes.map((n, idx) => {
        const isFound = foundNotes[idx];
        
        return (
          <div
            key={n.id}
            className="interactive"
            onClick={() => handleNoteFind(idx, n.text)}
            style={{
              position: 'fixed',
              left: `${n.x * 100}%`,
              top: `${n.y * 100}%`,
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: 'transparent',
              cursor: 'pointer',
              zIndex: 99,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: sittingOnBench || openingFutureGift ? 'none' : 'auto'
            }}
          >
            {/* hidden faint gold star visible only on cursor proximity */}
            <div
              className="pulse-dot"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isFound ? '#f2e3c6' : 'rgba(242, 227, 198, 0.08)',
                boxShadow: isFound ? '0 0 10px #f2e3c6' : 'none',
                transition: 'all 0.5s'
              }}
              onMouseEnter={(e) => { if (!isFound) e.currentTarget.style.backgroundColor = 'rgba(242, 227, 198, 0.55)'; }}
              onMouseLeave={(e) => { if (!isFound) e.currentTarget.style.backgroundColor = 'rgba(242, 227, 198, 0.08)'; }}
            />
          </div>
        );
      })}




      {/* 7. CINEMATIC MEDITATIVE BENCH FULLSCREEN CANVAS */}
      {sittingOnBench && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#020108',
            zIndex: 99999999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            animation: 'fade-in 1.5s'
          }}
        >
          <canvas
            ref={benchCanvasRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'default', pointerEvents: 'none' }}
          />

          <style>
            {`
              @keyframes float-up-firefly {
                0% { transform: translate(0, 0) scale(0.8); opacity: 0; }
                20% { opacity: 0.8; }
                50% { transform: translate(30px, -50vh) scale(1.2); }
                80% { opacity: 0.8; }
                100% { transform: translate(-30px, -110vh) scale(0.8); opacity: 0; }
              }
              @keyframes firefly-pulse {
                0%, 100% { filter: brightness(1) drop-shadow(0 0 4px rgba(242, 227, 198, 0.4)); }
                50% { filter: brightness(1.5) drop-shadow(0 0 10px rgba(242, 227, 198, 1)); }
              }
            `}
          </style>

          {/* Floating Fireflies */}
          {benchFireflies.map((f) => (
            <div
              key={f.id}
              style={{
                position: 'absolute',
                width: f.size,
                height: f.size,
                left: f.left,
                bottom: '-10%',
                borderRadius: '50%',
                backgroundColor: 'rgba(242, 227, 198, 0.95)',
                animation: `float-up-firefly ${f.animationDur} linear infinite`,
                animationDelay: f.animationDelay,
                opacity: 0.8,
                zIndex: 150,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: '#f2e3c6',
                  animation: `firefly-pulse ${f.pulseDur} ease-in-out infinite alternate`,
                  animationDelay: f.animationDelay,
                }}
              />
            </div>
          ))}

          {/* Auto-popping motivating text */}
          {benchMotivatingText && (
            <div
              key={benchMotivatingText}
              style={{
                position: 'absolute',
                top: '25%',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                zIndex: 200,
                pointerEvents: 'none',
                animation: 'fade-in 0.8s ease-out',
                maxWidth: '520px',
                padding: '0 24px',
              }}
            >
              <p style={{
                color: 'rgba(242, 227, 198, 0.9)',
                fontSize: '1.05rem',
                letterSpacing: '0.08em',
                fontStyle: 'italic',
                fontFamily: "'Lora', serif",
                textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 0 20px rgba(168,85,247,0.2)',
                lineHeight: 1.7,
                margin: 0
              }}>
                {benchMotivatingText}
              </p>
            </div>
          )}

          {/* Timed Meditate 30s Text */}
          {benchTextFade && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute',
                top: '45%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'rgba(242, 227, 198, 0.35)',
                fontSize: '0.85rem',
                letterSpacing: '0.25em',
                fontStyle: 'italic',
                textAlign: 'center',
                zIndex: 100,
                pointerEvents: 'none',
                width: '100%'
              }}
            >
              Sometimes it's enough just to be here.
            </div>
          )}

          {/* Elegant leave meditative sitting */}
          <button
            onClick={handleSittingExit}
            className="interactive"
            style={{
              position: 'absolute',
              top: '32px',
              right: '32px',
              background: 'rgba(255,255,255,0.02)',
              border: '1.2px solid rgba(255,255,255,0.1)',
              color: 'var(--text-secondary)',
              padding: '8px 16px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              zIndex: 100
            }}
          >
            Leave the Bench
          </button>
        </div>
      )}

      {/* 8. CINEMATIC FUTURE VISION SEQUENCE FULLSCREEN CANVAS */}
      {openingFutureGift && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#030209',
            zIndex: 99999999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            animation: 'fade-in 1.2s'
          }}
        >
          {/* FADES STAGED DIALOGUES (Stages 1 to 3) */}
          {futureGiftStage === 1 && (
            <div className="animate-fade-in" style={{ color: 'rgba(255, 253, 245, 0.65)', fontSize: '1.05rem', letterSpacing: '0.25em', fontStyle: 'italic', animation: 'fade-out 4s forwards' }}>
              Some gifts are meant to be opened later.
            </div>
          )}
          {futureGiftStage === 2 && (
            <div className="animate-fade-in" style={{ color: 'rgba(255, 253, 245, 0.65)', fontSize: '1.05rem', letterSpacing: '0.25em', fontStyle: 'italic', animation: 'fade-out 4s forwards' }}>
              Some people arrive in your life...
            </div>
          )}
          {futureGiftStage === 3 && (
            <div className="animate-fade-in" style={{ color: 'rgba(255, 253, 245, 0.65)', fontSize: '1.05rem', letterSpacing: '0.25em', fontStyle: 'italic', animation: 'fade-out 4s forwards' }}>
              ...and quietly become part of your story.
            </div>
          )}

          {/* Reveal future cinematic stargazing lake canvas */}
          {futureGiftStage >= 4 && (
            <>
              <canvas ref={futureCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

              {/* FULLSCREEN SPLIT LAYOUT */}
              <div
                className="future-vision-container"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  zIndex: 50,
                }}
              >
                {/* LEFT HALF — Large image */}
                <div
                  className="future-vision-image-half"
                  style={{
                    flex: '0 0 48%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {jungkookSylusImages.map((imgSrc, imgIdx) => (
                    <img
                      key={imgIdx}
                      src={imgSrc}
                      alt={`Moment ${imgIdx + 1}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: imgIdx === 8 ? 'center top' : 'center',
                        opacity: currentGiftImageIndex === imgIdx ? 1 : 0,
                        transition: 'opacity 2.5s ease-in-out',
                        filter: imgIdx === 8
                          ? 'contrast(1.04) brightness(1.04) saturate(1.06)'
                          : 'brightness(0.82)'
                      }}
                    />
                  ))}

                  {/* Gradient fade from image into right panel */}
                  <div className="future-vision-gradient" style={{
                    position: 'absolute', top: 0, right: 0,
                    width: '120px', height: '100%',
                    background: 'linear-gradient(to right, transparent, #030209)'
                  }} />

                  {/* Manual Controls */}
                  <div className="future-vision-controls" style={{
                    position: 'absolute', bottom: '56px', left: '32px',
                    display: 'flex', gap: '12px', alignItems: 'center',
                    zIndex: 60
                  }}>
                    <button
                      onClick={handleFutureGiftPrev}
                      disabled={currentGiftImageIndex === 0}
                      className="interactive"
                      style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: currentGiftImageIndex === 0 ? 'rgba(255,255,255,0.25)' : '#f2e3c6',
                        padding: '6px 14px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        cursor: currentGiftImageIndex === 0 ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        backdropFilter: 'blur(8px)',
                        pointerEvents: 'auto'
                      }}
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={handleFutureGiftNext}
                      disabled={currentGiftImageIndex === jungkookSylusImages.length - 1}
                      className="interactive"
                      style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: currentGiftImageIndex === jungkookSylusImages.length - 1 ? 'rgba(255,255,255,0.25)' : '#f2e3c6',
                        padding: '6px 14px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        cursor: currentGiftImageIndex === jungkookSylusImages.length - 1 ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        backdropFilter: 'blur(8px)',
                        pointerEvents: 'auto'
                      }}
                    >
                      Next →
                    </button>
                  </div>

                  {/* Bottom overlay — image counter */}
                  <div className="future-vision-dots" style={{
                    position: 'absolute', bottom: '32px', left: '32px',
                    display: 'flex', gap: '8px', alignItems: 'center'
                  }}>
                    {jungkookSylusImages.map((_, dotIdx) => (
                      <div key={dotIdx} style={{
                        width: dotIdx === currentGiftImageIndex ? '20px' : '6px',
                        height: '6px',
                        borderRadius: '3px',
                        background: dotIdx === currentGiftImageIndex ? '#f2e3c6' : 'rgba(242,227,198,0.25)',
                        transition: 'all 0.6s ease'
                      }} />
                    ))}
                  </div>

                  {/* Top label */}
                  <div style={{
                    position: 'absolute', top: '28px', left: '32px',
                    fontSize: '0.65rem', color: 'rgba(242,227,198,0.45)',
                    textTransform: 'uppercase', letterSpacing: '0.25em'
                  }}>
                    Moment {currentGiftImageIndex + 1} of {jungkookSylusImages.length}
                  </div>
                </div>

                {/* RIGHT HALF — Atmospheric description */}
                <div
                  className="future-vision-text-half"
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '60px 56px 60px 44px',
                    overflowY: 'auto',
                  }}
                >
                  {/* Top header */}
                  <div style={{ marginBottom: '36px' }}>
                    <p style={{
                      fontSize: '0.65rem',
                      color: 'var(--purple-accent)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3em',
                      margin: '0 0 12px'
                    }}>
                      ✦ A Vision From The Future ✦
                    </p>
                    <h2 style={{
                      fontFamily: 'var(--font-serif-display)',
                      fontSize: '1.45rem',
                      color: '#f2e3c6',
                      fontWeight: 400,
                      margin: 0,
                      lineHeight: '1.5',
                      letterSpacing: '0.04em'
                    }}>
                      "Imagine if we actually got married in the future<br />
                      and our husbands formed a bond...
                    </h2>
                    <h2 style={{
                      fontFamily: 'var(--font-serif-display)',
                      fontSize: '1.45rem',
                      color: '#c084fc',
                      fontWeight: 400,
                      margin: '4px 0 0',
                      letterSpacing: '0.04em'
                    }}>
                      it would look like this."
                    </h2>
                  </div>

                  {/* Divider */}
                  <div style={{
                    width: '48px', height: '1px',
                    background: 'rgba(242,227,198,0.3)',
                    marginBottom: '36px'
                  }} />

                  {/* Current description — large and readable, all stacked in same space */}
                  <div style={{ minHeight: '180px', flex: '1 0 auto' }}>
                    {momentDescriptions.map((desc, idx) => (
                      <div
                        key={idx}
                        className={currentGiftImageIndex === idx ? "animate-fade-in-up" : ""}
                        style={{
                          display: currentGiftImageIndex === idx ? 'block' : 'none'
                        }}
                      >
                        <p style={{
                          fontSize: '1.1rem',
                          color: 'rgba(255,253,245,0.93)',
                          lineHeight: '1.9',
                          fontStyle: 'italic',
                          margin: 0,
                          fontFamily: "'Georgia', serif",
                          letterSpacing: '0.01em'
                        }}>
                          {desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Stage 5 — final message at bottom right */}
                  {futureGiftStage === 5 && (
                    <div
                      className="animate-fade-in"
                      style={{
                        marginTop: '48px',
                        paddingTop: '24px',
                        borderTop: '1px solid rgba(242,227,198,0.18)'
                      }}
                    >
                      <p style={{
                        fontFamily: 'var(--font-serif-display)',
                        fontSize: '1.55rem',
                        color: '#f2e3c6',
                        letterSpacing: '0.2em',
                        margin: 0,
                        textShadow: '0 2px 20px rgba(242,227,198,0.3)'
                      }}>
                        We made the right choice.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Close future vision */}
              <button
                onClick={closeFutureGift}
                className="interactive future-vision-close"
                style={{
                  position: 'absolute',
                  top: '28px',
                  right: '32px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1.2px solid rgba(255,255,255,0.15)',
                  color: 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  zIndex: 200
                }}
              >
                Close Vision
              </button>
            </>
          )}
        </div>
      )}

      {/* 9. DEFERRED FINAL SECRET CONSTELLATION OVERLAY */}
      {finalSecretOverlay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(4, 3, 8, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999999999,
            padding: '24px',
            animation: 'fade-in 0.4s'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '450px',
              padding: '40px',
              background: 'rgba(20, 15, 30, 0.95)',
              border: '1.5px solid rgba(255, 218, 120, 0.35)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              position: 'relative'
            }}
          >
            <Sparkles size={28} color="#ffd700" style={{ alignSelf: 'center' }} />
            <h4 style={{ color: '#ffd700', fontSize: '1.25rem', margin: 0, fontFamily: 'var(--font-serif-display)', letterSpacing: '0.15em' }}>
              Constellation Remembered You
            </h4>
            <p style={{ color: '#fffdf5', fontSize: '1.05rem', lineHeight: '1.7', fontStyle: 'italic', margin: 0 }}>
              "Some stories never really end. They just become constellations."
            </p>
            
            <button
              onClick={closeFinalSecret}
              className="interactive"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 218, 120, 0.3)',
                color: '#ffd700',
                padding: '8px 24px',
                borderRadius: '16px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                alignSelf: 'center',
                marginTop: '8px'
              }}
            >
              Vanish star
            </button>
          </div>
        </div>
      )}

      {/* JK AI CHAT OVERLAY - C.AI style */}
      {showJKChat && (
        <div
          style={{
            position: 'fixed',
            top: 0, right: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(4, 3, 10, 0.5)',
            backdropFilter: 'blur(6px)',
            zIndex: 999999999,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'stretch',
            padding: '32px',
            gap: '32px',
            animation: 'fade-in 0.3s'
          }}
        >
          {window.innerWidth > 900 && (
            <div
              className="chat-window-sidebar"
              style={{
                flex: 1,
                minWidth: '400px',
                maxWidth: '650px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {renderRoomWindow()}
            </div>
          )}

          <div style={{
            flex: 1,
            width: '100%',
            maxWidth: '680px',
            height: '100%',
            maxHeight: '90vh',
            borderRadius: '24px',
            background: 'linear-gradient(160deg, #0d0b1e 0%, #140f28 100%)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            boxShadow: '0 0 60px rgba(168, 85, 247, 0.12), 0 32px 80px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Chat Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(168, 85, 247, 0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: 'rgba(168, 85, 247, 0.06)'
            }}>
              {/* JK Avatar */}
              <div style={{
                width: '48px', height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)',
                flexShrink: 0
              }}>
                🐰
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 600 }}>Jungkook</h3>
                <p style={{ margin: 0, color: '#a855f7', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  Here with you
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', padding: '3px 8px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>AI Character</span>
                <button
                  onClick={() => setShowJKChat(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
                >×</button>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(168,85,247,0.2) transparent'
            }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: '10px',
                  alignItems: 'flex-end'
                }}>
                  {msg.role === 'jk' && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>🐰</div>
                  )}
                  <div style={{ maxWidth: '72%', order: msg.role === 'user' ? 1 : 2 }}>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(139, 92, 246, 0.45))'
                        : 'rgba(255,255,255,0.05)',
                      border: msg.role === 'user'
                        ? '1px solid rgba(168, 85, 247, 0.3)'
                        : '1px solid rgba(255,255,255,0.07)',
                      color: '#fff',
                      fontSize: '0.88rem',
                      lineHeight: 1.6,
                    }}>
                      {msg.text}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', textAlign: msg.role === 'user' ? 'right' : 'left', paddingLeft: '4px' }}>{msg.ts}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.88rem', color: '#fff', fontWeight: 600, flexShrink: 0, order: 3 }}>S</div>
                  )}
                </div>
              ))}
              {/* Typing indicator */}
              {jkTyping && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🐰</div>
                  <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(168,85,247,0.7)', animation: `pulse-slow ${0.8 + i * 0.2}s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick action chips */}
            <div style={{
              padding: '8px 20px',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              background: 'rgba(0,0,0,0.1)',
              borderTop: '1px solid rgba(168, 85, 247, 0.08)',
              scrollbarWidth: 'none',
              pointerEvents: 'auto'
            }}>
              {[
                { text: "🎵 Sing Still With You", action: "Can you sing Still With You? 💜" },
                { text: "🎵 Play Euphoria", action: "Can you play Euphoria? ✨" },
                { text: "📖 Suggest a diary topic", action: "What should I write about in my diary today? 📖" },
                { text: "🪑 Meditate on the Bench", action: "Let's go sit on the bench. 🪑" }
              ].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleJKChatSend(chip.action)}
                  className="interactive"
                  style={{
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    borderRadius: '16px',
                    padding: '6px 14px',
                    color: '#e9d5ff',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)'; e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)'; e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.25)'; }}
                >
                  {chip.text}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(168, 85, 247, 0.1)',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !jkTyping) handleJKChatSend(); }}
                disabled={jkTyping}
                placeholder={jkTyping ? "Jungkook is typing..." : "Say something to Jungkook..."}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: '24px',
                  padding: '12px 18px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                  opacity: jkTyping ? 0.5 : 1
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)'; }}
              />
              <button
                onClick={() => handleJKChatSend()}
                disabled={!chatInput.trim() || jkTyping}
                style={{
                  width: '44px', height: '44px',
                  borderRadius: '50%',
                  background: (chatInput.trim() && !jkTyping) ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(168,85,247,0.1)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  color: '#fff',
                  cursor: (chatInput.trim() && !jkTyping) ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  boxShadow: chatInput.trim() ? '0 0 12px rgba(168,85,247,0.4)' : 'none'
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Awakening quest removed per user request */}
    </div>
  );
};
