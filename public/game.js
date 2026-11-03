import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8db5d0);
scene.fog = new THREE.Fog(0x8db5d0, 18, 48);
const camera = new THREE.PerspectiveCamera(43, innerWidth/innerHeight, .1, 100);
camera.position.set(0, 7.5, 13);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("app").prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xd9efff,0x4a3a35,2));
const sun = new THREE.DirectionalLight(0xffffff,2.3); sun.position.set(-5,12,7); sun.castShadow=true; scene.add(sun);
const mat=(c,rough=.8)=>new THREE.MeshStandardMaterial({color:c,roughness:rough});
const floor = new THREE.Mesh(new THREE.CylinderGeometry(8.8,8.8,.5,64),mat(0x596b68)); floor.position.y=-.35; floor.receiveShadow=true; scene.add(floor);
const ring = new THREE.Mesh(new THREE.TorusGeometry(7.4,.09,8,80),mat(0xf4bd65)); ring.rotation.x=Math.PI/2; ring.position.y=-.06; scene.add(ring);
for(let i=0;i<12;i++){let a=i*Math.PI/6;let post=new THREE.Mesh(new THREE.BoxGeometry(.18,2.3,.18),mat(0x354d60));post.position.set(Math.cos(a)*8.2,1,Math.sin(a)*8.2);post.castShadow=true;scene.add(post);}
const platform = new THREE.Mesh(new THREE.BoxGeometry(5,.25,.55),mat(0x334d5a));platform.position.set(0,.35,-7);scene.add(platform);
function textSprite(txt,color="#fff"){const c=document.createElement("canvas");c.width=512;c.height=128;const x=c.getContext("2d");x.font="bold 54px Arial";x.textAlign="center";x.fillStyle=color;x.fillText(txt,256,80);const t=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true}));s.scale.set(4,.9,1);s.position.set(0,3.4,-7);scene.add(s);}
textSprite("SANSAD ARENA","#fff2d4");

