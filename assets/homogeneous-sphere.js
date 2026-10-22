const clamp = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const blend = (a, b, t) => a + (b - a) * t;
const north = [0, 0, 1];
const azimuth = 0.48;
const tiltAxis = [-Math.sin(azimuth), Math.cos(azimuth), 0];

// Rodrigues' formula: every animated point undergoes the same rigid rotation.
export function rotateAboutAxis(vector, axis, angle) {
  const length = Math.hypot(...axis);
  const [x, y, z] = axis.map((value) => value / length);
  const [a, b, c] = vector;
  const cosine = Math.cos(angle),
    sine = Math.sin(angle);
  const dot = x * a + y * b + z * c;
  return [
    a * cosine + (y * c - z * b) * sine + x * dot * (1 - cosine),
    b * cosine + (z * a - x * c) * sine + y * dot * (1 - cosine),
    c * cosine + (x * b - y * a) * sine + z * dot * (1 - cosine),
  ];
}

export function homidFrame(seconds) {
  const tilt = 1.18 * smooth((seconds - 12.6) / 5.6);
  return {
    sphereOpacity: blend(0.95, 0.045, smooth((seconds - 2) / 2)),
    poleOpacity: smooth((seconds - 4) / 1.1),
    twist: 2 * Math.PI * smooth((seconds - 6) / 5),
    tilt,
    point: rotateAboutAxis(north, tiltAxis, tilt),
    so2Curve: smooth((seconds - 6) / 0.7) * (1 - smooth((seconds - 11) / 0.9)),
    so3Curve:
      smooth((seconds - 12.6) / 0.7) * (1 - smooth((seconds - 20.5) / 1.5)),
    so2Label: smooth((seconds - 6.5) / 0.8),
    so3Label: smooth((seconds - 13.4) / 0.8),
    quotient: smooth((seconds - 20) / 3),
  };
}

