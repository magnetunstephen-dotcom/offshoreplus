import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Modal } from "./Modal";
import { supabase, supabaseConfigured } from "../lib/supabase";

type GameState = "ready" | "running" | "over";
type PlatformKind = "jacket" | "concrete" | "semi" | "tlp" | "fpso" | "circular" | "complex";
type Rig = { x: number; padY: number; scored: boolean; name: string; size: number; kind: PlatformKind; flare: boolean };
type Drone = { x: number; y: number; phase: number };
type LeaderboardEntry = { user_id: string; display_name: string; score: number };

const WIDTH = 900;
const HEIGHT = 480;
const SEA_Y = 420;
const HELI_X = 145;
const PLATFORM_NAMES = ["Ula", "Statfjord", "Skarv", "Troll", "Oseberg", "Gullfaks", "Ekofisk", "Valhall", "Snorre", "Heidrun", "Åsgard", "Johan Sverdrup", "Goliat", "Johan Castberg"];
const PLATFORM_PROFILES: Record<string, { kind: PlatformKind; flare: boolean }> = {
  Ula: { kind: "jacket", flare: false }, Statfjord: { kind: "concrete", flare: true }, Skarv: { kind: "fpso", flare: true },
  Troll: { kind: "concrete", flare: false }, Oseberg: { kind: "complex", flare: false }, Gullfaks: { kind: "concrete", flare: false },
  Ekofisk: { kind: "complex", flare: true }, Valhall: { kind: "complex", flare: false }, Snorre: { kind: "semi", flare: false },
  Heidrun: { kind: "tlp", flare: false }, Åsgard: { kind: "semi", flare: true }, "Johan Sverdrup": { kind: "complex", flare: false },
  Goliat: { kind: "circular", flare: false }, "Johan Castberg": { kind: "fpso", flare: false },
};

function createRig(x: number, index: number): Rig {
  const name = PLATFORM_NAMES[index % PLATFORM_NAMES.length];
  const profile = PLATFORM_PROFILES[name];
  return {
    x,
    padY: 278 + Math.random() * 78,
    scored: false,
    name,
    size: name === "Goliat" ? 1.08 : name === "Johan Castberg" ? 1.28 : profile.kind === "complex" ? 1.18 + Math.random() * .16 : .82 + Math.random() * .32,
    ...profile,
  };
}

function createStartingCourse() {
  const startIndex = Math.floor(Math.random() * PLATFORM_NAMES.length);
  const name = PLATFORM_NAMES[startIndex];
  return {
    rigs: [{ x: 720, padY: 335, scored: false, name, size: name === "Goliat" ? 1.08 : name === "Johan Castberg" ? 1.28 : PLATFORM_PROFILES[name].kind === "complex" ? 1.24 : 1, ...PLATFORM_PROFILES[name] }] as Rig[],
    nextRigIndex: startIndex + 1,
    drones: [{ x: 600, y: 120 + Math.random() * 120, phase: Math.random() * 6 }] as Drone[],
  };
}