function fighter(color, accent, x, label){
 const g=new THREE.Group();scene.add(g);
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.48,.9,5,10),mat(color));body.position.y=1.2;body.castShadow=true;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.38,16,12),mat(0xf0c5a0));head.position.y=2.12;head.castShadow=true;g.add(head);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.39,16,8,0,Math.PI*2,0,Math.PI/2),mat(0x25232a));hair.position.y=2.28;g.add(hair);
 const belt=new THREE.Mesh(new THREE.BoxGeometry(.82,.16,.65),mat(accent));belt.position.y=.82;g.add(belt);
 for(const side of [-1,1]){let leg=new THREE.Mesh(new THREE.CapsuleGeometry(.17,.58,4,8),mat(0x263445));leg.position.set(side*.23,.34,0);g.add(leg);let arm=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.56,4,8),mat(color));arm.position.set(side*.57,1.32,0);arm.rotation.z=side*.18;g.add(arm);}
 g.position.set(x,0,0);g.userData={hp:100,attack:0,cool:0,guard:false,stun:0,label};return g;
}
let player, enemy, mode="menu", online=false, socket=null, mySlot=1, peerState=null, lastNet=0, room="";
const $=id=>document.getElementById(id);
function setMode(m){mode=m;$("menu").classList.toggle("hidden",m!=="menu");$("hud").classList.toggle("hidden",m==="menu");}
function resetGame(kind){scene.children.filter(o=>o.userData?.fighter).forEach(o=>scene.remove(o));player=fighter(0x2d8bba,0xf6bd60,-2,"PLAYER");enemy=fighter(0xb84f65,0xe9d8a6,2,kind==="cpu"?"CPU":"RIVAL");player.userData.fighter=enemy.userData.fighter=true;player.rotation.y=.35;enemy.rotation.y=Math.PI-.35;player.userData.hp=enemy.userData.hp=100;online=kind==="online";$("pName").textContent="PLAYER";$("eName").textContent=kind==="cpu"?"CPU":"RIVAL";$("message").textContent="READY";setMode("game");}
function connect(code,host){const proto=location.protocol==="https:"?"wss":"ws";socket=new WebSocket(`${proto}://${location.host}`);$("roomInfo").textContent="Connecting…";socket.onopen=()=>socket.send(JSON.stringify({type:"join",code}));socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==="joined"){mySlot=m.player;room=m.code;$("roomInfo").textContent=`Room ${room} · Waiting for opponent`; $("connection").textContent="CONNECTED";if(host)$("roomCode").value=room;}if(m.type==="peer")$("roomInfo").textContent=`Room ${room} · Players ${m.count}/2`;if(m.type==="ready"){resetGame("online");$("message").textContent="FIGHT!";}if(m.type==="state"&&m.state)peerState=m.state;if(m.type==="action"&&m.action)applyRemote(m.action);if(m.type==="error")$("roomInfo").textContent=m.message;};socket.onclose=()=>{$("connection").textContent="DISCONNECTED";};}
$("cpuBtn").onclick=()=>resetGame("cpu");
$("hostBtn").onclick=()=>{const code=Math.random().toString(36).slice(2,8).toUpperCase();connect(code,true);};
$("joinBtn").onclick=()=>{const c=$("roomCode").value.trim();if(c.length<4){$("roomInfo").textContent="Enter a valid room code";return;}connect(c,false);};
$("backBtn").onclick=()=>{if(socket){socket.close();socket=null;}setMode("menu");};
const keys={};addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if([" ","ArrowUp","ArrowDown"].includes(e.key))e.preventDefault();if(e.key.toLowerCase()==="j")act("strike");if(e.key.toLowerCase()==="k")act("guard",true);if(e.key.toLowerCase()==="l")act("dash");});
addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false;if(e.key.toLowerCase()==="k")act("guard",false);});
document.querySelectorAll("[data-key]").forEach(b=>{const k=b.dataset.key;b.onpointerdown=e=>{e.preventDefault();keys[k]=true;};b.onpointerup=b.onpointerleave=()=>keys[k]=false;});
document.querySelectorAll("[data-act]").forEach(b=>{const a=b.dataset.act;b.onpointerdown=e=>{e.preventDefault();act(a,a==="guard");};b.onpointerup=()=>{if(a==="guard")act("guard",false);};});
function act(a,v){if(mode!=="game"||!player)return;if(a==="guard"){player.userData.guard=!!v;return;}if(a==="strike"&&player.userData.cool<=0){player.userData.attack=.25;player.userData.cool=.55;}if(a==="dash"){player.position.x+=player.position.x<enemy.position.x?.65:-.65;}if(online&&socket?.readyState===1)socket.send(JSON.stringify({type:"action",action:{a,v}}));}
function applyRemote(a){if(!enemy)return;if(a.a==="strike"&&enemy.userData.cool<=0){enemy.userData.attack=.25;enemy.userData.cool=.6;}if(a.a==="guard")enemy.userData.guard=!!a.v;if(a.a==="dash")enemy.position.x+=enemy.position.x<player.position.x?.6:-.6;}
let prev=performance.now(),aiTimer=0;
function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-prev)/1000,.04);prev=now;
 if(mode==="game"&&player&&enemy){
  const speed=3.4*dt;
  if(keys.a||keys.arrowleft)player.position.x-=speed;if(keys.d||keys.arrowright)player.position.x+=speed;
  if(keys.w||keys.arrowup)player.position.z-=speed;if(keys.s||keys.arrowdown)player.position.z+=speed;
  player.position.x=THREE.MathUtils.clamp(player.position.x,-6.5,6.5);player.position.z=THREE.MathUtils.clamp(player.position.z,-4.5,4.5);
  if(!online){aiTimer-=dt;if(aiTimer<=0){aiTimer=.7+Math.random()*.7;const dist=enemy.position.distanceTo(player.position);if(dist<2.4&&Math.random()>.25){enemy.userData.attack=.22;enemy.userData.cool=.8;}else enemy.position.x+=Math.sign(player.position.x-enemy.position.x)*.45;}}
  [player,enemy].forEach(f=>{f.userData.cool=Math.max(0,f.userData.cool-dt);f.userData.attack=Math.max(0,f.userData.attack-dt);f.userData.stun=Math.max(0,f.userData.stun-dt);});
  const dist=player.position.distanceTo(enemy.position);
  if(player.userData.attack>0&&dist<2.15&&!player.userData.didHit){enemy.userData.hp=Math.max(0,enemy.userData.hp-(enemy.userData.guard?3:10));player.userData.didHit=true;}
  if(player.userData.attack===0)player.userData.didHit=false;
  if(enemy.userData.attack>0&&dist<2.15&&!enemy.userData.didHit){player.userData.hp=Math.max(0,player.userData.hp-(player.userData.guard?2:8));enemy.userData.didHit=true;}
  if(enemy.userData.attack===0)enemy.userData.didHit=false;
  $("pHealth").style.width=player.userData.hp+"%";$("eHealth").style.width=enemy.userData.hp+"%";
  if(player.userData.hp<=0||enemy.userData.hp<=0)$("message").textContent=player.userData.hp<=0?"ROUND LOST":"YOU WIN!";
  player.lookAt(enemy.position.x,player.position.y,enemy.position.z);enemy.lookAt(player.position.x,enemy.position.y,player.position.z);
  if(online&&socket?.readyState===1&&now-lastNet>80){lastNet=now;socket.send(JSON.stringify({type:"state",state:{x:player.position.x,z:player.position.z,hp:player.userData.hp}}));}
  if(online&&peerState){enemy.position.x=THREE.MathUtils.lerp(enemy.position.x,peerState.x,.18);enemy.position.z=THREE.MathUtils.lerp(enemy.position.z,peerState.z,.18);enemy.userData.hp=peerState.hp;}
 }
 camera.lookAt(0,1,0);renderer.render(scene,camera);
}
requestAnimationFrame(tick);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
