import { useEffect, useRef } from "react";
import { OffshorePlusLogo } from "./Icons";

export function WelcomeDialog({ onClose, onLogin, onSetup, onGame }: {
  onClose: () => void; onLogin: () => void; onSetup: () => void; onGame: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="welcome-dialog" aria-labelledby="welcome-title" onCancel={onClose}>
    <button autoFocus className="modal-corner-close" onClick={onClose} aria-label="Lukk velkomst">×</button>
    <div className="large-mark"><OffshorePlusLogo size={56} /></div>
    <h1 id="welcome-title">Se hva turen din blir verdt</h1>
    <p>Følg lønn, turnus og tiden til hjemreise – mens sekundene går.</p>
    <p className="welcome-demo-note">Bak vinduet kjører en demo: F2, 2/4-turnus og utreise for én uke siden.</p>
    <div className="welcome-actions">
      <button className="primary large-button" onClick={onLogin}>Logg inn / opprett gratis konto</button>
      <button className="secondary large-button" onClick={onClose}>Se demoen</button>
    </div>
    <p className="welcome-help">Med konto kan du synkronisere dine egne turer, lagre Split Flight-rekorder og se topp 10.</p>
    <div className="welcome-actions">
      <button className="secondary" onClick={onGame}>Prøv Split Flight 🚁</button>
      <button className="secondary" onClick={onSetup}>Sett opp tur uten konto</button>
    </div>
  </dialog>;
}
