import React, { useState, useEffect, useCallback, useRef } from "react";

const COLS = 20;
const ROWS = 24;
const CELL = 16;
const TICK_NORMAL = 160;
const TICK_SLOW = 280;   // tick when slow power-up is active
const POWERUP_DURATION = 6000; // ms

const POWERUPS = {
  slow:  { icon: "⏱", color: "#00B0FF", label: "SLOW" },
  multi: { icon: "✕2", color: "#FF6B00", label: "2X" },
};

const DIR = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const rand = (max) => Math.floor(Math.random() * max);

const freePos = (snake, exclude = []) => {
  let pos;
  do {
    pos = { x: rand(COLS), y: rand(ROWS) };
  } while (
    snake.some((s) => s.x === pos.x && s.y === pos.y) ||
    exclude.some((e) => e && e.x === pos.x && e.y === pos.y)
  );
  return pos;
};

const initState = () => {
  const snake = [{ x: 10, y: 12 }, { x: 9, y: 12 }, { x: 8, y: 12 }];
  return { snake, food: freePos(snake), score: 0, dead: false, powerup: null };
};

const RAINBOW_COLORS = ["#FF0040", "#FF6B00", "#FFD700", "#00E676", "#00B0FF", "#AA00FF", "#FF0099"];
const getRainbowColor = (i) => RAINBOW_COLORS[i % RAINBOW_COLORS.length];

