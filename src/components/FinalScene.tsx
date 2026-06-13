import React, { useState, useEffect, useRef } from 'react';

class SkyLantern {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  swaySpeed: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = -(Math.random() * 0.7 + 0.5);
    this.size = Math.random() * 12 + 10;
    this.alpha = 1.0;
    this.swaySpeed = Math.random() * 0.02 + 0.01;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx += Math.sin(this.y * this.swaySpeed) * 0.02;
    if (this.y < 120) {
      this.alpha -= 0.006;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = Math.max(0, this.alpha);

    // Warm glow outer ring
    ctx.beginPath();
    ctx.arc(0, 0, this.size + 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(249, 115, 22, 0.15)';
    ctx.fill();

    // Lantern body
    ctx.beginPath();
    ctx.moveTo(-this.size * 0.4, -this.size * 0.6);
    ctx.lineTo(this.size * 0.4, -this.size * 0.6);
    ctx.lineTo(this.size * 0.5, this.size * 0.6);
    ctx.lineTo(-this.size * 0.5, this.size * 0.6);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, -this.size * 0.6, 0, this.size * 0.6);
    grad.addColorStop(0, '#fef9c3'); // warm soft yellow top
    grad.addColorStop(0.6, '#f97316'); // orange middle
    grad.addColorStop(1, '#ea580c'); // flame red-orange bottom
    ctx.fillStyle = grad;
    
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Fire core inside
    ctx.beginPath();
    ctx.arc(0, this.size * 0.45, this.size * 0.15, 0, Math.PI, true);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

class WaterLily {
  x: number;
  y: number;
  size: number;
  vx: number;
  phase: number;
  speed: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 6 + 4;
    this.vx = -(Math.random() * 0.1 + 0.05); // float leftwards
    this.phase = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 0.005 + 0.002;
  }

  update() {
    this.x += this.vx;
    this.phase += this.speed;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const wave = Math.sin(this.phase) * 2;
    ctx.save();
    ctx.translate(this.x, this.y + wave);

    // Glow
    ctx.beginPath();
    ctx.arc(0, 0, this.size + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();

    // Lily Pad base (greenish/dark indigo outline)
    ctx.beginPath();
    ctx.arc(0, this.size * 0.2, this.size * 1.1, 0, Math.PI * 1.8);
    ctx.lineTo(0, this.size * 0.2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(30, 45, 60, 0.5)';
    ctx.fill();

    // Floating flower (overlapping simple white triangles)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = 'rgba(242, 227, 198, 0.5)';
    ctx.lineWidth = 0.5;

    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * this.size, Math.sin(angle) * this.size);
      ctx.lineTo(Math.cos(angle + 0.3) * (this.size * 0.5), Math.sin(angle + 0.3) * (this.size * 0.5));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glowing core
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f2e3c6';
    ctx.fill();

    ctx.restore();
  }
}

export const FinalScene: React.FC = () => {
  const [wishOpen, setWishOpen] = useState(false);
  const [wishText, setWishText] = useState('');
  const [wishSent, setWishSent] = useState(false);
  const [finalFaded, setFinalFaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lanternsRef = useRef<SkyLantern[]>([]);
  const waterLiliesRef = useRef<WaterLily[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn initial water lilies
    for (let i = 0; i < 35; i++) {
      waterLiliesRef.current.push(
        new WaterLily(Math.random() * canvas.width, canvas.height - 180 + Math.random() * 150)
      );
    }

    let animId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep lake reflection colors
      ctx.fillStyle = '#06060f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const grad = ctx.createLinearGradient(0, canvas.height - 250, 0, canvas.height);
      grad.addColorStop(0, '#06060f');
      grad.addColorStop(1, '#0e0e24');
      ctx.fillStyle = grad;
      ctx.fillRect(0, canvas.height - 250, canvas.width, 250);

      // Draw moon reflection on lake
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height - 200, 150, 20, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(242, 227, 198, 0.05)';
      ctx.filter = 'blur(10px)';
      ctx.fill();
      ctx.filter = 'none';

      // Wave lines reflecting light
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let i = canvas.height - 220; i < canvas.height; i += 12) {
        const widthOffset = Math.sin(Date.now() * 0.001 + i) * 15;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 250 - widthOffset, i);
        ctx.lineTo(canvas.width / 2 + 250 + widthOffset, i);
        ctx.stroke();
      }

      // Update & Draw Water Lilies
      const waterLilies = waterLiliesRef.current;
      waterLilies.forEach((wl) => {
        wl.update();
        if (wl.x < -20) wl.x = canvas.width + 20; // wrap
        wl.draw(ctx);
      });

      // Update & Draw Sky Lanterns
      const lanterns = lanternsRef.current;
      for (let i = lanterns.length - 1; i >= 0; i--) {
        const l = lanterns[i];
        l.update();
        if (l.alpha <= 0 || l.y < -30) {
          lanterns.splice(i, 1);
          continue;
        }
        l.draw(ctx);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleMakeWish = () => {
    setWishOpen(true);
  };

  const handleSendWish = () => {
    setWishOpen(false);
    setWishSent(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Spawn a flurry of lanterns!
    for (let i = 0; i < 22; i++) {
      setTimeout(() => {
        const randomX = Math.random() * canvas.width;
        // spawn starting from bottom of screen
        lanternsRef.current.push(new SkyLantern(randomX, canvas.height + 30));
      }, i * 350);
    }

    // Play synthesized b-day swell arpeggio chime
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.1);
    master.connect(ctx.destination);

    const chords = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Beautiful C Major 9 swell

    chords.forEach((freq, idx) => {
      const time = ctx.currentTime + idx * 0.18;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.2, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 2.5);

      osc.connect(gain);
      gain.connect(master);
      osc.start(time);
      osc.stop(time + 2.6);
    });

    // Fade screen out to stars after lanterns float up
    setTimeout(() => {
      setFinalFaded(true);
    }, 8000);
  };

  return (
    <section
      className="garden-section"
      style={{
        background: '#06060f',
        position: 'relative',
        height: '100vh',
        width: '100%',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Background Lake Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Floating Center Lily Graphic (static 2.5D styled SVG) */}
      <div
        className="animate-float"
        style={{
          position: 'absolute',
          bottom: '120px',
          width: '130px',
          height: '100px',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      >
        <svg viewBox="0 0 100 80" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.4))' }}>
          {/* Lily pad */}
          <path d="M 50,60 C 20,60 10,50 10,40 C 10,30 25,25 50,25 C 75,25 90,30 90,40 C 90,50 80,60 50,60 Z" fill="rgba(30,55,40,0.6)" />
          <path d="M 50,60 C 50,60 40,55 50,25" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" fill="none" />
          
          {/* Flower blooming on lake */}
          <path d="M 50,45 C 38,30 42,15 50,5 C 58,15 62,30 50,45 Z" fill="rgba(255,255,255,0.95)" />
          <path d="M 50,45 C 44,35 48,22 50,12 C 52,22 56,35 50,45 Z" fill="rgba(252,251,250,0.9)" />
          <circle cx="50" cy="40" r="2.5" fill="var(--gold-accent)" />
        </svg>
      </div>

      {/* Ending Typography Details */}
      <div
        style={{
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '620px',
          padding: '0 24px',
          transition: 'opacity 2s ease',
          opacity: finalFaded ? 0 : 1
        }}
      >
        <p
          className="serif-quote"
          style={{
            fontSize: '1.45rem',
            letterSpacing: '0.05em',
            color: 'var(--text-primary)',
            marginBottom: '16px',
            textShadow: '0 0 10px rgba(255,255,255,0.15)'
          }}
        >
          "The world became a little brighter the day you arrived."
        </p>
        <h1
          style={{
            fontSize: '2.5rem',
            color: 'var(--gold-accent)',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            fontWeight: '400',
            marginBottom: '40px',
            textShadow: '0 0 25px rgba(242, 227, 198, 0.4)'
          }}
        >
          Happy Birthday, Sonakshi 🌸
        </h1>

        {!wishSent && (
          <button onClick={handleMakeWish} className="magic-btn interactive">
            Make a Wish
          </button>
        )}
      </div>

      {/* Glassmorphism Wish Text Box */}
      {wishOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(5, 5, 12, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '24px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '36px',
              textAlign: 'center',
              background: 'rgba(20, 20, 30, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              animation: 'fade-in-up 0.4s ease'
            }}
          >
            <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0 }}>Write your Birthday Wish</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              Send a secret wish up into the twilight sky lanterns.
            </p>
            
            <textarea
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              placeholder="May this year be filled with..."
              style={{
                width: '100%',
                height: '110px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                padding: '12px',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'none',
                fontFamily: 'var(--font-sans)',
                lineHeight: '1.5'
              }}
            />

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setWishOpen(false)}
                className="interactive"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'var(--text-secondary)',
                  borderRadius: '20px',
                  padding: '8px 20px',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendWish}
                className="magic-btn interactive"
                style={{
                  padding: '8px 24px',
                  fontSize: '0.75rem'
                }}
              >
                Send into Stars ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Starry Final Fade Out Backdrop */}
      {finalFaded && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#030308',
            backgroundImage: 'radial-gradient(ellipse at center, rgba(13,14,38,0.2) 0%, #030308 100%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'auto'
          }}
        >
          {/* Subtle tiny sparkles on dark backdrop */}
          <div style={{ opacity: 0.35, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            {[10, 20, 30, 45, 55, 75, 80, 90].map((left, idx) => (
              <div
                key={idx}
                className="animate-pulse-slow"
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: `${Math.random() * 80 + 10}%`,
                  width: '2px',
                  height: '2px',
                  backgroundColor: '#fff',
                  boxShadow: '0 0 5px #fff',
                  animationDelay: `${idx * 250}ms`
                }}
              />
            ))}
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-serif-display)',
              fontSize: '1.4rem',
              color: 'var(--gold-accent)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              textAlign: 'center',
              textShadow: '0 0 15px rgba(242, 227, 198, 0.25)',
              lineHeight: '2.0',
              padding: '0 24px'
            }}
          >
            Thank you for visiting Sonakshi's Secret Garden.<br />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', letterSpacing: '0.15em' }}>Your wish is written in the constellations. 🌿🤍</span>
          </h2>
        </div>
      )}
    </section>
  );
};
