/* Lightweight steering lean, skid traces, and tire smoke for Battle Racers.
   Load after battle-racers-nature.js. */
(() => {
  "use strict";
  if (typeof drawCar !== "function" || typeof car === "undefined" ||
      typeof canvas === "undefined" || typeof ctx === "undefined") {
    console.warn("Battle Racers driving effects: load after the game scripts.");
    return;
  }

  const oldDrawCar = drawCar;
  const puffs = [];
  const skids = [];
  let lastX = car.x;
  let lastPuffAt = 0;
  let frame = 0;
  let lean = 0;

  function drawEffects(now, active, steering) {
    const cx = car.x + car.width / 2;
    const rearY = car.y + car.height * .86;
    const turn = Math.min(1, Math.abs(steering) / 7);

    if (active && turn > .32 && now - lastPuffAt > 95) {
      lastPuffAt = now;
      for (const side of [-1, 1]) {
        puffs.push({
          x: cx + side * car.width * .25,
          y: rearY,
          vx: -steering * .12 + side * .22,
          vy: 1.05 + Math.random() * .5,
          r: 3 + Math.random() * 3,
          life: 1,
          grow: .14 + Math.random() * .13
        });
      }
      if (Math.abs(steering) > 2.4) {
        for (const side of [-1, 1]) skids.push({
          x: cx + side * car.width * .25,
          y: rearY,
          side,
          life: 1
        });
      }
    }

    ctx.save();
    // Brief, faint tire traces appear only during a stronger turn.
    for (let i = skids.length - 1; i >= 0; i--) {
      const mark = skids[i];
      mark.life -= .018;
      if (mark.life <= 0) { skids.splice(i, 1); continue; }
      ctx.globalAlpha = .13 * mark.life;
      ctx.strokeStyle = "#172027";
      ctx.lineWidth = Math.max(1, car.width * .035);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(mark.x, mark.y);
      ctx.lineTo(mark.x - lean * car.width * .2, mark.y + 22 * mark.life);
      ctx.stroke();
    }
    // Soft gray puffs drift behind the rear tires and fade out.
    for (let i = puffs.length - 1; i >= 0; i--) {
      const puff = puffs[i];
      puff.x += puff.vx;
      puff.y += puff.vy;
      puff.r += puff.grow;
      puff.life -= .027;
      if (puff.life <= 0) { puffs.splice(i, 1); continue; }
      ctx.globalAlpha = .25 * puff.life;
      ctx.fillStyle = "#cbd5d7";
      ctx.beginPath();
      ctx.ellipse(puff.x, puff.y, puff.r * 1.2, puff.r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawCar = function () {
    // Match the road-fix sprite's portrait placement before calculating the lean pivot.
    if (canvas.width < canvas.height && canvas.height > 600)
      car.y = canvas.height - 205;

    const now = performance.now();
    const playing = typeof gameStarted !== "undefined" && gameStarted &&
      !(typeof paused !== "undefined" && paused) &&
      !(typeof countdownActive !== "undefined" && countdownActive) &&
      !(typeof health !== "undefined" && health <= 0);
    const dx = car.x - lastX;
    lastX = car.x;
    const targetLean = playing ? Math.max(-.12, Math.min(.12, dx * .022)) : 0;
    lean += (targetLean - lean) * .24;

    if (playing && ++frame % 3 === 0)
      drawEffects(now, true, dx);
    else if (!playing && (puffs.length || skids.length))
      drawEffects(now, false, 0);

    const pivotX = car.x + car.width / 2;
    const pivotY = car.y + car.height * .37;
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(lean);
    ctx.translate(-pivotX, -pivotY);
    oldDrawCar();
    ctx.restore();
  };
})();
