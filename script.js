const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d");

const UI={
hp:document.getElementById("hp"),
aihp:document.getElementById("aihp"),
time:document.getElementById("time"),
trophies:document.getElementById("trophies"),
pScore:document.getElementById("pScore"),
aScore:document.getElementById("aScore"),
dash:document.getElementById("dash"),
shield:document.getElementById("shield")
};

function resize(){canvas.width=innerWidth;canvas.height=innerHeight;}
addEventListener("resize",resize);resize();

const WORLD={w:2200,h:1400};
const cam={x:0,y:0};

function updateCamera(){
cam.x=player.x-innerWidth/2;
cam.y=player.y-innerHeight/2;
cam.x=Math.max(0,Math.min(WORLD.w-innerWidth,cam.x));
cam.y=Math.max(0,Math.min(WORLD.h-innerHeight,cam.y));
}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b,c,d)=>Math.hypot(c-a,d-b);

let trophies=Number(localStorage.getItem("trophies")||0);
let timeLeft=60;

const CP={x:WORLD.w/2,y:WORLD.h/2,r:70};

function fighter(x,y,isAI){
return{x,y,vx:0,vy:0,r:14,hp:100,hpMax:100,dashCd:0,shieldCd:0,shield:0,score:0,isAI};
}

function spawn(){
return{p:{x:300,y:WORLD.h/2},a:{x:WORLD.w-300,y:WORLD.h/2}};
}

let s=spawn();
let player=fighter(s.p.x,s.p.y,false);
let ai=fighter(s.a.x,s.a.y,true);

let keys=new Set();
addEventListener("keydown",e=>keys.add(e.key));
addEventListener("keyup",e=>keys.delete(e.key));

UI.dash.onclick=()=>dash(player);
UI.shield.onclick=()=>shield(player);

function dash(f){
if(f.dashCd>0)return;
const dx=ai.x-f.x,dy=ai.y-f.y;
const m=Math.hypot(dx,dy)||1;
f.vx-=dx/m*600;f.vy-=dy/m*600;f.dashCd=2;
}
function shield(f){
if(f.shieldCd>0)return;
f.shield=1.5;f.shieldCd=6;
}

let last=performance.now();
function loop(now){
const dt=Math.min(.033,(now-last)/1000);last=now;
update(dt);draw();requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function update(dt){
timeLeft-=dt;
player.dashCd=Math.max(0,player.dashCd-dt);
ai.dashCd=Math.max(0,ai.dashCd-dt);
player.shield=Math.max(0,player.shield-dt);
ai.shield=Math.max(0,ai.shield-dt);

const pmove=inputMove();
move(player,dt,pmove);
move(ai,dt,aiMove());

if(dist(player.x,player.y,CP.x,CP.y)<CP.r)player.score+=dt;
if(dist(ai.x,ai.y,CP.x,CP.y)<CP.r)ai.score+=dt;

if(timeLeft<=0){
trophies+=player.score>ai.score?24:-18;
localStorage.setItem("trophies",trophies);
timeLeft=60;player.score=ai.score=0;
s=spawn();
player.x=s.p.x;player.y=s.p.y;
ai.x=s.a.x;ai.y=s.a.y;
}

UI.hp.textContent=Math.ceil(player.hp);
UI.aihp.textContent=Math.ceil(ai.hp);
UI.time.textContent=Math.ceil(timeLeft);
UI.trophies.textContent=trophies;
UI.pScore.textContent=Math.floor(player.score);
UI.aScore.textContent=Math.floor(ai.score);

updateCamera();
}

function inputMove(){
let mx=0,my=0;
if(keys.has("w")||keys.has("ArrowUp"))my--;
if(keys.has("s")||keys.has("ArrowDown"))my++;
if(keys.has("a")||keys.has("ArrowLeft"))mx--;
if(keys.has("d")||keys.has("ArrowRight"))mx++;
const m=Math.hypot(mx,my)||1;
return{mx:mx/m,my:my/m};
}

function aiMove(){
const dx=CP.x-ai.x,dy=CP.y-ai.y;
const m=Math.hypot(dx,dy)||1;
return{mx:dx/m,my:dy/m};
}

function move(f,dt,dir){
f.vx+=dir.mx*220*dt;f.vy+=dir.my*220*dt;
f.vx*=0.9;f.vy*=0.9;
f.x=clamp(f.x+f.vx,f.r,WORLD.w-f.r);
f.y=clamp(f.y+f.vy,f.r,WORLD.h-f.r);
}

function draw(){
ctx.clearRect(0,0,canvas.width,canvas.height);
ctx.save();ctx.translate(-cam.x,-cam.y);
ctx.fillStyle="#0b1020";ctx.fillRect(0,0,WORLD.w,WORLD.h);

ctx.beginPath();ctx.arc(CP.x,CP.y,CP.r,0,Math.PI*2);
ctx.strokeStyle="#7aa7ff";ctx.stroke();

drawF(player,"#54d38a");drawF(ai,"#ff6b6b");

ctx.restore();
}

function drawF(f,c){
ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);
ctx.fillStyle=c;ctx.fill();
}
