import { createDemoTrip } from "./lib/demoTrip";
import { WelcomeDialog } from "./components/WelcomeDialog";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AdditionsModal } from "./components/AdditionsModal";
import { CalendarModal } from "./components/CalendarModal";
import { Dashboard } from "./components/Dashboard";
import { EarningsInfoModal } from "./components/EarningsInfoModal";
import { SettingsModal } from "./components/SettingsModal";
import { Wizard } from "./components/Wizard";
import { CvModal } from "./components/CvModal";
import { CertificatesModal } from "./components/CertificatesModal";
import { MyYearModal } from "./components/MyYearModal";
import { AccountModal } from "./components/AccountModal";
import { FeedbackModal } from "./components/FeedbackModal";
import { loadAutoDisabledYears, loadTheme, loadTrip, loadUserProfile, loadYearTrips, saveTheme, saveTrip, saveYearTrips, STORAGE_CHANGED_EVENT } from "./lib/storage";
import { automaticYearTrips, refreshMatchingYearTrip } from "./lib/year";
import { tripSetupForDate } from "./lib/rotation";
import { pushLocalData, syncAccount } from "./lib/cloud";
import { supabase, supabaseConfigured } from "./lib/supabase";
import type { EarningsView, TripSetup } from "./types";
import { MoonIcon, OffshorePlusLogo, SunIcon } from "./components/Icons";
import { InstallAppPrompt } from "./components/InstallAppPrompt";
import { PrivacyModal } from "./components/PrivacyModal";
import { PasswordResetModal } from "./components/PasswordResetModal";
import { RigRunnerModal } from "./components/RigRunnerModal";

type ModalName = "wizard" | "calendar" | "settings" | "additions" | "earnings-info" | "cv" | "certificates" | "my-year" | "account" | "feedback" | "privacy" | "password-reset" | "rig-runner" | null;