export function RigRunnerModal({ onClose, user, onLogin }: { onClose: () => void; user: User | null; onLogin: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const gameRunRef = useRef<string | null>(null);
  const gameRunPromiseRef = useRef<PromiseLike<string | null> | null>(null);
  const userRef = useRef(user);
  const initialCourseRef = useRef(createStartingCourse());
  const gameRef = useRef({
    state: "ready" as GameState,
    y: 190,
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
  const [scoreMessage, setScoreMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobilePlayMode, setMobilePlayMode] = useState(false);
  const nicknameRef = useRef(nickname);
  userRef.current = user;
  nicknameRef.current = nickname;

  async function loadLeaderboard() {
    if (!supabaseConfigured) return;
    const { data } = await supabase.from("game_scores").select("user_id,display_name,score").order("score", { ascending: false }).order("updated_at", { ascending: true }).limit(10);
    if (data) {
      const entries = data as LeaderboardEntry[];
      setLeaderboard(entries);
      let ownEntry = entries.find(entry => entry.user_id === userRef.current?.id);
      if (!ownEntry && userRef.current) {
        const { data: ownData } = await supabase.from("game_scores").select("user_id,display_name,score").eq("user_id", userRef.current.id).maybeSingle();
        ownEntry = ownData as LeaderboardEntry | undefined;
      }
      if (ownEntry && !nicknameRef.current.trim()) {
        setNickname(ownEntry.display_name);
        setNicknameDraft(ownEntry.display_name);
        localStorage.setItem("offshoreplus-game-name", ownEntry.display_name);
      }
    }
  }

  useEffect(() => { loadLeaderboard(); }, [user?.id]);

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
    const runId = gameRunRef.current ?? await gameRunPromiseRef.current;
    gameRunRef.current = null;
    gameRunPromiseRef.current = null;
    if (!currentUser || !runId || !supabaseConfigured) {
      if (currentUser) setScoreMessage("Resultatet ble lagret på telefonen, men kom ikke på poengtavlen. Kontroller spillnavnet og prøv igjen.");
      return;
    }
    const { data, error } = await supabase.rpc("finish_rig_runner_run", { p_run_id: runId, p_final_score: nextScore });
    if (error || data !== true) {
      setScoreMessage("Resultatet ble lagret lokalt, men poengtavlen avviste innsendingen.");
      return;
    }
    setScoreMessage("Resultatet er lagret på poengtavlen.");
    await loadLeaderboard();
  }

  function startVerifiedRun() {
    gameRunRef.current = null;
    if (!userRef.current || !supabaseConfigured) { gameRunPromiseRef.current = null; return; }
    setScoreMessage("");
    gameRunPromiseRef.current = supabase.rpc("start_rig_runner_run").then(({ data, error }) => {
      const id = !error && typeof data === "string" ? data : null;
      gameRunRef.current = id;
      if (!id) setScoreMessage("Lagre et spillnavn før resultatet kan føres på poengtavlen.");
      return id;
    });
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setMobilePlayMode(false);
      try { screen.orientation.unlock(); } catch { /* Ikke støttet på blant annet iPhone. */ }
      return;
    }
    if (mobilePlayMode) { setMobilePlayMode(false); return; }
    setMobilePlayMode(true);
    try { await gameAreaRef.current?.requestFullscreen(); } catch { /* CSS-modus gir iPhone samme spillflate. */ }
    try { await (screen.orientation as ScreenOrientation & { lock: (orientation: string) => Promise<void> }).lock("landscape"); } catch { /* Brukeren kan snu telefonen manuelt. */ }
  }

  function reset() {
    startVerifiedRun();
    const startingCourse = createStartingCourse();
    gameRef.current = {
      state: "running",
      y: 190,
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
      context.translate(HELI_X, y);
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
        // FPSO: langt skipsskrog med tydelig baug og et tett prosessanlegg på dekk.
        context.fillStyle = rig.name === "Johan Castberg" ? "#9f2f32" : "#8d3036";
        context.beginPath(); context.moveTo(x - 18 * size, y + 9); context.lineTo(x + width - 12 * size, y + 9); context.lineTo(x + width + 24 * size, y + 20); context.lineTo(x + width - 2 * size, y + 38); context.lineTo(x + 5 * size, y + 38); context.lineTo(x - 18 * size, y + 28); context.closePath(); context.fill(); context.stroke();
        context.fillStyle = "#e7edf0"; context.fillRect(x + 82 * size, y - 42 * size, 48 * size, 51 * size); context.strokeRect(x + 82 * size, y - 42 * size, 48 * size, 51 * size);
        context.fillStyle = "#244653";
        for (let module = 0; module < 3; module++) context.fillRect(x + (22 + module * 20) * size, y - (18 + (module % 2) * 8) * size, 16 * size, (27 + (module % 2) * 8) * size);
        context.strokeStyle = "#b9cbd0"; context.lineWidth = 2;
        context.beginPath(); context.moveTo(x + 72 * size, y + 7); context.lineTo(x + 52 * size, y - 36 * size); context.lineTo(x + 34 * size, y + 7); context.stroke();
        context.fillStyle = "#d7e9e5"; context.fillRect(x + width - 4 * size, y + 15, 18 * size, 4);
        context.fillStyle = "#1b667f"; context.fillRect(x + 86 * size, y - 31 * size, 38 * size, 8 * size);
      } else if (rig.kind === "complex") {
        // Broforbundne plattformer gjør feltsentrene store som små landsbyer.
        [0, 62, 124].forEach((offset, index) => {
          const moduleX = x + offset * size;
          const moduleW = (index === 1 ? 58 : 51) * size;
          context.fillStyle = "#173846"; context.fillRect(moduleX, y, moduleW, 15); context.strokeRect(moduleX, y, moduleW, 15);
          context.fillRect(moduleX + 12 * size, y - (30 + index * 7) * size, moduleW - 20 * size, (30 + index * 7) * size);
          context.strokeRect(moduleX + 12 * size, y - (30 + index * 7) * size, moduleW - 20 * size, (30 + index * 7) * size);
          context.beginPath(); context.moveTo(moduleX + 9 * size, y + 15); context.lineTo(moduleX + 17 * size, SEA_Y + 15); context.moveTo(moduleX + moduleW - 9 * size, y + 15); context.lineTo(moduleX + moduleW - 17 * size, SEA_Y + 15); context.stroke();
        });
        context.strokeStyle = "#f0c85b"; context.lineWidth = 4;
        context.beginPath(); context.moveTo(x + 49 * size, y - 7); context.lineTo(x + 66 * size, y - 7); context.moveTo(x + 116 * size, y - 9); context.lineTo(x + 128 * size, y - 9); context.stroke();
        context.strokeStyle = "#b9cbd0"; context.lineWidth = 3;
        context.beginPath(); context.moveTo(x + 102 * size, y - 37 * size); context.lineTo(x + 80 * size, y - 83 * size); context.lineTo(x + 69 * size, y - 76 * size); context.stroke();
      } else {
        context.fillRect(x, y, width, 17); context.strokeRect(x, y, width, 17);
        context.fillRect(x + 82 * size, y - 45 * size, 45 * size, 45 * size); context.strokeRect(x + 82 * size, y - 45 * size, 45 * size, 45 * size);
        if (rig.kind === "concrete") {
          context.fillStyle = "#315364";
          context.beginPath(); context.moveTo(x + 24 * size, y + 17); context.lineTo(x + 15 * size, SEA_Y + 18); context.lineTo(x + 57 * size, SEA_Y + 18); context.lineTo(x + 48 * size, y + 17); context.closePath(); context.fill(); context.stroke();
          context.beginPath(); context.moveTo(x + 108 * size, y + 17); context.lineTo(x + 101 * size, SEA_Y + 18); context.lineTo(x + 140 * size, SEA_Y + 18); context.lineTo(x + 132 * size, y + 17); context.closePath(); context.fill(); context.stroke();
        } else if (rig.kind === "semi" || rig.kind === "tlp") {
          context.fillStyle = "#173846"; context.fillRect(x + 8, SEA_Y - 5, 58 * size, 16); context.fillRect(x + 91 * size, SEA_Y - 5, 58 * size, 16);
          context.fillStyle = rig.kind === "tlp" ? "#607985" : "#315364";
          context.fillRect(x + 22 * size, y + 17, 28 * size, SEA_Y - y - 20); context.fillRect(x + 105 * size, y + 17, 28 * size, SEA_Y - y - 20);
          if (rig.kind === "tlp") { context.strokeStyle = "rgba(215,233,229,.22)"; context.lineWidth = 1; context.beginPath(); context.moveTo(x + 25 * size, SEA_Y + 10); context.lineTo(x + 25 * size, HEIGHT); context.moveTo(x + 130 * size, SEA_Y + 10); context.lineTo(x + 130 * size, HEIGHT); context.stroke(); }
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
      // Arbeidslys, moduler og kran gir installasjonene en tydeligere offshore-silhuett.
      context.fillStyle = "#ffd45c";
      for (let light = 0; light < 3; light++) context.fillRect(x + (86 + light * 12) * size, y - 33 * size, 5 * size, 5 * size);
      if (rig.kind === "jacket" || rig.kind === "concrete") {
        context.strokeStyle = "#b9cbd0"; context.lineWidth = 3;
        context.beginPath(); context.moveTo(x + 76 * size, y - 31 * size); context.lineTo(x + 25 * size, y - 70 * size); context.lineTo(x + 18 * size, y - 64 * size); context.stroke();
      }
      if (rig.kind === "fpso") {
        context.fillStyle = "#8bd3e6"; context.fillRect(x + 82 * size, y - 28 * size, 31 * size, 8 * size);
      }
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
      context.fillRect(16, 15, 224, 48);
      context.fillStyle = "#eaf8f3";
      context.font = "800 20px sans-serif";
      context.fillText(`ANTALL LANDINGER  ${game.score}`, 28, 46);
      if (game.state !== "running") {
        context.fillStyle = "rgba(3,13,22,.72)";
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.textAlign = "center";
        context.fillStyle = "#fff";
        context.font = "900 34px sans-serif";
        context.fillText(game.state === "ready" ? "DRONEVAKTA" : "Vaktrunden er over", WIDTH / 2, 184);
        context.font = "600 18px sans-serif";
        context.fillStyle = "#b8d0d6";
        context.fillText(game.state === "ready" ? "Patruljer feltet og unngå de russiske dronene" : `Du landet på ${game.score} ${game.score === 1 ? "installasjon" : "installasjoner"}`, WIDTH / 2, 222);
        context.fillStyle = "#20c98b";
        context.font = "800 17px sans-serif";
        context.fillText(game.state === "ready" ? "TRYKK FOR Å STARTE VAKTRUNDEN" : "TRYKK FOR Å PRØVE IGJEN", WIDTH / 2, 282);
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
        if (lastRig.x < 510) {
          game.rigs.push(createRig(lastRig.x + 475 + Math.random() * 120, game.nextRigIndex));
          game.nextRigIndex += 1;
        }
        game.rigs = game.rigs.filter(rig => rig.x > -180);
        if (!game.drones.length || game.drones[game.drones.length - 1].x < 470) {
          game.drones.push({ x: WIDTH + 40 + Math.random() * 220, y: 105 + Math.random() * 185, phase: Math.random() * 6 });
        }
        game.drones = game.drones.filter(drone => drone.x > -40);

        // Hjulene er tegnet med nederkant 25 px under helikopterets sentrum.
        // Bruk samme punkt i fysikken, så en synlig hjulkontakt faktisk teller.
        const heliBottom = game.y + 25;
        for (const rig of game.rigs) {
          const overlapsPad = rig.x < HELI_X + 42 && rig.x + 88 * rig.size > HELI_X - 40;
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
        const droneHit = game.drones.some(drone => Math.abs(drone.x - HELI_X) < 34 && Math.abs((drone.y + Math.sin(game.distance / 35 + drone.phase) * 7) - game.y) < 24);
        const flareHit = game.rigs.some(rig => rig.flare && Math.abs((rig.x + 205 * rig.size) - HELI_X) < 27 && Math.abs((rig.padY - 104 * rig.size) - game.y) < 38);
        if (droneHit || flareHit || game.y < 30 || heliBottom > SEA_Y + 3) finish();
      }
      draw();
      frameRef.current = requestAnimationFrame(loop);
    }
    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, []);

  return <Modal onClose={onClose} labelledBy="rig-runner-title" className="game-modal">
    <div ref={gameAreaRef} className={`game-fullscreen-area${mobilePlayMode ? " mobile-game-mode" : ""}`}>
    <div className="game-header">
      <div><span className="eyebrow">PAUSEMODUS</span><h2 id="rig-runner-title">Dronevakta</h2></div>
      <div className="game-score"><span>Landinger <b>{score}</b></span><span>Rekord <b>{best}</b></span></div>
      <div className="game-window-actions"><button onClick={toggleFullscreen} aria-label={isFullscreen || mobilePlayMode ? "Avslutt fullskjerm" : "Vis i fullskjerm"}>{isFullscreen || mobilePlayMode ? "↙" : "⛶"}</button><button className="calendar-close" onClick={onClose} aria-label="Lukk">×</button></div>
    </div>
    <div className="game-layout">
      <div className="game-play-column">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="rig-runner-canvas" onPointerDown={lift} aria-label="Dronevakta-spill" />
        <div className="game-controls">
          <button onPointerDown={(event) => { event.preventDefault(); lift(); }}>↑ Løft helikopteret</button>
          <p>Trykk på skjermen eller bruk mellomrom. Land mykt på den grønne H-en og unngå de russiske dronene.</p>
        </div>
        <button className="game-mobile-fullscreen" onClick={toggleFullscreen}>↻ Snu telefonen og spill på fullskjerm</button>
        {state === "over" && <button className="primary full-width" onClick={reset}>Prøv igjen</button>}
      </div>
      <aside className="game-leaderboard" aria-label="Poengtavle">
        <div><span className="eyebrow">TOPP 10</span><h3>Poengtavle</h3></div>
        {leaderboard.length ? <ol>{leaderboard.map((entry, index) => <li key={entry.user_id} className={entry.user_id === user?.id ? "is-me" : ""}><span><b>{index + 1}</b>{entry.display_name}</span><strong>{entry.score}</strong></li>)}</ol> : <p className="leaderboard-empty">Ingen resultater ennå. Bli den første!</p>}
        {scoreMessage && <p className="game-score-message" role="status">{scoreMessage}</p>}
        {!user ? <><p className="leaderboard-login-help">Logg inn for å lagre toppscoren din og velge spillnavn.</p><button className="secondary full-width" onClick={onLogin}>Logg inn for å lagre toppscore</button></> : <form className="game-name-form" onSubmit={saveNickname}><label htmlFor="game-name">Ditt spillnavn</label><div><input id="game-name" value={nicknameDraft} maxLength={20} placeholder="F.eks. Nordsjøpiloten" onChange={event => setNicknameDraft(event.target.value)} /><button type="submit">Lagre</button></div>{nameMessage && <small>{nameMessage}</small>}</form>}
      </aside>
    </div>
    </div>
  </Modal>;
}
