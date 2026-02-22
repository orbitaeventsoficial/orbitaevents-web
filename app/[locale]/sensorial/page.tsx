// ============================================================
// 🌟 ESPAI SENSORIAL - VERSIÓ DEFINITIVA
// ============================================================
// Un espai digital dissenyat per persones amb sensibilitat
// sensorial. Creat amb amor i respecte.
// ============================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

// ============================================================
// CONFIGURACIÓ DE TEMES (MOLTS MÉS!)
// ============================================================

// Theme IDs map to translation keys in sensorial.themeNames.*
const THEMES = [
  // Naturalesa
  { id: 'calm', emoji: '🌙', category: 'natura', items: ['🌙', '⭐', '✨', '💫'], cursor: '🌙', colors: ['#a78bfa', '#818cf8'], bg: 'from-indigo-950 via-violet-950 to-black', sound: [130.81, 196.00, 261.63] },
  { id: 'ocean', emoji: '🌊', category: 'natura', items: ['🐚', '🐠', '🦀', '🐙', '🦑', '🐡', '🦐', '💎', '🫧'], cursor: '🐚', colors: ['#0ea5e9', '#06b6d4'], bg: 'from-cyan-950 via-blue-950 to-black', sound: [110, 164.81, 220] },
  { id: 'forest', emoji: '🌲', category: 'natura', items: ['🍃', '🌿', '🦋', '🐦', '🌸', '🍀', '🌺', '🐿️', '🦔'], cursor: '🍃', colors: ['#22c55e', '#10b981'], bg: 'from-emerald-950 via-green-950 to-black', sound: [146.83, 220, 293.66] },
  { id: 'sky', emoji: '☁️', category: 'natura', items: ['☁️', '🌤️', '🌈', '🦅', '🎈', '🪁', '🦜', '🕊️'], cursor: '☁️', colors: ['#38bdf8', '#7dd3fc'], bg: 'from-sky-950 via-blue-950 to-black', sound: [174.61, 220, 261.63] },
  { id: 'garden', emoji: '🌷', category: 'natura', items: ['🌷', '🌹', '🌻', '🌼', '💐', '🦋', '🐝', '🐞', '🌺'], cursor: '🌸', colors: ['#f472b6', '#fb7185'], bg: 'from-pink-950 via-rose-950 to-black', sound: [196, 246.94, 293.66] },
  { id: 'aurora', emoji: '🌌', category: 'natura', items: ['✨', '💫', '⭐', '🌟', '❄️', '🦌'], cursor: '✨', colors: ['#34d399', '#a78bfa', '#06b6d4'], bg: 'from-emerald-950 via-violet-950 to-black', sound: [130.81, 164.81, 196] },
  { id: 'fireflies', emoji: '✨', category: 'natura', items: ['✨', '💫', '🌙', '🦗', '🌾', '🍃'], cursor: '✨', colors: ['#fbbf24', '#f59e0b'], bg: 'from-amber-950 via-yellow-950 to-black', sound: [220, 277.18, 329.63] },

  // Espai
  { id: 'cosmos', emoji: '🚀', category: 'espai', items: ['🚀', '🛸', '🌍', '🌙', '⭐', '🪐', '☄️', '👽', '🛰️'], cursor: '🚀', colors: ['#8b5cf6', '#6366f1'], bg: 'from-violet-950 via-indigo-950 to-black', sound: [98, 130.81, 164.81] },
  { id: 'planets', emoji: '🪐', category: 'espai', items: ['🪐', '🌍', '🌕', '☀️', '🌑', '🌓', '🌗', '💫'], cursor: '🪐', colors: ['#f59e0b', '#d97706'], bg: 'from-orange-950 via-amber-950 to-black', sound: [65.41, 98, 130.81] },

  // Animals
  { id: 'aquarium', emoji: '🐠', category: 'animals', items: ['🐠', '🐟', '🐡', '🦈', '🐙', '🦑', '🦐', '🦞', '🐢', '🦭'], cursor: '🐠', colors: ['#06b6d4', '#0891b2'], bg: 'from-cyan-950 via-teal-950 to-black', sound: [196, 246.94, 293.66] },
  { id: 'safari', emoji: '🦁', category: 'animals', items: ['🦁', '🐘', '🦒', '🦓', '🦛', '🐆', '🦏', '🐊', '🦩'], cursor: '🦁', colors: ['#d97706', '#b45309'], bg: 'from-amber-950 via-orange-950 to-black', sound: [130.81, 164.81, 196] },
  { id: 'pets', emoji: '🐱', category: 'animals', items: ['🐱', '🐶', '🐹', '🐰', '🐦', '🐢', '🐠', '🦜', '🐿️'], cursor: '🐾', colors: ['#fb923c', '#fdba74'], bg: 'from-orange-950 via-amber-950 to-black', sound: [261.63, 329.63, 392] },
  { id: 'dinosaurs', emoji: '🦕', category: 'animals', items: ['🦕', '🦖', '🥚', '🌋', '🌿', '🦴', '🪨'], cursor: '🦕', colors: ['#84cc16', '#65a30d'], bg: 'from-lime-950 via-green-950 to-black', sound: [65.41, 82.41, 98] },

  // Fantasia
  { id: 'unicorn', emoji: '🦄', category: 'fantasia', items: ['🦄', '🌈', '⭐', '💖', '🎀', '👑', '💎', '🌸', '✨'], cursor: '🦄', colors: ['#f472b6', '#c084fc', '#60a5fa'], bg: 'from-pink-950 via-purple-950 to-black', sound: [392, 493.88, 587.33] },
  { id: 'fairy', emoji: '🧚', category: 'fantasia', items: ['🧚', '🦋', '🌸', '✨', '🍄', '🌺', '💫', '🌙'], cursor: '🧚', colors: ['#a855f7', '#d946ef'], bg: 'from-purple-950 via-fuchsia-950 to-black', sound: [523.25, 659.25, 783.99] },
  { id: 'dragon', emoji: '🐉', category: 'fantasia', items: ['🐉', '🔥', '💎', '⚔️', '🏰', '👑', '🛡️', '🗡️'], cursor: '🐉', colors: ['#dc2626', '#f97316'], bg: 'from-red-950 via-orange-950 to-black', sound: [98, 116.54, 146.83] },
  { id: 'mermaid', emoji: '🧜', category: 'fantasia', items: ['🧜', '🐚', '💎', '🦪', '🌊', '✨', '👑', '🔱'], cursor: '🧜', colors: ['#06b6d4', '#8b5cf6'], bg: 'from-cyan-950 via-violet-950 to-black', sound: [293.66, 369.99, 440] },

  // Menjar
  { id: 'candy', emoji: '🍭', category: 'menjar', items: ['🍭', '🍬', '🍫', '🧁', '🍩', '🍪', '🎂', '🍰', '🍦'], cursor: '🍭', colors: ['#f472b6', '#fb7185', '#fbbf24'], bg: 'from-pink-950 via-rose-950 to-black', sound: [523.25, 587.33, 659.25] },
  { id: 'fruits', emoji: '🍎', category: 'menjar', items: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍍', '🥭'], cursor: '🍎', colors: ['#ef4444', '#f97316', '#eab308'], bg: 'from-red-950 via-orange-950 to-black', sound: [261.63, 329.63, 392] },

  // Festes (Òrbita!)
  { id: 'monmagic', emoji: '⚡', category: 'orbita', items: ['⚡', '🪄', '🦉', '📚', '🏰', '🧹', '🐍', '🦁', '🦅', '🦡', '⭐', '✨'], cursor: '🪄', colors: ['#fbbf24', '#7c3aed'], bg: 'from-amber-950 via-violet-950 to-black', sound: [261.63, 329.63, 392] },
  { id: 'halloween', emoji: '🎃', category: 'orbita', items: ['🎃', '👻', '🦇', '💀', '🕷️', '🕸️', '🧙', '🧛', '🌙', '🦴', '⚰️'], cursor: '🎃', colors: ['#f97316', '#7c2d12'], bg: 'from-orange-950 via-black to-black', sound: [146.83, 174.61, 220] },
  { id: 'christmas', emoji: '🎄', category: 'orbita', items: ['🎄', '🎅', '🎁', '⭐', '❄️', '☃️', '🦌', '🔔', '🎀', '🍪'], cursor: '🎄', colors: ['#dc2626', '#16a34a'], bg: 'from-red-950 via-green-950 to-black', sound: [261.63, 329.63, 392] },
  { id: 'tropical', emoji: '🌴', category: 'orbita', items: ['🌴', '🌺', '🍹', '🥥', '🦜', '🐠', '🌊', '☀️', '🏝️', '🦀'], cursor: '🌴', colors: ['#06b6d4', '#10b981'], bg: 'from-cyan-950 via-emerald-950 to-black', sound: [196, 246.94, 293.66] },
  { id: 'disco', emoji: '🪩', category: 'orbita', items: ['🪩', '💃', '🕺', '🎵', '🎤', '🎧', '💜', '💖', '✨', '🌟'], cursor: '🪩', colors: ['#ec4899', '#8b5cf6', '#06b6d4'], bg: 'from-fuchsia-950 via-violet-950 to-black', sound: [130.81, 164.81, 196] },
  { id: 'elegant', emoji: '✨', category: 'orbita', items: ['✨', '💎', '👑', '🥂', '🌹', '💫', '⭐', '🎀'], cursor: '💎', colors: ['#fbbf24', '#f59e0b'], bg: 'from-amber-950 via-yellow-950 to-black', sound: [220, 277.18, 329.63] },
  { id: 'carnival', emoji: '🎭', category: 'orbita', items: ['🎭', '🎪', '🎠', '🎡', '🎢', '🎨', '🎈', '🎉', '🤡'], cursor: '🎭', colors: ['#f43f5e', '#8b5cf6', '#fbbf24'], bg: 'from-rose-950 via-violet-950 to-black', sound: [261.63, 329.63, 392] },

  // Zen / Relaxació
  { id: 'zen', emoji: '🪷', category: 'zen', items: ['🪷', '🧘', '☯️', '🕯️', '🪨', '💧', '🌸'], cursor: '🪷', colors: ['#a3a3a3', '#737373'], bg: 'from-stone-950 via-neutral-950 to-black', sound: [174.61, 220, 261.63] },
  { id: 'rain', emoji: '🌧️', category: 'zen', items: ['💧', '🌧️', '☔', '🌈', '🍃', '🐸'], cursor: '💧', colors: ['#60a5fa', '#3b82f6'], bg: 'from-blue-950 via-slate-950 to-black', sound: [196, 233.08, 261.63] },
  { id: 'snow', emoji: '❄️', category: 'zen', items: ['❄️', '☃️', '🌨️', '⛄', '🏔️', '🎿'], cursor: '❄️', colors: ['#e0f2fe', '#bae6fd'], bg: 'from-sky-950 via-slate-950 to-black', sound: [293.66, 349.23, 392] },
];

// Category IDs map to translation keys in sensorial.categoryNames.*
const CATEGORIES = [
  { id: 'natura', emoji: '🌿' },
  { id: 'espai', emoji: '🚀' },
  { id: 'animals', emoji: '🐾' },
  { id: 'fantasia', emoji: '✨' },
  { id: 'menjar', emoji: '🍭' },
  { id: 'orbita', emoji: '🎉' },
  { id: 'zen', emoji: '🧘' },
];

// ============================================================
// MOTOR D'ÀUDIO
// ============================================================

class AudioEngine {
  private ctx: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private masterGain: GainNode | null = null;
  private isPlaying = false;

  async start(frequencies: number[]) {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.stop();
    this.isPlaying = true;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    frequencies.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.08 / (i + 1);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      this.oscillators.push(osc);
    });

    this.masterGain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 2);
    this.breathe();
  }

  private breathe() {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.linearRampToValueAtTime(0.35, now + 4);
    this.masterGain.gain.linearRampToValueAtTime(0.18, now + 10);
    setTimeout(() => this.breathe(), 10000);
  }

  playGrab() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = 600;
    osc.type = 'sine';
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playDrop() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = 400;
    osc.type = 'sine';
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playBounce() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = 300 + Math.random() * 200;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.stop(this.ctx.currentTime + 0.1);
  }

  stop() {
    this.isPlaying = false;
    this.oscillators.forEach(o => { try { o.stop(); } catch {} });
    this.oscillators = [];
  }
}

