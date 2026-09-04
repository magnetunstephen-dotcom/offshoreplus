import { useEffect, useState } from "react";
import { OffshorePlusLogo } from "./Icons";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppPrompt() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    if (standalone || sessionStorage.getItem("offshoreplus-install-dismissed")) return;

    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      window.setTimeout(() => setVisible(true), 1800);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    if (isiOS) window.setTimeout(() => { setShowIosHelp(true); setVisible(true); }, 1800);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  function dismiss() {
    sessionStorage.setItem("offshoreplus-install-dismissed", "1");
    setVisible(false);
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") setVisible(false);
    setPromptEvent(null);
  }

  if (!visible) return null;
  return <aside className="install-card" aria-label="Installer OffshorePlus">
    <span className="install-icon"><OffshorePlusLogo size={34} /></span>
    <div><strong>Ha OffshorePlus som app</strong><small>{showIosHelp ? "Trykk Del og velg «Legg til på Hjem-skjerm»." : "Åpnes fra hjemskjermen – uten nettleserfelt."}</small></div>
    {promptEvent && <button className="install-action" onClick={install}>Installer</button>}
    <button className="install-close" onClick={dismiss} aria-label="Ikke nå">×</button>
  </aside>;
}
