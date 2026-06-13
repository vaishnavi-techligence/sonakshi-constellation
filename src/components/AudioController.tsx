import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioControllerProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  audioCtx: AudioContext | null;
}

export const AudioController: React.FC<AudioControllerProps> = ({ isPlaying, setIsPlaying, audioCtx }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [pulse, setPulse] = useState(false);
  const pulseTimerRef = useRef<number[]>([]);

  useEffect(() => {
    // Initialize spring_day audio
    if (!audioRef.current) {
      const audio = new Audio('/spring_day.mpeg');
      audio.loop = true;
      audio.volume = 0.55;
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    // Resuming AudioContext if it's there (web audio requirement alignment)
    if (isPlaying && audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error("Failed to play background music:", err);
      });

      // Periodic gentle pulse effect on the music icon
      const triggerPulse = () => {
        setPulse(true);
        setTimeout(() => setPulse(false), 500);
      };
      
      triggerPulse();
      const interval = window.setInterval(triggerPulse, 3500);
      pulseTimerRef.current.push(interval);
    } else {
      audio.pause();
      pulseTimerRef.current.forEach((t) => clearInterval(t));
      pulseTimerRef.current = [];
      setPulse(false);
    }

    return () => {
      audio.pause();
      pulseTimerRef.current.forEach((t) => clearInterval(t));
      pulseTimerRef.current = [];
    };
  }, [isPlaying, audioCtx]);

  // Cleanup audio element on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div
      onClick={togglePlayback}
      className={`glass-panel interactive`}
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9990,
        cursor: 'pointer',
        boxShadow: pulse ? '0 0 15px rgba(242, 227, 198, 0.4)' : 'var(--glass-shadow)',
        transform: pulse ? 'scale(1.08)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        border: isPlaying ? '1px solid rgba(242, 227, 198, 0.4)' : '1px solid var(--glass-border)',
      }}
    >
      {isPlaying ? (
        <Volume2 size={20} style={{ color: 'var(--gold-accent)' }} />
      ) : (
        <VolumeX size={20} style={{ color: 'var(--text-muted)' }} />
      )}
    </div>
  );
};
