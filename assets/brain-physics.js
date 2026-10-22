// The brain is an illustration. The spin panel runs a 2D Ising model with J = 1,
// zero external field, periodic boundaries, and single-spin Metropolis updates.
export function spinEnergy(spins, size) {
  let energy = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      energy -=
        spins[i] *
        (spins[y * size + ((x + 1) % size)] +
          spins[((y + 1) % size) * size + x]);
    }
  }
  return energy;
}

export function metropolisSweep(
  spins,
  size,
  temperature,
  random = Math.random,
) {
  for (let attempt = 0; attempt < spins.length; attempt++) {
    const i = Math.floor(random() * spins.length);
    const x = i % size;
    const y = Math.floor(i / size);
    const neighbors =
      spins[y * size + ((x + 1) % size)] +
      spins[y * size + ((x + size - 1) % size)] +
      spins[((y + 1) % size) * size + x] +
      spins[((y + size - 1) % size) * size + x];
    const change = 2 * spins[i] * neighbors;
    if (
      change <= 0 ||
      (temperature > 0 && random() < Math.exp(-change / temperature))
    )
      spins[i] *= -1;
  }
  return spins;
}

export function initBrainPhysics() {
  const canvas = document.querySelector("#brain-physics");
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;

  const input = document.querySelector("#temperature");
  const output = document.querySelector("#temperature-value");
  const toggle = document.querySelector("#simulation-toggle");
  const orderOutput = document.querySelector("#order-value");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const size = 9;
  const spins = Array(size * size).fill(1);
  let temperature = Number(input.value) / 10;
  let running = !motion.matches;
  let inView = false;
  let frame = 0;
  let elapsed = 0;
  let previous = 0;
  let accumulated = 0;
  let width = 0;
  let height = 0;
  let palette;

  const brain = new Path2D(
    "M111 250 C82 253 65 229 71 207 C49 183 64 154 83 149 C72 121 95 96 120 98 C132 72 163 62 189 75 C208 48 240 50 260 68 C286 53 317 61 330 80 C359 68 386 85 392 106 C423 107 444 131 436 157 C460 179 448 210 425 217 C420 242 392 252 366 244 C353 267 326 272 300 259 C273 279 248 271 228 264 C208 282 180 277 164 263 C142 274 119 267 111 250 Z",
  );
  const folds = [
    "M89 151 C126 128 125 178 151 158 S167 102 198 112 S227 154 250 132 S268 88 297 102 S312 148 341 132 S392 128 409 151",
    "M95 210 C119 185 148 215 167 191 S191 147 217 172 S238 211 265 190 S282 147 309 169 S344 211 373 188 S409 179 428 193",
    "M127 112 C145 117 148 134 142 146 M183 82 C167 103 174 121 187 129 M245 78 C224 91 226 107 237 116 M328 88 C315 99 320 117 332 122",
    "M113 234 C136 216 150 240 166 229 S183 203 204 219 S227 252 249 234 S273 212 292 230 S328 252 345 230 S382 220 395 234",
    "M89 174 C106 165 116 183 113 197 M205 132 C191 142 197 155 210 158 M261 147 C251 161 257 171 267 176 M365 149 C348 154 353 168 361 172",
  ].map((path) => new Path2D(path));

  // Deterministic cortical mesh: enough structure to read as a brain at phone widths.
  let seed = 1729;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const neurons = [];
  for (let y = 74; y < 270; y += 17) {
    for (let x = 78; x < 440; x += 18) {
      const p = {
        x: x + random() * 11,
        y: y + random() * 11,
        phase: random() * Math.PI * 2,
      };
      if (ctx.isPointInPath(brain, p.x, p.y)) neurons.push(p);
    }
  }
  const edges = [];
  neurons.forEach((a, i) =>
    neurons.slice(i + 1).forEach((b) => {
      if (Math.hypot(a.x - b.x, a.y - b.y) < 30) edges.push([a, b]);
    }),
  );
  const signals = edges.filter((_, i) => i % 9 === 0);

  function reset() {
    for (let i = 0; i < spins.length; i++) spins[i] = random() < 0.7 ? 1 : -1;
    elapsed = 0;
    accumulated = 0;
    previous = 0;
    draw();
  }

  function updatePalette() {
    const dark =
      getComputedStyle(document.documentElement).colorScheme === "dark";
    palette = dark
      ? {
          line: "#a3caa9",
          ink: "#e0e7d8",
          muted: "#9cae9e",
          gold: "#f0c986",
          blue: "#94baca",
          fill: "#344b3c",
        }
      : {
          line: "#376c50",
          ink: "#263f30",
          muted: "#687b6b",
          gold: "#b0782a",
          blue: "#547c91",
          fill: "#dce8d7",
        };
    draw();
  }

  function draw() {
    if (!width || !height || !palette) return;
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const scale = Math.min(width / 720, height / 410);
    ctx.setTransform(
      ratio * scale,
      0,
      0,
      ratio * scale,
      (ratio * (width - 720 * scale)) / 2,
      (ratio * (height - 410 * scale)) / 2,
    );
    const { line, ink, muted, gold, blue, fill } = palette;
    const stroke = (path, color, thickness = 1, alpha = 1) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.globalAlpha = alpha;
      ctx.stroke(path);
      ctx.globalAlpha = 1;
    };
    const label = (
      text,
      x,
      y,
      font = "11px ui-monospace, monospace",
      color = muted,
    ) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };
    // Fine coordinate marks give the scene a scientific-plate feel.
    ctx.globalAlpha = 0.17;
    ctx.fillStyle = line;
    for (let x = 30; x < 710; x += 20)
      for (let y = 20; y < 390; y += 20) ctx.fillRect(x, y, 1, 1);
    ctx.globalAlpha = 1;

    label("01 / NEURAL SIGNALS", 72, 28);
    label("02 / COLLECTIVE BEHAVIOR", 476, 122);
    label("H = −J Σ sᵢsⱼ", 491, 67, "italic 23px Georgia, serif", ink);
    label(
      "nearest-neighbor interactions",
      492,
      89,
      "9px ui-monospace, monospace",
    );

    // Cerebellum and brain stem sit behind the cerebral cortex.
    const stem = new Path2D(
      "M252 258 C256 293 270 305 278 334 L301 334 C282 300 298 280 302 260",
    );
    ctx.fillStyle = fill;
    ctx.fill(stem);
    stroke(stem, line, 1.4, 0.65);
    const cerebellum = new Path2D(
      "M133 254 C120 282 147 312 182 310 C219 314 245 287 235 263",
    );
    ctx.fill(cerebellum);
    stroke(cerebellum, line, 1.4, 0.7);
    for (let i = 0; i < 6; i++) {
      const fold = new Path2D(
        `M${141 + i * 2} ${269 + i * 5} Q185 ${283 + i * 5} ${225 - i * 3} ${270 + i * 4}`,
      );
      stroke(fold, line, 0.8, 0.45);
    }
    ctx.fillStyle = fill;
    ctx.globalAlpha = 0.5;
    ctx.fill(brain);
    ctx.globalAlpha = 1;
    stroke(brain, line, 2, 0.9);
    ctx.save();
    ctx.clip(brain);
    for (const [a, b] of edges) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = line;
      ctx.globalAlpha = 0.13;
      ctx.lineWidth = 0.65;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const path of folds) stroke(path, line, 2, 0.5);
    for (const p of neurons) {
      const wave = Math.max(
        0,
        Math.sin(elapsed * 1.6 - p.x * 0.025 + p.y * 0.014),
      );
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.3 + wave * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = wave > 0.8 ? gold : line;
      ctx.globalAlpha = 0.3 + wave * 0.6;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    signals.forEach(([a, b], i) => {
      const t = (elapsed * 0.6 + i * 0.319) % 1;
      ctx.beginPath();
      ctx.arc(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t,
        2.1,
        0,
        Math.PI * 2,
      );
      ctx.shadowColor = gold;
      ctx.shadowBlur = 8;
      ctx.fillStyle = gold;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.restore();

    // Traveling pulses connect the illustrative brain with the simulated spins.
    for (let i = 0; i < 3; i++) {
      const path = new Path2D(
        `M423 ${177 + i * 18} C470 ${145 + i * 30} 461 ${159 + i * 38} 494 ${170 + i * 47}`,
      );
      stroke(path, line, 1, 0.28);
      ctx.setLineDash([3, 16]);
      ctx.lineDashOffset = -elapsed * 20 - i * 9;
      stroke(path, gold, 1.6, 0.8);
      ctx.setLineDash([]);
    }
    // The grid and arrow colors show the actual +/-1 states of the Ising model.
    const left = 505,
      top = 152,
      spacing = 19;
    ctx.strokeStyle = line;
    ctx.lineWidth = 0.7;
    ctx.globalAlpha = 0.18;
    for (let j = 0; j < size; j++) {
      ctx.beginPath();
      ctx.moveTo(left, top + j * spacing);
      ctx.lineTo(left + 8 * spacing, top + j * spacing);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(left + j * spacing, top);
      ctx.lineTo(left + j * spacing, top + 8 * spacing);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    spins.forEach((spin, i) => {
      const x = left + (i % size) * spacing;
      const y = top + Math.floor(i / size) * spacing;
      ctx.strokeStyle = spin > 0 ? line : blue;
      ctx.lineWidth = 1.7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y + spin * 5);
      ctx.lineTo(x, y - spin * 5);
      ctx.moveTo(x - 2.5, y - spin * 2);
      ctx.lineTo(x, y - spin * 5);
      ctx.lineTo(x + 2.5, y - spin * 2);
      ctx.stroke();
    });
    const order = Math.abs(spins.reduce((sum, s) => sum + s, 0) / spins.length);
    label("ISING SPINS · 9 × 9", 505, 330, "10px ui-monospace, monospace");
    label(
      "patterns from local interactions",
      72,
      368,
      "italic 19px Georgia, serif",
      ink,
    );
    label("sᵢ = ±1", 550, 367, "italic 17px Georgia, serif", ink);
    orderOutput.textContent = order.toFixed(2);
  }

  function updateToggle() {
    toggle.setAttribute(
      "aria-label",
      running ? "Pause simulation" : "Play simulation",
    );
    toggle.firstElementChild.textContent = running ? "Ⅱ" : "▷";
  }
  function schedule() {
    if (running && inView && !document.hidden && !frame)
      frame = requestAnimationFrame(tick);
  }
  function tick(time) {
    frame = 0;
    if (!running || !inView || document.hidden) {
      previous = 0;
      return;
    }
    const delta = previous ? Math.min(time - previous, 80) : 0;
    previous = time;
    elapsed += delta / 1000;
    accumulated += delta;
    if (accumulated >= 80) {
      metropolisSweep(spins, size, temperature, random);
      accumulated %= 80;
    }
    draw();
    schedule();
  }
  new ResizeObserver(() => {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    draw();
  }).observe(canvas);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    previous = 0;
    schedule();
  }).observe(canvas);
  new MutationObserver(updatePalette).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener(
    "change",
    updatePalette,
  );
  document.addEventListener("visibilitychange", () => {
    previous = 0;
    schedule();
  });
  input.addEventListener("input", () => {
    temperature = Number(input.value) / 10;
    output.textContent = temperature.toFixed(1);
    draw();
  });
  toggle.addEventListener("click", () => {
    running = !running;
    previous = 0;
    updateToggle();
    schedule();
  });
  document.querySelector("#simulation-reset").addEventListener("click", reset);
  motion.addEventListener("change", () => {
    running = !motion.matches;
    previous = 0;
    updateToggle();
    schedule();
  });
  updatePalette();
  reset();
  updateToggle();
  schedule();
}
