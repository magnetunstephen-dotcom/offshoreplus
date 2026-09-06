import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Modal } from "./Modal";
import { supabase, supabaseConfigured } from "../lib/supabase";

type GameState = "ready" | "running" | "over";
type PlatformKind = "jacket" | "jackup" | "drilljackup" | "drillsemi" | "concrete" | "monotower" | "semi" | "tlp" | "spar" | "fpso" | "circular" | "complex";
type RigTheme = "cosl" | "transocean" | "odfjell" | "noble" | "island" | "saipem" | "shelf" | "floatel" | "catj";
type Rig = { x: number; padY: number; scored: boolean; missed?: boolean; name: string; size: number; kind: PlatformKind; flare: boolean; landable?: boolean; theme?: RigTheme };
type Drone = { x: number; y: number; phase: number };
type LeaderboardEntry = { user_id: string; display_name: string; score: number; best_streak: number };
type PendingScore = { runId: string; score: number; streak: number };
const PENDING_SCORE_KEY = "offshoreplus-pending-game-score";

const WIDTH = 900;
const HEIGHT = 520;
const SEA_Y = 420;
const HELI_X = 145;
const HELICOPTER_COLORS = [
  { body: "#ffcc33", trim: "#f47b20" },
  { body: "#e94f64", trim: "#f6efe5" },
  { body: "#3f8fd2", trim: "#f3f7f8" },
  { body: "#36b889", trim: "#ffe17a" },
  { body: "#f28c28", trim: "#173b5c" },
  { body: "#9b72cf", trim: "#f3c4df" },
  { body: "#e8edf0", trim: "#2b78b8" },
] as const;
const PLATFORM_NAMES = [
  "Ula", "Njord", "Draupner", "Brage", "Skarv", "Heimdal", "Martin Linge", "Eldfisk", "Jotun FPSO", "Kristin",
  "Draugen", "Hugin", "Munin", "Grane", "Gudrun", "Ivar Aasen", "Gullfaks", "Gjøa", "Aasta Hansteen",
  "Balder FPSO", "Ringhorne", "Visund", "Norne FPSO", "Alvheim FPSO", "Sleipner A", "Kvitebjørn", "Valemon", "Edvard Grieg", "Fenris", "Yme",
  "Statfjord A", "Statfjord B", "Statfjord C", "Troll A", "Oseberg A", "Oseberg B", "Oseberg D", "Gullfaks A", "Gullfaks B", "Gullfaks C",
  "Ekofisk", "Valhall", "Haven", "Snorre", "Heidrun", "Åsgard", "Johan Sverdrup", "Goliat", "Johan Castberg",
  "COSL Pioneer", "Transocean Norge", "Deepsea Stavanger", "Noble Invincible", "COSL Innovator", "West Elara",
  "Deepsea Aberdeen", "Transocean Enabler", "COSL Prospector", "Noble Integrator", "Deepsea Nordkapp", "Island Innovator",
  "Transocean Encourage", "COSL Promoter", "Deepsea Bergen", "Noble Interceptor", "Scarabeo 8", "Deepsea Yantai",
  "Transocean Spitsbergen", "Shelf Drilling Barsk", "Floatel Superior", "Askepott", "Askeladden", "Yme Inspirer",
];
const PLATFORM_PROFILES: Record<string, { kind: PlatformKind; flare: boolean; size?: number; landable?: boolean; theme?: RigTheme }> = {
  Ula: { kind: "jacket", flare: false }, Njord: { kind: "semi", flare: false, size: 1.05 }, Draupner: { kind: "complex", flare: false, size: 1.2 },
  Brage: { kind: "jacket", flare: false, size: 1.02 }, Skarv: { kind: "fpso", flare: true, size: 1.25 }, Heimdal: { kind: "jacket", flare: false, size: .96 },
  "Martin Linge": { kind: "jacket", flare: false, size: 1.08 }, Eldfisk: { kind: "complex", flare: true, size: 1.28 }, "Jotun FPSO": { kind: "fpso", flare: false, size: 1.24 },
  Kristin: { kind: "semi", flare: false, size: 1.06 }, Draugen: { kind: "monotower", flare: false, size: 1.08 }, Hugin: { kind: "jacket", flare: false, size: 1.02 },
  Munin: { kind: "jacket", flare: false, size: .82, landable: false }, Grane: { kind: "jacket", flare: false, size: 1.12 }, Gudrun: { kind: "jacket", flare: false, size: .96 },
  "Ivar Aasen": { kind: "jacket", flare: false, size: 1.02 }, Gullfaks: { kind: "concrete", flare: false, size: 1.16 }, Gjøa: { kind: "semi", flare: false, size: 1.08 },
  "Aasta Hansteen": { kind: "spar", flare: false, size: 1.08 },
  "Balder FPSO": { kind: "fpso", flare: false, size: 1.25 }, Ringhorne: { kind: "jacket", flare: false, size: 1.02 }, Visund: { kind: "semi", flare: false, size: 1.08 },
  "Norne FPSO": { kind: "fpso", flare: true, size: 1.25 }, "Alvheim FPSO": { kind: "fpso", flare: false, size: 1.25 }, "Sleipner A": { kind: "concrete", flare: false, size: 1.16 },
  Kvitebjørn: { kind: "jacket", flare: false, size: 1.06 }, Valemon: { kind: "jacket", flare: false, size: .9 }, "Edvard Grieg": { kind: "jacket", flare: false, size: 1.1 },
  Fenris: { kind: "jacket", flare: false, size: .86, landable: false }, Yme: { kind: "jacket", flare: false, size: 1.02 },
  "Statfjord A": { kind: "concrete", flare: true, size: 1.18 }, "Statfjord B": { kind: "concrete", flare: false, size: 1.14 }, "Statfjord C": { kind: "concrete", flare: true, size: 1.15 },
  "Troll A": { kind: "concrete", flare: false, size: 1.26 }, "Oseberg A": { kind: "complex", flare: false, size: 1.28 }, "Oseberg B": { kind: "jacket", flare: false, size: 1.02 },
  "Oseberg D": { kind: "jacket", flare: false, size: .92 }, "Gullfaks A": { kind: "concrete", flare: false, size: 1.16 }, "Gullfaks B": { kind: "concrete", flare: true, size: 1.15 },
  "Gullfaks C": { kind: "concrete", flare: false, size: 1.17 }, Ekofisk: { kind: "complex", flare: true, size: 1.3 }, Valhall: { kind: "complex", flare: false, size: 1.22 }, Haven: { kind: "jackup", flare: false, size: 1.12 },
  Snorre: { kind: "semi", flare: false, size: 1.08 }, Heidrun: { kind: "tlp", flare: false, size: 1.08 }, Åsgard: { kind: "semi", flare: true, size: 1.08 },
  "Johan Sverdrup": { kind: "complex", flare: false, size: 1.32 }, Goliat: { kind: "circular", flare: false, size: 1.08 }, "Johan Castberg": { kind: "fpso", flare: false, size: 1.28 },
  "COSL Pioneer": { kind: "drillsemi", flare: false, size: 1.05, theme: "cosl" }, "COSL Innovator": { kind: "drillsemi", flare: false, size: 1.05, theme: "cosl" },
  "COSL Prospector": { kind: "drillsemi", flare: false, size: 1.08, theme: "cosl" }, "COSL Promoter": { kind: "drillsemi", flare: false, size: 1.05, theme: "cosl" },
  "Transocean Norge": { kind: "drillsemi", flare: false, size: 1.13, theme: "transocean" }, "Transocean Enabler": { kind: "drillsemi", flare: false, size: 1.09, theme: "transocean" },
  "Transocean Encourage": { kind: "drillsemi", flare: false, size: 1.09, theme: "transocean" }, "Transocean Spitsbergen": { kind: "drillsemi", flare: false, size: 1.1, theme: "transocean" },
  "Deepsea Stavanger": { kind: "drillsemi", flare: false, size: 1.11, theme: "odfjell" }, "Deepsea Aberdeen": { kind: "drillsemi", flare: false, size: 1.11, theme: "odfjell" },
  "Deepsea Nordkapp": { kind: "drillsemi", flare: false, size: 1.12, theme: "odfjell" }, "Deepsea Bergen": { kind: "drillsemi", flare: false, size: 1.1, theme: "odfjell" },
  "Deepsea Yantai": { kind: "drillsemi", flare: false, size: 1.12, theme: "odfjell" }, "Island Innovator": { kind: "drillsemi", flare: false, size: 1.06, theme: "island" },
  "Scarabeo 8": { kind: "drillsemi", flare: false, size: 1.08, theme: "saipem" }, "Floatel Superior": { kind: "drillsemi", flare: false, size: 1.11, theme: "floatel" },
  "Noble Invincible": { kind: "drilljackup", flare: false, size: 1.08, theme: "noble" }, "Noble Integrator": { kind: "drilljackup", flare: false, size: 1.08, theme: "noble" },
  "Noble Interceptor": { kind: "drilljackup", flare: false, size: 1.08, theme: "noble" }, "West Elara": { kind: "drilljackup", flare: false, size: 1.04, theme: "transocean" },
  "Shelf Drilling Barsk": { kind: "drilljackup", flare: false, size: 1.05, theme: "shelf" }, "Askepott": { kind: "drilljackup", flare: false, size: 1.07, theme: "catj" },
  "Askeladden": { kind: "drilljackup", flare: false, size: 1.07, theme: "catj" }, "Yme Inspirer": { kind: "drilljackup", flare: false, size: 1.07, theme: "noble" },
};

