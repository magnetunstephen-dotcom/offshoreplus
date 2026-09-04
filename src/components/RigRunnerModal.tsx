import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";

type GameState = "ready" | "running" | "over";
type Rig = { x: number; padY: number; scored: boolean };
type Bird = { x: number; y: number; phase: number };

const WIDTH = 720;
const HEIGHT = 400;
const SEA_Y = 350;

export function RigRunnerModal({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const gameRef = useRef({
    state: "ready" as GameState,
    y: 155,
    velocity: 0,
    score: 0,
    distance: 0,
    rigs: [{ x: 570, padY: 270, scored: false }] as Rig[],
    birds: [{ x: 390, y: 135, phase: 0 }] as Bird[],
    lastTime: 0,
  });
  const [state, setState] = useState<GameState>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("offshoreplus-rig-runner-best") || 0));

  function reset() {
    gameRef.current = {
      state: "running",
      y: 155,
      velocity: -80,
      score: 0,
      distance: 0,
      rigs: [{ x: 570, padY: 270, scored: false }],
      birds: [{ x: 390, y: 135, phase: 0 }],
      lastTime: performance.now(),
    };
    setScore(0);
    setState("running");
  }

  function lift() {
    const game = gameRef.current;
    if (game.state !== "running") { reset(); return; }
    game.velocity = Math.max(-245, game.velocity - 145);
  }

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
        event.preventDefault();
        lift();
      }
    };
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    function finish() {
      const game = gameRef.current;
      game.state = "over";
      setState("over");
      setBest(previous => {
        const next = Math.max(previous, game.score);
        localStorage.setItem("offshoreplus-rig-runner-best", String(next));
        return next;
      });
    }

    function drawHelicopter(y: number, rotation: number) {
      if (!context) return;
      context.save();
      context.translate(112, y);
      context.rotate(rotation);
      context.strokeStyle = "#eaf8f3";
      context.fillStyle = "#20c98b";
      context.lineWidth = 4;
      context.lineCap = "round";
      context.beginPath(); context.ellipse(0, 0, 27, 13, 0, 0, Math.PI * 2); context.fill(); context.stroke();
      context.beginPath(); context.moveTo(23, -1); context.lineTo(46, -9); context.lineTo(48, 1); context.lineTo(25, 6); context.fill(); context.stroke();
      context.fillStyle = "#0b2530";
      context.beginPath(); context.arc(-8, -2, 7, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.moveTo(-4, -15); context.lineTo(1, -26); context.stroke();
      context.beginPath(); context.moveTo(-27, -26); context.lineTo(28, -26); context.stroke();
      context.beginPath(); context.moveTo(-16, 13); context.lineTo(-21, 21); context.moveTo(14, 13); context.lineTo(19, 21); context.moveTo(-27, 21); context.lineTo(27, 21); context.stroke();
      context.restore();
    }

    function drawRig(rig: Rig) {
      if (!context) return;
      const x = rig.x;
      const y = rig.padY;
      context.strokeStyle = "#d7e9e5";
      context.fillStyle = "#173846";
      context.lineWidth = 5;
      context.fillRect(x, y, 155, 17);
      context.strokeRect(x, y, 155, 17);
      context.fillRect(x + 82, y - 45, 45, 45);
      context.strokeRect(x + 82, y - 45, 45, 45);
      context.beginPath(); context.moveTo(x + 20, y + 17); context.lineTo(x + 35, SEA_Y + 18); context.moveTo(x + 135, y + 17); context.lineTo(x + 120, SEA_Y + 18); context.stroke();
      context.strokeStyle = "#20c98b";
      context.lineWidth = 4;
      context.beginPath(); context.arc(x + 38, y - 2, 25, Math.PI, 0); context.stroke();
      context.font = "bold 17px sans-serif";
      context.fillStyle = "#20c98b";
      context.fillText("H", x + 31, y - 5);
      context.strokeStyle = "#d7e9e5";
      context.beginPath(); context.moveTo(x + 115, y - 45); context.lineTo(x + 132, y - 95); context.lineTo(x + 142, y - 45); context.stroke();
      context.strokeStyle = "#20c98b";
      context.beginPath(); context.moveTo(x + 132, y - 105); context.lineTo(x + 132, y - 84); context.moveTo(x + 121, y - 94); context.lineTo(x + 143, y - 94); context.stroke();
    }

    function draw() {
      if (!context) return;
      const game = gameRef.current;
      const gradient = context.createLinearGradient(0, 0, 0, HEIGHT);
      gradient.addColorStop(0, "#071723");
      gradient.addColorStop(1, "#14516a");
      context.fillStyle = gradient;
      context.fillRect(0, 0, WIDTH, HEIGHT);
      context.fillStyle = "rgba(255,255,255,.07)";
      context.beginPath(); context.arc(585, 72, 45, 0, Math.PI * 2); context.fill();
      context.strokeStyle = "rgba(206,239,244,.18)";
      context.lineWidth = 2;
      for (let row = 0; row < 4; row++) {
        context.beginPath();
        for (let x = -20; x <= WIDTH + 20; x += 20) {
          const y = SEA_Y + row * 13 + Math.sin((x + game.distance * .8) / 26) * 4;
          x === -20 ? context.moveTo(x, y) : context.lineTo(x, y);
        }
        context.stroke();
      }
      context.fillStyle = "#06121d";
      context.fillRect(0, SEA_Y + 7, WIDTH, HEIGHT - SEA_Y);
      game.rigs.forEach(drawRig);
      game.birds.forEach(bird => {
        const bob = Math.sin(game.distance / 35 + bird.phase) * 8;
        context.strokeStyle = "#f4f5ee";
        context.lineWidth = 4;
        context.beginPath(); context.arc(bird.x - 7, bird.y + bob, 9, Math.PI * 1.1, Math.PI * 1.9); context.arc(bird.x + 10, bird.y + bob, 9, Math.PI * 1.1, Math.PI * 1.9); context.stroke();
      });
      drawHelicopter(game.y, Math.max(-.18, Math.min(.22, game.velocity / 650)));
      context.fillStyle = "rgba(3,18,27,.72)";
      context.fillRect(16, 15, 160, 48);
      context.fillStyle = "#eaf8f3";
      context.font = "800 20px sans-serif";
      context.fillText(`LANDINGER  ${game.score}`, 28, 46);
      if (game.state !== "running") {
        context.fillStyle = "rgba(3,13,22,.72)";
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.textAlign = "center";
        context.fillStyle = "#fff";
        context.font = "900 34px sans-serif";
        context.fillText(game.state === "ready" ? "RIG RUNNER" : "Turen er over", WIDTH / 2, 154);
        context.font = "600 18px sans-serif";
        context.fillStyle = "#b8d0d6";
        context.fillText(game.state === "ready" ? "Land rolig på helidekkene" : `Du landet på ${game.score} ${game.score === 1 ? "rigg" : "rigger"}`, WIDTH / 2, 190);
        context.fillStyle = "#20c98b";
        context.font = "800 17px sans-serif";
        context.fillText(game.state === "ready" ? "TRYKK FOR Å STARTE" : "TRYKK FOR Å PRØVE IGJEN", WIDTH / 2, 242);
        context.textAlign = "start";
      }
    }

    function loop(time: number) {
      const game = gameRef.current;
      const delta = Math.min(.034, Math.max(0, (time - (game.lastTime || time)) / 1000));
      game.lastTime = time;
      if (game.state === "running") {
        const speed = 115 + Math.min(75, game.score * 7);
        game.velocity += 420 * delta;
        game.y += game.velocity * delta;
        game.distance += speed * delta;
        game.rigs.forEach(rig => { rig.x -= speed * delta; });
        game.birds.forEach(bird => { bird.x -= speed * delta; });

        const lastRig = game.rigs[game.rigs.length - 1];
        if (lastRig.x < 390) game.rigs.push({ x: lastRig.x + 390 + Math.random() * 90, padY: 225 + Math.random() * 80, scored: false });
        game.rigs = game.rigs.filter(rig => rig.x > -180);
        if (!game.birds.length || game.birds[game.birds.length - 1].x < 470) {
          game.birds.push({ x: 760 + Math.random() * 180, y: 95 + Math.random() * 125, phase: Math.random() * 6 });
        }
        game.birds = game.birds.filter(bird => bird.x > -40);

        const heliBottom = game.y + 21;
        for (const rig of game.rigs) {
          const overlapsPad = rig.x < 140 && rig.x + 75 > 82;
          if (overlapsPad && heliBottom >= rig.padY - 5) {
            if (!rig.scored && heliBottom <= rig.padY + 11 && game.velocity < 125) {
              rig.scored = true;
              game.score += 1;
              game.velocity = -170;
              game.y = rig.padY - 25;
              setScore(game.score);
            } else if (!rig.scored) finish();
          }
        }
        const birdHit = game.birds.some(bird => Math.abs(bird.x - 112) < 30 && Math.abs((bird.y + Math.sin(game.distance / 35 + bird.phase) * 8) - game.y) < 22);
        if (birdHit || game.y < 42 || heliBottom > SEA_Y + 3) finish();
      }
      draw();
      frameRef.current = requestAnimationFrame(loop);
    }
    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, []);

  return <Modal onClose={onClose} labelledBy="rig-runner-title" className="game-modal">
    <div className="game-header">
      <div><span className="eyebrow">PAUSEMODUS</span><h2 id="rig-runner-title">Rig Runner</h2></div>
      <div className="game-score"><span>Poeng <b>{score}</b></span><span>Rekord <b>{best}</b></span></div>
      <button className="calendar-close" onClick={onClose} aria-label="Lukk">×</button>
    </div>
    <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="rig-runner-canvas" onPointerDown={lift} aria-label="Rig Runner-spill" />
    <div className="game-controls">
      <button onPointerDown={(event) => { event.preventDefault(); lift(); }}>↑ Løft helikopteret</button>
      <p>Trykk på skjermen eller bruk mellomrom. Land mykt på den grønne H-en og unngå måkene.</p>
    </div>
    {state === "over" && <button className="primary full-width" onClick={reset}>Prøv igjen</button>}
  </Modal>;
}
