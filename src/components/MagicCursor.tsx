import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  type: 'sparkle' | 'petal';
  angle: number;
  rotationSpeed: number;
}

export const MagicCursor: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastEmitRef = useRef<number>(0);

  const posRef = useRef({ x: 0, y: 0 });
  const trailRef = useRef({ x: 0, y: 0 });

  // Track cursor position
  useEffect(() => {
    // Hidden on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

    const updatePosition = (e: MouseEvent) => {
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }

      // Emit custom canvas particles
      const now = Date.now();
      if (now - lastEmitRef.current > 85) {
        lastEmitRef.current = now;
        createParticles(e.clientX, e.clientY);
      }
    };

    // Check if hovered on interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.tagName === 'A' ||
        target.closest('a') ||
        target.classList.contains('interactive') ||
        target.closest('.interactive')
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  // Soft trail for the outer circle
  useEffect(() => {
    let animationFrameId: number;
    
    const updateTrailing = () => {
      const p = posRef.current;
      const t = trailRef.current;
      const dx = p.x - t.x;
      const dy = p.y - t.y;
      
      trailRef.current.x = t.x + dx * 0.15;
      trailRef.current.y = t.y + dy * 0.15;

      if (circleRef.current) {
        circleRef.current.style.left = `${trailRef.current.x}px`;
        circleRef.current.style.top = `${trailRef.current.y}px`;
      }
      
      animationFrameId = requestAnimationFrame(updateTrailing);
    };
    
    animationFrameId = requestAnimationFrame(updateTrailing);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Create particles (sparkles & petals)
  const createParticles = (x: number, y: number) => {
    const particles = particlesRef.current;
    
    // Lower chance of emitting a small golden sparkle
    const sparkleCount = Math.random() < 0.65 ? 1 : 0;
    for (let i = 0; i < sparkleCount; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2 - 0.4, // slightly upward drift
        alpha: 1.0,
        size: Math.random() * 1.8 + 1.2,
        type: 'sparkle',
        angle: 0,
        rotationSpeed: 0
      });
    }

    // Rare chance to emit a lily petal
    if (Math.random() < 0.08) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: Math.random() * 0.6 + 0.4, // float downwards
        alpha: 0.9,
        size: Math.random() * 5 + 4,
        type: 'petal',
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03
      });
    }

    // Cap particles
    if (particles.length > 80) {
      particles.shift();
    }
  };

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawPetal = (c: CanvasRenderingContext2D, px: number, py: number, size: number, angle: number, alpha: number) => {
      c.save();
      c.translate(px, py);
      c.rotate(angle);
      c.beginPath();
      // Curved shape resembling an elegant lily petal
      c.moveTo(0, -size);
      c.quadraticCurveTo(size * 0.6, 0, 0, size);
      c.quadraticCurveTo(-size * 0.6, 0, 0, -size);
      c.closePath();
      c.fillStyle = `rgba(252, 251, 250, ${alpha * 0.85})`;
      c.shadowColor = `rgba(220, 225, 255, ${alpha * 0.4})`;
      c.shadowBlur = 4;
      c.fill();
      c.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.type === 'sparkle' ? 0.02 : 0.007; // petals fade slower
        
        if (p.type === 'petal') {
          p.angle += p.rotationSpeed;
          // Add a subtle wave drift
          p.vx += Math.sin(p.y * 0.02) * 0.02;
        }

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        if (p.type === 'sparkle') {
          // Glow core
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(242, 227, 198, ${p.alpha})`;
          ctx.shadowColor = 'rgba(242, 227, 198, 0.8)';
          ctx.shadowBlur = 6;
          ctx.fill();
        } else {
          // Petal
          drawPetal(ctx, p.x, p.y, p.size, p.angle, p.alpha);
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* Visual Cursor Indicator */}
      <div
        ref={dotRef}
        className="magic-cursor-dot"
        style={{
          width: isHovered ? '12px' : '8px',
          height: isHovered ? '12px' : '8px',
          backgroundColor: isHovered ? 'var(--lily-white)' : 'var(--gold-accent)',
          boxShadow: isHovered ? '0 0 15px var(--lily-white)' : '0 0 10px var(--gold-accent)',
        }}
      />
      <div
        ref={circleRef}
        className="magic-cursor-circle"
        style={{
          transform: `translate(-50%, -50%) scale(${isHovered ? 1.5 : 1})`,
          borderColor: isHovered ? 'var(--lily-white)' : 'rgba(242, 227, 198, 0.3)',
          backgroundColor: isHovered ? 'rgba(252, 251, 250, 0.05)' : 'transparent',
        }}
      />
      {/* High-Performance Canvas Overlay */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 999999998,
        }}
      />
    </>
  );
};
