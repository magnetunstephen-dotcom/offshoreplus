import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Modal } from "./Modal";
import { supabase, supabaseConfigured } from "../lib/supabase";

type GameState = "ready" | "running" | "over";
type PlatformKind = "jacket" | "concrete" | "semi" | "fpso" | "circular";
type Rig = { x: number; padY: number; scored: boolean; name: string; size: number; kind: PlatformKind; flare: boolean };
type Drone = { x: number; y: number; phase: number };
type LeaderboardEntry = { user_id: string; display_name: string; score: number };

const WIDTH = 720;
const HEIGHT = 400;
const SEA_Y = 350;
const PLATFORM_NAMES = ["Ula", "Statfjord", "Skarv", "Troll", "Oseberg", "Gullfaks", "Ekofisk", "Valhall", "Snorre", "Heidrun", "Åsgard", "Johan Sverdrup", "Goliat", "Johan Castberg"];
const PLATFORM_PROFILES: Record<string, { kind: PlatformKind; flare: boolean }> = {
  Ula: { kind: "jacket", flare: false }, Statfjord: { kind: "concrete", flare: true }, Skarv: { kind: "fpso", flare: true },
  Troll: { kind: "concrete", flare: false }, Oseberg: { kind: "jacket", flare: false }, Gullfaks: { kind: "concrete", flare: false },
  Ekofisk: { kind: "jacket", flare: true }, Valhall: { kind: "jacket", flare: false }, Snorre: { kind: "semi", flare: false },
  Heidrun: { kind: "semi", flare: false }, Åsgard: { kind: "semi", flare: true }, "Johan Sverdrup": { kind: "jacket", flare: false },
  Goliat: { kind: "circular", flare: false }, "Johan Castberg": { kind: "fpso", flare: false },
};

function createRig(x: number, index: number): Rig {
  const name = PLATFORM_NAMES[index % PLATFORM_NAMES.length];
  const profile = PLATFORM_PROFILES[name];
  return {
    x,
    padY: 225 + Math.random() * 78,
    scored: false,
    name,
    size: name === "Goliat" ? 1.08 : name === "Johan Castberg" ? 1.18 : .78 + Math.random() * .42,
    ...profile,
  };
}

function createStartingCourse() {
  const startIndex = Math.floor(Math.random() * PLATFORM_NAMES.length);
  const name = PLATFORM_NAMES[startIndex];
  return {
    rigs: [{ x: 570, padY: 270, scored: false, name, size: name === "Goliat" ? 1.08 : name === "Johan Castberg" ? 1.18 : 1, ...PLATFORM_PROFILES[name] }] as Rig[],
    nextRigIndex: startIndex + 1,
    drones: [{ x: 470, y: 105 + Math.random() * 95, phase: Math.random() * 6 }] as Drone[],
  };
}

