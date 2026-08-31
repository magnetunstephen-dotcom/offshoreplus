import { useMemo, useState } from "react";
import { loadCertificates, saveCertificates } from "../lib/storage";
import type { Certificate, CertificateStatus } from "../types";
import { Modal } from "./Modal";

interface CertificatesModalProps { onClose: () => void; }

const uid = () => Math.random().toString(36).slice(2, 9);
const emptyCertificate = (): Certificate => ({
  id: uid(), name: "", issuedDate: "", expiryDate: "", includeInCv: true,
});

export function certificateStatus(certificate: Certificate, now = new Date()): CertificateStatus {
  const expiry = new Date(`${certificate.expiryDate}T23:59:59`);
  if (!certificate.expiryDate || Number.isNaN(expiry.getTime())) return "valid";
  const days = (expiry.getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return "expired";
  return days <= 90 ? "expiring" : "valid";
}

const statusText: Record<CertificateStatus, string> = {
  valid: "Gyldig", expiring: "Utløper snart", expired: "Utløpt",
};

export function CertificatesModal({ onClose }: CertificatesModalProps) {
  const [certificates, setCertificates] = useState<Certificate[]>(loadCertificates);
  const [draft, setDraft] = useState<Certificate>(emptyCertificate);
  const [editingId, setEditingId] = useState<string | null>(null);
  const counts = useMemo(() => certificates.reduce((result, certificate) => {
    result[certificateStatus(certificate)] += 1;
    return result;
  }, { valid: 0, expiring: 0, expired: 0 }), [certificates]);

  const persist = (next: Certificate[]) => { setCertificates(next); saveCertificates(next); };
  const reset = () => { setDraft(emptyCertificate()); setEditingId(null); };
  const submit = () => {
    if (!draft.name.trim()) return;
    const next = editingId
      ? certificates.map(certificate => certificate.id === editingId ? draft : certificate)
      : [...certificates, draft];
    persist(next);
    reset();
  };
  const edit = (certificate: Certificate) => { setDraft(certificate); setEditingId(certificate.id); };

  return <Modal onClose={onClose} labelledBy="certificates-title">
    <div className="calendar-header"><div><span className="eyebrow">Kompetanse</span><h2 id="certificates-title">Kurs & sertifikater</h2><p className="muted">Registrer én gang – bruk samme data direkte i CV-en.</p></div><button className="calendar-close" onClick={onClose}>✕</button></div>
    <div className="certificate-summary">
      <div><strong>{certificates.length}</strong><span>Registrert</span></div>
      <div className="valid"><strong>{counts.valid}</strong><span>Gyldige</span></div>
      <div className="expiring"><strong>{counts.expiring}</strong><span>Snart</span></div>
      <div className="expired"><strong>{counts.expired}</strong><span>Utløpt</span></div>
    </div>
    <section className="certificate-form">
      <h3>{editingId ? "Rediger kurs" : "Legg til kurs"}</h3>
      <label>Navn<input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="F.eks. Fallsikring" /></label>
      <div className="form-grid">
        <label>Utstedt dato<input type="date" value={draft.issuedDate} onChange={event => setDraft({ ...draft, issuedDate: event.target.value })} /></label>
        <label>Utløpsdato<input type="date" value={draft.expiryDate} onChange={event => setDraft({ ...draft, expiryDate: event.target.value })} /></label>
      </div>
      <label className="switch-row"><input type="checkbox" checked={draft.includeInCv} onChange={event => setDraft({ ...draft, includeInCv: event.target.checked })} /><span>Ta med direkte i CV</span></label>
      <div className="modal-actions"><button className="secondary" onClick={reset}>Nullstill</button><button className="primary" onClick={submit}>{editingId ? "Lagre endring" : "Legg til"}</button></div>
    </section>
    <section className="certificate-list">
      {certificates.length === 0 && <p className="muted">Ingen kurs registrert ennå.</p>}
      {certificates.map(certificate => { const status = certificateStatus(certificate); return <article className="certificate-row" key={certificate.id}>
        <div><span className={`certificate-status ${status}`}>{statusText[status]}</span><strong>{certificate.name}</strong><small>{certificate.expiryDate ? `Utløper ${certificate.expiryDate}` : "Ingen utløpsdato"}{certificate.includeInCv ? " · med i CV" : ""}</small></div>
        <div className="certificate-actions"><button className="secondary" onClick={() => edit(certificate)}>Rediger</button><button className="text-danger" onClick={() => persist(certificates.filter(item => item.id !== certificate.id))}>Slett</button></div>
      </article>; })}
    </section>
  </Modal>;
}
