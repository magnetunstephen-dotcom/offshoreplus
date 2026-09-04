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
import { loadTheme, loadTrip, saveTheme, saveTrip, STORAGE_CHANGED_EVENT } from "./lib/storage";
import { pushLocalData, syncAccount } from "./lib/cloud";
import { supabase, supabaseConfigured } from "./lib/supabase";
import type { EarningsView, TripSetup } from "./types";
import { MoonIcon, SunIcon } from "./components/Icons";

type ModalName = "wizard" | "calendar" | "settings" | "additions" | "earnings-info" | "cv" | "certificates" | "my-year" | "account" | "feedback" | null;

export default function App() {
  const initialTrip = loadTrip();
  const [trip, setTrip] = useState<TripSetup | null>(() => initialTrip);
  const [modal, setModal] = useState<ModalName>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => loadTheme());
  const [user, setUser] = useState<User | null>(null);
  const [syncState, setSyncState] = useState("Ikke synkronisert ennå");
  const syncTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
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
    if (closeModal) setModal(null);
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    saveTheme(nextTheme);
  }

  function changeEarningsView(view: EarningsView) {
    if (!trip) return;
    storeTrip({ ...trip, earningsView: view }, false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><span className="brand-o">O</span><span className="brand-plus">+</span></span>
          <span>OffshorePlus</span>
        </div>
        <div className="topbar-actions"><button className={`account-button ${user ? "signed-in" : ""}`} onClick={() => setModal("account")}><span>{user ? (user.email?.[0] || "O").toUpperCase() : "○"}</span>{user ? "Min konto" : "Logg inn"}</button><button className="theme-button" onClick={toggleTheme} aria-label="Bytt tema">
          {theme === "dark" ? <SunIcon size={19} /> : <MoonIcon size={19} />}
        </button></div>
      </header>

      {trip ? (
        <Dashboard
          trip={trip}
          onNewTrip={() => setModal("wizard")}
          onCalendar={() => setModal("calendar")}
          onSettings={() => setModal("settings")}
          onAdditions={() => setModal("additions")}
          onEarningsInfo={() => setModal("earnings-info")}
          onCv={() => setModal("cv")}
          onCertificates={() => setModal("certificates")}
          onMyYear={() => setModal("my-year")}
          onChangeEarningsView={changeEarningsView}
        />
      ) : (
        <main className="empty-state">
          <div className="large-mark"><span className="brand-o">O</span><span className="brand-plus">+</span></div>
          <h1>OffshorePlus</h1>
          <p>En enkel oversikt over offshore-tur, lønn og turnus.</p>
          <button className="primary large-button" onClick={() => setModal("wizard")}>
            Start ny tur
          </button>
        </main>
      )}

      <button className="feedback-bubble" onClick={() => setModal("feedback")} aria-label="Send tilbakemelding"><span>💬</span><b>Tips eller feil?</b></button>

      {modal === "wizard" && (
        <Wizard
          existingTrip={trip}
          onComplete={(nextTrip) => storeTrip(nextTrip)}
          onCancel={trip ? () => setModal(null) : undefined}
        />
      )}

      {modal === "calendar" && trip && (
        <CalendarModal trip={trip} onClose={() => setModal(null)} />
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
      {modal === "account" && <AccountModal user={user} syncState={syncState} onClose={() => setModal(null)} />}
      {modal === "feedback" && <FeedbackModal user={user} onClose={() => setModal(null)} onLogin={() => setModal("account")} />}

      {modal === "earnings-info" && trip && (
        <EarningsInfoModal trip={trip} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
