// Smooth 60fps Canvas Particle & Confetti Engine
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  vRot: number;
  shape: 'rect' | 'circle' | 'star';
  life: number;
  maxLife: number;
}

const GOLD_PALETTE = ['#F59E0B', '#FBBF24', '#FCD34D', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FFFFFF'];

export function triggerConfetti(originX?: number, originY?: number, isGrandFanfare: boolean = false) {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const startX = originX ?? width / 2;
  const startY = originY ?? (isGrandFanfare ? height * 0.4 : height * 0.5);

  const count = isGrandFanfare ? 180 : 70;
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (isGrandFanfare ? 6 : 4) + Math.random() * (isGrandFanfare ? 14 : 9);
    const shapeRoll = Math.random();
    const shape: 'rect' | 'circle' | 'star' = shapeRoll > 0.6 ? 'rect' : shapeRoll > 0.25 ? 'circle' : 'star';

    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isGrandFanfare ? 5 : 2),
      color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      shape,
      life: 0,
      maxLife: Math.floor(Math.random() * 40 + 70),
    });
  }

  let animationFrameId: number;

  function render() {
    ctx?.clearRect(0, 0, width, height);
    let activeCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.life++;
      if (p.life >= p.maxLife) continue;
      activeCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.vRot;

      const alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (ctx) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw 5-pointed star
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(Math.cos(((18 + s * 72) * Math.PI) / 180) * p.size, -Math.sin(((18 + s * 72) * Math.PI) / 180) * p.size);
            ctx.lineTo(Math.cos(((54 + s * 72) * Math.PI) / 180) * (p.size / 2), -Math.sin(((54 + s * 72) * Math.PI) / 180) * (p.size / 2));
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }
    }

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  }

  animationFrameId = requestAnimationFrame(render);
}
