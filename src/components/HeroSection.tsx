import React, { useEffect, useRef, useState } from 'react';

class Butterfly {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  wingAngle: number;
  wingSpeed: number;
  color: string;
  alpha: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 8 + 6;
    this.vx = (Math.random() - 0.5) * 1.8;
    this.vy = -(Math.random() * 1.2 + 0.6);
    this.wingAngle = Math.random() * Math.PI;
    this.wingSpeed = Math.random() * 0.15 + 0.15;
    const colors = [
      'rgba(229, 204, 255, 0.9)', // BTS Purple
      'rgba(242, 227, 198, 0.9)', // Gold
      'rgba(208, 240, 255, 0.9)', // Ice blue
      'rgba(255, 255, 255, 0.95)', // Lily White
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.alpha = 1.0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.wingAngle += this.wingSpeed;
    this.alpha -= 0.008;
    // Fluttering drift
    this.vx += Math.sin(this.y * 0.04) * 0.04;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const flap = Math.abs(Math.sin(this.wingAngle));
    
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = this.alpha;

    // Draw left wing
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-this.size * flap, -this.size * 0.8, -this.size * 1.5 * flap, this.size * 0.2, 0, this.size * 0.4);
    
    // Draw right wing
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(this.size * flap, -this.size * 0.8, this.size * 1.5 * flap, this.size * 0.2, 0, this.size * 0.4);
    
    ctx.fill();

    // Subtle antennae
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-2, -5, -4, -7);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(2, -5, 4, -7);
    ctx.stroke();

    ctx.restore();
  }
}

class SparkleParticle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 2 + 1;
    this.vx = (Math.random() - 0.5) * 1.0;
    this.vy = (Math.random() - 0.5) * 1.0;
    this.alpha = 1.0;
    this.color = Math.random() < 0.5 ? '#f2e3c6' : '#fff';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.015;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 4;
    ctx.fill();
  }
}

