const c = document.getElementById("game");
const ctx = c.getContext("2d");

function resize(){
  c.width = innerWidth;
  c.height = innerHeight;
}
addEventListener("resize", resize);
resize();

const ui = {
  hp: document.getElementById("hp"),
  aihp: document.getElementById("aihp"),
  time: document.getElementById("time"),
  trophies: document.getElementById("trophies"),
};

let trophies = 0;
let time = 60;

const player = {x:innerWidth*0.3,y:innerHeight/2,hp:100};
const ai = {x:innerWidth*0.7,y:innerHeight/2,hp:100};

function loop(){
  ctx.clearRect(0,0,c.width,c.height);

  // control point
  ctx.beginPath();
  ctx.arc(innerWidth/2, innerHeight/2, 60, 0, Math.PI*2);
  ctx.strokeStyle = "#7aa7ff";
  ctx.stroke();

  // player
  ctx.fillStyle = "#54d38a";
  ctx.beginPath();
  ctx.arc(player.x,player.y,14,0,Math.PI*2);
  ctx.fill();

  // ai
  ctx.fillStyle = "#ff6b6b";
  ctx.beginPath();
  ctx.arc(ai.x,ai.y,14,0,Math.PI*2);
  ctx.fill();

  requestAnimationFrame(loop);
}
loop();