export default function App() {
  const initialTrip = loadTrip();
  const [trip, setTrip] = useState<TripSetup | null>(() => initialTrip);
  const [modal, setModal] = useState<ModalName>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => loadTheme());
  const [user, setUser] = useState<User | null>(null);
  const [demoTrip, setDemoTrip] = useState(createDemoTrip);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const displayedTrip = trip ?? demoTrip;
  const isDemo = !trip;
  function dismissWelcome() {
    sessionStorage.setItem("offshoreplus-welcome-seen", "1");
    setWelcomeOpen(false);
  }
  function welcomeAction(next: ModalName) { dismissWelcome(); setModal(next); }
  useEffect(() => {
    if (!authReady || user || trip || modal || sessionStorage.getItem("offshoreplus-welcome-seen")) return;
    const timer = window.setTimeout(() => setWelcomeOpen(true), 1400);
    return () => window.clearTimeout(timer);
  }, [authReady, user, trip, modal]);
  const [syncState, setSyncState] = useState("Ikke synkronisert ennå");
  const syncTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!trip) return;
    const archiveCompletedTrips = () => {
      const existing = loadYearTrips();
      const generated = automaticYearTrips(trip, loadUserProfile(), existing, loadAutoDisabledYears());
      if (generated.length) saveYearTrips([...existing, ...generated]);
    };
    archiveCompletedTrips();
    const timer = window.setInterval(archiveCompletedTrips, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [trip]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setAuthReady(true); }).catch(() => setAuthReady(true));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setSyncState("Logg inn for sikker synkronisering"); return; }
    setSyncState("Synkroniserer …");
    syncAccount(user).then(data => { setTrip(data.trip); setSyncState("Alt er synkronisert"); }).catch(() => setSyncState("Synkronisering feilet – lokal kopi er trygg"));
    const handleChange = () => {
      window.clearTimeout(syncTimer.current);
      syncTimer.current = window.setTimeout(() => {
        setSyncState("Synkroniserer …");
        pushLocalData(user).then(() => setSyncState("Alt er synkronisert")).catch(() => setSyncState("Venter på nettforbindelse"));
      }, 700);
    };
    window.addEventListener(STORAGE_CHANGED_EVENT, handleChange);
    return () => { window.removeEventListener(STORAGE_CHANGED_EVENT, handleChange); window.clearTimeout(syncTimer.current); };
  }, [user]);

  function storeTrip(nextTrip: TripSetup, closeModal = true) {
    setTrip(nextTrip);
    saveTrip(nextTrip);
    const rows = loadYearTrips();
    const updatedRows = refreshMatchingYearTrip(rows, tripSetupForDate(nextTrip), loadUserProfile());
    if (updatedRows !== rows) saveYearTrips(updatedRows);
    if (closeModal) setModal(null);
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    saveTheme(nextTheme);
  }

  function changeEarningsView(view: EarningsView) {
    if (!trip) { setDemoTrip(current => ({ ...current, earningsView: view })); return; }
    storeTrip({ ...trip, earningsView: view }, false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><OffshorePlusLogo size={29} /></span>
          <span>OffshorePlus</span>
        </div>
        <div className="topbar-actions"><button className={`account-button ${user ? "signed-in" : "login-glow"}`} onClick={() => setModal("account")}><span>{user ? (user.email?.[0] || "O").toUpperCase() : "○"}</span>{user ? "Min konto" : "Logg inn"}</button><button className="theme-button" onClick={toggleTheme} aria-label="Bytt tema">
          {theme === "dark" ? <SunIcon size={19} /> : <MoonIcon size={19} />}
        </button></div>
      </header>

      {isDemo && <div className="demo-banner" role="note"><div><strong>LIVE DEMO · F2</strong><span>Eksempeltur startet for én uke siden · 2 uker på / 4 uker av · tallene er ikke dine egne</span></div><button className="secondary" onClick={() => setModal("wizard")}>Sett opp min tur</button></div>}
        <Dashboard
          trip={displayedTrip}
          onNewTrip={() => setModal("wizard")}
          onCalendar={() => setModal("calendar")}
          onSettings={() => setModal(trip ? "settings" : "wizard")}
          onAdditions={() => setModal(trip ? "additions" : "wizard")}
          onEarningsInfo={() => setModal("earnings-info")}
          onCv={() => setModal("cv")}
          onCertificates={() => setModal("certificates")}
          onMyYear={() => setModal(trip ? "my-year" : "wizard")}
          onGame={() => setModal("rig-runner")}
          onChangeEarningsView={changeEarningsView}
        />
      {welcomeOpen && !user && isDemo && !modal && <WelcomeDialog onClose={dismissWelcome} onLogin={() => welcomeAction("account")} onSetup={() => welcomeAction("wizard")} onGame={() => welcomeAction("rig-runner")} />}

      <button className="feedback-bubble" onClick={() => setModal("feedback")} aria-label="Send tilbakemelding"><span>💬</span><b>Tips eller feil?</b></button>
      <InstallAppPrompt />
      <button className="privacy-footer" onClick={() => setModal("privacy")}>Personvern · Vilkår</button>

      {modal === "wizard" && (
        <Wizard
          existingTrip={trip}
          onComplete={(nextTrip) => storeTrip(nextTrip)}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === "calendar" && (
        <CalendarModal trip={displayedTrip} onClose={() => setModal(null)} />
      )}

      {modal === "settings" && trip && (
        <SettingsModal
          trip={trip}
          onClose={() => setModal(null)}
          onSave={(nextTrip) => storeTrip(nextTrip)}
        />
      )}

      {modal === "additions" && trip && (
        <AdditionsModal
          trip={trip}
          onClose={() => setModal(null)}
          onSave={(nextTrip) => storeTrip(nextTrip, false)}
        />
      )}

      {modal === "cv" && <CvModal onClose={() => setModal(null)} />}
      {modal === "certificates" && <CertificatesModal onClose={() => setModal(null)} />}
      {modal === "my-year" && trip && <MyYearModal trip={trip} onClose={() => setModal(null)} />}
      {modal === "account" && <AccountModal user={user} syncState={syncState} onClose={() => setModal(null)} onPrivacy={() => setModal("privacy")} onForgot={() => setModal("password-reset")} />}
      {modal === "feedback" && <FeedbackModal user={user} onClose={() => setModal(null)} onLogin={() => setModal("account")} />}
      {modal === "privacy" && <PrivacyModal onClose={() => setModal(null)} />}
      {modal === "password-reset" && <PasswordResetModal onClose={() => setModal(null)} />}
      {modal === "rig-runner" && <RigRunnerModal user={user} onClose={() => setModal(null)} onLogin={() => setModal("account")} />}

      {modal === "earnings-info" && (
        <EarningsInfoModal trip={displayedTrip} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
