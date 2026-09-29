/* Enhanced weapon impacts and explosions for Battle Racers.
   Load after battle-racers-driving.js. */
(() => {
  "use strict";
  if (typeof drawEnemies !== "function" || typeof drawBoss !== "function" ||
      typeof canvas === "undefined" || typeof ctx === "undefined") {
    console.warn("Battle Racers combat effects: load after the game scripts.");
    return;
  }

  const oldDrawEnemies = drawEnemies;
  const oldDrawBoss = drawBoss;
  const effects = [];
  const enemyStates = new Map();
  let bossState = null;
  let lastEffectsPaint = -Infinity;

  function addBurst(x, y, heavy) {
    const sparks = [];
    const count = heavy ? 26 : 12;
    for (let i = 0; i < count; i++) {
      const a = Math.PI * 2 * i / count + (Math.random() - .5) * .3;
      const speed = (heavy ? 45 : 32) + Math.random() * (heavy ? 115 : 75);
      sparks.push({
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        length: 4 + Math.random() * (heavy ? 17 : 10),
        hue: Math.random() < .28 ? 48 : (heavy ? 20 : 188)
      });
    }
    effects.push({ x, y, start: performance.now(), heavy, sparks,
      life: heavy ? 720 : 330 });
    if (effects.length > 24) effects.splice(0, effects.length - 24);
  }

  function paintEffects(now) {
    // drawEnemies and drawBoss may both run in one frame; paint the overlay once.
    if (now - lastEffectsPaint < 6) return;
    lastEffectsPaint = now;
    ctx.save();
    for (let n = effects.length - 1; n >= 0; n--) {
      const fx = effects[n];
      const elapsed = now - fx.start;
      const p = Math.max(0, Math.min(1, elapsed / fx.life));
      const fade = 1 - p;
      if (fade <= 0) { effects.splice(n, 1); continue; }
      const radius = (fx.heavy ? 10 : 5) + p * (fx.heavy ? 45 : 24);

      // Bright center flash fades quickly, followed by an expanding hot ring.
      const glow = ctx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, radius * 1.2);
      glow.addColorStop(0, `rgba(255,255,245,${.86 * fade})`);
      glow.addColorStop(.22, fx.heavy
        ? `rgba(255,190,54,${.78 * fade})`
        : `rgba(95,231,255,${.7 * fade})`);
      glow.addColorStop(1, "rgba(255,80,20,0)");
      ctx.globalAlpha = fade;
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(fx.x, fx.y, radius * 1.2, 0, Math.PI * 2); ctx.fill();

      ctx.globalAlpha = .72 * fade;
      ctx.strokeStyle = fx.heavy ? "#ffb53d" : "#bdfaff";
      ctx.lineWidth = Math.max(1, (fx.heavy ? 4 : 2.5) * fade);
      ctx.beginPath(); ctx.arc(fx.x, fx.y, radius, 0, Math.PI * 2); ctx.stroke();

      // Warm sparks fan outward and drop under gravity.
      for (const s of fx.sparks) {
        const x1 = fx.x + s.vx * elapsed / 1000;
        const y1 = fx.y + s.vy * elapsed / 1000 + 50 * (elapsed / 1000) ** 2;
        const tail = Math.max(.12, 1 - p * 1.4);
        ctx.globalAlpha = fade * tail;
        ctx.strokeStyle = s.hue === 188 ? "#a7f8ff" : `hsl(${s.hue} 100% 62%)`;
        ctx.lineWidth = fx.heavy ? 2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(x1 - s.vx * .035, y1 - s.vy * .035);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      if (fx.heavy) {
        // A soft smoke halo lingers after the bright blast.
        ctx.globalAlpha = .16 * fade;
        ctx.fillStyle = "#65727a";
        ctx.beginPath();
        ctx.ellipse(fx.x, fx.y + p * 5, 13 + p * 24, 10 + p * 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function snapshotEnemies() {
    if (typeof enemies === "undefined" || !Array.isArray(enemies)) return;
    const live = new Set(enemies);
    for (const e of enemies) {
      const hp = Number(e.health ?? e.hp);
      const old = enemyStates.get(e);
      const x = Number(e.x) + Number(e.width || 0) / 2;
      const y = Number(e.y) + Number(e.height || 0) / 2;
      if (old && Number.isFinite(hp) && Number.isFinite(old.hp) && hp < old.hp)
        addBurst(x, y, false);
      enemyStates.set(e, { hp, x, y });
    }
    for (const [e, old] of enemyStates) {
      if (live.has(e)) continue;
      if (old.y > canvas.height * .3 && old.y < canvas.height * .9)
        addBurst(old.x, old.y, true);
      enemyStates.delete(e);
    }
  }

  drawEnemies = function () {
    oldDrawEnemies();
    snapshotEnemies();
    paintEffects(performance.now());
  };

  drawBoss = function () {
    oldDrawBoss();
    if (typeof boss !== "undefined" && boss) {
      const hp = Number(boss.health);
      const x = Number(boss.x) + Number(boss.width || 0) / 2;
      const y = Number(boss.y) + Number(boss.height || 0) / 2;
      if (bossState && bossState.object === boss && Number.isFinite(hp) && hp < bossState.hp)
        addBurst(x, y, false);
      bossState = { object: boss, hp };
    } else if (bossState) {
      if (bossState.y > 0 && bossState.y < canvas.height * .9)
        addBurst(bossState.x, bossState.y, true);
      bossState = null;
    }
    if (bossState && typeof boss !== "undefined" && boss) {
      bossState.x = Number(boss.x) + Number(boss.width || 0) / 2;
      bossState.y = Number(boss.y) + Number(boss.height || 0) / 2;
    }
    paintEffects(performance.now());
  };
})();