export const LANDABLE_INSTALLATION_COUNT = PLATFORM_NAMES.filter(name => PLATFORM_PROFILES[name].landable !== false).length;

function rigSize(name: string) {
  const profile = PLATFORM_PROFILES[name];
  return profile.size ?? (profile.kind === "complex" ? 1.18 + Math.random() * .16 : .86 + Math.random() * .24);
}

function createRig(x: number, index: number): Rig {
  const name = PLATFORM_NAMES[index % PLATFORM_NAMES.length];
  const profile = PLATFORM_PROFILES[name];
  return {
    x,
    padY: 278 + Math.random() * 78,
    scored: false,
    name,
    size: rigSize(name),
    ...profile,
  };
}

function createStartingCourse() {
  let startIndex = Math.floor(Math.random() * PLATFORM_NAMES.length);
  if (PLATFORM_NAMES[startIndex] === "Haven") startIndex -= 1;
  const name = PLATFORM_NAMES[startIndex];
  const firstRig = { x: 720, padY: 335, scored: false, name, size: rigSize(name), ...PLATFORM_PROFILES[name] } as Rig;
  const rigs = [firstRig];
  let nextRigIndex = startIndex + 1;
  // Valhall og Haven er én sammenhengende scene. Opprett begge med en gang,
  // slik at gangbroen og begge installasjonene kommer inn på skjermen samlet.
  if (name === "Valhall") {
    const haven = createRig(firstRig.x + 245, nextRigIndex);
    haven.padY = firstRig.padY + 8;
    rigs.push(haven);
    nextRigIndex += 1;
  }
  return {
    rigs,
    nextRigIndex,
    drones: [{ x: 600, y: 120 + Math.random() * 120, phase: Math.random() * 6 }] as Drone[],
  };
}

function resultFeedback(score: number) {
  if (score < 20) return {
    title: "Oi, det gikk visst ikke helt etter planen!",
    subtitle: `Godt du ikke er helikopterpilot · ${score} landinger`,
  };
  if (score < 40) return {
    title: "Du begynner å få dreisen på dette!",
    subtitle: `${score} landinger · passasjerene er bare litt bleke`,
  };
  if (score < 70) return {
    title: "Dette begynner å ligne offshoreflyging!",
    subtitle: `${score} landinger · stødig levert`,
  };
  if (score < 100) return {
    title: "Sterk flyging – nå kjenner du feltet!",
    subtitle: `${score} landinger · kapteinen har kontroll`,
  };
  if (score < 150) return {
    title: "Imponerende vaktrunde!",
    subtitle: `${score} landinger · dette er pilotklasse`,
  };
  return {
    title: "Legendarisk flyging!",
    subtitle: `${score} landinger · Nordsjøen er din`,
  };
}

