import { useEffect, useState } from "react";
import { AdditionsModal } from "./components/AdditionsModal";
import { CalendarModal } from "./components/CalendarModal";
import { Dashboard } from "./components/Dashboard";
import { EarningsInfoModal } from "./components/EarningsInfoModal";
import { SettingsModal } from "./components/SettingsModal";
import { Wizard } from "./components/Wizard";
import { loadTheme, loadTrip, saveTheme, saveTrip } from "./lib/storage";
import type { EarningsView, TripSetup } from "./types";
import { MoonIcon, SunIcon } from "./components/Icons";

type ModalName = "wizard" | "calendar" | "settings" | "additions" | "earnings-info" | null;

export default function App() {
  const initialTrip = loadTrip();
  const [trip, setTrip] = useState<TripSetup | null>(() => initialTrip);
  const [modal, setModal] = useState<ModalName>(() => (initialTrip ? "wizard" : null));
  const [theme, setTheme] = useState<"dark" | "light">(() => loadTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

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
        <button className="theme-button" onClick={toggleTheme} aria-label="Bytt tema">
          {theme === "dark" ? <SunIcon size={19} /> : <MoonIcon size={19} />}
        </button>
      </header>

      {trip ? (
        <Dashboard
          trip={trip}
          onNewTrip={() => setModal("wizard")}
          onCalendar={() => setModal("calendar")}
          onSettings={() => setModal("settings")}
          onAdditions={() => setModal("additions")}
          onEarningsInfo={() => setModal("earnings-info")}
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

      {modal === "earnings-info" && trip && (
        <EarningsInfoModal trip={trip} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