const audio = typeof window !== 'undefined' ? new AudioEngine() : null;

// ============================================================
// ELEMENT INTERACTIU (que es pot agafar!)
// ============================================================

interface GrabbableItem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  grabbed: boolean;
  scale: number;
}

// ============================================================
// CANVAS AMB ELEMENTS QUE ES PODEN AGAFAR
// ============================================================

function InteractiveCanvas({
  theme,
  intensity,
  speed,
  soundEnabled,
}: {
  theme: typeof THEMES[0];
  intensity: number;
  speed: number;
  soundEnabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemsRef = useRef<GrabbableItem[]>([]);
  const pointerRef = useRef({ x: -1000, y: -1000, active: false, down: false });
  const grabbedItemRef = useRef<number | null>(null);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>();
  const timeRef = useRef(0);

  // Inicialitzar items
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Crear items
      itemsRef.current = [];
      const count = Math.floor(intensity * 0.8);
      for (let i = 0; i < count; i++) {
        itemsRef.current.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          emoji: theme.items[Math.floor(Math.random() * theme.items.length)],
          size: 30 + Math.random() * 30,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 3,
          grabbed: false,
          scale: 1,
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GRAVITY = 0.15;
    const BOUNCE = 0.7;
    const FRICTION = 0.99;

    const render = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;

      // Clear
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pointer = pointerRef.current;

      // Dibuixar cursor personalitzat
      if (pointer.active) {
        // Glow del cursor
        const gradient = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 80);
        gradient.addColorStop(0, theme.colors[0] + '40');
        gradient.addColorStop(0.5, theme.colors[0] + '15');
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 80, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Cursor emoji
        ctx.save();
        ctx.translate(pointer.x, pointer.y);
        ctx.rotate(Math.sin(t * 2) * 0.1);
        const cursorSize = pointer.down ? 50 : 40;
        ctx.font = `${cursorSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(theme.cursor, 0, 0);
        ctx.restore();

        // Cercle d'agafar
        if (pointer.down && grabbedItemRef.current === null) {
          ctx.beginPath();
          ctx.arc(pointer.x, pointer.y, 60, 0, Math.PI * 2);
          ctx.strokeStyle = theme.colors[0] + '50';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Actualitzar i dibuixar items
      itemsRef.current.forEach((item) => {
        // Si està agafat, seguir el cursor
        if (item.grabbed && grabbedItemRef.current === item.id) {
          const dx = pointer.x - item.x;
          const dy = pointer.y - item.y;
          item.x += dx * 0.3;
          item.y += dy * 0.3;
          item.vx = pointer.x - lastPointerRef.current.x;
          item.vy = pointer.y - lastPointerRef.current.y;
          item.scale = 1.3;
          item.rotationSpeed = item.vx * 0.5;
        } else {
          // Física normal
          item.vy += GRAVITY * speed;
          item.vx *= FRICTION;
          item.vy *= FRICTION;
          item.x += item.vx * speed;
          item.y += item.vy * speed;
          item.scale = Math.max(1, item.scale - 0.02);

          // Bounce als límits
          if (item.x < item.size / 2) {
            item.x = item.size / 2;
            item.vx *= -BOUNCE;
            if (soundEnabled && Math.abs(item.vx) > 1) audio?.playBounce();
          }
          if (item.x > canvas.width - item.size / 2) {
            item.x = canvas.width - item.size / 2;
            item.vx *= -BOUNCE;
            if (soundEnabled && Math.abs(item.vx) > 1) audio?.playBounce();
          }
          if (item.y < item.size / 2) {
            item.y = item.size / 2;
            item.vy *= -BOUNCE;
          }
          if (item.y > canvas.height - item.size / 2) {
            item.y = canvas.height - item.size / 2;
            item.vy *= -BOUNCE;
            if (soundEnabled && Math.abs(item.vy) > 2) audio?.playBounce();
          }

          // Atracció suau al cursor
          if (pointer.active && !pointer.down) {
            const dx = pointer.x - item.x;
            const dy = pointer.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150 && dist > 0) {
              const force = (1 - dist / 150) * 0.02 * speed;
              item.vx += dx * force;
              item.vy += dy * force;
            }
          }
        }

        item.rotation += item.rotationSpeed * speed;

        // Dibuixar item
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation * Math.PI / 180);
        ctx.scale(item.scale, item.scale);
        
        // Glow si està agafat
        if (item.grabbed) {
          ctx.shadowColor = theme.colors[0];
          ctx.shadowBlur = 20;
        }
        
        ctx.font = `${item.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.emoji, 0, 0);
        ctx.restore();
      });

      lastPointerRef.current = { x: pointer.x, y: pointer.y };
      frameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [theme, intensity, speed, soundEnabled]);

  // Handlers
  const handleMove = useCallback((x: number, y: number) => {
    pointerRef.current.x = x;
    pointerRef.current.y = y;
    pointerRef.current.active = true;
  }, []);

  const handleDown = useCallback((x: number, y: number) => {
    pointerRef.current = { x, y, active: true, down: true };
    
    // Buscar item per agafar
    const item = itemsRef.current.find((item) => {
      const dx = x - item.x;
      const dy = y - item.y;
      return Math.sqrt(dx * dx + dy * dy) < item.size;
    });

    if (item) {
      item.grabbed = true;
      grabbedItemRef.current = item.id;
      if (soundEnabled) audio?.playGrab();
    }
  }, [soundEnabled]);

  const handleUp = useCallback(() => {
    pointerRef.current.down = false;
    
    // Deixar anar item
    if (grabbedItemRef.current !== null) {
      const item = itemsRef.current.find(i => i.id === grabbedItemRef.current);
      if (item) {
        item.grabbed = false;
        // Impulsar amb la velocitat del cursor
        item.vx *= 2;
        item.vy *= 2;
        if (soundEnabled) audio?.playDrop();
      }
      grabbedItemRef.current = null;
    }
  }, [soundEnabled]);

  const handleLeave = useCallback(() => {
    pointerRef.current.active = false;
    handleUp();
  }, [handleUp]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 touch-none"
      style={{ cursor: 'none', zIndex: 1 }}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseDown={(e) => handleDown(e.clientX, e.clientY)}
      onMouseUp={handleUp}
      onMouseLeave={handleLeave}
      onTouchMove={(e) => { const t = e.touches[0]; if (t) handleMove(t.clientX, t.clientY); }}
      onTouchStart={(e) => { const t = e.touches[0]; if (t) handleDown(t.clientX, t.clientY); }}
      onTouchEnd={handleUp}
    />
  );
}

