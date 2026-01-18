
const c = document.getElementById("game");
const ctx = c.getContext("2d");

function resize(){
  c.width = innerWidth;
  c.height = innerHeight;
}
resize();
addEventListener("resize", resize);

// stop iOS scroll
document.addEventListener("touchmove", e=>e.preventDefault(), {passive:false});

const world = {w:2000,h:1200};
const player = {x:300,y:600,r:15};
const cam = {x:0,y:0};

let lastX=0,lastY=0,active=false;

c.addEventListener("touchstart", e=>{
  active=true;
  lastX=e.touches[0].clientX;
  lastY=e.touches[0].clientY;
},{passive:false});

c.addEventListener("touchmove", e=>{
  if(!active) return;
  const x=e.touches[0].clientX;
  const y=e.touches[0].clientY;
  player.x += (x-lastX)*0.05;
  player.y += (y-lastY)*0.05;
  lastX=x; lastY=y;
},{passive:false});

c.addEventListener("touchend", ()=>active=false);

function loop(){
  cam.x = Math.max(0, Math.min(world.w-c.width, player.x-c.width/2));
  cam.y = Math.max(0, Math.min(world.h-c.height, player.y-c.height/2));

  ctx.fillStyle="#0b1020";
  ctx.fillRect(0,0,c.width,c.height);

  ctx.fillStyle="#54d38a";
  ctx.beginPath();
  ctx.arc(player.x-cam.x, player.y-cam.y, player.r, 0, Math.PI*2);
  ctx.fill();

  requestAnimationFrame(loop);
}
loop();
