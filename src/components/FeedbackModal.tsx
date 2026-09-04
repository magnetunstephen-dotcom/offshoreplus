import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { Modal } from "./Modal";

interface Props { user: User | null; onClose: () => void; onLogin: () => void; }

export function FeedbackModal({ user, onClose, onLogin }: Props) {
  const [category, setCategory] = useState("forbedring");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit() {
    if (!user?.email || message.trim().length < 3) return;
    setState("sending"); setError("");
    const { error: sendError } = await supabase.from("feedback").insert({
      user_id: user.id, user_email: user.email, category, message: message.trim(),
    });
    if (sendError) { setError("Kunne ikke sende akkurat nå. Prøv igjen litt senere."); setState("idle"); }
    else setState("sent");
  }

  return <Modal onClose={onClose} labelledBy="feedback-title" className="feedback-modal">
    <div className="account-header"><div><span className="eyebrow">Hjelp oss å bli bedre</span><h2 id="feedback-title">Send tilbakemelding</h2></div><button className="calendar-close" onClick={onClose} aria-label="Lukk">×</button></div>
    {!user ? <div className="feedback-login"><p>Logg inn først, så vet vi hvem vi kan kontakte hvis vi trenger mer informasjon.</p><button className="primary full-width" onClick={onLogin}>Logg inn</button></div>
    : state === "sent" ? <div className="feedback-success"><span>✓</span><h3>Tusen takk!</h3><p>Tilbakemeldingen er sendt og dukker opp i OffshorePlus-innboksen.</p><button className="secondary full-width" onClick={onClose}>Lukk</button></div>
    : <div className="feedback-form">
      <label>Hva gjelder det?<select value={category} onChange={e => setCategory(e.target.value)}><option value="forbedring">Forslag til forbedring</option><option value="feil">Meld fra om feil</option><option value="annet">Annet</option></select></label>
      <label>Fortell litt mer<textarea rows={6} maxLength={2000} placeholder="Hva skjedde, eller hva ønsker du at OffshorePlus skal gjøre?" value={message} onChange={e => setMessage(e.target.value)} /></label>
      <small>{message.length} / 2000 · sendes som {user.email}</small>
      {error && <div className="account-message">{error}</div>}
      <button className="primary full-width" disabled={state === "sending" || message.trim().length < 3} onClick={submit}>{state === "sending" ? "Sender …" : "Send tilbakemelding"}</button>
    </div>}
  </Modal>;
}