// ============================================================
// MODAL D'EXPLICACIÓ (PER QUÈ EXISTEIX AQUESTA PÀGINA)
// ============================================================

function ExplanationModal({ onClose, color, t }: { onClose: () => void; color: string; t: (key: string, values?: Record<string, string>) => string }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      emoji: '💜',
      titleKey: 'tutorial.step1.title',
      content: (
        <div className="space-y-4 text-white/70">
          <p dangerouslySetInnerHTML={{ __html: t('tutorial.step1.p1') }} />
          <p>{t('tutorial.step1.p2')}</p>
          <p className="text-white/50 text-sm italic">
            {t('tutorial.step1.p3')}
          </p>
        </div>
      ),
    },
    {
      emoji: '👆',
      titleKey: 'tutorial.step2.title',
      content: (
        <div className="space-y-4 text-white/70">
          <p dangerouslySetInnerHTML={{ __html: t('tutorial.step2.intro') }} />
          <ul className="space-y-2 ml-4">
            <li dangerouslySetInnerHTML={{ __html: '🖱️ ' + t('tutorial.step2.click') }} />
            <li dangerouslySetInnerHTML={{ __html: '↔️ ' + t('tutorial.step2.drag') }} />
            <li dangerouslySetInnerHTML={{ __html: '🚀 ' + t('tutorial.step2.throw') }} />
            <li dangerouslySetInnerHTML={{ __html: '🏀 ' + t('tutorial.step2.bounce') }} />
          </ul>
          <p className="text-white/50 text-sm">
            {t('tutorial.step2.cursor')}
          </p>
        </div>
      ),
    },
    {
      emoji: '🎨',
      titleKey: 'tutorial.step3.title',
      content: (
        <div className="space-y-4 text-white/70">
          <p dangerouslySetInnerHTML={{ __html: t('tutorial.step3.intro') }} />
          <div className="grid grid-cols-4 gap-2 text-center text-2xl">
            {['🌊', '🦄', '🚀', '🎃', '🐠', '🌈', '🎄', '🦁', '🍭', '🐉', '❄️', '🪩'].map((e, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                {e}
              </motion.span>
            ))}
          </div>
          <p className="text-white/50 text-sm">
            {t('tutorial.step3.outro')}
          </p>
        </div>
      ),
    },
    {
      emoji: '🎵',
      titleKey: 'tutorial.step4.title',
      content: (
        <div className="space-y-4 text-white/70">
          <p dangerouslySetInnerHTML={{ __html: t('tutorial.step4.p1') }} />
          <p dangerouslySetInnerHTML={{ __html: t('tutorial.step4.p2') }} />
          <p dangerouslySetInnerHTML={{ __html: t('tutorial.step4.p3') }} />
          <p className="text-white/50 text-sm">
            {t('tutorial.step4.p4')}
          </p>
        </div>
      ),
    },
  ];

  const cur = steps[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full cursor-pointer"
              style={{ backgroundColor: i === step ? color : 'rgba(255,255,255,0.2)' }}
              onClick={() => setStep(i)}
              whileHover={{ scale: 1.3 }}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10"
          >
            <div className="text-center mb-6">
              <motion.span
                className="text-7xl block mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {cur.emoji}
              </motion.span>
              <h2 className="text-2xl font-bold text-white">{t(cur.titleKey)}</h2>
            </div>
            {cur.content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-4 justify-center mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
            >
              ← {t('tutorial.back')}
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-8 py-3 rounded-full font-semibold text-black transition-transform hover:scale-105"
              style={{ backgroundColor: color }}
            >
              {t('tutorial.next')} →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-full font-bold text-black transition-transform hover:scale-105"
              style={{ backgroundColor: color }}
            >
              {t('tutorial.start')} 🎮
            </button>
          )}
        </div>

        {step < steps.length - 1 && (
          <button
            onClick={onClose}
            className="mt-6 text-white/50 text-sm block mx-auto hover:text-white/50"
          >
            {t('tutorial.skip')}
          </button>
        )}

        <p className="text-white/20 text-xs text-center mt-8">
          {t('tutorial.madeBy')}
        </p>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// PANEL DE CONTROL