export default function Snake() {
  const [state, setState] = useState(initState());
  const [started, setStarted] = useState(false);
  const [rainbow, setRainbow] = useState(false);

  // Active power-up effects (separate from board state so timer can clear them)
  const [slowActive, setSlowActive] = useState(false);
  const [multiActive, setMultiActive] = useState(false);
  const slowTimerRef = useRef(null);
  const multiTimerRef = useRef(null);
  const slowActiveRef = useRef(false);
  const multiActiveRef = useRef(false);

  useEffect(() => { slowActiveRef.current = slowActive; }, [slowActive]);
  useEffect(() => { multiActiveRef.current = multiActive; }, [multiActive]);

  // Web Audio
  const audioCtxRef = useRef(null);
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playEat = useCallback(() => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12);
  }, []);

  const playPowerup = useCallback(() => {
    const ctx = getAudioCtx();
    [0, 0.07, 0.14].forEach((t, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440 + i * 220, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.1);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.1);
    });
  }, []);

  const playDie = useCallback(() => {
    const ctx = getAudioCtx();
    [0, 0.1, 0.2].forEach((t, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300 - i * 80, ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + t + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.15);
    });
  }, []);

  const playTurn = useCallback(() => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.04);
  }, []);

  const nextDirRef = useRef(DIR.RIGHT);
  const curDirRef = useRef(DIR.RIGHT);
  const startedRef = useRef(false);
  const rainbowRef = useRef(false);
  useEffect(() => { rainbowRef.current = rainbow; }, [rainbow]);

  // Canvas particles
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const hueRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ps = particlesRef.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.88; p.vy *= 0.88; p.life -= 1;
        if (p.life <= 0) { ps.splice(i, 1); continue; }
        const alpha = (p.life / p.maxLife) * 0.85;
        const sz = p.size * (p.life / p.maxLife);
        ctx.fillStyle = rainbowRef.current
          ? `hsla(${p.hue}, 100%, 60%, ${alpha})`
          : `rgba(10, 10, 10, ${alpha})`;
        ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const spawnParticles = useCallback((headX, headY, tailX, tailY) => {
    hueRef.current = (hueRef.current + 18) % 360;
    const hcx = headX * CELL + CELL / 2, hcy = headY * CELL + CELL / 2;
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2, speed = 0.5 + Math.random() * 1.5;
      particlesRef.current.push({ x: hcx + (Math.random() - 0.5) * CELL * 0.5, y: hcy + (Math.random() - 0.5) * CELL * 0.5, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 12 + Math.floor(Math.random() * 8), maxLife: 20, hue: (hueRef.current + i * 40) % 360, size: 1.5 + Math.random() * 2.5 });
    }
    if (tailX !== undefined) {
      const tcx = tailX * CELL + CELL / 2, tcy = tailY * CELL + CELL / 2;
      for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2, speed = 0.8 + Math.random() * 3.5;
        particlesRef.current.push({ x: tcx + (Math.random() - 0.5) * CELL * 0.8, y: tcy + (Math.random() - 0.5) * CELL * 0.8, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 22 + Math.floor(Math.random() * 18), maxLife: 40, hue: (hueRef.current + i * 20) % 360, size: 3 + Math.random() * 5 });
      }
    }
  }, []);

  const activatePowerup = useCallback((type) => {
    setTimeout(playPowerup, 0);
    if (type === "slow") {
      setSlowActive(true);
      slowActiveRef.current = true;
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = setTimeout(() => { setSlowActive(false); slowActiveRef.current = false; }, POWERUP_DURATION);
    } else if (type === "multi") {
      setMultiActive(true);
      multiActiveRef.current = true;
      clearTimeout(multiTimerRef.current);
      multiTimerRef.current = setTimeout(() => { setMultiActive(false); multiActiveRef.current = false; }, POWERUP_DURATION);
    }
  }, [playPowerup]);

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.dead) return prev;
      curDirRef.current = nextDirRef.current;
      const head = prev.snake[0];
      const next = { x: head.x + curDirRef.current.x, y: head.y + curDirRef.current.y };

      if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) { setTimeout(playDie, 0); return { ...prev, dead: true }; }
      if (prev.snake.some((s) => s.x === next.x && s.y === next.y)) { setTimeout(playDie, 0); return { ...prev, dead: true }; }

      const ate = next.x === prev.food.x && next.y === prev.food.y;
      if (ate) setTimeout(playEat, 0);

      // Check power-up collision
      const atePowerup = prev.powerup && next.x === prev.powerup.x && next.y === prev.powerup.y;
      if (atePowerup) setTimeout(() => activatePowerup(prev.powerup.type), 0);

      const newSnake = [next, ...prev.snake];
      if (!ate) newSnake.pop();

      const tail = prev.snake[prev.snake.length - 1];
      spawnParticles(head.x, head.y, tail.x, tail.y);

      const scoreGain = ate ? (multiActiveRef.current ? 2 : 1) : 0;

      // Possibly spawn a new power-up after eating (30% chance), clear if eaten
      let newPowerup = prev.powerup;
      if (atePowerup) { newPowerup = null; }
      if (ate && !newPowerup && Math.random() < 0.3) {
        const type = Math.random() < 0.5 ? "slow" : "multi";
        newPowerup = { ...freePos(newSnake, [prev.food]), type };
      }

      return {
        ...prev,
        snake: newSnake,
        food: ate ? freePos(newSnake, [newPowerup]) : prev.food,
        score: prev.score + scoreGain,
        powerup: newPowerup,
      };
    });
  }, [spawnParticles, playEat, playDie, activatePowerup]);

  // Restart interval when slow state changes
  const tickRef = useRef(tick);
  useEffect(() => { tickRef.current = tick; }, [tick]);

  useEffect(() => {
    if (!started) return;
    const interval = slowActive ? TICK_SLOW : TICK_NORMAL;
    const id = setInterval(() => tickRef.current(), interval);
    return () => clearInterval(id);
  }, [started, slowActive]);

  // Key controls
  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowUp: DIR.UP, ArrowDown: DIR.DOWN, ArrowLeft: DIR.LEFT, ArrowRight: DIR.RIGHT, w: DIR.UP, s: DIR.DOWN, a: DIR.LEFT, d: DIR.RIGHT };
      const newDir = map[e.key];
      if (!newDir) return;
      e.preventDefault();
      const cur = curDirRef.current;
      if (newDir.x === -cur.x && newDir.y === -cur.y) return;
      if (newDir.x !== nextDirRef.current.x || newDir.y !== nextDirRef.current.y) playTurn();
      nextDirRef.current = newDir;
      if (!startedRef.current) { startedRef.current = true; setStarted(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playTurn]);

  const changeDir = (newDir) => {
    const cur = curDirRef.current;
    if (newDir.x === -cur.x && newDir.y === -cur.y) return;
    if (newDir.x !== nextDirRef.current.x || newDir.y !== nextDirRef.current.y) playTurn();
    nextDirRef.current = newDir;
    if (!startedRef.current) { startedRef.current = true; setStarted(true); }
  };

  const restart = () => {
    curDirRef.current = DIR.RIGHT; nextDirRef.current = DIR.RIGHT;
    startedRef.current = false; particlesRef.current = [];
    clearTimeout(slowTimerRef.current); clearTimeout(multiTimerRef.current);
    setSlowActive(false); setMultiActive(false);
    slowActiveRef.current = false; multiActiveRef.current = false;
    setState(initState()); setStarted(false);
  };

  const touchStart = useRef(null);
  const onTouchStart = (e) => { const t = e.touches[0]; touchStart.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x, dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    // Tap (no swipe) — determine direction based on tap position relative to snake head
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const rect = e.currentTarget.getBoundingClientRect();
      const tapX = t.clientX - rect.left;
      const tapY = t.clientY - rect.top;
      const head = state.snake[0];
      const headPx = head.x * CELL + CELL / 2;
      const headPy = head.y * CELL + CELL / 2;
      const ddx = tapX - headPx, ddy = tapY - headPy;
      if (Math.abs(ddx) > Math.abs(ddy)) {
        changeDir(ddx > 0 ? DIR.RIGHT : DIR.LEFT);
      } else {
        changeDir(ddy > 0 ? DIR.DOWN : DIR.UP);
      }
      return;
    }
    // Swipe
    if (Math.abs(dx) > Math.abs(dy)) { changeDir(dx > 0 ? DIR.RIGHT : DIR.LEFT); } else { changeDir(dy > 0 ? DIR.DOWN : DIR.UP); }
  };

  const { snake, food, score, dead, powerup } = state;
  const currentTick = slowActive ? TICK_SLOW : TICK_NORMAL;

  const onScreenTap = (e) => {
    // Ignore taps on buttons
    if (e.target.closest('button')) return;
    const cur = curDirRef.current;
    const head = state.snake[0];
    const boardEl = document.getElementById('snake-board');
    if (!boardEl) return;
    const rect = boardEl.getBoundingClientRect();
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const tapX = clientX - rect.left;
    const tapY = clientY - rect.top;
    const headPx = head.x * CELL + CELL / 2;
    const headPy = head.y * CELL + CELL / 2;
    const ddx = tapX - headPx, ddy = tapY - headPy;
    if (Math.abs(ddx) > Math.abs(ddy)) {
      changeDir(ddx > 0 ? DIR.RIGHT : DIR.LEFT);
    } else {
      changeDir(ddy > 0 ? DIR.DOWN : DIR.UP);
    }
  };

  return (
    <div className="pb-16" onTouchEnd={onScreenTap} onClick={onScreenTap}>
      {/* Header */}
      <div className="px-5 pt-8 pb-4 border-b-2 border-foreground">
        <p className="font-display text-foreground leading-none" style={{ fontSize: "clamp(3rem, 14vw, 4.5rem)" }}>
          SKULL<br />SNAKE.
        </p>
        <p className="font-body text-muted-foreground text-xs tracking-widest uppercase mt-1">Lo-fi edition · swipe or tap to play</p>
      </div>

      {/* Coming Soon Badge */}
      <div className="px-5 py-8 bg-foreground/5 border-b-2 border-foreground">
        <p className="font-mono text-xs tracking-widest uppercase text-center text-muted-foreground">
          ⚠ COMING SOON
        </p>
      </div>

      {/* Game board */}
      <div className="flex justify-center pt-4 pb-2">
        <div id="snake-board" className="relative border-2 border-foreground bg-white" style={{ width: COLS * CELL, height: ROWS * CELL, touchAction: "none" }}>
          {/* Grid */}
          <svg className="absolute inset-0 pointer-events-none opacity-10" width={COLS * CELL} height={ROWS * CELL}>
            {Array.from({ length: COLS + 1 }).map((_, i) => (
              <line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={ROWS * CELL} stroke="black" strokeWidth="0.5" />
            ))}
            {Array.from({ length: ROWS + 1 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={i * CELL} x2={COLS * CELL} y2={i * CELL} stroke="black" strokeWidth="0.5" />
            ))}
          </svg>

          {/* Snake body */}
          {snake.map((seg, i) => (
            <div
              key={i}
              className="absolute flex items-center justify-center"
              style={{
                left: seg.x * CELL, top: seg.y * CELL,
                width: CELL, height: CELL,
                backgroundColor: rainbow ? getRainbowColor(i) : (i === 0 ? "#0a0a0a" : "#333"),
                opacity: i === 0 ? 1 : Math.max(0.35, 1 - i * 0.03),
                fontSize: i === 0 ? 11 : 8,
                lineHeight: 1,
                color: rainbow ? "white" : (i === 0 ? "white" : "#ccc"),
                transition: `left ${currentTick * 0.9}ms linear, top ${currentTick * 0.9}ms linear`,
              }}
            >
              {i === 0 ? "■" : "▪"}
            </div>
          ))}

          {/* Canvas particle trail */}
          <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} className="absolute inset-0 pointer-events-none" />

          {/* Food */}
          <div
            className="absolute flex items-center justify-center"
            style={{ left: food.x * CELL, top: food.y * CELL, width: CELL, height: CELL, fontSize: 14, color: "#0a0a0a", fontFamily: "monospace", fontWeight: "bold" }}
          >
            $
          </div>

          {/* Power-up item */}
          {powerup && (
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: powerup.x * CELL, top: powerup.y * CELL,
                width: CELL, height: CELL,
                fontSize: powerup.type === "multi" ? 8 : 11,
                lineHeight: 1,
                filter: "drop-shadow(0 0 3px " + POWERUPS[powerup.type].color + ")",
              }}
            >
              {POWERUPS[powerup.type].icon}
            </div>
          )}

          {/* Start overlay */}
          {!started && !dead && (
            <div className="absolute inset-0 bg-background/85 flex flex-col items-center justify-center gap-3">
              <p className="font-display text-3xl text-foreground">JAYWALKER</p>
              <div className="flex gap-3 text-xs font-body text-center text-muted-foreground">
                <span>⏱ <span className="text-[#00B0FF]">SLOW</span></span>
                <span>✕2 <span className="text-[#FF6B00]">MULTI</span></span>
              </div>
              <p className="font-body text-[10px] text-muted-foreground tracking-widest uppercase text-center px-4">
                Collect power-ups for bonuses
              </p>
              <button
                onClick={() => { startedRef.current = true; setStarted(true); }}
                className="mt-2 px-8 py-3 bg-foreground text-background font-display text-xl tracking-widest hover:bg-foreground/80 transition-colors"
              >
                START →
              </button>
            </div>
          )}

          {/* Dead overlay */}
          {dead && (
            <div className="absolute inset-0 bg-background/85 flex flex-col items-center justify-center gap-2">
              <p className="font-display text-5xl text-foreground">[ X ]</p>
              <p className="font-display text-3xl text-foreground">GAME OVER</p>
              <p className="font-body text-xs text-muted-foreground tracking-widest uppercase">Score: {score}</p>
              <button onClick={restart} className="mt-2 px-8 py-3 bg-foreground text-background font-display text-xl tracking-widest hover:bg-foreground/80 transition-colors">
                RETRY →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}