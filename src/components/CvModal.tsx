import { useState } from "react";
import { loadCvProfile, saveCvProfile } from "../lib/storage";
import type { CvEntry, CvExperience, CvProfile } from "../types";
import { Modal } from "./Modal";

interface CvModalProps { onClose: () => void; }
const uid = () => Math.random().toString(36).slice(2, 9);
const emptyProfile: CvProfile = {
  fullName: "", address: "", email: "", phone: "", birthDate: "", familyStatus: "", linkedin: "",
  keyQualifications: "", experiences: [], education: [], courses: [], itSkills: "", languages: "", interests: "", references: [],
};

function lines(text: string) { return text.split("\n").map(v => v.trim()).filter(Boolean); }

export function CvModal({ onClose }: CvModalProps) {
  const [profile, setProfile] = useState<CvProfile>(() => loadCvProfile() ?? emptyProfile);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const set = <K extends keyof CvProfile>(key: K, value: CvProfile[K]) => setProfile(p => ({ ...p, [key]: value }));
  const save = () => { saveCvProfile(profile); setTab("preview"); };
  const addExperience = () => set("experiences", [...profile.experiences, { id: uid(), employer: "", period: "", role: "", details: "" }]);
  const updateExperience = (id: string, patch: Partial<CvExperience>) => set("experiences", profile.experiences.map(x => x.id === id ? { ...x, ...patch } : x));
  const addEntry = (key: "education" | "courses" | "references") => set(key, [...profile[key], { id: uid(), title: "", detail: "" }]);
  const updateEntry = (key: "education" | "courses" | "references", id: string, patch: Partial<CvEntry>) => set(key, profile[key].map(x => x.id === id ? { ...x, ...patch } : x));

  return <Modal onClose={onClose} labelledBy="cv-title" className="cv-modal">
    <div className="calendar-header no-print"><div><span className="eyebrow">Profil & dokumenter</span><h2 id="cv-title">CV-generator</h2><p className="muted">Fyll inn én gang. Dataene lagres lokalt på denne enheten.</p></div><button className="calendar-close" onClick={onClose}>✕</button></div>
    <div className="segmented cv-tabs no-print"><button className={tab === "edit" ? "selected" : ""} onClick={() => setTab("edit")}>Rediger</button><button className={tab === "preview" ? "selected" : ""} onClick={() => setTab("preview")}>Forhåndsvis</button></div>

    {tab === "edit" && <div className="cv-editor no-print">
      <h3>Personalia</h3><div className="form-grid">
        <label>Navn<input value={profile.fullName} onChange={e => set("fullName", e.target.value)} /></label>
        <label>Telefon<input value={profile.phone} onChange={e => set("phone", e.target.value)} /></label>
        <label>E-post<input type="email" value={profile.email} onChange={e => set("email", e.target.value)} /></label>
        <label>Adresse<input value={profile.address} onChange={e => set("address", e.target.value)} /></label>
        <label>Fødselsdato<input value={profile.birthDate} onChange={e => set("birthDate", e.target.value)} placeholder="dd.mm.åååå" /></label>
        <label>Sivilstatus<input value={profile.familyStatus} onChange={e => set("familyStatus", e.target.value)} /></label>
      </div><label>LinkedIn<input value={profile.linkedin} onChange={e => set("linkedin", e.target.value)} /></label>
      <label>Nøkkelkvalifikasjoner<textarea rows={6} value={profile.keyQualifications} onChange={e => set("keyQualifications", e.target.value)} placeholder="Kort profesjonell profil / nøkkelkvalifikasjoner" /></label>

      <div className="cv-section-head"><h3>Arbeidserfaring</h3><button className="secondary" onClick={addExperience}>+ Legg til</button></div>
      {profile.experiences.map((x, i) => <div className="cv-edit-card" key={x.id}><strong>Erfaring {i+1}</strong><div className="form-grid"><label>Arbeidsgiver<input value={x.employer} onChange={e => updateExperience(x.id,{employer:e.target.value})}/></label><label>Periode<input value={x.period} onChange={e => updateExperience(x.id,{period:e.target.value})} placeholder="2024 – nå"/></label></div><label>Stilling<input value={x.role} onChange={e => updateExperience(x.id,{role:e.target.value})}/></label><label>Arbeidsoppgaver – én per linje<textarea rows={5} value={x.details} onChange={e => updateExperience(x.id,{details:e.target.value})}/></label><button className="text-danger" onClick={() => set("experiences", profile.experiences.filter(v=>v.id!==x.id))}>Fjern</button></div>)}

      {(["education","courses","references"] as const).map(key => <section key={key}><div className="cv-section-head"><h3>{key === "education" ? "Utdanning / fagbrev" : key === "courses" ? "Kurs / sertifiseringer" : "Referanser"}</h3><button className="secondary" onClick={() => addEntry(key)}>+ Legg til</button></div>{profile[key].map(x => <div className="cv-edit-card compact" key={x.id}><div className="form-grid"><label>{key === "references" ? "Navn" : "Tittel"}<input value={x.title} onChange={e=>updateEntry(key,x.id,{title:e.target.value})}/></label><label>{key === "courses" ? "Gyldighet / detalj" : "Detalj"}<input value={x.detail} onChange={e=>updateEntry(key,x.id,{detail:e.target.value})}/></label></div><button className="text-danger" onClick={() => set(key, profile[key].filter(v=>v.id!==x.id))}>Fjern</button></div>)}</section>)}

      <label>IT-kunnskaper – én per linje<textarea rows={4} value={profile.itSkills} onChange={e=>set("itSkills",e.target.value)}/></label>
      <label>Språk – én per linje<textarea rows={3} value={profile.languages} onChange={e=>set("languages",e.target.value)}/></label>
      <label>Fritidsinteresser<textarea rows={2} value={profile.interests} onChange={e=>set("interests",e.target.value)}/></label>
      <div className="modal-actions"><button className="secondary" onClick={onClose}>Lukk</button><button className="primary" onClick={save}>Lagre og forhåndsvis</button></div>
    </div>}

    <div className={`cv-preview-wrap ${tab === "preview" ? "" : "print-only"}`}>
      <article className="cv-paper" id="cv-print"><header><h1>CV – {profile.fullName || "Ditt navn"}</h1><div className="cv-contact">{profile.address && <span>Adresse: {profile.address}</span>}{profile.email && <span>E-post: {profile.email}</span>}{profile.phone && <span>Telefon: {profile.phone}</span>}{profile.birthDate && <span>Født: {profile.birthDate}</span>}{profile.familyStatus && <span>Sivilstatus: {profile.familyStatus}</span>}{profile.linkedin && <span>LinkedIn Profil: {profile.linkedin}</span>}</div></header>
      {profile.keyQualifications && <section><h2>NØKKELKVALIFIKASJONER</h2><p>{profile.keyQualifications}</p></section>}
      {profile.experiences.length>0 && <section><h2>ARBEIDSERFARING</h2>{profile.experiences.map(x=><div className="cv-item" key={x.id}><div className="cv-item-title"><strong>{x.employer}</strong><span>{x.period}</span></div><b>{x.role}</b><ul>{lines(x.details).map((v,i)=><li key={i}>{v}</li>)}</ul></div>)}</section>}
      {profile.education.length>0 && <section><h2>UTDANNING</h2><ul>{profile.education.map(x=><li key={x.id}><strong>{x.title}</strong>{x.detail && <> – {x.detail}</>}</li>)}</ul></section>}
      {profile.courses.length>0 && <section><h2>KURS / SERTIFISERINGER</h2><ul>{profile.courses.map(x=><li key={x.id}><strong>{x.title}</strong>{x.detail && <> ({x.detail})</>}</li>)}</ul></section>}
      {profile.itSkills && <section><h2>IT-KUNNSKAPER</h2><ul>{lines(profile.itSkills).map((v,i)=><li key={i}>{v}</li>)}</ul></section>}
      {profile.languages && <section><h2>SPRÅK</h2><ul>{lines(profile.languages).map((v,i)=><li key={i}>{v}</li>)}</ul></section>}
      {profile.interests && <section><h2>FRITIDSINTERESSER</h2><p>{profile.interests}</p></section>}
      {profile.references.length>0 && <section><h2>REFERANSER</h2><ul>{profile.references.map(x=><li key={x.id}><strong>{x.title}</strong>{x.detail && <> – {x.detail}</>}</li>)}</ul></section>}
      </article>
      {tab === "preview" && <div className="cv-preview-actions no-print"><button className="secondary" onClick={()=>setTab("edit")}>← Rediger</button><button className="primary" onClick={()=>{saveCvProfile(profile); window.print();}}>📄 Lagre som PDF / skriv ut</button></div>}
    </div>
  </Modal>;
}
