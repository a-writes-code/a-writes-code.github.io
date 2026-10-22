// These are explanatory illustrations. Only the arithmetic and cellular automata
// compute exact task outputs; no animation presents synthetic research measurements.
import { drawHomogeneousSphere } from "./homogeneous-sphere.js";
export function nextAutomatonRow(row, rule) {
  return row.map((_, i) => {
    const left = row[(i - 1 + row.length) % row.length];
    const middle = row[i];
    const right = row[(i + 1) % row.length];
    return (rule >> ((left << 2) | (middle << 1) | right)) & 1;
  });
}

export const modularRule = (x, y, a = 2, b = 3, p = 7) =>
  (((a * x + b * y) % p) + p) % p;
export const polynomialTerms = (x, y, p = 7) =>
  [x * y ** 3, x ** 2 * y].map((value) => ((value % p) + p) % p);
export const modularPolynomial = (x, y, p = 7) =>
  polynomialTerms(x, y, p).reduce((sum, value) => (sum + value) % p, 0);

export function contextTask(index, seed = 0) {
  const [a, b] = [
    [2, 3],
    [5, 4],
    [3, 6],
  ][index];
  const inputs = [
    [1, 0],
    [0, 1],
    [2, 1],
  ];
  let state = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % 7;
  };
  let x = next();
  const y = next();
  while (inputs.some((pair) => pair[0] === x && pair[1] === y)) x = (x + 1) % 7;
  return {
    a,
    b,
    color: index === 2 ? "red" : "green",
    examples: inputs.map(([x, y]) => [x, y, modularRule(x, y, a, b)]),
    query: [x, y],
  };
}

export function regularizationFrame(t) {
  const progress = smooth((t - 0.25) / 0.5);
  return { progress, green: 0.22 + 0.78 * progress, red: 1 - 0.84 * progress };
}

export function holeSite(t) {
  const phase = ((t % 1) + 1) % 1;
  return [2, 4, 6, 8, 10, 8, 6, 4][Math.floor(phase * 8)];
}

const automata = new Map(
  [30, 90].map((rule) => {
    const rows = [Array.from({ length: 49 }, (_, i) => Number(i === 24))];
    for (let i = 1; i < 27; i++) rows.push(nextAutomatonRow(rows.at(-1), rule));
    return [rule, rows];
  }),
);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};