// ============================================================

function ControlPanel({
  open,
  theme,
  onThemeChange,
  intensity,
  onIntensityChange,
  speed,
  onSpeedChange,
  soundEnabled,
  onSoundToggle,
  color,
  t,
}: {
  open: boolean;
  theme: typeof THEMES[0];
  onThemeChange: (t: typeof THEMES[0]) => void;
  intensity: number;
  onIntensityChange: (i: number) => void;
  speed: number;
  onSpeedChange: (s: number) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  color: string;
  t: (key: string, values?: Record<string, string>) => string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!open) return null;

  const filteredThemes = selectedCategory
    ? THEMES.filter(themeItem => themeItem.category === selectedCategory)
    : THEMES;

  return (
    <motion.aside
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed right-0 top-0 bottom-0 z-40 w-80 sm:w-96
               bg-black/95 backdrop-blur-xl border-l border-white/10
               overflow-y-auto"
    >
      <div className="p-6 pt-20 pb-32">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">🎛️</span>
          <div>
            <h2 className="text-xl font-bold text-white">{t('controls')}</h2>
            <p className="text-white/60 text-sm">{t('customizeExperience')}</p>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="text-white/60 text-xs uppercase mb-3">📁 {t('categories')}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                !selectedCategory ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60'
              }`}
            >
              {t('all')}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1 ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{t(`categoryNames.${cat.id}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Temes */}
        <div className="mb-8">
          <h3 className="text-white/60 text-xs uppercase mb-3">🎨 {t('themesLabel')} ({filteredThemes.length})</h3>
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-2">
            {filteredThemes.map(themeItem => (
              <button
                key={themeItem.id}
                onClick={() => onThemeChange(themeItem)}
                className={`p-2 rounded-xl text-center transition-all ${
                  theme.id === themeItem.id ? 'ring-2 bg-white/15' : 'bg-white/5 hover:bg-white/10'
                }`}
                style={{ '--tw-ring-color': themeItem.colors[0] } as React.CSSProperties}
                title={t(`themeNames.${themeItem.id}`)}
              >
                <span className="text-2xl block">{themeItem.emoji}</span>
                <span className="text-white/50 text-[10px] truncate block">{t(`themeNames.${themeItem.id}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* So */}
        <div className="mb-8">
          <h3 className="text-white/60 text-xs uppercase mb-3">🔊 {t('sound')}</h3>
          <button
            onClick={onSoundToggle}
            className={`w-full p-4 rounded-xl text-left flex items-center gap-4 transition-all ${
              soundEnabled ? 'bg-white/15 ring-1' : 'bg-white/5 hover:bg-white/10'
            }`}
            style={{ '--tw-ring-color': soundEnabled ? color : 'transparent' } as React.CSSProperties}
          >
            <span className="text-3xl">{soundEnabled ? '🔊' : '🔇'}</span>
            <div className="flex-1">
              <p className="text-white font-medium">{t('ambientSound')}</p>
              <p className="text-white/60 text-xs">
                {soundEnabled ? t('soundOn') : t('soundOff')}
              </p>
            </div>
          </button>
        </div>

        {/* Sliders */}
        <div className="mb-8 space-y-4">
          <h3 className="text-white/60 text-xs uppercase mb-3">🎚️ {t('intensity')}</h3>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">{t('elements')}</span>
              <span className="text-white/60 font-mono">{intensity}</span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={intensity}
              onChange={(e) => onIntensityChange(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${color} 0%, ${color} ${((intensity - 10) / 50) * 100}%, rgba(255,255,255,0.1) ${((intensity - 10) / 50) * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">{t('speedLabel')}</span>
              <span className="text-white/60 font-mono">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={2}
              step={0.1}
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${color} 0%, ${color} ${((speed - 0.2) / 1.8) * 100}%, rgba(255,255,255,0.1) ${((speed - 0.2) / 1.8) * 100}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
          </div>
        </div>

        {/* Presets */}
        <div className="mb-8">
          <h3 className="text-white/60 text-xs uppercase mb-3">⚡ {t('presets')}</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { onIntensityChange(15); onSpeedChange(0.3); }}
              className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm"
            >
              🧘 {t('presetSoft')}
            </button>
            <button
              onClick={() => { onIntensityChange(30); onSpeedChange(0.8); }}
              className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm"
            >
              ✨ {t('presetNormal')}
            </button>
            <button
              onClick={() => { onIntensityChange(50); onSpeedChange(1.5); }}
              className="py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm"
            >
              🎉 {t('presetActive')}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50">
          <p className="mb-2"><strong className="text-white/70">💡 {t('tips')}:</strong></p>
          <ul className="space-y-1">
            <li>• {t('tipDrag')}</li>
            <li>• {t('tipBounce')}</li>
            <li>• {t('tipCursor', { cursor: theme.cursor })}</li>
          </ul>
        </div>

        <div className="pt-8 mt-8 border-t border-white/10 text-center">
          <p className="text-white/50 text-xs">🪐 {t('footer')}</p>
        </div>
      </div>
    </motion.aside>
  );
}

// ============================================================
// COMPONENT PRINCIPAL
// ============================================================

export default function EspaiSensorial() {
  const t = useTranslations('sensorial');
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [theme, setTheme] = useState(THEMES[0]);
  const [intensity, setIntensity] = useState(15);  // Reduït per fluïdesa
  const [speed, setSpeed] = useState(0.4);  // Reduït per fluïdesa
  const [soundEnabled, setSoundEnabled] = useState(false);

  const color = theme.colors[0];
  const bg = theme.bg;

  useEffect(() => {
    setTimeout(() => setReady(true), 300);
  }, []);

  useEffect(() => {
    if (soundEnabled) {
      audio?.start(theme.sound);
    } else {
      audio?.stop();
    }
    return () => audio?.stop();
  }, [soundEnabled, theme]);

  const exit = useCallback(() => {
    audio?.stop();
    router.push('/');
  }, [router]);

  if (!ready) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <motion.span
            className="text-7xl block mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            💜
          </motion.span>
          <p className="text-white/50">{t('loading')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <main className={`fixed inset-0 bg-gradient-to-br ${bg} overflow-hidden`}>
      {/* Canvas */}
      <InteractiveCanvas
        theme={theme}
        intensity={intensity}
        speed={speed}
        soundEnabled={soundEnabled}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 p-4">
        <div className="flex justify-between items-center">
          <motion.button
            onClick={exit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20
                     border border-white/20 text-white/80 font-medium text-sm
                     backdrop-blur-sm transition-all"
          >
            ← {t('exit')}
          </motion.button>

          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <p className="text-white/60 text-xs uppercase tracking-wider">{t('title')}</p>
            <h1 className="text-white font-medium flex items-center gap-2">
              <span className="text-xl">{theme.emoji}</span>
              <span>{t(`themeNames.${theme.id}`)}</span>
            </h1>
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={() => setShowExplanation(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 
                       backdrop-blur-sm border border-white/10 text-white/70"
            >
              💜
            </motion.button>
            <motion.button
              onClick={() => setPanelOpen(!panelOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-3 rounded-full backdrop-blur-sm border transition-all ${
                panelOpen ? 'bg-white/20 border-white/30' : 'bg-white/10 border-white/10'
              } text-white/70`}
            >
              {panelOpen ? '✕' : '☰'}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Indicador d'elements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30
                 px-5 py-2.5 rounded-full backdrop-blur-md
                 border text-sm flex items-center gap-2"
        style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, color }}
      >
        <span>{theme.cursor}</span>
        <span>{t('grabElements')}</span>
      </motion.div>

      {/* Panel */}
      <AnimatePresence>
        {panelOpen && (
          <ControlPanel
            open={panelOpen}
            theme={theme}
            onThemeChange={setTheme}
            intensity={intensity}
            onIntensityChange={setIntensity}
            speed={speed}
            onSpeedChange={setSpeed}
            soundEnabled={soundEnabled}
            onSoundToggle={() => setSoundEnabled(!soundEnabled)}
            color={color}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Modal explicació */}
      <AnimatePresence>
        {showExplanation && (
          <ExplanationModal onClose={() => setShowExplanation(false)} color={color} t={t} />
        )}
      </AnimatePresence>
    </main>
  );
}
