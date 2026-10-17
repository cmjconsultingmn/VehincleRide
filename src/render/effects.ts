interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

interface Popup {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
}

export class Effects {
  private particles: Particle[] = [];
  private popups: Popup[] = [];
  shake = 0;

  emit(x: number, y: number, vx: number, vy: number, size: number, color: string, life = 0.6) {
    this.particles.push({ x, y, vx, vy, life, max: life, size, color });
  }

  popup(text: string, x: number, y: number, color: string) {
    this.popups.push({ text, x, y, life: 1.1, color });
  }

  clear() {
    this.particles = [];
    this.popups = [];
    this.shake = 0;
  }

  update(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.popups) {
      p.y -= 50 * dt;
      p.life -= dt;
    }
    this.popups = this.popups.filter((p) => p.life > 0);
    this.shake = Math.max(0, this.shake - dt * 30);
  }

  drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const k = p.life / p.max;
      ctx.globalAlpha = k * 0.8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.6 - k * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawPopups(ctx: CanvasRenderingContext2D, size: number) {
    ctx.textAlign = 'center';
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = '#1b1b2a';
    for (const p of this.popups) {
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }
}
