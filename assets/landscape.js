// A small analytic surface keeps the sketch independent of graphics libraries.
export function loss(x, z) {
  return (
    0.11 * (x * x + z * z) +
    0.45 * Math.sin(1.4 * x) * Math.cos(1.3 * z) +
    0.1 * Math.sin(2 * z) +
    0.55
  );
}

export function gradient(x, z) {
  return [
    0.22 * x + 0.63 * Math.cos(1.4 * x) * Math.cos(1.3 * z),
    0.22 * z -
      0.585 * Math.sin(1.4 * x) * Math.sin(1.3 * z) +
      0.2 * Math.cos(2 * z),
  ];
}

export function descend(point, rate) {
  const [gx, gz] = gradient(point.x, point.z);
  return { x: point.x - rate * gx, z: point.z - rate * gz };
}

export function initLandscape() {
  const canvas = document.querySelector("#landscape");
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;

  const rateInput = document.querySelector("#learning-rate");
  const rateOutput = document.querySelector("#rate-value");
  const toggle = document.querySelector("#simulation-toggle");
  const stepOutput = document.querySelector("#step-value");
  const lossOutput = document.querySelector("#loss-value");
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  const starts = [
    { x: 2.6, z: 2.5 },
    { x: -2.7, z: 2.6 },
    { x: 2.8, z: -2.5 },
    { x: -2.4, z: -2.7 },
  ];
  let startIndex = 0;
  let point = { ...starts[0] };
  let trail = [{ ...point }];
  let step = 0;
  let rate = Number(rateInput.value) / 100;
  let running = !motionPreference.matches;
  let inView = true;
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastStep = 0;
  let holdSince = 0;
  let rotation = -0.63;

  const surface = [];
  const n = 32;
  const edge = 3.15;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = -edge + (2 * edge * i) / n;
      const z = -edge + (2 * edge * j) / n;
      const d = (2 * edge) / n;
      surface.push(
        [
          [x, z],
          [x + d, z],
          [x + d, z + d],
          [x, z + d],
        ].map(([u, v]) => ({ x: u, z: v, y: loss(u, v) })),
      );
    }
  }

  function project(x, z, y) {
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    const horizontal = x * c - z * s;
    const depth = x * s + z * c;
    const scale = width * 0.103;
    const verticalScale = Math.min(scale, height * 0.14);
    return [
      width * 0.5 + horizontal * scale,
      height * 0.65 + (depth * 0.42 - (y - 0.6)) * verticalScale,
    ];
  }

  function render() {
    if (!width || !height) return;
    const style = getComputedStyle(document.documentElement);
    const dark = style.colorScheme === "dark";
    ctx.clearRect(0, 0, width, height);
    // A subtle floor grid gives the surface a spatial reference.
    ctx.strokeStyle = dark ? "rgba(161,190,161,.08)" : "rgba(65,99,73,.08)";
    ctx.lineWidth = 0.6;
    for (let p = -3; p <= 3; p++) {
      for (const ends of [
        [
          [-3.5, p],
          [3.5, p],
        ],
        [
          [p, -3.5],
          [p, 3.5],
        ],
      ]) {
        ctx.beginPath();
        ends.forEach(([x, z], i) => {
          const q = project(x, z, -0.17);
          i ? ctx.lineTo(...q) : ctx.moveTo(...q);
        });
        ctx.stroke();
      }
    }
    const sorted = surface
      .map((cell) => ({
        cell,
        depth:
          cell.reduce(
            (v, p) => v + p.x * Math.sin(rotation) + p.z * Math.cos(rotation),
            0,
          ) / 4,
      }))
      .sort((a, b) => a.depth - b.depth);
    for (const { cell } of sorted) {
      const y = cell.reduce((sum, p) => sum + p.y, 0) / 4;
      const shade = 72 - y * 13;
      ctx.beginPath();
      cell.forEach((p, i) => {
        const q = project(p.x, p.z, p.y);
        i ? ctx.lineTo(...q) : ctx.moveTo(...q);
      });
      ctx.closePath();
      ctx.fillStyle = `hsl(${125 + y * 9} 19% ${dark ? shade - 24 : shade}%)`;
      ctx.fill();
      ctx.strokeStyle = dark ? "rgba(176,210,173,.23)" : "rgba(39,83,55,.24)";
      ctx.lineWidth = 0.55;
      ctx.stroke();
    }
    if (trail.length > 1) {
      ctx.beginPath();
      trail.forEach((p, i) => {
        const q = project(p.x, p.z, loss(p.x, p.z) + 0.035);
        i ? ctx.lineTo(...q) : ctx.moveTo(...q);
      });
      ctx.strokeStyle = "#f7e3a9";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
      const first = trail[0];
      const q = project(first.x, first.z, loss(first.x, first.z) + 0.035);
      ctx.beginPath();
      ctx.arc(...q, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#f7e3a9";
      ctx.fill();
    }
    const q = project(point.x, point.z, loss(point.x, point.z) + 0.07);
    ctx.beginPath();
    ctx.arc(...q, 11, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,242,199,.20)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(...q, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffedb8";
    ctx.fill();
    ctx.strokeStyle = "#927949";
    ctx.lineWidth = 1;
    ctx.stroke();
    stepOutput.textContent = String(step).padStart(3, "0");
    lossOutput.textContent = loss(point.x, point.z).toFixed(3);
  }

  function updateToggle() {
    toggle.setAttribute(
      "aria-label",
      running ? "Pause simulation" : "Play simulation",
    );
    toggle.firstElementChild.textContent = running ? "Ⅱ" : "▷";
  }

  function reset() {
    startIndex = (startIndex + 1) % starts.length;
    point = { ...starts[startIndex] };
    trail = [{ ...point }];
    step = 0;
    holdSince = 0;
    lastStep = 0;
    render();
  }

  function tick(time) {
    frame = 0;
    if (!running || !inView || document.hidden) return;
    if (time - lastStep > 38) {
      const next = descend(point, rate);
      const distance = Math.hypot(next.x - point.x, next.z - point.z);
      if (distance > 0.0001 && step < 600) {
        point = next;
        trail.push({ ...point });
        step++;
      } else {
        if (!holdSince) holdSince = time;
        if (time - holdSince > 2300) reset();
      }
      lastStep = time;
      render();
    }
    schedule();
  }

  function schedule() {
    if (!frame && running && inView && !document.hidden)
      frame = requestAnimationFrame(tick);
  }

  new ResizeObserver(() => {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    render();
  }).observe(canvas);

  new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      schedule();
    },
    { threshold: 0.05 },
  ).observe(canvas);
  document.addEventListener("visibilitychange", schedule);
  rateInput.addEventListener("input", () => {
    rate = Number(rateInput.value) / 100;
    rateOutput.textContent = rate.toFixed(2);
    holdSince = 0;
  });
  toggle.addEventListener("click", () => {
    running = !running;
    updateToggle();
    schedule();
  });
  document.querySelector("#simulation-reset").addEventListener("click", reset);
  document
    .querySelector(".theme-toggle")
    .addEventListener("click", () => requestAnimationFrame(render));
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
  motionPreference.addEventListener("change", (event) => {
    if (event.matches) {
      running = false;
      updateToggle();
      render();
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || motionPreference.matches) return;
    const bounds = canvas.getBoundingClientRect();
    rotation =
      -0.63 + ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.35;
    render();
  });
  canvas.addEventListener("pointerleave", () => {
    rotation = -0.63;
    render();
  });
  updateToggle();
  schedule();
}
