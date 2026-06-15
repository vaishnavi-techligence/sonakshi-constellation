import React, { useState, useRef, useEffect } from 'react';

interface IntroVideoProps {
  onComplete: () => void;
}

export const IntroVideo: React.FC<IntroVideoProps> = ({ onComplete }) => {
  const [started, setStarted] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStart = () => {
    setStarted(true);
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.error("Video play failed:", e));
    }
  };

  const handleComplete = () => {
    setFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 1500); // 1.5s fade out
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        zIndex: 100000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 1.5s ease-out',
      }}
    >
      {!started && (
        <div 
          onClick={handleStart}
          style={{
            position: 'absolute',
            zIndex: 10,
            cursor: 'pointer',
            padding: '40px 100px',
            textAlign: 'center'
          }}
        >
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1rem',
            color: '#e9d5ff',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            animation: 'pulse 2s infinite',
            opacity: 0.8
          }}>
            Click anywhere to begin
          </p>
        </div>
      )}

      <video
        ref={videoRef}
        src="/Into_Video.mp4"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: started ? 1 : 0,
          transition: 'opacity 1s ease-in'
        }}
        onEnded={handleComplete}
        playsInline
      />

      {started && (
        <button
          onClick={handleComplete}
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.6)',
            padding: '8px 20px',
            borderRadius: '20px',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          }}
        >
          Skip Intro
        </button>
      )}
    </div>
  );
};