export function drawHomogeneousSphere(ctx, seconds, palette) {
  const state = homidFrame(seconds);
  const { ink, muted, accent, line, paper } = palette;
  const cx = blend(360, 225, state.quotient),
    cy = 173,
    radius = 105;
  const camera = -0.4,
    elevation = 0.36;
  const project = ([x, y, z], r = radius) => {
    const horizontal = x * Math.cos(camera) - y * Math.sin(camera);
    const ground = x * Math.sin(camera) + y * Math.cos(camera);
    return [
      cx + r * horizontal,
      cy - r * (z * Math.cos(elevation) + ground * Math.sin(elevation)),
      ground * Math.cos(elevation) - z * Math.sin(elevation),
    ];
  };
  const rotate = (point) =>
    rotateAboutAxis(
      rotateAboutAxis(point, north, state.twist),
      tiltAxis,
      state.tilt,
    );
  const write = (value, x, y, size, color = ink, alpha = 1, italic = false) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = `${italic ? "italic " : ""}${size}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, x, y);
    ctx.restore();
  };
  const polyline = (points, color, width, alpha = 1, dashed = false) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (dashed) ctx.setLineDash([4, 5]);
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.restore();
  };
  const arrow = (points, color, alpha = 1, width = 2.2, head = 8) => {
    if (points.length < 2 || alpha <= 0) return;
    polyline(points, color, width, alpha);
    const [x, y] = points.at(-1),
      [px, py] = points.at(-2);
    const angle = Math.atan2(y - py, x - px);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x - head * Math.cos(angle - 0.42),
      y - head * Math.sin(angle - 0.42),
    );
    ctx.lineTo(
      x - head * Math.cos(angle + 0.42),
      y - head * Math.sin(angle + 0.42),
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  const dot = (point, color, alpha = 1, r = 3) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point[0], point[1], r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // A lit sphere first; after dimming, only a faint geometric guide remains.
  const gradient = ctx.createRadialGradient(
    cx - 37,
    cy - 40,
    3,
    cx,
    cy,
    radius,
  );
  const dark = paper === "#23342b";
  gradient.addColorStop(0, dark ? "#d6e3c8" : "#ffffff");
  gradient.addColorStop(0.55, dark ? "#9cb596" : "#f0f5e8");
  gradient.addColorStop(1, dark ? "#58705d" : "#c9d7bf");
  ctx.save();
  ctx.globalAlpha = state.sphereOpacity;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.1 + state.sphereOpacity * 0.25;
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Latitude/longitude lines reveal the actual SO(2) and SO(3) rigid motions.
  const mesh = (points, emphasized = false) => {
    const projected = points.map((point) => project(rotate(point)));
    for (const front of [false, true]) {
      ctx.save();
      ctx.globalAlpha = (emphasized ? 0.33 : 0.085) * (front ? 1 : 0.4);
      ctx.strokeStyle = emphasized ? accent : ink;
      ctx.lineWidth = emphasized ? 1.4 : 0.75;
      if (!front) ctx.setLineDash([2, 4]);
      ctx.beginPath();
      for (let i = 1; i < projected.length; i++) {
        if (projected[i][2] <= 0 !== front) continue;
        ctx.moveTo(...projected[i - 1].slice(0, 2));
        ctx.lineTo(...projected[i].slice(0, 2));
      }
      ctx.stroke();
      ctx.restore();
    }
  };
  for (let latitude = -2; latitude <= 2; latitude++) {
    const z = Math.sin((latitude * Math.PI) / 6),
      r = Math.sqrt(1 - z * z);
    mesh(
      Array.from({ length: 81 }, (_, i) => {
        const phi = (i * Math.PI) / 40;
        return [r * Math.cos(phi), r * Math.sin(phi), z];
      }),
    );
  }
  for (let meridian = 0; meridian < 8; meridian++) {
    const phi = (meridian * Math.PI) / 8;
    mesh(
      Array.from({ length: 81 }, (_, i) => {
        const theta = (i * Math.PI) / 40;
        return [
          Math.sin(theta) * Math.cos(phi),
          Math.sin(theta) * Math.sin(phi),
          Math.cos(theta),
        ];
      }),
    );
  }

  // SO(2) turns the sphere around the selected axis; the north-pole vector is fixed.
  const pole = project(state.point),
    tip = project(state.point, radius + 31);
  if (state.tilt > 0.01) {
    polyline(
      [project(north), project(north, radius + 31)],
      muted,
      1.3,
      0.4 * (1 - state.quotient),
      true,
    );
    dot(project(north), muted, 0.45 * (1 - state.quotient), 2.3);
  }
  arrow([pole, tip], accent, state.poleOpacity, 2.7, 8);
  dot(pole, accent, state.poleOpacity, 3.6);
  if (seconds < 12.6)
    write("north pole", cx - 68, cy - 112, 13, muted, state.poleOpacity);
  if (seconds > 17.5)
    write(
      "an arbitrary point",
      cx + 125,
      cy - 74,
      13,
      muted,
      smooth((seconds - 17.5) / 0.7) * (1 - state.quotient),
    );

  if (state.so2Curve > 0) {
    const orbit = Array.from({ length: 87 }, (_, i) => {
      const phi = -0.15 + (i / 86) * 5.4 + state.twist * 0.2;
      return project([Math.cos(phi), Math.sin(phi), 0], radius * 1.2);
    });
    arrow(orbit, ink, state.so2Curve, 2, 7);
  }
  if (state.so3Curve > 0 && state.tilt > 0.01) {
    const orbit = Array.from({ length: 65 }, (_, i) =>
      project(
        rotateAboutAxis(north, tiltAxis, (state.tilt * i) / 64),
        radius * 1.38,
      ),
    );
    arrow(orbit, ink, state.so3Curve, 2.1, 8);
  }

  write("S²", cx, cy + radius + 30, 31, ink, 1, true);
  // The group labels move into a real fraction before the equivalence appears.
  write(
    "SO(2)",
    blend(493, 518, state.quotient),
    blend(250, 204, state.quotient),
    blend(28, 33, state.quotient),
    ink,
    state.so2Label,
  );
  write(
    "SO(3)",
    blend(474, 518, state.quotient),
    blend(29, 146, state.quotient),
    blend(28, 33, state.quotient),
    ink,
    state.so3Label,
  );
  if (state.quotient > 0) {
    polyline(
      [
        [468, 175],
        [568, 175],
      ],
      ink,
      1.6,
      state.quotient,
    );
    const equivalent = smooth((seconds - 22.2) / 1.3);
    write("≅", 600, 176, 36, ink, equivalent);
    write("S²", 655, 176, 38, ink, equivalent, true);
    write(
      "rotations / rotations that fix the pole",
      532,
      258,
      13,
      muted,
      equivalent,
    );
  }
}