export function RigRunnerModal({ onClose, user, onLogin }: { onClose: () => void; user: User | null; onLogin: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const finalAudioRef = useRef<HTMLAudioElement>(null);
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
    streak: 0,
    bestStreak: 0,
    distance: 0,
    crashAt: 0,
    crashX: HELI_X,
    crashY: 190,
    helicopterColor: Math.floor(Math.random() * HELICOPTER_COLORS.length),
    ...initialCourseRef.current,
    lastTime: 0,
  });
  const [state, setState] = useState<GameState>("ready");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => Number(localStorage.getItem("offshoreplus-rig-runner-streak") || 0));
  const [best, setBest] = useState(() => Number(localStorage.getItem("offshoreplus-rig-runner-best") || 0));
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [streakLeaderboard, setStreakLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nickname, setNickname] = useState(() => localStorage.getItem("offshoreplus-game-name") || "");
  const [nicknameDraft, setNicknameDraft] = useState(() => localStorage.getItem("offshoreplus-game-name") || "");
  const [nameMessage, setNameMessage] = useState("");
  const [scoreMessage, setScoreMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobilePlayMode, setMobilePlayMode] = useState(false);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem("offshoreplus-game-sound") === "on");
  const nicknameRef = useRef(nickname);
  userRef.current = user;
  nicknameRef.current = nickname;

  async function loadLeaderboard() {
    if (!supabaseConfigured) return;
    const [{ data }, { data: streakData }] = await Promise.all([
      supabase.from("game_scores").select("user_id,display_name,score,best_streak").order("score", { ascending: false }).order("updated_at", { ascending: true }).limit(10),
      supabase.from("game_scores").select("user_id,display_name,score,best_streak").order("best_streak", { ascending: false }).order("updated_at", { ascending: true }).limit(10),
    ]);
    if (streakData) setStreakLeaderboard(streakData as LeaderboardEntry[]);
    if (data) {
      const entries = data as LeaderboardEntry[];
      setLeaderboard(entries);
      let ownEntry = entries.find(entry => entry.user_id === userRef.current?.id);
      if (!ownEntry && userRef.current) {
        const { data: ownData } = await supabase.from("game_scores").select("user_id,display_name,score,best_streak").eq("user_id", userRef.current.id).maybeSingle();
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
    if (!user || !supabaseConfigured) return;
    const saved = localStorage.getItem(PENDING_SCORE_KEY);
    if (!saved) return;
    try {
      const pending = JSON.parse(saved) as PendingScore;
      supabase.rpc("finish_rig_runner_run", { p_run_id: pending.runId, p_final_score: pending.score, p_best_streak: pending.streak ?? 0 }).then(async ({ data, error }) => {
        if (!error || data === false) localStorage.removeItem(PENDING_SCORE_KEY);
        if (data === true) {
          setScoreMessage("Den ventende toppscoren ble lagret på poengtavlen.");
          await loadLeaderboard();
        }
      });
    } catch {
      localStorage.removeItem(PENDING_SCORE_KEY);
    }
  }, [user?.id]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    const regular = audioRef.current;
    const finalStage = finalAudioRef.current;
    if (!regular || !finalStage) return;
    regular.volume = .32;
    finalStage.volume = .35;
    const active = score >= 50 ? finalStage : regular;
    const inactive = score >= 50 ? regular : finalStage;
    inactive.pause();
    if (soundOn && state !== "over") active.play().catch(() => undefined);
    else active.pause();
  }, [soundOn, state, score]);

  async function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem("offshoreplus-game-sound", next ? "on" : "off");
    const audio = score >= 50 ? finalAudioRef.current : audioRef.current;
    if (!audio) return;
    audio.volume = .32;
    if (next) await audio.play().catch(() => undefined);
    else audio.pause();
  }

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

  async function submitScore(nextScore: number, nextStreak: number) {
    const currentUser = userRef.current;
    const runId = gameRunRef.current ?? await gameRunPromiseRef.current;
    gameRunRef.current = null;
    gameRunPromiseRef.current = null;
    if (!currentUser || !runId || !supabaseConfigured) {
      if (currentUser) setScoreMessage("Resultatet ble lagret på telefonen, men kom ikke på poengtavlen. Kontroller spillnavnet og prøv igjen.");
      return;
    }
    localStorage.setItem(PENDING_SCORE_KEY, JSON.stringify({ runId, score: nextScore, streak: nextStreak } satisfies PendingScore));
    const { data, error } = await supabase.rpc("finish_rig_runner_run", { p_run_id: runId, p_final_score: nextScore, p_best_streak: nextStreak });
    if (error) {
      setScoreMessage("Nettet svarte ikke. Resultatet sendes automatisk på nytt.");
      return;
    }
    localStorage.removeItem(PENDING_SCORE_KEY);
    if (data !== true) {
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
    finalAudioRef.current?.pause();
    finalAudioRef.current && (finalAudioRef.current.currentTime = 0);
    if (soundOn) audioRef.current?.play().catch(() => undefined);
    startVerifiedRun();
    const startingCourse = createStartingCourse();
    const previousColor = gameRef.current.helicopterColor;
    const helicopterColor = (previousColor + 1 + Math.floor(Math.random() * (HELICOPTER_COLORS.length - 1))) % HELICOPTER_COLORS.length;
    gameRef.current = {
      state: "running",
      y: 190,
      velocity: -80,
      score: 0,
      streak: 0,
      bestStreak: 0,
      distance: 0,
      crashAt: 0,
      crashX: HELI_X,
      crashY: 190,
      helicopterColor,
      ...startingCourse,
      lastTime: performance.now(),
    };
    setScore(0);
    setStreak(0);
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
      if (game.state !== "running") return;
      game.crashAt = performance.now();
      game.crashX = HELI_X;
      game.crashY = game.y;
      game.state = "over";
      setState("over");
      setBest(previous => {
        const next = Math.max(previous, game.score);
        localStorage.setItem("offshoreplus-rig-runner-best", String(next));
        return next;
      });
      setBestStreak(previous => {
        const next = Math.max(previous, game.bestStreak);
        localStorage.setItem("offshoreplus-rig-runner-streak", String(next));
        return next;
      });
      submitScore(game.score, game.bestStreak);
    }

    function drawHelicopter(y: number, rotation: number, rotorPhase: number, colorIndex: number) {
      if (!context) return;
      const colors = HELICOPTER_COLORS[colorIndex % HELICOPTER_COLORS.length];
      context.save();
      context.translate(HELI_X, y);
      context.rotate(rotation);
      context.scale(-1, 1);
      context.strokeStyle = colors.body;
      context.fillStyle = colors.body;
      context.lineWidth = 3;
      context.lineCap = "round";
      context.beginPath(); context.ellipse(0, 0, 29, 14, 0, 0, Math.PI * 2); context.fill(); context.stroke();
      context.fillStyle = "#12304a";
      context.beginPath(); context.ellipse(1, -5, 27, 8, 0, Math.PI, Math.PI * 2); context.fill();
      context.fillStyle = colors.trim;
      context.beginPath(); context.moveTo(-24, 6); context.lineTo(22, 1); context.lineTo(17, 8); context.lineTo(-16, 12); context.closePath(); context.fill();
      context.fillStyle = colors.body;
      context.beginPath(); context.moveTo(23, -2); context.lineTo(51, -10); context.lineTo(53, 1); context.lineTo(25, 7); context.closePath(); context.fill(); context.stroke();
      context.fillStyle = "#12304a";
      context.beginPath(); context.moveTo(29, -4); context.lineTo(50, -10); context.lineTo(50, -5); context.lineTo(29, 1); context.closePath(); context.fill();
      context.fillStyle = "#102d3d";
      context.beginPath(); context.arc(-10, -3, 7, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#8bd3e6";
      context.beginPath(); context.arc(-10, -3, 4, 0, Math.PI * 2); context.fill();
      context.strokeStyle = colors.body;
      context.beginPath(); context.moveTo(-3, -15); context.lineTo(1, -25); context.stroke();
      const rotorWidth = 35 + Math.abs(Math.sin(rotorPhase)) * 22;
      context.strokeStyle = "rgba(235,245,248,.9)";
      context.lineWidth = 3;
      context.beginPath(); context.moveTo(-rotorWidth, -26); context.lineTo(rotorWidth, -26); context.stroke();
      context.strokeStyle = "rgba(32,201,139,.35)";
      context.lineWidth = 2;
      context.beginPath(); context.moveTo(-rotorWidth * .75, -29); context.lineTo(rotorWidth * .75, -23); context.stroke();
      context.save(); context.translate(52, -5); context.rotate(rotorPhase * 2.4);
      context.strokeStyle = colors.trim; context.lineWidth = 2;
      context.beginPath(); context.moveTo(-8, 0); context.lineTo(8, 0); context.moveTo(0, -8); context.lineTo(0, 8); context.stroke();
      context.restore();
      context.strokeStyle = colors.body; context.lineWidth = 3;
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

      // Fenris besøkes fra CSOV/W2W-fartøy. Olympic Notos følger derfor
      // installasjonen som en samlet scene med boligdel, gangveitårn og bro.
      if (rig.name === "Fenris") {
        const shipX = x + width + 22;
        const deckY = SEA_Y - 27;
        context.save();
        context.strokeStyle = "#cddfe4";
        context.lineJoin = "round";
        context.lineCap = "round";
        context.lineWidth = 3;
        // Skrog med markert CSOV-baug.
        context.fillStyle = "#173f61";
        context.beginPath(); context.moveTo(shipX, deckY); context.lineTo(shipX + 116, deckY); context.lineTo(shipX + 137, deckY + 8); context.lineTo(shipX + 122, deckY + 25); context.lineTo(shipX + 16, deckY + 25); context.lineTo(shipX - 5, deckY + 13); context.closePath(); context.fill(); context.stroke();
        context.fillStyle = "#e76538";
        context.beginPath(); context.moveTo(shipX + 5, deckY + 17); context.lineTo(shipX + 126, deckY + 13); context.lineTo(shipX + 119, deckY + 23); context.lineTo(shipX + 17, deckY + 23); context.closePath(); context.fill();
        // Hvit bolig-/broseksjon og blå vindusbånd.
        context.fillStyle = "#e8f0f1";
        context.fillRect(shipX + 56, deckY - 47, 62, 47); context.strokeRect(shipX + 56, deckY - 47, 62, 47);
        context.fillStyle = "#75b9d0";
        context.fillRect(shipX + 64, deckY - 39, 45, 8);
        context.fillStyle = "#ffd45c";
        for (let window = 0; window < 4; window++) context.fillRect(shipX + 65 + window * 12, deckY - 21, 6, 6);
        // Tårn og bevegelseskompensert Walk-to-Work-gangbro mot Fenris.
        const towerX = shipX + 31;
        context.strokeStyle = "#d7e9e5"; context.lineWidth = 4;
        context.beginPath(); context.moveTo(towerX, deckY); context.lineTo(towerX, deckY - 59); context.moveTo(towerX - 10, deckY); context.lineTo(towerX + 10, deckY - 59); context.stroke();
        const bridgeStartX = x + width - 3;
        const bridgeStartY = y + 2;
        const bridgeEndX = towerX + 5;
        const bridgeEndY = deckY - 51;
        context.lineWidth = 3;
        context.beginPath(); context.moveTo(bridgeStartX, bridgeStartY - 5); context.lineTo(bridgeEndX, bridgeEndY - 5); context.moveTo(bridgeStartX, bridgeStartY + 4); context.lineTo(bridgeEndX, bridgeEndY + 4); context.stroke();
        context.lineWidth = 1.5;
        for (let span = 0; span < 5; span++) {
          const progress = span / 5;
          const nextProgress = (span + 1) / 5;
          context.beginPath();
          context.moveTo(bridgeStartX + (bridgeEndX - bridgeStartX) * progress, bridgeStartY - 4 + (bridgeEndY - bridgeStartY) * progress);
          context.lineTo(bridgeStartX + (bridgeEndX - bridgeStartX) * nextProgress, bridgeStartY + 4 + (bridgeEndY - bridgeStartY) * nextProgress);
          context.stroke();
        }
        context.fillStyle = "rgba(3,18,27,.82)"; context.fillRect(shipX + 47, deckY + 28, 93, 21);
        context.fillStyle = "#eaf8f3"; context.font = "800 11px sans-serif"; context.fillText("Olympic Notos · W2W", shipX + 53, deckY + 43);
        context.strokeStyle = "rgba(220,247,250,.42)"; context.lineWidth = 2;
        context.beginPath(); context.arc(shipX + 25, SEA_Y + 3, 18, Math.PI, Math.PI * 2); context.arc(shipX + 92, SEA_Y + 3, 23, Math.PI, Math.PI * 2); context.stroke();
        context.restore();
      }
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
        const fpsoHull = rig.name === "Johan Castberg" ? "#a83036"
          : rig.name === "Jotun FPSO" ? "#b84b2c"
          : rig.name === "Alvheim FPSO" ? "#274f73"
          : rig.name === "Balder FPSO" ? "#394d59"
          : rig.name === "Norne FPSO" ? "#a04435"
          : "#8d3036";
        context.fillStyle = fpsoHull;
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
      } else if (rig.kind === "drillsemi") {
        const semiThemes: Partial<Record<RigTheme, { hull: string; deck: string; house: string; accent: string }>> = {
          cosl: { hull: "#e2b72e", deck: "#f0c83f", house: "#e9eef0", accent: "#bf3636" },
          transocean: { hull: "#b7333b", deck: "#d9e3e6", house: "#f0f3f4", accent: "#c52d38" },
          odfjell: { hull: "#b94435", deck: "#e7ecee", house: "#f5f5f0", accent: "#e07b2d" },
          island: { hull: "#243f60", deck: "#e0b832", house: "#ecf1f2", accent: "#e0b832" },
          saipem: { hull: "#b53338", deck: "#e3bb2e", house: "#e9edef", accent: "#d94432" },
          floatel: { hull: "#9f3139", deck: "#dce5e8", house: "#f1f2ed", accent: "#28729a" },
        };
        const theme = semiThemes[rig.theme ?? "odfjell"] ?? { hull: "#315364", deck: "#d9e3e6", house: "#eef2f2", accent: "#f0c85b" };
        // Bore-rigger har brede pongtonger, fire søyler og en markant boretårnsilhuett.
        context.fillStyle = theme.hull;
        context.fillRect(x + 3 * size, SEA_Y - 9, 62 * size, 20); context.fillRect(x + 90 * size, SEA_Y - 9, 62 * size, 20);
        context.fillStyle = theme.hull;
        [18, 49, 101, 132].forEach(offset => context.fillRect(x + offset * size, y + 14, 18 * size, SEA_Y - y - 18));
        context.fillStyle = theme.deck; context.fillRect(x - 7 * size, y, width + 14 * size, 18); context.strokeRect(x - 7 * size, y, width + 14 * size, 18);
        context.fillStyle = theme.house; context.fillRect(x + 78 * size, y - 49 * size, 51 * size, 49 * size); context.strokeRect(x + 78 * size, y - 49 * size, 51 * size, 49 * size);
        context.fillStyle = theme.accent; context.fillRect(x + 84 * size, y - 39 * size, 39 * size, 8 * size);
        context.strokeStyle = "#d7e9e5"; context.lineWidth = 3;
        context.beginPath(); context.moveTo(x + 58 * size, y); context.lineTo(x + 76 * size, y - 92 * size); context.lineTo(x + 95 * size, y); context.moveTo(x + 63 * size, y - 25 * size); context.lineTo(x + 89 * size, y - 25 * size); context.moveTo(x + 67 * size, y - 48 * size); context.lineTo(x + 85 * size, y - 48 * size); context.stroke();
        context.fillStyle = "#ffd45c";
        for (let light = 0; light < 4; light++) context.fillRect(x + (84 + light * 10) * size, y - 20 * size, 5 * size, 5 * size);
        if (rig.name === "COSL Prospector") {
          // Prospector er vinterisert: lukkede, lyse arbeidsområder rundt boredekket.
          context.fillStyle = "rgba(236,244,245,.94)";
          context.beginPath(); context.roundRect(x + 24 * size, y - 43 * size, 48 * size, 43 * size, 6 * size); context.fill(); context.stroke();
          context.fillStyle = "#d9ad22"; context.fillRect(x + 28 * size, y - 34 * size, 40 * size, 7 * size);
          context.fillStyle = "rgba(211,239,245,.7)"; context.fillRect(x + 32 * size, y - 20 * size, 32 * size, 9 * size);
        }
      } else if (rig.kind === "drilljackup") {
        const jackupThemes: Partial<Record<RigTheme, { deck: string; accent: string }>> = {
          noble: { deck: "#284e70", accent: "#e9edf0" },
          transocean: { deck: "#b8343b", accent: "#eef2f3" },
          shelf: { deck: "#e3812c", accent: "#244b6a" },
          catj: { deck: "#b83a35", accent: "#f0c33d" },
        };
        const theme = jackupThemes[rig.theme ?? "noble"] ?? { deck: "#315364", accent: "#e9edf0" };
        context.fillStyle = theme.deck; context.fillRect(x - 7 * size, y, width + 14 * size, 19); context.strokeRect(x - 7 * size, y, width + 14 * size, 19);
        context.strokeStyle = "#b9cbd0"; context.lineWidth = 4;
        [13, 76, 143].forEach(offset => {
          context.beginPath(); context.moveTo(x + offset * size, y + 12); context.lineTo(x + offset * size, HEIGHT); context.stroke();
          context.lineWidth = 1.5;
          for (let brace = 0; brace < 5; brace++) {
            const top = y + 18 + brace * 37;
            context.beginPath(); context.moveTo(x + (offset - 5) * size, top); context.lineTo(x + (offset + 5) * size, top + 28); context.stroke();
          }
          context.lineWidth = 4;
        });
        context.fillStyle = theme.accent; context.fillRect(x + 88 * size, y - 47 * size, 43 * size, 47 * size); context.strokeRect(x + 88 * size, y - 47 * size, 43 * size, 47 * size);
        context.strokeStyle = "#d7e9e5"; context.lineWidth = 3;
        context.beginPath(); context.moveTo(x + 48 * size, y); context.lineTo(x + 65 * size, y - 88 * size); context.lineTo(x + 83 * size, y); context.moveTo(x + 54 * size, y - 31 * size); context.lineTo(x + 77 * size, y - 31 * size); context.stroke();
        context.fillStyle = "#ffd45c"; context.fillRect(x + 95 * size, y - 35 * size, 7 * size, 7 * size); context.fillRect(x + 108 * size, y - 35 * size, 7 * size, 7 * size);
      } else if (rig.kind === "jackup") {
        // Haven: stor, gangveiforbundet jack-up boliginnretning med fire markante bein.
        context.fillStyle = "#dce7e8"; context.fillRect(x, y, width, 17); context.strokeRect(x, y, width, 17);
        context.fillStyle = "#eef3f2"; context.fillRect(x + 62 * size, y - 82 * size, 76 * size, 82 * size); context.strokeRect(x + 62 * size, y - 82 * size, 76 * size, 82 * size);
        context.fillStyle = "#1f5367"; context.fillRect(x + 70 * size, y - 67 * size, 60 * size, 13 * size);
        context.fillStyle = "#ffd45c";
        for (let light = 0; light < 4; light++) context.fillRect(x + (72 + light * 15) * size, y - 43 * size, 7 * size, 7 * size);
        context.strokeStyle = "#b9cbd0"; context.lineWidth = 5;
        [18, 52, 112, 146].forEach(offset => { context.beginPath(); context.moveTo(x + offset * size, y + 12); context.lineTo(x + offset * size, HEIGHT); context.stroke(); });
        // Gangveien går fra Haven mot Valhall-dekket på venstre side.
        const bridgeStart = x - 72 * size, bridgeEnd = x + 10 * size;
        context.strokeStyle = "#d7e9e5"; context.lineWidth = 3;
        context.beginPath(); context.moveTo(bridgeStart, y - 11 * size); context.lineTo(bridgeEnd, y - 7 * size); context.moveTo(bridgeStart, y + 1 * size); context.lineTo(bridgeEnd, y - 3 * size); context.stroke();
        context.lineWidth = 2;
        for (let span = 0; span < 6; span++) {
          const spanX = bridgeStart + span * 14 * size;
          context.beginPath(); context.moveTo(spanX, y - 10 * size); context.lineTo(spanX + 14 * size, y - 3 * size); context.stroke();
        }
      } else if (rig.kind === "spar") {
        // Aasta Hansteen: flytende SPAR med ett dypt, smalt sylinderskrog.
        context.fillStyle = "#d9e6e9"; context.fillRect(x, y, width, 17); context.strokeRect(x, y, width, 17);
        context.fillStyle = "#b53a3c";
        context.beginPath(); context.roundRect(x + 60 * size, y + 14, 48 * size, SEA_Y - y + 38, 18 * size); context.fill(); context.stroke();
        context.fillStyle = "#173846"; context.fillRect(x + 70 * size, y - 54 * size, 54 * size, 54 * size); context.strokeRect(x + 70 * size, y - 54 * size, 54 * size, 54 * size);
        context.strokeStyle = "rgba(215,233,229,.28)"; context.lineWidth = 2;
        context.beginPath(); context.moveTo(x + 64 * size, SEA_Y + 7); context.lineTo(x + 22 * size, HEIGHT); context.moveTo(x + 104 * size, SEA_Y + 7); context.lineTo(x + 148 * size, HEIGHT); context.stroke();
      } else if (rig.kind === "monotower") {
        // Draugen: bredt dekk på én markant betongsøyle, ikke vanlige jacket-bein.
        context.fillStyle = "#173846"; context.fillRect(x - 8 * size, y, width + 18 * size, 18); context.strokeRect(x - 8 * size, y, width + 18 * size, 18);
        context.fillStyle = "#315364";
        context.beginPath(); context.moveTo(x + 55 * size, y + 17); context.lineTo(x + 43 * size, SEA_Y + 18); context.lineTo(x + 116 * size, SEA_Y + 18); context.lineTo(x + 105 * size, y + 17); context.closePath(); context.fill(); context.stroke();
        context.fillStyle = "#e1e8eb"; context.fillRect(x + 78 * size, y - 50 * size, 50 * size, 50 * size); context.strokeRect(x + 78 * size, y - 50 * size, 50 * size, 50 * size);
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
      if (rig.landable !== false) {
        context.strokeStyle = "#20c98b";
        context.lineWidth = 4;
        context.beginPath(); context.arc(x + 38 * size, y - 2, 25 * size, Math.PI, 0); context.stroke();
        context.font = `bold ${Math.max(13, 17 * size)}px sans-serif`;
        context.fillStyle = "#20c98b";
        context.fillText("H", x + 31 * size, y - 5);
      } else {
        context.fillStyle = "#f05252";
        context.fillRect(x + 10 * size, y - 5, 55 * size, 5);
      }
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
      // Blinkende navigasjonslys og skum gjør feltet mer levende uten å påvirke fysikken.
      if (Math.sin(phase * 2.2 + x / 80) > -.15) {
        context.fillStyle = "#ff5d5d"; context.beginPath(); context.arc(x + 132 * size, y - 107 * size, 3.5, 0, Math.PI * 2); context.fill();
      }
      if (["fpso", "circular", "semi", "tlp", "spar"].includes(rig.kind)) {
        context.strokeStyle = "rgba(220,247,250,.42)"; context.lineWidth = 2;
        for (let foam = 0; foam < 3; foam++) {
          const foamX = x + (18 + foam * 48) * size;
          context.beginPath(); context.arc(foamX, SEA_Y + 3, 17 * size, Math.PI, Math.PI * 2); context.stroke();
        }
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
      gradient.addColorStop(0, "#030d18");
      gradient.addColorStop(.48, "#0b2b3f");
      gradient.addColorStop(.82, "#185873");
      gradient.addColorStop(1, "#28758b");
      context.fillStyle = gradient;
      context.fillRect(0, 0, WIDTH, HEIGHT);

      // Små stjerner og lave skybanker gir dybde, men holder landingsområdet ryddig.
      context.fillStyle = "rgba(214,239,245,.38)";
      for (let star = 0; star < 24; star++) {
        const starX = (star * 173 + 47) % WIDTH;
        const starY = 18 + ((star * 67) % 165);
        const twinkle = .45 + Math.sin(game.distance / 90 + star) * .25;
        context.globalAlpha = twinkle;
        context.beginPath(); context.arc(starX, starY, star % 5 === 0 ? 1.5 : .8, 0, Math.PI * 2); context.fill();
      }
      context.globalAlpha = 1;
      const moonGlow = context.createRadialGradient(585, 72, 8, 585, 72, 85);
      moonGlow.addColorStop(0, "rgba(218,241,246,.18)");
      moonGlow.addColorStop(.55, "rgba(180,224,234,.07)");
      moonGlow.addColorStop(1, "rgba(180,224,234,0)");
      context.fillStyle = moonGlow; context.beginPath(); context.arc(585, 72, 85, 0, Math.PI * 2); context.fill();
      context.fillStyle = "rgba(224,240,242,.12)";
      context.beginPath(); context.arc(585, 72, 45, 0, Math.PI * 2); context.fill();
      for (let cloud = 0; cloud < 4; cloud++) {
        const cloudX = ((cloud * 310 - game.distance * (.025 + cloud * .004)) % (WIDTH + 320)) - 110;
        const cloudY = 105 + (cloud % 2) * 58;
        const cloudGradient = context.createRadialGradient(cloudX, cloudY, 8, cloudX, cloudY, 95);
        cloudGradient.addColorStop(0, "rgba(164,205,217,.10)");
        cloudGradient.addColorStop(1, "rgba(70,125,145,0)");
        context.fillStyle = cloudGradient;
        context.beginPath(); context.ellipse(cloudX, cloudY, 125, 32, 0, 0, Math.PI * 2); context.fill();
      }
      if (game.score >= 50) {
        // Sjeldne, lokale lyn gir stormfølelse uten et ubehagelig helskjermblink.
        const lightningPhase = game.distance % 920;
        if (lightningPhase < 58) {
          const storm = Math.floor(game.distance / 920);
          const lightningX = 330 + ((storm * 173) % 420);
          context.save();
          context.shadowColor = "rgba(210,236,255,.9)"; context.shadowBlur = 18;
          context.strokeStyle = `rgba(225,242,255,${.8 - lightningPhase / 90})`; context.lineWidth = 4;
          context.beginPath(); context.moveTo(lightningX, 5); context.lineTo(lightningX - 24, 61); context.lineTo(lightningX + 3, 55); context.lineTo(lightningX - 31, 125); context.stroke();
          context.restore();
        }
      }
      // Et saktegående supply-/standbyfartøy i bakgrunnen.
      const vesselX = WIDTH + 110 - ((game.distance * .2) % (WIDTH + 320));
      context.fillStyle = "rgba(225,238,239,.52)";
      context.fillRect(vesselX + 30, SEA_Y - 29, 35, 18);
      context.fillStyle = "rgba(31,78,91,.72)";
      context.beginPath(); context.moveTo(vesselX, SEA_Y - 12); context.lineTo(vesselX + 95, SEA_Y - 12); context.lineTo(vesselX + 77, SEA_Y + 2); context.lineTo(vesselX + 13, SEA_Y + 2); context.closePath(); context.fill();
      context.fillStyle = "rgba(255,210,82,.7)"; context.fillRect(vesselX + 36, SEA_Y - 24, 6, 5); context.fillRect(vesselX + 48, SEA_Y - 24, 6, 5);
      context.strokeStyle = "rgba(220,247,250,.28)"; context.lineWidth = 2;
      context.beginPath(); context.moveTo(vesselX - 20, SEA_Y + 3); context.lineTo(vesselX + 100, SEA_Y + 3); context.stroke();
      const seaGradient = context.createLinearGradient(0, SEA_Y, 0, HEIGHT);
      seaGradient.addColorStop(0, "#13536b");
      seaGradient.addColorStop(.12, "#0b3d56");
      seaGradient.addColorStop(.48, "#082b40");
      seaGradient.addColorStop(1, "#03111d");
      context.fillStyle = seaGradient;
      context.fillRect(0, SEA_Y, WIDTH, HEIGHT - SEA_Y);
      // Måneskinn og myke speilinger under installasjonene binder sjø og objekter sammen.
      const reflection = context.createLinearGradient(0, SEA_Y, 0, HEIGHT);
      reflection.addColorStop(0, "rgba(180,229,237,.16)");
      reflection.addColorStop(1, "rgba(180,229,237,0)");
      context.fillStyle = reflection;
      context.beginPath(); context.moveTo(548, SEA_Y); context.lineTo(622, SEA_Y); context.lineTo(665, HEIGHT); context.lineTo(505, HEIGHT); context.closePath(); context.fill();
      game.rigs.forEach(rig => {
        const center = rig.x + 77 * rig.size;
        const rigReflection = context.createLinearGradient(center, SEA_Y, center, HEIGHT);
        rigReflection.addColorStop(0, "rgba(138,211,220,.10)");
        rigReflection.addColorStop(1, "rgba(26,91,111,0)");
        context.fillStyle = rigReflection;
        context.beginPath(); context.moveTo(center - 30 * rig.size, SEA_Y); context.lineTo(center + 30 * rig.size, SEA_Y); context.lineTo(center + 12 * rig.size, HEIGHT); context.lineTo(center - 12 * rig.size, HEIGHT); context.closePath(); context.fill();
      });
      context.strokeStyle = "rgba(206,239,244,.24)";
      context.lineWidth = 2;
      for (let row = 0; row < 4; row++) {
        context.beginPath();
        for (let x = -20; x <= WIDTH + 20; x += 20) {
          const y = SEA_Y + row * 13 + Math.sin((x + game.distance * .8) / 26) * 4;
          x === -20 ? context.moveTo(x, y) : context.lineTo(x, y);
        }
        context.stroke();
      }
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
      drawHelicopter(game.y, Math.max(-.18, Math.min(.22, game.velocity / 650)), game.distance / 4, game.helicopterColor);
      if (game.score >= 15) {
        const rainAmount = Math.min(48, 18 + game.score);
        context.strokeStyle = `rgba(200,232,240,${Math.min(.34, .16 + game.score / 300)})`;
        context.lineWidth = 1.5;
        for (let drop = 0; drop < rainAmount; drop++) {
          const rainX = (drop * 79 + game.distance * 2.1) % (WIDTH + 80) - 40;
          const rainY = (drop * 47 + game.distance * 1.15) % (SEA_Y + 80) - 40;
          context.beginPath(); context.moveTo(rainX, rainY); context.lineTo(rainX - 8, rainY + 21); context.stroke();
        }
      }
      if (game.score >= 30) {
        const fog = Math.min(.18, .06 + (game.score - 30) / 350);
        context.fillStyle = `rgba(205,225,226,${fog})`; context.fillRect(0, 110, WIDTH, 270);
      }
      if (game.score >= 10) {
        const gust = Math.sin(game.distance / 125);
        context.fillStyle = "rgba(3,18,27,.65)"; context.fillRect(WIDTH - 150, 15, 134, 48);
        context.fillStyle = "#b8d0d6"; context.font = "800 16px sans-serif";
        context.fillText(`VIND ${gust > 0 ? "↓" : "↑"} ${Math.round(Math.abs(gust) * Math.min(18, 7 + game.score / 5))} m/s`, WIDTH - 136, 46);
      }
      if (game.state !== "running") {
        const feedback = resultFeedback(game.score);
        context.fillStyle = "rgba(3,13,22,.72)";
        context.fillRect(0, 0, WIDTH, HEIGHT);
        context.textAlign = "center";
        context.fillStyle = "#fff";
        context.font = "900 34px sans-serif";
        context.fillText(game.state === "ready" ? "SPLIT FLIGHT" : feedback.title, WIDTH / 2, 184);
        context.font = "600 18px sans-serif";
        context.fillStyle = "#b8d0d6";
        context.fillText(game.state === "ready" ? "Patruljer feltet og unngå de russiske dronene" : feedback.subtitle, WIDTH / 2, 222);
        context.fillStyle = "#20c98b";
        context.font = "800 17px sans-serif";
        context.fillText(game.state === "ready" ? "TRYKK FOR Å STARTE VAKTRUNDEN" : "TRYKK FOR Å PRØVE IGJEN", WIDTH / 2, 282);
        context.textAlign = "start";
      }
      if (game.crashAt) {
        const elapsed = performance.now() - game.crashAt;
        if (elapsed < 1050) {
          const progress = elapsed / 1050;
          const radius = 16 + progress * 72;
          context.save();
          context.globalAlpha = Math.max(0, 1 - progress);
          context.fillStyle = "rgba(255,90,28,.24)"; context.beginPath(); context.arc(game.crashX, game.crashY, radius * 1.35, 0, Math.PI * 2); context.fill();
          context.fillStyle = "#ff5d24"; context.beginPath(); context.arc(game.crashX, game.crashY, radius * .72, 0, Math.PI * 2); context.fill();
          context.fillStyle = "#ffd45c"; context.beginPath(); context.arc(game.crashX - 5, game.crashY - 5, radius * .4, 0, Math.PI * 2); context.fill();
          for (let spark = 0; spark < 18; spark++) {
            const angle = spark * (Math.PI * 2 / 18) + .35;
            const travel = radius * (.7 + (spark % 4) * .14);
            const sparkX = game.crashX + Math.cos(angle) * travel;
            const sparkY = game.crashY + Math.sin(angle) * travel + progress * 24;
            context.fillStyle = spark % 3 ? "#ffd45c" : "#ff6b32";
            context.beginPath(); context.arc(sparkX, sparkY, Math.max(1, 4 - progress * 3), 0, Math.PI * 2); context.fill();
          }
          context.fillStyle = "rgba(35,43,48,.72)";
          for (let smoke = 0; smoke < 5; smoke++) {
            context.beginPath(); context.arc(game.crashX + (smoke - 2) * 12, game.crashY - radius * .5 - smoke * 5, 10 + progress * 12, 0, Math.PI * 2); context.fill();
          }
          context.restore();
        }
      }
    }

    function loop(time: number) {
      const game = gameRef.current;
      const delta = Math.min(.034, Math.max(0, (time - (game.lastTime || time)) / 1000));
      game.lastTime = time;
      if (game.state === "running") {
        // Farten øker merkbart for hver landing og flater først ut på et høyere nivå.
        // Det gjør lange vaktrunder vanskeligere uten å gjøre 100 landinger umulig.
        const speed = 122 + Math.min(125, game.score * 10);
        const gustForce = game.score >= 10 ? Math.sin(game.distance / 125) * Math.min(34, 10 + (game.score - 10) * .55) : 0;
        game.velocity += (390 + gustForce) * delta;
        game.y += game.velocity * delta;
        game.distance += speed * delta;
        game.rigs.forEach(rig => { rig.x -= speed * delta; });
        game.drones.forEach(drone => { drone.x -= speed * delta; });

        const lastRig = game.rigs[game.rigs.length - 1];
        if (lastRig.x < 510) {
          const nextName = PLATFORM_NAMES[game.nextRigIndex % PLATFORM_NAMES.length];
          const nextRig = createRig(lastRig.x + 475 + Math.random() * 120, game.nextRigIndex);
          game.rigs.push(nextRig);
          game.nextRigIndex += 1;
          // Haven følger Valhall fra samme øyeblikk som Valhall opprettes.
          // Dermed blir ikke Haven plutselig lastet inn først når Valhall er midt på skjermen.
          if (nextName === "Valhall" && PLATFORM_NAMES[game.nextRigIndex % PLATFORM_NAMES.length] === "Haven") {
            const haven = createRig(nextRig.x + 245, game.nextRigIndex);
            haven.padY = nextRig.padY + 8;
            game.rigs.push(haven);
            game.nextRigIndex += 1;
          }
        }
        game.rigs = game.rigs.filter(rig => rig.x > -180);
        game.rigs.forEach(rig => {
          if (rig.landable !== false && !rig.scored && !rig.missed && rig.x + 88 * rig.size < HELI_X - 40) {
            rig.missed = true;
            game.streak = 0;
            setStreak(0);
          }
        });
        if (!game.drones.length || game.drones[game.drones.length - 1].x < 470) {
          game.drones.push({ x: WIDTH + 40 + Math.random() * 220, y: 105 + Math.random() * 185, phase: Math.random() * 6 });
        }
        game.drones = game.drones.filter(drone => drone.x > -40);

        // Hjulene er tegnet med nederkant 25 px under helikopterets sentrum.
        // Bruk samme punkt i fysikken, så en synlig hjulkontakt faktisk teller.
        const heliBottom = game.y + 25;
        for (const rig of game.rigs) {
          const overlapsPad = rig.x < HELI_X + 42 && rig.x + 88 * rig.size > HELI_X - 40;
          if (rig.landable === false) {
            if (overlapsPad && heliBottom >= rig.padY - 3 && heliBottom <= rig.padY + 22) finish();
            continue;
          }
          const approachingPad = overlapsPad && heliBottom > rig.padY - 40 && heliBottom < rig.padY - 3;
          if (!rig.scored && approachingPad && game.velocity > 15) {
            game.velocity *= .91;
            game.y += (rig.padY - 21 - game.y) * .03;
          }
          if (overlapsPad && heliBottom >= rig.padY - 3) {
            if (!rig.scored && heliBottom <= rig.padY + 14 && game.velocity < 190) {
              rig.scored = true;
              game.score += 1;
              game.streak += 1;
              game.bestStreak = Math.max(game.bestStreak, game.streak);
              game.velocity = -170;
              game.y = rig.padY - 29;
              setScore(game.score);
              setStreak(game.streak);
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
    <audio ref={audioRef} src="/split-flight-theme.mp3" loop preload="none" />
    <audio ref={finalAudioRef} src="/split-flight-final-stage.mp3" loop preload="none" />
    <div ref={gameAreaRef} className={`game-fullscreen-area${mobilePlayMode ? " mobile-game-mode" : ""}`}>
    <div className="game-header">
      <div><span className="eyebrow">DRONEVAKTA</span><h2 id="rig-runner-title">Split Flight</h2></div>
      <div className="game-score"><span>Landinger <b>{score}</b></span><span>På rad <b>{streak}</b></span><span>Rekord <b>{best}</b></span><span>Best på rad <b>{bestStreak}</b></span></div>
      <div className="game-window-actions"><button onClick={toggleSound} aria-label={soundOn ? "Slå av musikk" : "Slå på musikk"} title={soundOn ? "Slå av musikk" : "Slå på musikk"}>{soundOn ? "🔊" : "🔇"}</button><button onClick={toggleFullscreen} aria-label={isFullscreen || mobilePlayMode ? "Avslutt fullskjerm" : "Vis i fullskjerm"}>{isFullscreen || mobilePlayMode ? "↙" : "⛶"}</button><button className="calendar-close" onClick={onClose} aria-label="Lukk">×</button></div>
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
        <section className="leaderboard-section"><div><span className="eyebrow">TOPP 10</span><h3>Flest landinger</h3></div>{leaderboard.length ? <ol>{leaderboard.map((entry, index) => <li key={entry.user_id} className={entry.user_id === user?.id ? "is-me" : ""}><span><b>{index + 1}</b>{entry.display_name}</span><strong>{entry.score}</strong></li>)}</ol> : <p className="leaderboard-empty">Ingen resultater ennå.</p>}</section>
        <section className="leaderboard-section"><div><span className="eyebrow">TOPP 10</span><h3>Flest helidekk på rad</h3></div>{streakLeaderboard.filter(entry => entry.best_streak > 0).length ? <ol>{streakLeaderboard.filter(entry => entry.best_streak > 0).map((entry, index) => <li key={entry.user_id} className={entry.user_id === user?.id ? "is-me" : ""}><span><b>{index + 1}</b>{entry.display_name}</span><strong>{entry.best_streak}</strong></li>)}</ol> : <p className="leaderboard-empty">Første rekord på helidekk i rad er fortsatt ledig!</p>}</section>
        {scoreMessage && <p className="game-score-message" role="status">{scoreMessage}</p>}
        {!user ? <><p className="leaderboard-login-help">Logg inn for å lagre toppscoren din og velge spillnavn.</p><button className="secondary full-width" onClick={onLogin}>Logg inn for å lagre toppscore</button></> : <form className="game-name-form" onSubmit={saveNickname}><label htmlFor="game-name">Ditt spillnavn</label><div><input id="game-name" value={nicknameDraft} maxLength={20} placeholder="F.eks. Nordsjøpiloten" onChange={event => setNicknameDraft(event.target.value)} /><button type="submit">Lagre</button></div>{nameMessage && <small>{nameMessage}</small>}</form>}
      </aside>
    </div>
    </div>
  </Modal>;
}
