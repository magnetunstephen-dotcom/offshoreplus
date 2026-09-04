import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { Modal } from "./Modal";

interface Props { user: User | null; syncState: string; onClose: () => void; onPrivacy: () => void; onForgot: () => void; }

interface Feedback { id: number; user_email: string; category: string; message: string; status: string; created_at: string; }
const OWNER_EMAIL = "magnetun.stephen@gmail.com";

export function AccountModal({ user, syncState, onClose, onPrivacy, onForgot }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "verify">("login");
  const [deleteText, setDeleteText] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendWait, setResendWait] = useState(0);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL;

  useEffect(() => {
    if (!isOwner) return;
    supabase.from("feedback").select("*").order("created_at", { ascending: false }).then(({ data }) => setFeedback((data as Feedback[]) || []));
  }, [isOwner]);

  useEffect(() => {
    if (resendWait <= 0) return;
    const timer = window.setInterval(() => setResendWait(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendWait]);

  async function setFeedbackStatus(id: number, status: string) {
    const { error } = await supabase.from("feedback").update({ status }).eq("id", id);
    if (!error) setFeedback(items => items.map(item => item.id === id ? { ...item, status } : item));
  }

  function authError(text: string) {
    if (/invalid login credentials/i.test(text)) return "Feil e-post eller passord.";
    if (/email not confirmed/i.test(text)) return "E-postadressen er ikke bekreftet ennå.";
    if (/already registered|already been registered/i.test(text)) return "Det finnes allerede en konto med denne e-posten.";
    if (/rate limit|too many requests/i.test(text)) return "En bekreftelseskode er nylig sendt. Sjekk innboksen og søppelpost, eller vent litt før du ber om en ny.";
    if (/password/i.test(text)) return "Passordet må inneholde minst 8 tegn.";
    return `Kunne ikke fullføre: ${text}`;
  }

  async function login() {
    if (!email.trim() || !password) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setMessage(authError(error.message)); else onClose();
  }

  async function signup() {
    if (!email.trim() || password.length < 8) return;
    setBusy(true); setMessage("");
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setMessage(authError(error.message));
      if (/rate limit|too many requests/i.test(error.message)) { setMode("verify"); setResendWait(60); }
    }
    else if (data.session) onClose();
    else { setMode("verify"); setResendWait(60); setMessage("Vi har sendt en bekreftelseskode til e-posten din."); }
  }

  async function resendCode() {
    if (!email.trim() || resendWait > 0) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    setBusy(false);
    if (error) {
      setMessage(authError(error.message));
      if (/rate limit|too many requests/i.test(error.message)) setResendWait(60);
    } else {
      setResendWait(60);
      setMessage("En ny bekreftelseskode er sendt.");
    }
  }

  async function verify() {
    if (!email.trim() || code.trim().length < 6) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) setMessage("Koden er feil eller har utløpt. Be om en ny kode og prøv igjen."); else onClose();
  }

  async function deleteAccount() {
    if (deleteText !== "SLETT") return;
    setBusy(true); setMessage("");
    const { error } = await supabase.rpc("delete_own_account");
    if (error) { setBusy(false); setMessage("Kontoen kunne ikke slettes. Prøv igjen eller send oss en tilbakemelding."); return; }
    await supabase.auth.signOut();
    localStorage.clear();
    setBusy(false);
    onClose();
    window.location.reload();
  }

  async function signOut() { await supabase.auth.signOut(); onClose(); }

  return <Modal onClose={onClose} labelledBy="account-title" className="account-modal">
    <div className="account-header"><div><span className="eyebrow">OffshorePlus-konto</span><h2 id="account-title">{user ? "Kontoen din" : "Logg inn eller opprett konto"}</h2></div><button className="calendar-close" onClick={onClose} aria-label="Lukk">×</button></div>
    {!user && <div className="free-account-note"><strong>Gratis å bruke</strong><span>Det koster ingenting å opprette konto eller bruke OffshorePlus.</span></div>}
    {user ? <div className="account-signed-in"><div className="account-avatar">{(user.email?.[0] || "O").toUpperCase()}</div><strong>{user.email}</strong><span>{syncState}</span><div className="account-benefits"><span>✓ Turer og årsoversikt synkroniseres</span><span>✓ Samme data på mobil og PC</span><span>✓ Lokal kopi ved dårlig dekning</span></div>{isOwner && <section className="feedback-inbox"><div className="feedback-inbox-title"><h3>Tilbakemeldinger</h3><span>{feedback.filter(x => x.status !== "ferdig").length} åpne</span></div>{feedback.length === 0 ? <p>Ingen tilbakemeldinger ennå.</p> : feedback.map(item => <article key={item.id} className={`feedback-item ${item.status}`}><div><strong>{item.category === "feil" ? "Feil" : item.category === "forbedring" ? "Forbedring" : "Annet"}</strong><time>{new Date(item.created_at).toLocaleDateString("nb-NO")}</time></div><p>{item.message}</p><small>{item.user_email}</small><select aria-label="Status" value={item.status} onChange={e => setFeedbackStatus(item.id, e.target.value)}><option value="ny">Ny</option><option value="lest">Lest</option><option value="ferdig">Ferdig</option></select></article>)}</section>}<button className="secondary full-width" onClick={signOut}>Logg ut</button></div> : <div className="account-login">
      {mode !== "verify" && <div className="account-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Logg inn</button><button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>Opprett konto</button></div>}
      {mode === "verify" ? <><p>Skriv inn koden vi sendte til <strong>{email}</strong>. Du trenger ikke klikke på noen lenke.</p><label>Bekreftelseskode<input className="otp-input" inputMode="numeric" autoComplete="one-time-code" maxLength={8} placeholder="000000" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && verify()} /></label><button className="primary full-width" disabled={busy || code.length < 6} onClick={verify}>{busy ? "Kontrollerer …" : "Bekreft e-post"}</button><button className="text-button" disabled={busy || resendWait > 0} onClick={resendCode}>{resendWait > 0 ? `Send ny kode om ${resendWait} sek` : "Send ny kode"}</button><button className="text-button" onClick={() => { setMode("signup"); setCode(""); setMessage(""); }}>Tilbake</button></>
      : <><p>{mode === "login" ? "Logg inn med e-post og passord. Du trenger ingen e-postlenke." : "Opprett en gratis og sikker konto. Etterpå bekrefter du e-posten med en kort tallkode."}</p><label>E-post<input type="email" autoComplete="email" placeholder="navn@epost.no" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Passord<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} placeholder={mode === "signup" ? "Minst 8 tegn" : "Passord"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && (mode === "login" ? login() : signup())} /></label><button className="primary full-width" disabled={busy || !email.trim() || password.length < 8} onClick={mode === "login" ? login : signup}>{busy ? "Vent litt …" : mode === "login" ? "Logg inn" : "Opprett gratis konto"}</button></>}
      {message && <div className="account-message">{message}</div>}<small>OffshorePlus lagrer aldri passordet ditt. Det håndteres sikkert av Supabase.</small></div>}
    {!user && mode === "login" && <button className="text-button account-extra-action" onClick={onForgot}>Glemt passord?</button>}
    {user && <div className="account-extra-actions"><button className="text-button" onClick={onPrivacy}>Personvern og bruksvilkår</button>{!showDelete ? <button className="text-button danger-link" onClick={() => setShowDelete(true)}>Slett konto</button> : <section className="delete-account"><strong>Slett konto og alle data?</strong><p>Dette kan ikke angres. Skriv SLETT for å bekrefte.</p><input value={deleteText} onChange={e => setDeleteText(e.target.value.toUpperCase())} placeholder="Skriv SLETT" /><button className="danger-button full-width" disabled={busy || deleteText !== "SLETT"} onClick={deleteAccount}>{busy ? "Sletter …" : "Slett kontoen permanent"}</button><button className="text-button" onClick={() => { setShowDelete(false); setDeleteText(""); }}>Avbryt</button></section>}</div>}
  </Modal>;
}