function text(ctx, value, x, y, size = 16, color, align = "left") {
  ctx.fillStyle = color;
  ctx.font = `${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(value, x, y);
}

function line(ctx, x1, y1, x2, y2, color, width = 1.5) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function dot(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function box(ctx, x, y, w, h, color, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function context(ctx, t, p, seconds, seed) {
  function row(index, center, scale, opacity = 1) {
    const task = contextTask(index, seed);
    ctx.save();
    ctx.translate(360, center);
    ctx.scale(scale, scale);
    ctx.globalAlpha = opacity;
    const pieces = [
      ["z = ", p.text],
      [String(task.a), p[task.color]],
      ["x + ", p.text],
      [String(task.b), p[task.color]],
      ["y  (mod 7)", p.text],
    ];
    ctx.font = '30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const total = pieces.reduce(
      (sum, [value]) => sum + ctx.measureText(value).width,
      0,
    );
    let left = -total / 2;
    for (const [value, color] of pieces) {
      text(ctx, value, left, -35, 30, color);
      left += ctx.measureText(value).width;
    }
    const cells = [...task.examples, [...task.query, "?"]];
    cells.forEach((values, i) => {
      const x = -325 + i * 166;
      box(ctx, x, -4, 152, 64, p.text, p.paper);
      text(ctx, `(${values.join(", ")})`, x + 76, 28, 25, p.text, "center");
    });
    ctx.restore();
  }
  const first = smooth((seconds - 4) / 1.5);
  row(0, 160 + (48 - 160) * first, 1 - 0.34 * first);
  if (seconds >= 5.5) {
    const second = smooth((seconds - 10) / 1.5);
    row(
      1,
      165 + (155 - 165) * second,
      1 - 0.34 * second,
      smooth((seconds - 5.5) / 0.5),
    );
  }
  if (seconds >= 11.5) row(2, 260, 1, smooth((seconds - 11.5) / 0.5));
}

function polynomial(ctx, t, p) {
  text(ctx, "xy³ + x²y (mod 7)", 360, 32, 22, p.ink, "center");
  const terms = polynomialTerms(3, 2);
  const edges = [
    [100, 110, 300, 110],
    [100, 110, 300, 230],
    [100, 250, 300, 230],
    [100, 250, 300, 110],
    [390, 110, 520, 170],
    [390, 230, 520, 170],
    [570, 170, 657, 170],
  ];
  edges.forEach((edge) => line(ctx, ...edge, p.line, 2));
  box(ctx, 35, 88, 90, 44, p.line, p.surface);
  box(ctx, 35, 228, 90, 44, p.line, p.surface);
  text(ctx, "x = 3", 80, 110, 20, p.ink, "center");
  text(ctx, "y = 2", 80, 250, 20, p.ink, "center");
  box(ctx, 270, 76, 135, 69, p.line, p.surface);
  box(ctx, 270, 196, 135, 69, p.line, p.surface);
  text(ctx, "x × y³", 337, 96, 15, p.muted, "center");
  text(ctx, "x² × y", 337, 216, 15, p.muted, "center");
  text(ctx, t > 0.18 ? String(terms[0]) : "·", 337, 124, 24, p.ink, "center");
  text(ctx, t > 0.25 ? String(terms[1]) : "·", 337, 244, 24, p.ink, "center");
  dot(ctx, 540, 170, 30, p.surface);
  ctx.beginPath();
  ctx.arc(540, 170, 30, 0, Math.PI * 2);
  ctx.strokeStyle = p.line;
  ctx.stroke();
  text(ctx, "+", 540, 170, 30, p.ink, "center");
  text(
    ctx,
    t > 0.66 ? String(modularPolynomial(3, 2)) : "?",
    667,
    170,
    37,
    p.ink,
    "center",
  );
  text(
    ctx,
    "Exact arithmetic, built from small computations",
    360,
    312,
    15,
    p.muted,
    "center",
  );
  const edgeIndex = t < 0.35 ? 0 : t < 0.66 ? 4 : 6;
  const [x1, y1, x2, y2] = edges[edgeIndex];
  const phase = (t * 3) % 1;
  dot(ctx, x1 + (x2 - x1) * phase, y1 + (y2 - y1) * phase, 5, p.accent);
}

function automaton(ctx, t, p) {
  const rule = t < 0.58 ? 90 : 30;
  const local = t < 0.58 ? t / 0.58 : (t - 0.58) / 0.42;
  const rows = automata.get(rule);
  const shown = Math.min(rows.length, 1 + Math.floor(local * 34));
  text(ctx, `RULE ${rule}`, 70, 28, 16, p.ink);
  text(ctx, "one row = one time step", 650, 28, 14, p.muted, "right");
  const cell = 11;
  const x0 = (720 - rows[0].length * cell) / 2;
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      ctx.fillStyle = y < shown && rows[y][x] ? p.ink : p.grid;
      ctx.fillRect(x0 + x * cell, 65 + y * 8.5, cell - 1.3, 7.2);
    }
  }
  text(
    ctx,
    "A single seed. A local update. A growing pattern.",
    360,
    320,
    15,
    p.muted,
    "center",
  );
}

function noise(ctx, t, p) {
  const state = regularizationFrame(t);
  const corrupted = new Set([5, 16, 23, 39, 44]);
  text(ctx, "(a + b) mod 7", 138, 32, 19, p.text, "center");
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const wrong = corrupted.has(row * 7 + col);
      const x = 38 + col * 30,
        y = 68 + row * 30;
      ctx.fillStyle = wrong ? p.red : p.grid;
      ctx.fillRect(x, y, 27, 27);
      text(
        ctx,
        String((row + col + Number(wrong)) % 7),
        x + 13.5,
        y + 14,
        13,
        wrong ? "#fff8ed" : p.text,
        "center",
      );
    }
  }
  text(ctx, "Corrupted examples", 138, 303, 14, p.muted, "center");
  line(ctx, 272, 171, 330, 171, p.line, 2);
  text(ctx, "→", 300, 171, 24, p.text, "center");
  text(
    ctx,
    t < 0.25 ? "Neural network" : "Regularization increases",
    501,
    32,
    20,
    p.text,
    "center",
  );
  const layers = [
    Array.from({ length: 3 }, (_, i) => ({
      x: 366,
      y: 109 + i * 58,
      color: i % 2 === 0 ? "red" : "green",
    })),
    Array.from({ length: 6 }, (_, i) => ({
      x: 494,
      y: 77 + i * 37,
      color: i % 2 === 0 ? "green" : "red",
    })),
    Array.from({ length: 3 }, (_, i) => ({
      x: 625,
      y: 109 + i * 58,
      color: i % 2 === 0 ? "green" : "red",
    })),
  ];
  for (let layer = 0; layer < layers.length - 1; layer++) {
    for (const a of layers[layer])
      for (const b of layers[layer + 1]) {
        ctx.save();
        ctx.globalAlpha = a.color === b.color ? state[a.color] * 0.44 : 0.14;
        line(
          ctx,
          a.x,
          a.y,
          b.x,
          b.y,
          a.color === b.color ? p[a.color] : p.line,
          1.25,
        );
        ctx.restore();
      }
  }
  for (const neuron of layers.flat()) {
    dot(ctx, neuron.x, neuron.y, 11, p.paper);
    ctx.save();
    ctx.globalAlpha = state[neuron.color];
    ctx.shadowBlur = 15 * state[neuron.color];
    ctx.shadowColor = p[neuron.color];
    dot(ctx, neuron.x, neuron.y, 10, p[neuron.color]);
    ctx.restore();
  }
  dot(ctx, 359, 304, 4, p.green);
  text(ctx, "Generalization", 372, 304, 13, p.text);
  dot(ctx, 538, 304, 4, p.red);
  text(ctx, "Memorization", 551, 304, 13, p.text);
}

function holes(ctx, t, p) {
  const hole = holeSite(t);
  const x0 = 62,
    spacing = 49;
  for (let i = 0; i < 12; i++) {
    const active = i < hole ? i % 2 === 0 : i % 2 === 1;
    line(
      ctx,
      x0 + i * spacing,
      172,
      x0 + (i + 1) * spacing,
      172,
      active ? p.ink : p.line,
      active ? 6 : 1.5,
    );
  }
  for (let i = 0; i < 13; i++) {
    const x = x0 + i * spacing;
    dot(ctx, x, 172, 12, p.paper);
    if (i !== hole) dot(ctx, x, 172, 7, p.ink);
    else {
      ctx.beginPath();
      ctx.arc(x, 172, 12, 0, Math.PI * 2);
      ctx.strokeStyle = p.coral;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

const scenes = {
  manifold: (ctx, t, palette, seconds) =>
    drawHomogeneousSphere(ctx, seconds, palette),
  context,
  polynomial,
  automata: automaton,
  noise,
  holes,
};

export function initProjectAnimations() {
  const figures = [...document.querySelectorAll("[data-animation]")];
  if (!figures.length) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const items = [];
  let frame = 0;
  let lastTime = 0;

  function palette() {
    const dark =
      getComputedStyle(document.documentElement).colorScheme === "dark";
    return dark
      ? {
          ink: "#c2d6b3",
          muted: "#a3b3a4",
          line: "#617261",
          surface: "#263b2e",
          grid: "#314936",
          paper: "#23342b",
          accent: "#f0d494",
          coral: "#dbad95",
          text: "#f2f2ef",
          green: "#82cf99",
          red: "#f18b88",
        }
      : {
          ink: "#426c55",
          muted: "#6f8072",
          line: "#bcc8b5",
          surface: "#eef1e7",
          grid: "#d5dfca",
          paper: "#edf0e6",
          accent: "#a58b47",
          coral: "#b57560",
          text: "#252725",
          green: "#257844",
          red: "#bd4145",
        };
  }

  function draw(item) {
    const { canvas, ctx } = item;
    const width = canvas.clientWidth,
      height = canvas.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (
      canvas.width !== Math.round(width * dpr) ||
      canvas.height !== Math.round(height * dpr)
    ) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / 720, height / 340);
    ctx.translate((width - 720 * scale) / 2, (height - 340 * scale) / 2);
    ctx.scale(scale, scale);
    scenes[item.figure.dataset.animation](
      ctx,
      item.time / item.duration,
      palette(),
      item.time,
      item.seed,
    );
    const stage = Math.max(
      0,
      item.stageTimes.findLastIndex((time) => time <= item.time),
    );
    if (stage !== item.stage) {
      item.caption.textContent = item.stages[stage];
      item.stage = stage;
    }
    item.clock.textContent = `${String(Math.floor(item.time)).padStart(2, "0")} / ${item.duration}s`;
    if (item.seek) item.seek.value = item.time.toFixed(1);
  }

  function schedule() {
    if (
      !frame &&
      !document.hidden &&
      items.some((item) => item.running && item.visible)
    )
      frame = requestAnimationFrame(tick);
  }

  function tick(time) {
    frame = 0;
    if (document.hidden) {
      lastTime = 0;
      return;
    }
    const elapsed = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0;
    if (elapsed && elapsed < 1 / 25) {
      schedule();
      return;
    }
    lastTime = time;
    for (const item of items) {
      if (!item.running || !item.visible) continue;
      item.time = (item.time + elapsed) % item.duration;
      draw(item);
    }
    schedule();
  }

  function updateButton(item) {
    item.button.setAttribute(
      "aria-label",
      `${item.running ? "Pause" : "Play"} animation: ${item.button.dataset.title}`,
    );
    item.button.firstElementChild.textContent = item.running ? "Ⅱ" : "▷";
  }

  for (const figure of figures) {
    const canvas = figure.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx || !scenes[figure.dataset.animation]) continue;
    const item = {
      figure,
      canvas,
      ctx,
      button: figure.querySelector(".animation-play"),
      caption: figure.querySelector(".animation-stage"),
      clock: figure.querySelector(".animation-time"),
      stages: JSON.parse(figure.dataset.stages),
      stageTimes: JSON.parse(figure.dataset.stageTimes),
      duration: Number(figure.dataset.duration),
      seek: figure.querySelector(".animation-seek"),
      time: 0,
      stage: -1,
      visible: false,
      running: !reduced.matches,
      seed: Math.floor(Math.random() * 0x100000000),
    };
    items.push(item);
    item.seek?.addEventListener("input", () => {
      item.time = Number(item.seek.value);
      item.running = false;
      updateButton(item);
      draw(item);
    });
    item.button.addEventListener("click", () => {
      item.running = !item.running;
      updateButton(item);
      lastTime = 0;
      schedule();
    });
    figure.querySelector(".animation-replay").addEventListener("click", () => {
      item.time = 0;
      draw(item);
      lastTime = 0;
      schedule();
    });
    new ResizeObserver(() => draw(item)).observe(canvas);
    updateButton(item);
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const item = items.find((item) => item.figure === entry.target);
        item.visible = entry.isIntersecting;
        if (item.visible) draw(item);
      }
      lastTime = 0;
      schedule();
    },
    { threshold: 0.05 },
  );
  items.forEach((item) => observer.observe(item.figure));
  document.addEventListener("visibilitychange", () => {
    lastTime = 0;
    schedule();
  });
  document
    .querySelector(".theme-toggle")
    ?.addEventListener("click", () => items.forEach(draw));
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () =>
    items.forEach(draw),
  );
  reduced.addEventListener("change", (event) => {
    if (event.matches) {
      items.forEach((item) => {
        item.running = false;
        updateButton(item);
        draw(item);
      });
    }
  });
}
