import { useState, useEffect } from 'react';
import { MagicCursor } from './components/MagicCursor';
import { AudioController } from './components/AudioController';
import { LandingScene } from './components/LandingScene';
import { HeroSection } from './components/HeroSection';
import { SonakshiUniverse } from './components/SonakshiUniverse';
import { LilyTree } from './components/LilyTree';
import { FinalScene } from './components/FinalScene';
import { JungkookConstellation } from './components/JungkookConstellation';
import { IntroVideo } from './components/IntroVideo';
import './App.css';

function App() {
  const [stage, setStage] = useState<'intro' | 'landing' | 'garden' | 'jungkook-constellation'>('intro');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [unlockedWishes, setUnlockedWishes] = useState<boolean[]>([
    false, false, false, false, false, false
  ]);

  useEffect(() => {
    if (stage === 'garden') {
      const timer = setTimeout(() => setMusicPlaying(true), 500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  return (
    <>
      <MagicCursor />

      {stage === 'intro' ? (
        <IntroVideo onComplete={() => setStage('landing')} />
      ) : stage === 'jungkook-constellation' ? (
        <JungkookConstellation
          audioCtx={audioCtx}
          onExit={() => setStage('garden')}
        />
      ) : stage === 'landing' ? (
        <LandingScene
          onComplete={() => setStage('garden')}
          startMusic={(ctx) => {
            setAudioCtx(ctx);
          }}
        />
      ) : (
        <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <AudioController isPlaying={musicPlaying} setIsPlaying={setMusicPlaying} audioCtx={audioCtx} />
          <HeroSection />
          <SonakshiUniverse
            audioCtx={audioCtx}
            ambientPlaying={musicPlaying}
            setAmbientPlaying={setMusicPlaying}
            onEnterJungkookConstellation={() => setStage('jungkook-constellation')}
          />
          <LilyTree unlockedWishes={unlockedWishes} setUnlockedWishes={setUnlockedWishes} />
          <FinalScene />
        </div>
      )}
    </>
  );
}

export default App;