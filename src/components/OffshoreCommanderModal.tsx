import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";

const W = 760, H = 480;
const rigs = [{x:135,y:350,n:"Ekofisk"},{x:270,y:270,n:"Valhall"},{x:455,y:170,n:"Ula"},{x:620,y:95,n:"Johan Sverdrup"}];
type Contact = {x:number;y:number;vx:number;vy:number;active:boolean};
export function OffshoreCommanderModal({onClose}:{onClose:()=>void}) {
 const canvas=useRef<HTMLCanvasElement>(null);
 const keys=useRef(new Set<string>());
 const pointer=useRef<{x:number;y:number}|null>(null);
 const state=useRef({x:100,y:390,angle:0,score:0,health:100,elapsed:0,sonar:0,contacts:[] as Contact[],running:false});
 const [hud,setHud]=useState({score:0,health:100,running:false});
 const [muted,setMuted]=useState(false);
 const reset=()=>{state.current={x:100,y:390,angle:0,score:0,health:100,elapsed:0,sonar:0,contacts:[],running:true};setHud({score:0,health:100,running:true});};
 const ping=()=>{if(state.current.sonar<=0)state.current.sonar=1;};
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();keys.current.add(e.key.toLowerCase());if(e.key===" ")ping();};
  const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());
  window.addEventListener("keydown",down);window.addEventListener("keyup",up);
  let frame=0,last=performance.now();
  const draw=(now:number)=>{
   const dt=Math.min((now-last)/1000,.05);last=now;
   const c=canvas.current,ctx=c?.getContext("2d");
   if(ctx){const s=state.current;
    if(s.running){s.elapsed+=dt;s.sonar=Math.max(0,s.sonar-dt*.65);
     const turn=(keys.current.has("arrowleft")||keys.current.has("a")?-1:0)+(keys.current.has("arrowright")||keys.current.has("d")?1:0);
     s.angle+=turn*dt*2.6;
     let speed=(keys.current.has("arrowup")||keys.current.has("w")?125:0)-(keys.current.has("arrowdown")||keys.current.has("s")?65:0);
     if(pointer.current){const dx=pointer.current.x-s.x,dy=pointer.current.y-s.y;s.angle=Math.atan2(dy,dx)+Math.PI/2;speed=Math.min(145,Math.hypot(dx,dy)*2);}
     s.x=Math.max(15,Math.min(W-15,s.x+Math.sin(s.angle)*speed*dt));s.y=Math.max(15,Math.min(H-15,s.y-Math.cos(s.angle)*speed*dt));
     if(Math.random()<dt*.45)s.contacts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*35,vy:(Math.random()-.5)*35,active:true});
     for(const enemy of s.contacts){enemy.x+=enemy.vx*dt;enemy.y+=enemy.vy*dt;
      if(Math.hypot(enemy.x-s.x,enemy.y-s.y)<22){enemy.active=false;s.health=Math.max(0,s.health-12);}
      if(s.sonar>.2&&Math.hypot(enemy.x-s.x,enemy.y-s.y)<90){enemy.active=false;s.score+=25;}
     }
     s.contacts=s.contacts.filter(e=>e.active&&e.x>0&&e.x<W&&e.y>0&&e.y<H).slice(-18);
     if(s.health===0)s.running=false;
     if(Math.floor(s.elapsed*5)%2===0)setHud({score:s.score,health:s.health,running:s.running});
    }
    ctx.fillStyle="#061c2b";ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#174458";ctx.lineWidth=1;for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.fillStyle="#163d37";ctx.beginPath();ctx.moveTo(730,0);ctx.lineTo(W,0);ctx.lineTo(W,H);ctx.lineTo(700,H);ctx.lineTo(715,350);ctx.lineTo(694,270);ctx.lineTo(720,190);ctx.lineTo(690,110);ctx.closePath();ctx.fill();
    ctx.font="13px sans-serif";for(const r of rigs){ctx.fillStyle="#42d7a4";ctx.beginPath();ctx.arc(r.x,r.y,8,0,7);ctx.fill();ctx.fillStyle="#d6f6ed";ctx.fillText(r.n,r.x+13,r.y-12);}
    for(const e of s.contacts){if(s.sonar>0&&Math.hypot(e.x-s.x,e.y-s.y)<150){ctx.fillStyle="#ff8a75";ctx.beginPath();ctx.arc(e.x,e.y,6,0,7);ctx.fill();}}
    if(s.sonar>0){ctx.strokeStyle="rgba(68,235,193,.65)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,(1-s.sonar)*160,0,7);ctx.stroke();}
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle);ctx.fillStyle="#e8f6ff";ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(11,14);ctx.lineTo(0,8);ctx.lineTo(-11,14);ctx.closePath();ctx.fill();ctx.restore();
    ctx.fillStyle="#d8f5f4";ctx.font="bold 15px sans-serif";ctx.fillText("KNM HELGE INGSTAD",15,25);
    if(!s.running){ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(0,0,W,H);ctx.fillStyle="#fff";ctx.font="bold 28px sans-serif";ctx.textAlign="center";ctx.fillText(s.health===0?"Oppdrag avsluttet":"Trykk Start oppdrag",W/2,H/2);ctx.textAlign="start";}
   }
   frame=requestAnimationFrame(draw);
  };frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);};
 },[]);
 const touch=(e:React.PointerEvent<HTMLCanvasElement>)=>{const rect=e.currentTarget.getBoundingClientRect();pointer.current={x:(e.clientX-rect.left)*W/rect.width,y:(e.clientY-rect.top)*H/rect.height};};
 return <Modal onClose={onClose}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2>⚓ Offshore Commander</h2><button className="secondary" onClick={onClose}>Lukk ✕</button></div><div style={{display:"grid",gap:12,maxWidth:850}}>
 <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10}}><strong>KNM Helge Ingstad · Nordsjøen</strong><span>Poeng: {hud.score} · Skrog: {hud.health}%</span></div>
 <canvas ref={canvas} width={W} height={H} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);touch(e);}} onPointerMove={e=>{if(e.buttons)touch(e);}} onPointerUp={()=>pointer.current=null} onPointerCancel={()=>pointer.current=null} style={{width:"100%",touchAction:"none",borderRadius:12,border:"1px solid #236071",background:"#061c2b"}} aria-label="Spillkart over norsk sokkel"/>
 <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="primary" onClick={reset}>▶ Start oppdrag</button><button className="secondary" onClick={ping}>📡 Sonar</button><button className="secondary" onClick={()=>setMuted(v=>!v)}>{muted?"🔇":"🔊"} Lyd (kommer senere)</button></div>
 <small>PC: WASD eller piltaster, mellomrom for sonar. Mobil: Dra på kartet for å styre. Sonar avslører og fjerner fiktive kontakter i nærheten. Dette er en tidlig spillprototype med stilisert kart.</small>
 </div></Modal>;
}
