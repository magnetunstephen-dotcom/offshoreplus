import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Modal } from "./Modal";

interface Props { onClose: () => void; }

export function PasswordResetModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function sendCode() {
    if (!email.trim()) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setBusy(false);
    if (error) setMessage(/rate limit/i.test(error.message) ? "Vent litt før du ber om en ny kode." : "Kunne ikke sende kode. Kontroller e-postadressen.");
    else { setStep("reset"); setMessage("Vi har sendt en kode til e-posten din."); }
  }

  async function choosePassword() {
    if (code.length < 6 || password.length < 8) return;
    setBusy(true); setMessage("");
    const { error: codeError } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: "recovery" });
    if (codeError) { setBusy(false); setMessage("Koden er feil eller har utløpt."); return; }
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMessage("Passordet kunne ikke endres. Prøv igjen.");
    else setStep("done");
  }

  return <Modal onClose={onClose} labelledBy="reset-title" className="account-modal">
    <div className="account-header"><div><span className="eyebrow">OffshorePlus-konto</span><h2 id="reset-title">Glemt passord</h2></div><button className="calendar-close" onClick={onClose} aria-label="Lukk">×</button></div>
    {step === "email" ? <div className="account-login"><p>Skriv inn e-postadressen din, så sender vi en kort kode.</p><label>E-post<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label><button className="primary full-width" disabled={busy || !email.trim()} onClick={sendCode}>{busy ? "Sender …" : "Send kode"}</button></div>
    : step === "reset" ? <div className="account-login"><p>Skriv inn koden sendt til <strong>{email}</strong>, og velg et nytt passord.</p><label>Kode<input className="otp-input" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} /></label><label>Nytt passord<input type="password" autoComplete="new-password" minLength={8} placeholder="Minst 8 tegn" value={password} onChange={e => setPassword(e.target.value)} /></label><button className="primary full-width" disabled={busy || code.length < 6 || password.length < 8} onClick={choosePassword}>{busy ? "Endrer …" : "Velg nytt passord"}</button><button className="text-button" onClick={sendCode}>Send ny kode</button></div>
    : <div className="feedback-success"><span>✓</span><h3>Passordet er endret</h3><p>Du er nå logget inn med det nye passordet.</p><button className="primary full-width" onClick={onClose}>Ferdig</button></div>}
    {message && <div className="account-message">{message}</div>}
  </Modal>;
}