export const HeroSection: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const butterfliesRef = useRef<Butterfly[]>([]);
  const sparklesRef = useRef<SparkleParticle[]>([]);
  const lastEmitRef = useRef<number>(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isHovered) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = Date.now();
    if (now - lastEmitRef.current > 100) {
      lastEmitRef.current = now;
      
      // Spawn a butterfly
      butterfliesRef.current.push(new Butterfly(x, y));
      
      // Spawn sparkles
      for (let i = 0; i < 4; i++) {
        sparklesRef.current.push(new SparkleParticle(x, y));
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let animId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update & Draw Sparkles
      const sparkles = sparklesRef.current;
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.update();
        if (s.alpha <= 0) {
          sparkles.splice(i, 1);
          continue;
        }
        s.draw(ctx);
      }

      // Update & Draw Butterflies
      const butterflies = butterfliesRef.current;
      for (let i = butterflies.length - 1; i >= 0; i--) {
        const b = butterflies[i];
        b.update();
        if (b.alpha <= 0) {
          butterflies.splice(i, 1);
          continue;
        }
        b.draw(ctx);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section
      className="garden-section"
      style={{
        background: 'radial-gradient(circle at center, var(--bg-twilight) 0%, var(--bg-dark) 100%)',
        position: 'relative',
        height: '100vh',
        width: '100%',
        zIndex: 5,
      }}
    >
      {/* Drifting cloud assets */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '-10%',
          width: '40%',
          height: '20%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)',
          animation: 'drift 20s ease-in-out infinite alternate',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '-5%',
          width: '50%',
          height: '25%',
          background: 'radial-gradient(ellipse, rgba(220,225,255,0.02) 0%, transparent 80%)',
          animation: 'drift 28s ease-in-out infinite alternate',
          pointerEvents: 'none',
        }}
      />

      {/* Gigantic Glowing Moon */}
      <div
        className="animate-pulse-slow"
        style={{
          position: 'absolute',
          top: '10%',
          width: 'min(45vw, 450px)',
          height: 'min(45vw, 450px)',
          borderRadius: '50%',
          backgroundImage: "url('/moon_texture.png')",
          backgroundSize: 'cover',
          backgroundColor: '#101225',
          mixBlendMode: 'screen',
          boxShadow: '0 0 100px 10px rgba(255, 255, 255, 0.25), 0 0 200px 30px rgba(242, 227, 198, 0.1)',
          zIndex: 1,
          opacity: 0.85,
        }}
      />

      {/* Giant Rotating Lily Container */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        className="interactive"
        style={{
          width: 'min(70vw, 420px)',
          height: 'min(70vw, 420px)',
          zIndex: 3,
          position: 'relative',
          cursor: 'pointer',
          perspective: '1000px',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transform: `perspective(1000px) rotateX(25deg) rotateY(${isHovered ? 20 : 0}deg) scale(${isHovered ? 1.08 : 1})`,
            transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <svg
            viewBox="0 0 100 100"
            className="animate-spin-slow"
            style={{
              width: '100%',
              height: '100%',
              filter: isHovered
                ? 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.7))'
                : 'drop-shadow(0 0 20px rgba(242, 227, 198, 0.4))',
              transition: 'filter 0.5s ease',
            }}
          >
            {/* Ambient inner soft shadow */}
            <circle cx="50" cy="50" r="10" fill="rgba(242, 227, 198, 0.3)" filter="blur(6px)" />

            {/* Outer Petals */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <path
                key={`hero-outer-${i}`}
                d="M 50,50 C 40,24 45,6 50,0 C 55,6 60,24 50,50 Z"
                fill="url(#lilyHeroOuterGrad)"
                style={{
                  transformOrigin: '50px 50px',
                  transform: `rotate(${angle}deg) scale(${isHovered ? 1.05 : 0.95})`,
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            ))}

            {/* Inner Petals */}
            {[30, 90, 150, 210, 270, 330].map((angle, i) => (
              <path
                key={`hero-inner-${i}`}
                d="M 50,50 C 43,30 46,14 50,5 C 54,14 57,30 50,50 Z"
                fill="url(#lilyHeroInnerGrad)"
                style={{
                  transformOrigin: '50px 50px',
                  transform: `rotate(${angle}deg) scale(${isHovered ? 0.95 : 0.8})`,
                  transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            ))}

            {/* Glowing stamens */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
              <g
                key={`hero-stamen-${i}`}
                style={{
                  transformOrigin: '50px 50px',
                  transform: `rotate(${angle}deg) scale(${isHovered ? 0.9 : 0.8})`,
                  transition: 'transform 0.5s ease',
                }}
              >
                <line x1="50" y1="50" x2="50" y2="28" stroke="var(--gold-accent)" strokeWidth="0.8" opacity="0.9" />
                <circle cx="50" cy="27" r="1.3" fill="#fff" filter="drop-shadow(0 0 3px var(--gold-accent))" />
              </g>
            ))}

            <circle cx="50" cy="50" r="3" fill="#fff" filter="drop-shadow(0 0 5px var(--gold-accent))" />

            {/* Definitions */}
            <defs>
              <linearGradient id="lilyHeroOuterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#faf7ee" />
                <stop offset="100%" stopColor="#dfdac9" />
              </linearGradient>
              <linearGradient id="lilyHeroInnerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#fdfaf3" />
                <stop offset="100%" stopColor="#d5cebd" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Floating Canvas overlay for butterfly emitter */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      />

      {/* Title & Floating Info */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          textAlign: 'center',
          zIndex: 6,
          pointerEvents: 'none',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-serif-display)',
            fontSize: '1.2rem',
            letterSpacing: '0.4em',
            color: 'var(--gold-accent)',
            textTransform: 'uppercase',
            marginBottom: '10px',
            textShadow: '0 0 10px rgba(242, 227, 198, 0.3)',
          }}
        >
          Sonakshi's Lily Garden
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          Scroll down to discover her universe
        </p>
      </div>
    </section>
  );
};
