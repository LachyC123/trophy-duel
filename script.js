// Trophy Duel v1 — working movement + abilities + simple 1v1 loop (GitHub Pages friendly)

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

const UI = {
  hp: document.getElementById("hp"),
  aihp: document.getElementById("aihp"),
  time: document.getElementById("time"),
  trophies: document.getElementById("trophies"),
  pScore: document.getElementById("pScore"),
  aScore: document.getElementById("aScore"),
  dash: document.getElementById("dash"),
  shield: document.getElementById("shield"),
  toast: document.getElementById("toast"),
};

function showToast(msg, ms=1200){
  UI.toast.hidden = false;
  UI.toast.textContent = msg;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> UI.toast.hidden = true, ms);
}

function resize(){
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const dist = (x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1);
const lerp = (a,b,t)=>a+(b-a)*t;

// --- Save
let trophies = Number(localStorage.getItem("trophy_duel_trophies") || "0");
UI.trophies.textContent = trophies;

// --- Arena + obstacles
const arena = {
  pad: 20,
  obstacles: [
    // chunky rectangles: (x,y,w,h)
    {x:0.45, y:0.22, w:0.10, h:0.14},
    {x:0.20, y:0.55, w:0.12, h:0.16},
    {x:0.68, y:0.60, w:0.12, h:0.16},
  ],
};

function obstacleRects(){
  // convert normalized to pixels every frame (handles resize)
  return arena.obstacles.map(o=>({
    x: o.x * innerWidth,
    y: o.y * innerHeight,
    w: o.w * innerWidth,
    h: o.h * innerHeight
  }));
}

function circleRectCollide(cx, cy, r, rx, ry, rw, rh){
  const nx = clamp(cx, rx, rx+rw);
  const ny = clamp(cy, ry, ry+rh);
  const dx = cx - nx, dy = cy - ny;
  return (dx*dx + dy*dy) < (r*r);
}

// --- Control point + sudden death ring
const controlPoint = { r: 60 };
function cpX(){ return innerWidth/2; }
function cpY(){ return innerHeight/2; }

const sudden = { active:false, total: 22, left: 0 };

// --- Entities
function makeFighter(x,y,isAI){
  return {
    x,y, vx:0, vy:0,
    r: 14,
    hpMax: 100,
    hp: 100,
    isAI,
    // abilities
    dashCd: 0,
    shieldCd: 0,
    shield: 0,
    invuln: 0,
    // scoring
    score: 0,
    // shooting
    nextShot: 0,
  };
}

let player = makeFighter(innerWidth*0.33, innerHeight*0.5, false);
let bot    = makeFighter(innerWidth*0.67, innerHeight*0.5, true);

const bullets = [];

function resetRound(){
  player = makeFighter(innerWidth*0.33, innerHeight*0.5, false);
  bot    = makeFighter(innerWidth*0.67, innerHeight*0.5, true);
  bullets.length = 0;
  state.timeLeft = state.roundTime;
  sudden.active = false;
  sudden.left = 0;
  state.running = true;
  showToast("Fight!");
}

const state = {
  roundTime: 60,
  timeLeft: 60,
  running: true,
};

// --- Input: touch joystick (left side) + keyboard fallback
const joy = {
  active:false, id:null,
  baseX:0, baseY:0,
  dx:0, dy:0,
  max: 55
};

canvas.addEventListener("pointerdown", (e)=>{
  // left half only, avoid stealing button presses on right
  if(e.clientX > innerWidth*0.55) return;
  joy.active = true;
  joy.id = e.pointerId;
  joy.baseX = e.clientX;
  joy.baseY = e.clientY;
  joy.dx = 0; joy.dy = 0;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e)=>{
  if(!joy.active || e.pointerId !== joy.id) return;
  const dx = e.clientX - joy.baseX;
  const dy = e.clientY - joy.baseY;
  const m = Math.hypot(dx,dy) || 1;
  const k = Math.min(1, m/joy.max);
  joy.dx = (dx/m)*k;
  joy.dy = (dy/m)*k;
});

function joyUp(e){
  if(!joy.active || e.pointerId !== joy.id) return;
  joy.active=false; joy.id=null;
  joy.dx=0; joy.dy=0;
}
canvas.addEventListener("pointerup", joyUp);
canvas.addEventListener("pointercancel", joyUp);

const keys = new Set();
addEventListener("keydown", e=> keys.add(e.key.toLowerCase()));
addEventListener("keyup", e=> keys.delete(e.key.toLowerCase()));

function getMove(){
  let mx=0,my=0;
  if(joy.active){
    mx = joy.dx; my = joy.dy;
  } else {
    if(keys.has("w") || keys.has("arrowup")) my -= 1;
    if(keys.has("s") || keys.has("arrowdown")) my += 1;
    if(keys.has("a") || keys.has("arrowleft")) mx -= 1;
    if(keys.has("d") || keys.has("arrowright")) mx += 1;
    const m = Math.hypot(mx,my) || 1;
    mx/=m; my/=m;
  }
  return {mx,my};
}

// --- Abilities (these were missing in your first zip)
UI.dash.addEventListener("click", ()=> dash(player));
UI.shield.addEventListener("click", ()=> shield(player));

function dash(f){
  if(f.dashCd > 0 || !state.running) return;
  const {mx,my} = getMove();
  let dx=mx, dy=my;
  if(Math.hypot(dx,dy) < 0.1){
    // no input: dash toward opponent
    const t = f.isAI ? player : bot;
    dx = t.x - f.x; dy = t.y - f.y;
  }
  const m = Math.hypot(dx,dy) || 1;
  f.vx += (dx/m)*620;
  f.vy += (dy/m)*620;
  f.invuln = 0.12;
  f.dashCd = 2.2;
  showToast("Dash!", 650);
}

function shield(f){
  if(f.shieldCd > 0 || !state.running) return;
  f.shield = 1.4;
  f.shieldCd = 6.0;
  showToast("Shield!", 650);
}

// --- Shooting
function shoot(from, to, now){
  if(now < from.nextShot) return;
  from.nextShot = now + 230; // fire rate
  const dx = to.x - from.x, dy = to.y - from.y;
  const m = Math.hypot(dx,dy) || 1;
  bullets.push({
    x: from.x, y: from.y,
    vx: (dx/m)*560,
    vy: (dy/m)*560,
    r: 4,
    dmg: 8,
    owner: from,
    life: 1.4
  });
}

function damage(target, amount){
  if(target.invuln > 0) return;
  if(target.shield > 0) amount *= 0.55;
  target.hp -= amount;
  target.invuln = 0.06;
}

// --- Movement + collision (wall sliding)
function moveFighter(f, mx, my, dt, rects){
  const speed = 220;
  // accel
  f.vx += mx*speed*7*dt;
  f.vy += my*speed*7*dt;
  // friction
  f.vx *= Math.pow(0.0008, dt);
  f.vy *= Math.pow(0.0008, dt);

  // try X
  const oldX = f.x, oldY = f.y;
  f.x += f.vx*dt;
  f.x = clamp(f.x, arena.pad, innerWidth - arena.pad);
  for(const r of rects){
    if(circleRectCollide(f.x, f.y, f.r, r.x, r.y, r.w, r.h)){
      f.x = oldX; f.vx = 0; break;
    }
  }
  // try Y
  f.y += f.vy*dt;
  f.y = clamp(f.y, arena.pad, innerHeight - arena.pad);
  for(const r of rects){
    if(circleRectCollide(f.x, f.y, f.r, r.x, r.y, r.w, r.h)){
      f.y = oldY; f.vy = 0; break;
    }
  }
}

// --- AI (simple but purposeful): contest point, kite low HP, finish low player
const botBrain = { mode:"contest", t:0, stuck:0, lastX:0, lastY:0 };

function lineOfSight(ax,ay,bx,by, rects){
  // very lightweight sample-based LOS check
  const steps = 14;
  for(let i=1;i<steps;i++){
    const t = i/steps;
    const x = lerp(ax,bx,t);
    const y = lerp(ay,by,t);
    for(const r of rects){
      if(x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h) return false;
    }
  }
  return true;
}

function updateBot(dt, rects){
  botBrain.t -= dt;

  // stuck detection (distance moved over ~0.5s)
  botBrain.stuck += dt;
  if(botBrain.stuck >= 0.5){
    const moved = dist(bot.x, bot.y, botBrain.lastX, botBrain.lastY);
    botBrain.lastX = bot.x; botBrain.lastY = bot.y;
    botBrain.stuck = 0;
    if(moved < 6){
      // recovery: quick dash or strafe direction flip
      if(bot.dashCd<=0) dash(bot);
      botBrain.mode = "rotate";
      botBrain.t = 0.35;
    }
  }

  if(botBrain.t <= 0){
    const hpPct = bot.hp / bot.hpMax;
    const pd = dist(bot.x, bot.y, player.x, player.y);
    const cp = dist(bot.x, bot.y, cpX(), cpY());

    let mode = "contest";
    if(hpPct < 0.35) mode = "kite";
    else if(player.hp < 35 && pd < 240) mode = "finish";
    else if(cp > controlPoint.r + 30) mode = "rotate";

    botBrain.mode = mode;
    botBrain.t = 0.33;
  }

  // choose target position
  let tx = cpX(), ty = cpY();
  if(botBrain.mode === "kite"){
    const ax = bot.x - player.x, ay = bot.y - player.y;
    const m = Math.hypot(ax,ay) || 1;
    tx = clamp(bot.x + (ax/m)*170, arena.pad, innerWidth-arena.pad);
    ty = clamp(bot.y + (ay/m)*170, arena.pad, innerHeight-arena.pad);
  } else if(botBrain.mode === "finish"){
    tx = player.x; ty = player.y;
  } else if(botBrain.mode === "rotate"){
    const ang = Math.atan2(bot.y - cpY(), bot.x - cpX()) + 0.95;
    tx = cpX() + Math.cos(ang)*150;
    ty = cpY() + Math.sin(ang)*150;
  }

  // if no LOS and contesting, flank by rotating
  if(botBrain.mode === "contest" && !lineOfSight(bot.x,bot.y,player.x,player.y,rects)){
    const ang = Math.atan2(bot.y - cpY(), bot.x - cpX()) + 1.15;
    tx = cpX() + Math.cos(ang)*180;
    ty = cpY() + Math.sin(ang)*180;
  }

  // move toward target
  const dx = tx - bot.x, dy = ty - bot.y;
  const m = Math.hypot(dx,dy) || 1;
  const mx = dx/m, my = dy/m;

  // abilities
  if(bot.hp < 45 && bot.shieldCd<=0) shield(bot);
  if(dist(bot.x,bot.y,player.x,player.y) < 140 && bot.dashCd<=0 && player.invuln<=0) dash(bot);

  moveFighter(bot, mx, my, dt, rects);
}

// --- Scoring
function applyControlPoint(dt){
  const px = cpX(), py = cpY();
  const inP = dist(player.x, player.y, px, py) <= controlPoint.r;
  const inB = dist(bot.x, bot.y, px, py) <= controlPoint.r;
  const rate = 1.0; // points per second

  if(inP && !inB) player.score += rate*dt;
  if(inB && !inP) bot.score += rate*dt;
}

// --- Round end / trophies
function endRound(){
  state.running = false;
  const pDead = player.hp <= 0;
  const bDead = bot.hp <= 0;

  let result = "Draw";
  if(bDead && !pDead) result = "Victory";
  else if(pDead && !bDead) result = "Defeat";
  else if(player.score !== bot.score) result = (player.score > bot.score) ? "Victory" : "Defeat";

  const delta = (result==="Victory") ? 24 : (result==="Defeat" ? -18 : 0);
  trophies = Math.max(0, trophies + delta);
  localStorage.setItem("trophy_duel_trophies", String(trophies));
  UI.trophies.textContent = trophies;

  showToast(`${result}  (${delta>=0?"+":""}${delta} 🏆)`, 1800);
  setTimeout(resetRound, 1400);
}

// --- Main loop
let last = performance.now();
function loop(now){
  const dt = Math.min(0.033, (now-last)/1000);
  last = now;

  if(state.running){
    tick(dt, now);
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function tick(dt, now){
  const rects = obstacleRects();

  // timers
  state.timeLeft -= dt;

  // sudden death trigger
  if(state.timeLeft <= 0){
    if(Math.floor(player.score) === Math.floor(bot.score) && player.hp>0 && bot.hp>0){
      sudden.active = true;
      sudden.left = sudden.total;
      state.timeLeft = sudden.total;
      showToast("Sudden Death!", 1100);
    } else {
      endRound();
      return;
    }
  }

  if(sudden.active){
    sudden.left -= dt;
    if(sudden.left <= 0){
      endRound();
      return;
    }
  }

  // cooldowns
  for(const f of [player, bot]){
    f.dashCd = Math.max(0, f.dashCd - dt);
    f.shieldCd = Math.max(0, f.shieldCd - dt);
    f.shield = Math.max(0, f.shield - dt);
    f.invuln = Math.max(0, f.invuln - dt);
  }

  // movement
  const {mx,my} = getMove();
  moveFighter(player, mx, my, dt, rects);
  updateBot(dt, rects);

  // shooting
  shoot(player, bot, now);
  shoot(bot, player, now);

  // bullets
  for(let i=bullets.length-1;i>=0;i--){
    const b = bullets[i];
    b.x += b.vx*dt;
    b.y += b.vy*dt;
    b.life -= dt;

    // obstacle hit: remove bullet
    let hitWall = false;
    for(const r of rects){
      if(b.x>=r.x && b.x<=r.x+r.w && b.y>=r.y && b.y<=r.y+r.h){
        hitWall = true; break;
      }
    }
    if(hitWall) b.life = -1;

    // hit fighter
    const target = (b.owner === player) ? bot : player;
    if(dist(b.x,b.y,target.x,target.y) < b.r + target.r){
      damage(target, b.dmg);
      b.life = -1;
    }

    // bounds / life
    if(b.x < -30 || b.x > innerWidth+30 || b.y < -30 || b.y > innerHeight+30) b.life = -1;
    if(b.life <= 0) bullets.splice(i,1);
  }

  // scoring
  applyControlPoint(dt);

  // sudden death ring damage (shrinking)
  if(sudden.active){
    const t = 1 - (sudden.left / sudden.total);
    const cx = innerWidth/2, cy = innerHeight/2;
    const maxR = Math.min(innerWidth, innerHeight) * 0.46;
    const minR = 120;
    const r = lerp(maxR, minR, t);
    for(const f of [player, bot]){
      if(dist(f.x,f.y,cx,cy) > r){
        damage(f, 14*dt);
      }
    }
  }

  // end if dead
  if(player.hp <= 0 || bot.hp <= 0){
    endRound();
    return;
  }

  // UI
  UI.hp.textContent = Math.max(0, Math.ceil(player.hp));
  UI.aihp.textContent = Math.max(0, Math.ceil(bot.hp));
  UI.time.textContent = Math.max(0, Math.ceil(state.timeLeft));
  UI.pScore.textContent = Math.floor(player.score);
  UI.aScore.textContent = Math.floor(bot.score);
}

// --- Draw
function draw(){
  // background
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0,0,innerWidth,innerHeight);

  const rects = obstacleRects();

  // obstacles
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.strokeStyle = "rgba(255,255,255,.14)";
  ctx.lineWidth = 2;
  for(const r of rects){
    roundRect(r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.stroke();
  }

  // control point
  ctx.beginPath();
  ctx.arc(cpX(), cpY(), controlPoint.r, 0, Math.PI*2);
  ctx.fillStyle = "rgba(122,167,255,.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(122,167,255,.25)";
  ctx.stroke();

  // sudden death ring
  if(sudden.active){
    const t = 1 - (sudden.left / sudden.total);
    const cx = innerWidth/2, cy = innerHeight/2;
    const maxR = Math.min(innerWidth, innerHeight) * 0.46;
    const minR = 120;
    const r = lerp(maxR, minR, t);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(255,107,107,.35)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // bullets
  for(const b of bullets){
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fillStyle = "rgba(233,238,252,.9)";
    ctx.fill();
  }

  // fighters
  drawFighter(player, "#54d38a");
  drawFighter(bot, "#ff6b6b");

  // joystick hint
  if(joy.active){
    ctx.beginPath();
    ctx.arc(joy.baseX, joy.baseY, 28, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(233,238,252,.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(joy.baseX + joy.dx*55, joy.baseY + joy.dy*55, 12, 0, Math.PI*2);
    ctx.fillStyle = "rgba(233,238,252,.25)";
    ctx.fill();
  }
}

function drawFighter(f, color){
  // body
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
  ctx.fillStyle = color;
  ctx.fill();

  // shield outline
  if(f.shield > 0){
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r+6, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(122,167,255,.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // invuln flash
  if(f.invuln > 0){
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r+2, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // tiny hp bar
  const w = 42, h = 6;
  const x = f.x - w/2;
  const y = f.y - f.r - 18;
  ctx.fillStyle = "rgba(0,0,0,.35)";
  roundRect(x, y, w, h, 4); ctx.fill();
  const pct = clamp(f.hp/f.hpMax, 0, 1);
  ctx.fillStyle = "rgba(233,238,252,.85)";
  roundRect(x, y, w*pct, h, 4); ctx.fill();
}

function roundRect(x,y,w,h,r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y, x+w, y+h, rr);
  ctx.arcTo(x+w,y+h, x, y+h, rr);
  ctx.arcTo(x,y+h, x, y, rr);
  ctx.arcTo(x,y, x+w, y, rr);
  ctx.closePath();
}

// Start
showToast("Move (left side). Buttons on right.");
