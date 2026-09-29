/* Battle Racers picture style: load after the existing game script. */
(() => {
  "use strict";
  const road=new Image(), racer=new Image();
  road.src="battle-road.webp";
  racer.src="battle-car.webp";
  const ready=img=>img.complete&&img.naturalWidth>0;
  const colors={
    red:"none",blue:"hue-rotate(205deg)",green:"hue-rotate(110deg)",
    orange:"hue-rotate(35deg)",purple:"hue-rotate(275deg)",
    gold:"sepia(1) saturate(2.5) hue-rotate(5deg)"
  };
  function sprite(g,x,y,w,h,color){
    g.save();g.filter=colors[color]||"none";
    g.drawImage(racer,x,y,w,h);g.restore();
  }
  const style=document.createElement("style");
  style.textContent=`
    #title{font-style:italic;font-weight:1000;font-size:clamp(18px,5vw,31px);
      text-shadow:2px 3px #082238,0 0 10px #fff}
    #pauseButton,#soundButton{width:48px;height:48px;border-radius:10px;
      background:linear-gradient(#2d5d84,#0b2239);box-shadow:0 4px 10px #0009}
    #soundButton{right:67px}
    #fireButton{width:104px;height:104px;right:15px;bottom:68px;
      border:4px solid white;font-size:19px;
      background:radial-gradient(circle at 35% 28%,#ff837a,#f30e20 55%,#850011);
      box-shadow:0 0 5px #fff,0 0 25px #ff2934,inset 0 0 20px #6b0000}
    #steeringWheel{width:112px;height:112px;left:15px;bottom:68px;
      border:4px solid #c3e4ef;font-size:40px;
      box-shadow:0 0 4px #fff,0 0 21px #2fc4ff,inset 0 0 15px #000}
    #shopBar{bottom:max(8px,env(safe-area-inset-bottom));width:min(95vw,520px);
      justify-content:center;gap:3px;padding:5px;background:#061827e8}
    .shopTab{flex:1 1 0;min-width:0;width:auto;height:49px;padding:2px;
      font-size:clamp(10px,2.8vw,14px);background:linear-gradient(#173b61,#061525)}
    #shopPage{background:radial-gradient(circle at 50% 0,#204967,#07121c 75%)}
    .shopCard{background:linear-gradient(150deg,#284966,#101c2b);border-color:#5196c2}
    .shopCard:has(.shopAction:disabled){border-color:#59e497}
    .shopPreview{display:flex;align-items:center;justify-content:center;min-height:100px;
      background:radial-gradient(ellipse,#5e9fc459,#071624 74%);border-radius:10px}
    .shopPreview canvas{width:85px;height:94px;max-width:100%}
    #battleDamage{position:fixed;inset:0;pointer-events:none;z-index:115;opacity:0;
      background:radial-gradient(circle,transparent 36%,#fc211cae)}
    #battleDamage.flash{animation:battleHit .4s ease-out both}
    @keyframes battleHit{from{opacity:1}to{opacity:0}}
    #battleBossIntro{position:fixed;z-index:320;left:50%;top:22%;
      transform:translateX(-50%);pointer-events:none;white-space:nowrap;
      color:#fff4b0;font:900 clamp(20px,6vw,37px) Arial;
      text-shadow:0 0 12px #ff2400,2px 3px #250900;animation:bossIntro 2.2s both}
    @keyframes bossIntro{0%{opacity:0;scale:1.3}15%,75%{opacity:1;scale:1}
      100%{opacity:0;scale:.9}}
    @media(orientation:landscape) and (max-height:600px){
      #fireButton{width:77px;height:77px;bottom:12px}
      #steeringWheel{width:78px;height:78px;bottom:12px}
      .shopTab{height:36px}.shopPreview{min-height:68px}
      .shopPreview canvas{height:67px;width:61px}}
  `;
  document.head.appendChild(style);

  // Double the bitmap resolution without changing the game's CSS-pixel coordinates.
  try{
    const w=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,"width");
    const h=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,"height");
    if(w?.set&&h?.set){
      const logical={w:canvas.width,h:canvas.height};
      const ratio=()=>Math.min(2,Math.max(1,window.devicePixelRatio||1));
      Object.defineProperties(canvas,{
        width:{configurable:true,get(){return logical.w},set(v){
          logical.w=+v;w.set.call(canvas,Math.round(v*ratio()));
          ctx.setTransform(ratio(),0,0,ratio(),0,0)}},
        height:{configurable:true,get(){return logical.h},set(v){
          logical.h=+v;h.set.call(canvas,Math.round(v*ratio()));
          ctx.setTransform(ratio(),0,0,ratio(),0,0)}}
      });
      resizeGame();
    }
  }catch(error){console.warn("Canvas resolution:",error)}

  const oldRoad=drawRoad;
  drawRoad=function(){
    if(!ready(road)){oldRoad();return}
    const w=canvas.width,h=canvas.height;
    const scale=Math.max(w/road.width,h/road.height);
    const sw=w/scale,sh=h/scale;
    ctx.drawImage(road,(road.width-sw)/2,(road.height-sh)/2,sw,sh,0,0,w,h);
    if(gameStarted&&!paused&&!countdownActive&&health>0)
      sceneryOffset=(sceneryOffset+7)%500;
    ctx.save();
    for(let i=0;i<5;i++){
      const depth=(i/5+sceneryOffset/650)%1;
      const y=h*(.29+.71*depth*depth);
      ctx.globalAlpha=.12*depth;ctx.strokeStyle="#fff";ctx.lineWidth=2+depth*4;
      ctx.beginPath();ctx.moveTo(w/2,y);ctx.lineTo(w/2,y+12+depth*32);ctx.stroke();
    }
    ctx.restore();
  };

  const oldCar=drawCar;
  drawCar=function(){
    if(!ready(racer)){oldCar();return}
    const w=Math.min(canvas.width*.37,165),h=w*1.05;
    const x=car.x+car.width/2-w/2,y=car.y+car.height*.7-h*.7;
    ctx.save();
    ctx.fillStyle="#0008";ctx.beginPath();
    ctx.ellipse(x+w/2,y+h*.85,w*.41,h*.17,0,0,Math.PI*2);ctx.fill();
    if(gameStarted&&health>0&&!paused&&!countdownActive){
      ctx.shadowBlur=18;ctx.shadowColor="#3cecff";ctx.fillStyle="#73e9ff";
      for(const fx of [.35,.65]){
        ctx.beginPath();ctx.moveTo(x+w*fx-5,y+h*.87);
        ctx.lineTo(x+w*fx,y+h*(1.08+Math.random()*.06));
        ctx.lineTo(x+w*fx+5,y+h*.87);ctx.fill();
      }
    }
    sprite(ctx,x,y,w,h,carColor);ctx.restore();
  };

  // Preserve all existing movement, collision, and damage behavior.
  const oldEnemies=drawEnemies;
  drawEnemies=function(){
    if(!ready(racer)){oldEnemies();return}
    ctx.save();ctx.globalAlpha=0;oldEnemies();ctx.restore();
    enemies.forEach((e,i)=>{
      const w=e.strong?70:58,h=e.strong?83:72;
      sprite(ctx,e.x+e.width/2-w/2,e.y,w,h,
        e.strong?"orange":["blue","green","purple"][i%3]);
      if(e.strong){
        ctx.fillStyle="#06131fdc";ctx.fillRect(e.x,e.y-9,e.width,5);
        ctx.fillStyle="#4dff63";
        ctx.fillRect(e.x,e.y-9,e.width*Math.max(0,e.health/3),5);
      }
    });
  };
  const oldBoss=drawBoss;
  drawBoss=function(){
    if(!boss||!ready(racer)){oldBoss();return}
    ctx.save();ctx.globalAlpha=0;oldBoss();ctx.restore();
    if(!boss)return;
    ctx.save();ctx.shadowBlur=23;ctx.shadowColor="#ff351e";
    sprite(ctx,boss.x-10,boss.y-8,boss.width+20,boss.height+12,"red");
    ctx.restore();
    const bw=Math.min(canvas.width-40,420),bx=(canvas.width-bw)/2;
    ctx.fillStyle="#09121de8";ctx.fillRect(bx,54,bw,24);
    ctx.fillStyle="#ff4730";ctx.fillRect(bx+2,56,
      Math.max(0,boss.health/boss.maxHealth*(bw-4)),20);
    ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.strokeRect(bx,54,bw,24);
    ctx.fillStyle="#fff";ctx.font="bold 14px Arial";ctx.textAlign="center";
    ctx.fillText("BOSS  "+Math.ceil(boss.health)+" / "+boss.maxHealth,
      canvas.width/2,72);
  };

  const oldCard=createShopCard;
  createShopCard=function(item,owned,selected,action){
    oldCard(item,owned,selected,action);
    if(!shopCars.includes(item)||!ready(racer))return;
    const preview=shopGrid.lastElementChild?.querySelector(".shopPreview");
    if(!preview)return;
    const sample=document.createElement("canvas");
    sample.width=180;sample.height=190;
    sample.setAttribute("aria-label",item.name+" preview");
    const g=sample.getContext("2d");g.scale(2,2);
    sprite(g,6,2,78,87,item.id);preview.replaceChildren(sample);
  };
  racer.addEventListener("load",()=>{
    if(shopPage.style.display==="block"&&shopTitle.textContent.includes("CAR"))
      renderCars();
  });

  drawHUD=function(){
    ctx.save();
    const tw=canvas.width<600?125:160,th=30;
    const labels=["🏆 SCORE","🏁 LEVEL","🪙 COINS","❤️ HEALTH"];
    const values=[score,level,coins,"▰".repeat(Math.max(0,health))||"0"];
    for(let i=0;i<4;i++){
      const y=52+i*(th+4);
      ctx.fillStyle="rgba(3,22,36,.78)";
      ctx.beginPath();ctx.roundRect(10,y,tw,th,8);ctx.fill();
      ctx.strokeStyle="#6c9dbb";ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle="#cce6f5";ctx.font="bold 10px Arial";ctx.textAlign="left";
      ctx.fillText(labels[i],17,y+12);
      ctx.fillStyle=i===3?"#71fd67":"#fff";
      ctx.font="bold 14px Arial";ctx.fillText(String(values[i]),17,y+26);
    }
    if(rapidFire){
      ctx.fillStyle="#ffe65b";ctx.font="bold 17px Arial";ctx.textAlign="center";
      ctx.fillText("⚡ RAPID FIRE ⚡",canvas.width/2,102);
    }
    ctx.restore();
  };

  const damage=document.createElement("div");
  damage.id="battleDamage";document.body.appendChild(damage);
  let previousHealth=health;
  function watchHealth(){
    if(gameStarted&&health<previousHealth){
      damage.classList.remove("flash");void damage.offsetWidth;
      damage.classList.add("flash");
    }
    previousHealth=health;requestAnimationFrame(watchHealth);
  }
  requestAnimationFrame(watchHealth);
  const oldSpawnBoss=spawnBoss;
  spawnBoss=function(){
    const hadBoss=!!boss;oldSpawnBoss();
    if(hadBoss||!boss)return;
    const warning=document.createElement("div");
    warning.id="battleBossIntro";warning.textContent="⚠ BOSS INCOMING ⚠";
    document.body.appendChild(warning);
    setTimeout(()=>warning.remove(),2200);
  };
})();