export function RigRunnerModal({ onClose, user, onLogin }: { onClose: () => void; user: User | null; onLogin: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const gameRunRef = useRef<string | null>(null);
  const userRef = useRef(user);
  const initialCourseRef = useRef(createStartingCourse());
  const gameRef = useRef({
    state: "ready" as GameState,
    y: 155,
    velocity: 0,
    score: 0,
    distance: 0,
    ...initialCourseRef.current,
    lastTime: 0,
  });
  const [state, setState] = useState<GameState>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("offshoreplus-rig-runner-best") || 0));
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nickname, setNickname] = useState(() => localStorage.getItem("offshoreplus-game-name") || "");
  const [nicknameDraft, setNicknameDraft] = useState(() => localStorage.getItem("offshoreplus-game-name") || "");
  const [nameMessage, setNameMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const nicknameRef = useRef(nickname);
  userRef.current = user;
  nicknameRef.current = nickname;

  async function loadLeaderboard() {
    if (!supabaseConfigured) return;
    const { data } = await supabase.from("game_scores").select("user_id,display_name,score").order("score", { ascending: false }).order("updated_at", { ascending: true }).limit(10);
    if (data) setLeaderboard(data as LeaderboardEntry[]);
  }

  useEffect(() => { loadLeaderboard(); }, []);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  async function saveNickname(event: FormEvent) {
    event.preventDefault();
    const clean = nicknameDraft.trim().replace(/\s+/g, " ");
    if (clean.length < 3 || clean.length > 20) { setNameMessage("Bruk mellom 3 og 20 tegn."); return; }
    setNickname(clean);
    localStorage.setItem("offshoreplus-game-name", clean);
    setNameMessage("Spillnavnet er lagret.");
    if (user) {
      const { error } = await supabase.rpc("set_rig_runner_name", { new_name: clean });
      if (error) { setNameMessage("Kunne ikke lagre spillnavnet akkurat nå."); return; }
      loadLeaderboard();
    }
  }

  async function submitScore(nextScore: number) {
    const currentUser = userRef.current;
    const currentName = nicknameRef.current.trim();
    const runId = gameRunRef.current;
    gameRunRef.current = null;
    if (!currentUser || !runId || currentName.length < 3 || !supabaseConfigured) return;
    await supabase.rpc("finish_rig_runner_run", { p_run_id: runId, p_final_score: nextScore });
    loadLeaderboard();
  }

  async function startVerifiedRun() {
    gameRunRef.current = null;
    if (!userRef.current || nicknameRef.current.trim().length < 3 || !supabaseConfigured) return;
    const { data } = await supabase.rpc("start_rig_runner_run");
    if (typeof data === "string") gameRunRef.current = data;
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) await gameAreaRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  }

  function reset() {
    startVerifiedRun();
    const startingCourse = createStartingCourse();
    gameRef.current = {
      state: "running",
      y: 155,
      velocity: -80,
      score: 0,
      distance: 0,
      ...startingCourse,
      lastTime: performance.now(),
    };
    setScore(0);
    setState("running");
  }

  function lift() {
    const game = gameRef.current;
    if (game.state !== "running") { reset(); return; }
    game.velocity = Math.max(-220, game.velocity - 125);
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
      submitScore(game.score);
    }

    function drawHelicopter(y: number, rotation: number, rotorPhase: number) {
      if (!context) return;
      context.save();
      context.translate(112, y);
      context.rotate(rotation);
      context.scale(-1, 1);
      context.strokeStyle = "#f7c948";
      context.fillStyle = "#ffcc33";
      context.lineWidth = 3;
      context.lineCap = "round";
      context.beginPath(); context.ellipse(0, 0, 29, 14, 0, 0, Math.PI * 2); context.fill(); context.stroke();
      context.fillStyle = "#12304a";
      context.beginPath(); context.ellipse(1, -5, 27, 8, 0, Math.PI, Math.PI * 2); context.fill();
      context.fillStyle = "#f47b20";
      context.beginPath(); context.moveTo(-24, 6); context.lineTo(22, 1); context.lineTo(17, 8); context.lineTo(-16, 12); context.closePath(); context.fill();
      context.fillStyle = "#ffcc33";
      context.beginPath(); context.moveTo(23, -2); context.lineTo(51, -10); context.lineTo(53, 1); context.lineTo(25, 7); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#12304a";
      context.beginPath(); context.moveTo(29, -4); context.lineTo(50, -10); context.lineTo(50, -5); context.lineTo(29, 1); context.closePath(); context.fill();
      context.fillStyle = "#102d3d";
      context.beginPath(); context.arc(-10, -3, 7, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#8bd3e6";
      context.beginPath(); context.arc(-10, -3, 4, 0, Math.PI * 2); context.fill();
      context.strokeStyle = "#f7c948";
      context.beginPath(); context.moveTo(-3, -15); context.lineTo(1, -25); context.stroke();
      const rotorWidth = 35 + Math.abs(Math.sin(rotorPhase)) * 22;
      context.strokeStyle = "rgba(235,245,248,.9)";
      context.lineWidth = 3;
      context.beginPath(); context.moveTo(-rotorWidth, -26); context.lineTo(rotorWidth, -26); context.stroke();
      context.strokeStyle = "rgba(32,201,139,.35)";
      context.lineWidth = 2;
      context.beginPath(); context.moveTo(-rotorWidth * .75, -29); context.lineTo(rotorWidth * .75, -23); context.stroke();
      context.save(); context.translate(52, -5); context.rotate(rotorPhase * 2.4);
      context.strokeStyle = "#f47b20"; context.lineWidth = 2;
      context.beginPath(); context.moveTo(-8, 0); context.lineTo(8, 0); context.moveTo(0, -8); context.lineTo(0, 8); context.stroke();
      context.restore();
      context.strokeStyle = "#f7c948"; context.lineWidth = 3;
      context.beginPath(); context.moveTo(-16, 13); context.lineTo(-18, 20); context.moveTo(15, 13); context.lineTo(18, 20); context.stroke();
      context.fillStyle = "#263944";
      context.beginPath(); context.arc(-18, 21, 4, 0, Math.PI * 2); context.arc(18, 21, 4, 0, Math.PI * 2); context.fill();
      context.restore();
    }

    function drawRig(rig: Rig, phase: number) {
      if (!context) return;
      const x = rig.x;
      const y = rig.padY;
      const size = rig.size;
      const width = 155 * size;
      context.strokeStyle = "#d7e9e5";
      context.fillStyle = "#173846";
      context.lineWidth = 5;
      if (rig.kind === "circular") {
        context.fillStyle = "#2b3f49";
        context.beginPath(); context.ellipse(x + width * .52, y + 25, width * .48, 27 * size, 0, 0, Math.PI * 2); context.fill(); context.stroke();
        context.fillStyle = "#f2b233"; context.fillRect(x + 35 * size, y + 5, 82 * size, 6);
        context.fillStyle = "#dce8ee"; context.fillRect(x + 72 * size, y - 48 * size, 42 * size, 55 * size); context.strokeRect(x + 72 * size, y - 48 * size, 42 * size, 55 * size);
        context.fillStyle = "#e2ebee"; context.beginPath(); context.ellipse(x + width * .52, y + 12, width * .35, 13 * size, 0, 0, Math.PI * 2); context.fill(); context.stroke();
        context.strokeStyle = "rgba(215,233,229,.42)"; context.beginPath(); context.moveTo(x + 28, y + 42); context.lineTo(x + 18, SEA_Y + 10); context.moveTo(x + width - 28, y + 42); context.lineTo(x + width - 18, SEA_Y + 10); context.stroke();
      } else if (rig.kind === "fpso") {
        context.beginPath(); context.moveTo(x - 12, y + 12); context.lineTo(x + width + 18, y + 12); context.lineTo(x + width, y + 36); context.lineTo(x + 10, y + 36); context.closePath(); context.fill(); context.stroke();
        context.fillRect(x + 72 * size, y - 36 * size, 48 * size, 48 * size); context.strokeRect(x + 72 * size, y - 36 * size, 48 * size, 48 * size);
        if (rig.name === "Johan Castberg") { context.fillStyle = "#d6473f"; context.fillRect(x + 7, y + 24, width - 3, 8); }
        context.strokeStyle = "rgba(215,233,229,.45)"; context.beginPath(); context.moveTo(x + 24, y + 37); context.lineTo(x + 12, SEA_Y + 13); context.moveTo(x + width - 18, y + 37); context.lineTo(x + width, SEA_Y + 13); context.stroke();
      } else {
        context.fillRect(x, y, width, 17); context.strokeRect(x, y, width, 17);
        context.fillRect(x + 82 * size, y - 45 * size, 45 * size, 45 * size); context.strokeRect(x + 82 * size, y - 45 * size, 45 * size, 45 * size);
        if (rig.kind === "concrete") {
          context.fillStyle = "#315364";
          context.beginPath(); context.moveTo(x + 24 * size, y + 17); context.lineTo(x + 15 * size, SEA_Y + 18); context.lineTo(x + 57 * size, SEA_Y + 18); context.lineTo(x + 48 * size, y + 17); context.closePath(); context.fill(); context.stroke();
          context.beginPath(); context.moveTo(x + 108 * size, y + 17); context.lineTo(x + 101 * size, SEA_Y + 18); context.lineTo(x + 140 * size, SEA_Y + 18); context.lineTo(x + 132 * size, y + 17); context.closePath(); context.fill(); context.stroke();
        } else if (rig.kind === "semi") {
          context.fillStyle = "#173846"; context.fillRect(x + 8, SEA_Y - 5, 58 * size, 16); context.fillRect(x + 91 * size, SEA_Y - 5, 58 * size, 16);
          context.beginPath(); context.moveTo(x + 30 * size, y + 17); context.lineTo(x + 35 * size, SEA_Y); context.moveTo(x + 118 * size, y + 17); context.lineTo(x + 120 * size, SEA_Y); context.stroke();
        } else {
          context.beginPath(); context.moveTo(x + 20 * size, y + 17); context.lineTo(x + 35 * size, SEA_Y + 18); context.moveTo(x + 135 * size, y + 17); context.lineTo(x + 120 * size, SEA_Y + 18); context.moveTo(x + 20 * size, y + 35); context.lineTo(x + 127 * size, SEA_Y - 10); context.moveTo(x + 134 * size, y + 35); context.lineTo(x + 29 * size, SEA_Y - 10); context.stroke();
        }
      }
      context.strokeStyle = "#20c98b";
      context.lineWidth = 4;
      context.beginPath(); context.arc(x + 38 * size, y - 2, 25 * size, Math.PI, 0); context.stroke();
      context.font = `bold ${Math.max(13, 17 * size)}px sans-serif`;
      context.fillStyle = "#20c98b";
      context.fillText("H", x + 31 * size, y - 5);
      context.strokeStyle = "#d7e9e5";
      context.beginPath(); context.moveTo(x + 115 * size, y - 45 * size); context.lineTo(x + 132 * size, y - 95 * size); context.lineTo(x + 142 * size, y - 45 * size); context.stroke();
      if (rig.flare) {
        const flameX = x + 205 * size, flameY = y - 104 * size;
        context.strokeStyle = "#d7e9e5"; context.lineWidth = 4;
        context.beginPath(); context.moveTo(x + 132 * size, y - 95 * size); context.lineTo(flameX, flameY + 7); context.stroke();
        context.lineWidth = 2; context.beginPath(); context.moveTo(x + 145 * size, y - 91 * size); context.lineTo(x + 158 * size, y - 78 * size); context.lineTo(x + 171 * size, y - 100 * size); context.lineTo(x + 184 * size, y - 83 * size); context.lineTo(flameX, flameY + 7); context.stroke();
        context.fillStyle = "rgba(255,148,40,.25)"; context.beginPath(); context.arc(flameX, flameY, 18 + Math.sin(phase) * 3, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#ff5d32"; context.beginPath(); context.moveTo(flameX, flameY + 10); context.quadraticCurveTo(flameX - 13, flameY - 2, flameX + Math.sin(phase * 1.7) * 8, flameY - 27); context.quadraticCurveTo(flameX + 15, flameY - 3, flameX, flameY + 10); context.fill();
        context.fillStyle = "#ffd45c"; context.beginPath(); context.moveTo(flameX, flameY + 7); context.quadraticCurveTo(flameX - 6, flameY - 2, flameX + 2, flameY - 14); context.quadraticCurveTo(flameX + 7, flameY, flameX, flameY + 7); context.fill();
      } else {
        context.strokeStyle = "#20c98b"; context.beginPath(); context.moveTo(x + 132 * size, y - 105 * size); context.lineTo(x + 132 * size, y - 84 * size); context.moveTo(x + 121 * size, y - 94 * size); context.lineTo(x + 143 * size, y - 94 * size); context.stroke();
      }
      context.fillStyle = "rgba(3,18,27,.82)";
      context.fillRect(x + 3, y + 24, Math.max(72, rig.name.length * 10), 25);
      context.fillStyle = "#eaf8f3";
      context.font = "800 14px sans-serif";
      context.fillText(rig.name, x + 11, y + 42);
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
      game.rigs.forEach(rig => drawRig(rig, game.distance / 9));
      game.drones.forEach(drone => {
        const bob = Math.sin(game.distance / 35 + drone.phase) * 7;
        const y = drone.y + bob;
        const propellerPhase = game.distance / 5 + drone.phase;
        context.strokeStyle = "#c9d3ca";
        context.fillStyle = "#4d604d";
        context.lineWidth = 3;
        context.beginPath(); context.moveTo(drone.x - 20, y - 7); context.lineTo(drone.x + 20, y + 7); context.moveTo(drone.x + 20, y - 7); context.lineTo(drone.x - 20, y + 7); context.stroke();
        context.fillRect(drone.x - 12, y - 7, 24, 14);
        context.fillStyle = "#f4f4f4"; context.fillRect(drone.x - 12, y - 5, 24, 4);
        context.fillStyle = "#2367b2"; context.fillRect(drone.x - 12, y - 1, 24, 4);
        context.fillStyle = "#d52b1e"; context.fillRect(drone.x - 12, y + 3, 24, 4);
        [[-20,-8],[20,-8],[-20,8],[20,8]].forEach(([dx,dy], index) => {
          context.save(); context.translate(drone.x + dx, y + dy); context.rotate(propellerPhase + index * .7);
          context.strokeStyle = "rgba(215,233,229,.9)"; context.lineWidth = 2;
          context.beginPath(); context.moveTo(-11, 0); context.lineTo(11, 0); context.moveTo(0, -4); context.lineTo(0, 4); context.stroke(); context.restore();
        });
        context.fillStyle = "#f05252";
        context.beginPath(); context.arc(drone.x, y + 1, 3, 0, Math.PI * 2); context.fill();
        context.fillStyle = "#ffffff"; context.font = "900 7px sans-serif"; context.textAlign = "center";
        context.fillText("RU", drone.x, y - 10);
        context.fillStyle = "#d52b1e"; context.font = "900 11px sans-serif";
        context.fillText("★", drone.x, y + 4);
        context.textAlign = "start";
      });
      drawHelicopter(game.y, Math.max(-.18, Math.min(.22, game.velocity / 650)), game.distance / 4);
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
        const speed = 122 + Math.min(85, game.score * 8);
        game.velocity += 390 * delta;
        game.y += game.velocity * delta;
        game.distance += speed * delta;
        game.rigs.forEach(rig => { rig.x -= speed * delta; });
        game.drones.forEach(drone => { drone.x -= speed * delta; });

        const lastRig = game.rigs[game.rigs.length - 1];
        if (lastRig.x < 390) {
          game.rigs.push(createRig(lastRig.x + 395 + Math.random() * 100, game.nextRigIndex));
          game.nextRigIndex += 1;
        }
        game.rigs = game.rigs.filter(rig => rig.x > -180);
        if (!game.drones.length || game.drones[game.drones.length - 1].x < 470) {
          game.drones.push({ x: 760 + Math.random() * 180, y: 95 + Math.random() * 125, phase: Math.random() * 6 });
        }
        game.drones = game.drones.filter(drone => drone.x > -40);

        // Hjulene er tegnet med nederkant 25 px under helikopterets sentrum.
        // Bruk samme punkt i fysikken, så en synlig hjulkontakt faktisk teller.
        const heliBottom = game.y + 25;
        for (const rig of game.rigs) {
          const overlapsPad = rig.x < 154 && rig.x + 88 * rig.size > 72;
          const approachingPad = overlapsPad && heliBottom > rig.padY - 40 && heliBottom < rig.padY - 3;
          if (!rig.scored && approachingPad && game.velocity > 15) {
            game.velocity *= .91;
            game.y += (rig.padY - 21 - game.y) * .03;
          }
          if (overlapsPad && heliBottom >= rig.padY - 3) {
            if (!rig.scored && heliBottom <= rig.padY + 14 && game.velocity < 190) {
              rig.scored = true;
              game.score += 1;
              game.velocity = -170;
              game.y = rig.padY - 29;
              setScore(game.score);
            } else if (!rig.scored) finish();
          }
        }
        const droneHit = game.drones.some(drone => Math.abs(drone.x - 112) < 34 && Math.abs((drone.y + Math.sin(game.distance / 35 + drone.phase) * 7) - game.y) < 24);
        const flareHit = game.rigs.some(rig => rig.flare && Math.abs((rig.x + 205 * rig.size) - 112) < 27 && Math.abs((rig.padY - 104 * rig.size) - game.y) < 38);
        if (droneHit || flareHit || game.y < 30 || heliBottom > SEA_Y + 3) finish();
      }
      draw();
      frameRef.current = requestAnimationFrame(loop);
    }
    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, []);

  return <Modal onClose={onClose} labelledBy="rig-runner-title" className="game-modal">
    <div ref={gameAreaRef} className="game-fullscreen-area">
    <div className="game-header">
      <div><span className="eyebrow">PAUSEMODUS</span><h2 id="rig-runner-title">Rig Runner</h2></div>
      <div className="game-score"><span>Poeng <b>{score}</b></span><span>Rekord <b>{best}</b></span></div>
      <div className="game-window-actions"><button onClick={toggleFullscreen} aria-label={isFullscreen ? "Avslutt fullskjerm" : "Vis i fullskjerm"}>{isFullscreen ? "↙" : "⛶"}</button><button className="calendar-close" onClick={onClose} aria-label="Lukk">×</button></div>
    </div>
    <div className="game-layout">
      <div className="game-play-column">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="rig-runner-canvas" onPointerDown={lift} aria-label="Rig Runner-spill" />
        <div className="game-controls">
          <button onPointerDown={(event) => { event.preventDefault(); lift(); }}>↑ Løft helikopteret</button>
          <p>Trykk på skjermen eller bruk mellomrom. Land mykt på den grønne H-en og unngå de russiske dronene.</p>
        </div>
        {state === "over" && <button className="primary full-width" onClick={reset}>Prøv igjen</button>}
      </div>
      <aside className="game-leaderboard" aria-label="Poengtavle">
        <div><span className="eyebrow">TOPP 10</span><h3>Poengtavle</h3></div>
        {leaderboard.length ? <ol>{leaderboard.map((entry, index) => <li key={entry.user_id} className={entry.user_id === user?.id ? "is-me" : ""}><span><b>{index + 1}</b>{entry.display_name}</span><strong>{entry.score}</strong></li>)}</ol> : <p className="leaderboard-empty">Ingen resultater ennå. Bli den første!</p>}
        {!user ? <button className="secondary full-width" onClick={onLogin}>Logg inn for poengtavlen</button> : <form className="game-name-form" onSubmit={saveNickname}><label htmlFor="game-name">Ditt spillnavn</label><div><input id="game-name" value={nicknameDraft} maxLength={20} placeholder="F.eks. Nordsjøpiloten" onChange={event => setNicknameDraft(event.target.value)} /><button type="submit">Lagre</button></div>{nameMessage && <small>{nameMessage}</small>}</form>}
      </aside>
    </div>
    </div>
  </Modal>;
}
