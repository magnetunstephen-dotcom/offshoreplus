import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { Modal } from "./Modal";

interface Props { user: User | null; syncState: string; onClose: () => void; }

export function AccountModal({ user, syncState, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendLink() {
    if (!email.trim()) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    setMessage(error ? `Kunne ikke sende lenken: ${error.message}` : "Sjekk e-posten din. Trykk på lenken for å logge inn.");
  }

  async function signOut() { await supabase.auth.signOut(); onClose(); }

  return <Modal onClose={onClose} labelledBy="account-title" className="account-modal">
    <div className="account-header"><div><span className="eyebrow">OffshorePlus-konto</span><h2 id="account-title">{user ? "Kontoen din" : "Logg inn eller opprett konto"}</h2></div><button className="calendar-close" onClick={onClose} aria-label="Lukk">×</button></div>
    {user ? <div className="account-signed-in"><div className="account-avatar">{(user.email?.[0] || "O").toUpperCase()}</div><strong>{user.email}</strong><span>{syncState}</span><div className="account-benefits"><span>✓ Turer og årsoversikt synkroniseres</span><span>✓ Samme data på mobil og PC</span><span>✓ Lokal kopi ved dårlig dekning</span></div><button className="secondary full-width" onClick={signOut}>Logg ut</button></div> : <div className="account-login"><p>Bruk e-postadressen din. Du får en sikker innloggingslenke og trenger ikke passord.</p><label>E-post<input type="email" autoComplete="email" placeholder="navn@epost.no" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && sendLink()}/></label><button className="primary full-width" disabled={busy || !email.trim()} onClick={sendLink}>{busy ? "Sender …" : "Send innloggingslenke"}</button>{message && <div className="account-message">{message}</div>}<small>Data som allerede ligger på denne enheten, flyttes automatisk til kontoen etter innlogging.</small></div>}
  </Modal>;
}
