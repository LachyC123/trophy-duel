
// Trophy Duel – Shooting Build (A)

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d",{alpha:false});

function resize(){
  const dpr = Math.min(2, devicePixelRatio||1);
  canvas.width = innerWidth*dpr;
  canvas.height = innerHeight*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
resize();
addEventListener("resize", resize);

document.addEventListener("touchmove", e=>e.preventDefault(), {passive:false});

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1);

const world={w:2200,h:1400};
const player={x:300,y:700,r:16,hp:100,hit:0,kvx:0,kvy:0};
const ai={x:1900,y:700,r:16,hp:100,hit:0,kvx:0,kvy:0};
const cam={x:0,y:0};

const joy={active:false,baseX:0,baseY:0,dx:0,dy:0,max:60};

canvas.addEventListener("touchstart",e=>{
  const t=e.touches[0];
  joy.active=true;
  joy.baseX=t.clientX;
  joy.baseY=t.clientY;
},{passive:false});

canvas.addEventListener("touchmove",e=>{
  if(!joy.active) return;
  const t=e.touches[0];
  const dx=t.clientX-joy.baseX;
  const dy=t.clientY-joy.baseY;
  const m=Math.hypot(dx,dy)||1;
  const k=Math.min(1,m/joy.max);
  joy.dx=(dx/m)*k;
  joy.dy=(dy/m)*k;
},{passive:false});

canvas.addEventListener("touchend",()=>{joy.active=false;joy.dx=joy.dy=0;},{passive:false});

const PLAYER_SPEED=200;
const AI_SPEED=150;

const bullets=[];
const BULLET_SPEED=650;
const FIRE_RATE=0.2;
let pFire=0,aFire=0;

function updateCam(dt){
  const tx=clamp(player.x-innerWidth/2,0,world.w-innerWidth);
  const ty=clamp(player.y-innerHeight/2,0,world.h-innerHeight);
  cam.x+= (tx-cam.x)*10*dt;
  cam.y+= (ty-cam.y)*10*dt;
}
const sx=x=>x-cam.x;
const sy=y=>y-cam.y;

function shoot(from,to){
  const dx=to.x-from.x, dy=to.y-from.y;
  const d=Math.hypot(dx,dy)||1;
  bullets.push({x:from.x,y:from.y,vx:(dx/d)*BULLET_SPEED,vy:(dy/d)*BULLET_SPEED,life:1,owner:from});
}

function update(){
  const dt=1/60;

  player.x+=joy.dx*PLAYER_SPEED*dt;
  player.y+=joy.dy*PLAYER_SPEED*dt;
  player.x=clamp(player.x,player.r,world.w-player.r);
  player.y=clamp(player.y,player.r,world.h-player.r);

  const dx=player.x-ai.x, dy=player.y-ai.y;
  const d=Math.hypot(dx,dy)||1;
  ai.x+=dx/d*AI_SPEED*dt;
  ai.y+=dy/d*AI_SPEED*dt;

  pFire-=dt; aFire-=dt;
  if(pFire<=0){ shoot(player,ai); pFire=FIRE_RATE; }
  if(aFire<=0){ shoot(ai,player); aFire=FIRE_RATE*1.1; }

  bullets.forEach(b=>{
    b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt;
    const t=b.owner===player?ai:player;
    if(dist(b.x,b.y,t.x,t.y)<t.r+4){
      t.hp-=6;
      b.life=0;
    }
  });
  for(let i=bullets.length-1;i>=0;i--) if(bullets[i].life<=0) bullets.splice(i,1);

  updateCam(dt);
}

function draw(){
  ctx.fillStyle="#0b1020";
  ctx.fillRect(0,0,innerWidth,innerHeight);

  bullets.forEach(b=>{
    ctx.fillStyle="#fff";
    ctx.beginPath();
    ctx.arc(sx(b.x),sy(b.y),4,0,Math.PI*2);
    ctx.fill();
  });

  ctx.fillStyle="#54d38a";
  ctx.beginPath();
  ctx.arc(sx(player.x),sy(player.y),player.r,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle="#ff6b6b";
  ctx.beginPath();
  ctx.arc(sx(ai.x),sy(ai.y),ai.r,0,Math.PI*2);
  ctx.fill();

  if(joy.active){
    ctx.strokeStyle="rgba(255,255,255,.3)";
    ctx.beginPath();
    ctx.arc(joy.baseX,joy.baseY,30,0,Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(joy.baseX+joy.dx*joy.max,joy.baseY+joy.dy*joy.max,12,0,Math.PI*2);
    ctx.fill();
  }
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
