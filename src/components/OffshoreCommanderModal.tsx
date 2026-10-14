import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";

const W=960,H=540;
const platforms=[
 {name:"Ekofisk",lat:56.55,lon:3.21},{name:"Valhall",lat:56.28,lon:3.39},
 {name:"Ula",lat:57.11,lon:2.84},{name:"Eldfisk",lat:56.38,lon:3.22},
 {name:"Sleipner",lat:58.37,lon:1.91},{name:"Johan Sverdrup",lat:58.84,lon:2.55},
 {name:"Troll",lat:60.64,lon:3.72},{name:"Oseberg",lat:60.49,lon:2.82},
 {name:"Gullfaks",lat:61.20,lon:2.27},{name:"Statfjord",lat:61.26,lon:1.85},
 {name:"Heidrun",lat:65.33,lon:7.33},{name:"Norne",lat:66.03,lon:8.08},
 {name:"Åsgard",lat:65.11,lon:6.79},{name:"Goliat",lat:71.30,lon:22.25},
 {name:"Johan Castberg",lat:72.49,lon:20.35}
];
// Approximate field coordinates for a geographically based arcade map; not for navigation.
const world=platforms.map(p=>({...p,x:(p.lon+1)*120,y:(72.8-p.lat)*115}));
type Vessel={x:number;y:number;vx:number;vy:number;kind:"sub"|"supply"|"lifeboat";active:boolean;revealed:number};
type Game={x:number;y:number;angle:number;score:number;health:number;elapsed:number;sonar:number;cooldown:number;running:boolean;vessels:Vessel[];trail:{x:number;y:number}[];rescued:number;shots:{x:number;y:number;vx:number;vy:number}[]};
const initial=():Game=>({x:world[0].x-70,y:world[0].y+60,angle:0,score:0,health:100,elapsed:0,sonar:0,cooldown:0,running:false,vessels:[],trail:[],rescued:0,shots:[]});
export function OffshoreCommanderModal({onClose}:{onClose:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),root=useRef<HTMLDivElement>(null);
 const game=useRef<Game>(initial()),keys=useRef(new Set<string>()),stick=useRef({x:0,y:0}),stickPointer=useRef<number|null>(null);
 const [hud,setHud]=useState({score:0,health:100,rescued:0,running:false}),[full,setFull]=useState(false),[stickPos,setStickPos]=useState({x:0,y:0});
 const [landscape,setLandscape]=useState(window.innerWidth>window.innerHeight);
 const reset=()=>{game.current=initial();game.current.running=true;setHud({score:0,health:100,rescued:0,running:true});};
 const sonar=()=>{const g=game.current;if(g.running&&g.sonar<=0){g.sonar=1;g.vessels.forEach(v=>{if(v.kind==="sub"&&Math.hypot(v.x-g.x,v.y-g.y)<270)v.revealed=4;});}};
 const shoot=()=>{const g=game.current;if(!g.running||g.cooldown>0)return;g.cooldown=.28;g.shots.push({x:g.x+Math.sin(g.angle)*24,y:g.y-Math.cos(g.angle)*24,vx:Math.sin(g.angle)*430,vy:-Math.cos(g.angle)*430});};
 const fullscreen=async()=>{try{await root.current?.requestFullscreen();setFull(true);}catch{/* browser may block fullscreen */}try{const o=screen.orientation as ScreenOrientation & {lock?:(mode:string)=>Promise<void>};await o.lock?.("landscape");}catch{/* rotate manually */}};
 const leave=async()=>{if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});setFull(false);onClose();};
 useEffect(()=>{const onResize=()=>setLandscape(innerWidth>innerHeight);window.addEventListener("resize",onResize);return()=>window.removeEventListener("resize",onResize);},[]);
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(e.key.toLowerCase()))e.preventDefault();keys.current.add(e.key.toLowerCase());if(e.key===" ")shoot();if(e.key.toLowerCase()==="e")sonar();};
  const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());
  window.addEventListener("keydown",down);window.addEventListener("keyup",up);
  let raf=0,last=performance.now(),lastHud=0;
  const frame=(now:number)=>{
   const dt=Math.min(.045,(now-last)/1000);last=now;
   const c=canvas.current,ctx=c?.getContext("2d");
   if(ctx){const g=game.current;
    if(g.running){
     g.elapsed+=dt;g.sonar=Math.max(0,g.sonar-dt*.7);g.cooldown=Math.max(0,g.cooldown-dt);
     const turn=Number(keys.current.has("arrowright")||keys.current.has("d"))-Number(keys.current.has("arrowleft")||keys.current.has("a"));
     const forward=Number(keys.current.has("arrowup")||keys.current.has("w"))-Number(keys.current.has("arrowdown")||keys.current.has("s"));
     let speed=forward*180;
     if(Math.hypot(stick.current.x,stick.current.y)>.13){g.angle=Math.atan2(stick.current.x,-stick.current.y);speed=Math.min(1,Math.hypot(stick.current.x,stick.current.y))*190;}
     else g.angle+=turn*dt*2.8;
     g.x+=Math.sin(g.angle)*speed*dt;g.y-=Math.cos(g.angle)*speed*dt;
     g.x=Math.max(20,Math.min(3100,g.x));g.y=Math.max(20,Math.min(2200,g.y));
     g.trail.unshift({x:g.x,y:g.y});if(g.trail.length>650)g.trail.pop();
     if(Math.random()<dt*.9&&g.vessels.length<24){
      const a=Math.random()*Math.PI*2,d=220+Math.random()*290;
      const kind:Vessel["kind"]=Math.random()<.38?"sub":Math.random()<.6?"supply":"lifeboat";
      g.vessels.push({x:g.x+Math.cos(a)*d,y:g.y+Math.sin(a)*d,vx:(Math.random()-.5)*35,vy:(Math.random()-.5)*35,kind,active:true,revealed:0});
     }
     for(const v of g.vessels){v.x+=v.vx*dt;v.y+=v.vy*dt;v.revealed=Math.max(0,v.revealed-dt);
      const d=Math.hypot(v.x-g.x,v.y-g.y);
      if(v.kind==="lifeboat"&&d<30){v.active=false;g.rescued++;g.score+=50;}
      if(v.kind==="supply"&&d<28){v.active=false;g.health=Math.max(0,g.health-10);g.score=Math.max(0,g.score-75);}
      if(v.kind==="sub"&&d<25){v.active=false;g.health=Math.max(0,g.health-15);}
     }
     for(const b of g.shots){b.x+=b.vx*dt;b.y+=b.vy*dt;
      for(const v of g.vessels){if(v.active&&Math.hypot(v.x-b.x,v.y-b.y)<20){
       v.active=false;b.x=-99999;g.score=Math.max(0,g.score+(v.kind==="sub"?100:v.kind==="supply"?-150:-50));break;
      }}
     }
     g.shots=g.shots.filter(b=>Math.hypot(b.x-g.x,b.y-g.y)<650);
     g.vessels=g.vessels.filter(v=>v.active&&Math.hypot(v.x-g.x,v.y-g.y)<850);
     for(const p of world){if(g.rescued&&Math.hypot(p.x-g.x,p.y-g.y)<42){g.score+=g.rescued*200;g.rescued=0;}}
     if(g.health===0)g.running=false;
     if(now-lastHud>160){setHud({score:g.score,health:g.health,rescued:g.rescued,running:g.running});lastHud=now;}
    }
    ctx.fillStyle="#06283b";ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(W/2-g.x,H/2-g.y);
    ctx.strokeStyle="#19485b";ctx.lineWidth=1;
    const left=g.x-W/2,top=g.y-H/2;
    for(let x=Math.floor(left/80)*80;x<left+W;x+=80){ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top+H);ctx.stroke();}
    for(let y=Math.floor(top/80)*80;y<top+H;y+=80){ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(left+W,y);ctx.stroke();}
    for(const p of world){if(Math.abs(p.x-g.x)>W/2+80||Math.abs(p.y-g.y)>H/2+80)continue;
     ctx.fillStyle="#e9b44a";ctx.fillRect(p.x-12,p.y-12,24,24);ctx.fillStyle="#74edb8";ctx.fillRect(p.x-7,p.y-7,14,14);
     ctx.fillStyle="#d6fff0";ctx.font="bold 14px sans-serif";ctx.fillText(p.name,p.x+20,p.y-12);
     ctx.strokeStyle="#52d9aa";ctx.beginPath();ctx.arc(p.x,p.y,43,0,Math.PI*2);ctx.stroke();
    }
    for(const v of g.vessels){if(v.kind==="sub"&&v.revealed<=0&&g.sonar<=0)continue;
     ctx.save();ctx.translate(v.x,v.y);ctx.rotate(Math.atan2(v.vy,v.vx)+Math.PI/2);
     ctx.fillStyle=v.kind==="sub"?"#f26673":v.kind==="supply"?"#70b8ff":"#ffad42";
     ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(11,10);ctx.lineTo(0,16);ctx.lineTo(-11,10);ctx.closePath();ctx.fill();
     ctx.fillStyle="#112c3a";ctx.fillRect(-4,-3,8,9);ctx.restore();
    }
    for(let i=0;i<g.rescued;i++){const t=g.trail[Math.min(g.trail.length-1,(i+1)*27)];if(!t)continue;
     ctx.strokeStyle="#f7a94c";ctx.beginPath();const prev=i?g.trail[Math.min(g.trail.length-1,i*27)]:{x:g.x,y:g.y};ctx.moveTo(prev.x,prev.y);ctx.lineTo(t.x,t.y);ctx.stroke();
     ctx.fillStyle="#ffa94c";ctx.beginPath();ctx.ellipse(t.x,t.y,9,6,0,0,Math.PI*2);ctx.fill();
    }
    for(const b of g.shots){ctx.fillStyle="#fff0a0";ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();}
    if(g.sonar>0){ctx.strokeStyle="#64f6cb";ctx.lineWidth=3;ctx.beginPath();ctx.arc(g.x,g.y,(1-g.sonar)*290,0,Math.PI*2);ctx.stroke();}
    ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.angle);ctx.fillStyle="#e7f4fa";ctx.beginPath();ctx.moveTo(0,-27);ctx.lineTo(13,18);ctx.lineTo(0,11);ctx.lineTo(-13,18);ctx.closePath();ctx.fill();ctx.fillStyle="#507e95";ctx.fillRect(-5,-3,10,13);ctx.restore();
    ctx.restore();
    if(!g.running){ctx.fillStyle="rgba(0,0,0,.58)";ctx.fillRect(0,0,W,H);ctx.textAlign="center";ctx.fillStyle="#fff";ctx.font="bold 32px sans-serif";ctx.fillText(g.health===0?"Oppdrag avsluttet":"KNM HELGE INGSTAD",W/2,H/2);ctx.font="18px sans-serif";ctx.fillText("Trykk Start for å patruljere",W/2,H/2+35);ctx.textAlign="left";}
   }
   raf=requestAnimationFrame(frame);
  };raf=requestAnimationFrame(frame);
  return()=>{cancelAnimationFrame(raf);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);};
 },[]);
 const move=(e:React.PointerEvent<HTMLDivElement>)=>{const b=e.currentTarget.getBoundingClientRect(),x=(e.clientX-b.left-b.width/2)/(b.width*.32),y=(e.clientY-b.top-b.height/2)/(b.height*.32),m=Math.max(1,Math.hypot(x,y));stick.current={x:x/m,y:y/m};setStickPos(stick.current);};
 const release=()=>{stickPointer.current=null;stick.current={x:0,y:0};setStickPos({x:0,y:0});};
 return <Modal onClose={onClose}><div ref={root} style={{background:"#061d2c",color:"#fff",borderRadius:12,padding:10,width:"100%",boxSizing:"border-box",height:full?"100dvh":undefined,display:"flex",flexDirection:"column",justifyContent:"center",gap:8}}>
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap",fontSize:13}}><strong>⚓ Helge Ingstad</strong><span>⭐ {hud.score} · ❤️ {hud.health}% · 🛟 {hud.rescued}</span><button className="secondary" onClick={leave}>✕ Lukk</button></div>
 {!landscape&&<div style={{fontSize:12,opacity:.8}}>📱 Snu telefonen til liggende format.</div>}
 <div style={{position:"relative",width:"100%",aspectRatio:"960 / 540",maxHeight:full?"calc(100dvh - 105px)":undefined,margin:"auto",overflow:"hidden",borderRadius:10}}>
 <canvas ref={canvas} width={W} height={H} style={{width:"100%",height:"100%",display:"block"}}/>
 <div onPointerDown={e=>{stickPointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);move(e);}} onPointerMove={e=>{if(stickPointer.current===e.pointerId)move(e);}} onPointerUp={release} onPointerCancel={release} style={{position:"absolute",bottom:"6%",left:"4%",width:"min(22%,115px)",aspectRatio:"1",border:"2px solid #80c4d7",borderRadius:"50%",background:"rgba(45,102,126,.6)",touchAction:"none",display:"grid",placeItems:"center"}}>
 <div style={{width:"43%",aspectRatio:"1",borderRadius:"50%",background:"#a6e3ef",transform:"translate("+stickPos.x*65+"%,"+stickPos.y*65+"%)"}}/></div>
 <button onClick={sonar} style={{position:"absolute",bottom:"7%",right:"17%",borderRadius:"50%",width:"min(13%,72px)",aspectRatio:"1",background:"#12655e",border:"2px solid #75e6ca",color:"white",fontSize:11}}>📡<br/>SONAR</button>
 <button onClick={shoot} style={{position:"absolute",bottom:"7%",right:"3%",borderRadius:"50%",width:"min(13%,72px)",aspectRatio:"1",background:"#9a3b37",border:"2px solid #ffad92",color:"white",fontSize:11}}>💥<br/>SKYT</button>
 </div>
 <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}><button className="primary" onClick={async()=>{await fullscreen();reset();}}>▶ Start / restart</button><button className="secondary" onClick={fullscreen}>⛶ Fullskjerm</button></div>
 <small style={{opacity:.75}}>🟥 Ubåt +100 · 🟦 Supply −150 ved treff · 🟧 Livbåt +50 og slep · Lever livbåter ved plattform +200 hver. PC: WASD, mellomrom for skudd, E for sonar. Omtrentlige feltposisjoner, ikke navigasjonskart.</small>
 </div></Modal>;
}
