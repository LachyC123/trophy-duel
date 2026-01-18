
const c = document.getElementById("game");
const ctx = c.getContext("2d",{alpha:false});

function resize(){
  const dpr = Math.min(2, devicePixelRatio||1);
  c.width = innerWidth*dpr;
  c.height = innerHeight*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
resize();
addEventListener("resize",resize);

// stop iOS scroll
document.addEventListener("touchmove",e=>e.preventDefault(),{passive:false});

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

const world={w:2200,h:1400};
const player={x:300,y:700,r:16};
const ai={x:1900,y:700,r:16};
const cam={x:0,y:0};
const point={x:world.w/2,y:world.h/2,r:80};

const obs=[
 {x:600,y:300,w:260,h:180},
 {x:1300,y:360,w:260,h:180},
 {x:800,y:820,w:260,h:180},
 {x:1200,y:820,w:260,h:180}
];

// --- JOYSTICK ---
const joy={
  active:false,
  baseX:0, baseY:0,
  dx:0, dy:0,
  max:60
};

c.addEventListener("touchstart",e=>{
  const t=e.touches[0];
  joy.active=true;
  joy.baseX=t.clientX;
  joy.baseY=t.clientY;
  joy.dx=0; joy.dy=0;
},{passive:false});

c.addEventListener("touchmove",e=>{
  if(!joy.active) return;
  const t=e.touches[0];
  const dx=t.clientX-joy.baseX;
  const dy=t.clientY-joy.baseY;
  const m=Math.hypot(dx,dy)||1;
  const k=Math.min(1,m/joy.max);
  joy.dx=(dx/m)*k;
  joy.dy=(dy/m)*k;
},{passive:false});

c.addEventListener("touchend",()=>{
  joy.active=false;
  joy.dx=joy.dy=0;
},{passive:false});

function updatePlayer(){
  const speed=1.2;          // was 5
  player.x+=joy.dx*speed*1.5; // was *8
  player.y+=joy.dy*speed*1.5; // was *8;
  player.x=clamp(player.x,player.r,world.w-player.r);
  player.y=clamp(player.y,player.r,world.h-player.r);
}

// camera
function updateCam(){
  cam.x=clamp(player.x-innerWidth/2,0,world.w-innerWidth);
  cam.y=clamp(player.y-innerHeight/2,0,world.h-innerHeight);
}
const sx=x=>x-cam.x;
const sy=y=>y-cam.y;

// AI follow
function updateAI(){
  const dx=player.x-ai.x, dy=player.y-ai.y;
  const d=Math.hypot(dx,dy)||1;
  ai.x+=dx/d*1.4;
  ai.y+=dy/d*1.4;
}

// grid
function drawGrid(){
  const s=100;
  ctx.strokeStyle="rgba(255,255,255,.05)";
  for(let x=Math.floor(cam.x/s)*s;x<cam.x+innerWidth;x+=s){
    ctx.beginPath();ctx.moveTo(sx(x),0);ctx.lineTo(sx(x),innerHeight);ctx.stroke();
  }
  for(let y=Math.floor(cam.y/s)*s;y<cam.y+innerHeight;y+=s){
    ctx.beginPath();ctx.moveTo(0,sy(y));ctx.lineTo(innerWidth,sy(y));ctx.stroke();
  }
}

// minimap
function drawMini(){
  const mw=160,mh=96,p=12;
  const x0=innerWidth-mw-p,y0=p;
  ctx.fillStyle="rgba(0,0,0,.35)";
  ctx.fillRect(x0,y0,mw,mh);
  ctx.strokeStyle="rgba(255,255,255,.2)";
  ctx.strokeRect(x0,y0,mw,mh);

  ctx.fillStyle="rgba(255,255,255,.2)";
  obs.forEach(o=>ctx.fillRect(
    x0+(o.x/world.w)*mw,
    y0+(o.y/world.h)*mh,
    (o.w/world.w)*mw,
    (o.h/world.h)*mh
  ));

  ctx.strokeStyle="rgba(122,167,255,.6)";
  ctx.strokeRect(
    x0+(cam.x/world.w)*mw,
    y0+(cam.y/world.h)*mh,
    (innerWidth/world.w)*mw,
    (innerHeight/world.h)*mh
  );

  ctx.fillStyle="#54d38a";
  ctx.beginPath();
  ctx.arc(x0+(player.x/world.w)*mw,y0+(player.y/world.h)*mh,4,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#ff6b6b";
  ctx.beginPath();
  ctx.arc(x0+(ai.x/world.w)*mw,y0+(ai.y/world.h)*mh,4,0,Math.PI*2);
  ctx.fill();
}

function drawJoystick(){
  if(!joy.active) return;
  ctx.beginPath();
  ctx.arc(joy.baseX,joy.baseY,30,0,Math.PI*2);
  ctx.strokeStyle="rgba(233,238,252,.35)";
  ctx.lineWidth=2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(joy.baseX+joy.dx*joy.max,joy.baseY+joy.dy*joy.max,14,0,Math.PI*2);
  ctx.fillStyle="rgba(233,238,252,.35)";
  ctx.fill();
}

function loop(){
  updatePlayer();
  updateAI();
  updateCam();

  ctx.fillStyle="#0b1020";
  ctx.fillRect(0,0,innerWidth,innerHeight);

  drawGrid();

  ctx.strokeStyle="rgba(255,255,255,.15)";
  ctx.strokeRect(sx(0),sy(0),world.w,world.h);

  ctx.fillStyle="rgba(255,255,255,.1)";
  obs.forEach(o=>ctx.fillRect(sx(o.x),sy(o.y),o.w,o.h));

  ctx.beginPath();
  ctx.arc(sx(point.x),sy(point.y),point.r,0,Math.PI*2);
  ctx.strokeStyle="rgba(122,167,255,.5)";
  ctx.lineWidth=3;
  ctx.stroke();

  ctx.fillStyle="#54d38a";
  ctx.beginPath();ctx.arc(sx(player.x),sy(player.y),player.r,0,Math.PI*2);ctx.fill();

  ctx.fillStyle="#ff6b6b";
  ctx.beginPath();ctx.arc(sx(ai.x),sy(ai.y),ai.r,0,Math.PI*2);ctx.fill();

  drawMini();
  drawJoystick();

  requestAnimationFrame(loop);
}
loop();
