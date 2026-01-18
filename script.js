const c = document.getElementById("game");
const ctx = c.getContext("2d", {alpha:false});
const posEl = document.getElementById("pos");
const camEl = document.getElementById("cam");

function resize(){
  const dpr = Math.max(1, Math.min(2, devicePixelRatio || 1));
  c.width = Math.floor(innerWidth*dpr);
  c.height = Math.floor(innerHeight*dpr);
  c.style.width = innerWidth+"px";
  c.style.height = innerHeight+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize", resize);
resize();

// stop iOS scroll
document.addEventListener("touchmove", e=>e.preventDefault(), {passive:false});

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

const world = { w: 2000, h: 1200, pad: 30 };

const player = { x: 300, y: 600, r: 16, speed: 6 };
const cam = { x: 0, y: 0 };

// landmarks (so movement is obvious)
const landmarks = [
  {x:120,y:120, r:18, label:"NW"},
  {x:world.w-120,y:120, r:18, label:"NE"},
  {x:120,y:world.h-120, r:18, label:"SW"},
  {x:world.w-120,y:world.h-120, r:18, label:"SE"},
  {x:world.w/2,y:world.h/2, r:70, label:"POINT"},
];

// simple obstacles
const obs = [
  {x:700,y:260,w:240,h:160},
  {x:1150,y:520,w:220,h:200},
  {x:540,y:760,w:260,h:160},
];

function updateCam(){
  cam.x = clamp(player.x - innerWidth/2, 0, Math.max(0, world.w - innerWidth));
  cam.y = clamp(player.y - innerHeight/2, 0, Math.max(0, world.h - innerHeight));
}
function sx(x){ return x - cam.x; }
function sy(y){ return y - cam.y; }

let active=false, lastX=0,lastY=0;
c.addEventListener("touchstart", e=>{
  const t = e.touches[0];
  active=true;
  lastX=t.clientX; lastY=t.clientY;
},{passive:false});

c.addEventListener("touchmove", e=>{
  if(!active) return;
  const t = e.touches[0];
  const dx = t.clientX - lastX;
  const dy = t.clientY - lastY;
  // move opposite of finger drag to feel like a joystick/camera? keep direct for now:
  player.x += dx * 0.9;
  player.y += dy * 0.9;
  player.x = clamp(player.x, world.pad, world.w-world.pad);
  player.y = clamp(player.y, world.pad, world.h-world.pad);
  lastX=t.clientX; lastY=t.clientY;
},{passive:false});

c.addEventListener("touchend", ()=> active=false, {passive:false});
c.addEventListener("touchcancel", ()=> active=false, {passive:false});

// also allow drag with mouse
let mdown=false;
c.addEventListener("mousedown", e=>{ mdown=true; lastX=e.clientX; lastY=e.clientY; });
addEventListener("mouseup", ()=> mdown=false);
addEventListener("mousemove", e=>{
  if(!mdown) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  player.x += dx * 0.9;
  player.y += dy * 0.9;
  player.x = clamp(player.x, world.pad, world.w-world.pad);
  player.y = clamp(player.y, world.pad, world.h-world.pad);
  lastX=e.clientX; lastY=e.clientY;
});

function drawGrid(){
  const spacing = 100;
  const startX = Math.floor(cam.x/spacing)*spacing;
  const startY = Math.floor(cam.y/spacing)*spacing;

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,.06)";

  for(let x=startX; x<=cam.x+innerWidth; x+=spacing){
    ctx.beginPath();
    ctx.moveTo(sx(x), 0);
    ctx.lineTo(sx(x), innerHeight);
    ctx.stroke();
  }
  for(let y=startY; y<=cam.y+innerHeight; y+=spacing){
    ctx.beginPath();
    ctx.moveTo(0, sy(y));
    ctx.lineTo(innerWidth, sy(y));
    ctx.stroke();
  }
}

function drawMinimap(){
  const mw = 160, mh = 96;
  const pad = 12;
  const x0 = innerWidth - mw - pad;
  const y0 = pad;

  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fillRect(x0, y0, mw, mh);
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.strokeRect(x0, y0, mw, mh);

  // obstacles
  ctx.fillStyle = "rgba(255,255,255,.20)";
  for(const r of obs){
    ctx.fillRect(
      x0 + (r.x/world.w)*mw,
      y0 + (r.y/world.h)*mh,
      (r.w/world.w)*mw,
      (r.h/world.h)*mh
    );
  }

  // player
  ctx.fillStyle = "#54d38a";
  ctx.beginPath();
  ctx.arc(x0 + (player.x/world.w)*mw, y0 + (player.y/world.h)*mh, 4, 0, Math.PI*2);
  ctx.fill();

  // camera viewport box
  ctx.strokeStyle = "rgba(122,167,255,.6)";
  ctx.strokeRect(
    x0 + (cam.x/world.w)*mw,
    y0 + (cam.y/world.h)*mh,
    (innerWidth/world.w)*mw,
    (innerHeight/world.h)*mh
  );
}

function loop(){
  updateCam();

  // background
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0,0,innerWidth,innerHeight);

  drawGrid();

  // world bounds
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(sx(0), sy(0), world.w, world.h);

  // obstacles
  ctx.fillStyle = "rgba(255,255,255,.10)";
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  for(const r of obs){
    ctx.fillRect(sx(r.x), sy(r.y), r.w, r.h);
    ctx.strokeRect(sx(r.x), sy(r.y), r.w, r.h);
  }

  // control point ring
  const cp = landmarks[4];
  ctx.beginPath();
  ctx.arc(sx(cp.x), sy(cp.y), cp.r, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(122,167,255,.45)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // corner markers
  ctx.fillStyle = "rgba(233,238,252,.9)";
  ctx.font = "14px system-ui";
  for(const l of landmarks){
    if(l.label==="POINT") continue;
    ctx.beginPath();
    ctx.arc(sx(l.x), sy(l.y), l.r, 0, Math.PI*2);
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.stroke();
    ctx.fillStyle = "rgba(233,238,252,.9)";
    ctx.fillText(l.label, sx(l.x)-10, sy(l.y)+5);
  }

  // player
  ctx.beginPath();
  ctx.arc(sx(player.x), sy(player.y), player.r, 0, Math.PI*2);
  ctx.fillStyle = "#54d38a";
  ctx.fill();

  // HUD numbers
  posEl.textContent = `${Math.round(player.x)},${Math.round(player.y)}`;
  camEl.textContent = `${Math.round(cam.x)},${Math.round(cam.y)}`;

  drawMinimap();

  requestAnimationFrame(loop);
}
loop();
