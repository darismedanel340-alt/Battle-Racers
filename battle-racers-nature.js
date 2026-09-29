/* Subtle ocean shimmer, palm sway, and roadside grass breeze for Battle Racers.
   Load after battle-racers-road-fix.js. */
(() => {
  "use strict";
  if (typeof drawRoad !== "function" || typeof canvas === "undefined" || typeof ctx === "undefined") {
    console.warn("Battle Racers nature effects: load after the game scripts.");
    return;
  }

  const scene = new Image();
  scene.src = "battle-road.webp";
  const oldDrawRoad = drawRoad;
  const TAU = Math.PI * 2;
  let start = performance.now();

  // Small, irregular water glints, clustered offshore so the road and beach stay clear.
  const glints = [];
  let seed = 7921;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 44; i++) {
    glints.push({
      x: 640 + random() * 265,
      y: 320 + random() * 305,
      length: 9 + random() * 27,
      speed: 4 + random() * 12,
      phase: random() * TAU,
      alpha: .08 + random() * .14
    });
  }

  // A few palm crowns in the existing background photo, with restrained frond flex.
  const palms = [
    { x: 108, y: 154, size: 1.0, phase: .2 },
    { x: 174, y: 338, size: .77, phase: 1.7 },
    { x: 73, y: 541, size: .82, phase: 2.9 },
    { x: 250, y: 737, size: .68, phase: 4.2 },
    { x: 122, y: 1007, size: .63, phase: 5.1 }
  ];

  // Wind-bent blades around the green verges. Coordinates follow the source artwork.
  const grassPatches = [
    { x: 48, y: 684, w: 104, h: 70, n: 18, phase: .3 },
    { x: 12, y: 861, w: 126, h: 76, n: 20, phase: 1.4 },
    { x: 22, y: 1172, w: 75, h: 62, n: 14, phase: 2.8 },
    { x: 84, y: 1455, w: 94, h: 65, n: 16, phase: 4.3 }
  ];
  for (const patch of grassPatches) {
    patch.blades = Array.from({ length: patch.n }, () => ({
      x: random() * patch.w,
      y: random() * patch.h,
      height: 8 + random() * 21,
      lean: (random() - .5) * .45,
      phase: random() * TAU,
      shade: random()
    }));
  }

  function drawPalm(g, palm, t) {
    const sway = Math.sin(t * .72 + palm.phase) * 4.2 * palm.size;
    const scale = palm.size;
    g.save();
    g.translate(palm.x, palm.y);
    // Only the fine leaf edges move; the original photo remains visible underneath.
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI * .90 + i * Math.PI * .34;
      const flex = sway * (.45 + i / 11);
      const len = (31 + (i % 3) * 8) * scale;
      const ex = Math.cos(angle) * len + flex;
      const ey = Math.sin(angle) * len * .67 + Math.abs(flex) * .18;
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(ex * .48 + flex * .5, ey * .30, ex, ey);
      g.strokeStyle = i % 2 ? "rgba(24,91,39,.19)" : "rgba(179,208,105,.17)";
      g.lineWidth = 2.2 * scale;
      g.lineCap = "round";
      g.stroke();
      // Short side leaflets keep the fronds soft and natural rather than rigid lines.
      for (let j = 1; j <= 3; j++) {
        const p = j / 4;
        const bx = ex * p + flex * p;
        const by = ey * p;
        const side = (j % 2 ? -1 : 1) * (8 + j * 1.8) * scale;
        g.beginPath();
        g.moveTo(bx, by);
        g.quadraticCurveTo(bx + side * .35, by + 2 * scale, bx + side, by + 7 * scale);
        g.strokeStyle = "rgba(43,112,52,.15)";
        g.lineWidth = 1.3 * scale;
        g.stroke();
      }
    }
    g.restore();
  }

  function drawNature() {
    if (!scene.complete || !scene.naturalWidth) return;
    const w = canvas.width, h = canvas.height;
    const scale = Math.max(w / scene.naturalWidth, h / scene.naturalHeight);
    const offsetX = (w - scene.naturalWidth * scale) / 2;
    const offsetY = (h - scene.naturalHeight * scale) / 2;
    const t = (performance.now() - start) / 1000;
    const moving = typeof gameStarted === "undefined" || !gameStarted ||
      (typeof paused !== "undefined" && paused) ? .45 : 1;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Clip shimmer to the open-water side of the cove; no effects cross the road.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(660, 327); ctx.lineTo(864, 298); ctx.lineTo(864, 565);
    ctx.lineTo(821, 553); ctx.lineTo(785, 520); ctx.lineTo(752, 480);
    ctx.lineTo(718, 435); ctx.lineTo(682, 388); ctx.closePath();
    ctx.clip();
    for (const wave of glints) {
      const drift = (t * wave.speed * moving + wave.phase * 18) % 300;
      const x = 610 + ((wave.x - 610 + drift) % 300);
      const y = wave.y + Math.sin(t * .55 + wave.phase) * 2.5;
      const pulse = .55 + .45 * Math.sin(t * 1.2 + wave.phase);
      ctx.globalAlpha = wave.alpha * pulse;
      ctx.strokeStyle = wave.phase > 3 ? "#d8fbff" : "#9deafa";
      ctx.lineWidth = .8 + (wave.length / 27) * .7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + wave.length * .45, y - 1.8, x + wave.length, y + .5);
      ctx.stroke();
    }
    ctx.restore();

    // Tiny wind flecks catch the light across the leafy edges.
    for (const palm of palms) drawPalm(ctx, palm, t * moving);
    for (const patch of grassPatches) {
      const breeze = Math.sin(t * .9 + patch.phase) * 3.6 * moving;
      for (const blade of patch.blades) {
        const x = patch.x + blade.x;
        const y = patch.y + blade.y;
        const tipX = x + blade.lean * blade.height + breeze + Math.sin(t * 1.3 + blade.phase) * 1.5;
        const tipY = y - blade.height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + breeze * .25, y - blade.height * .55, tipX, tipY);
        ctx.strokeStyle = blade.shade > .5 ? "rgba(179,220,128,.18)" : "rgba(38,111,51,.2)";
        ctx.lineWidth = 1 + blade.shade * 1.2;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawRoad = function () {
    oldDrawRoad();
    drawNature();
  };
})();
