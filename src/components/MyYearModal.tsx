import { useMemo, useState } from "react";
import type { TripSetup, UserProfile, YearTrip } from "../types";
import { formatDate } from "../lib/date";
import { loadUserProfile, loadYearTrips, saveUserProfile, saveYearTrips } from "../lib/storage";
import { snapshotTrip, summarizeYear } from "../lib/year";
import { Modal } from "./Modal";

interface Props { trip: TripSetup; onClose: () => void; }
type Tab = "overview" | "trips" | "profile";
const money = (n: number) => new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(n);

export function MyYearModal({ trip, onClose }: Props) {
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());
  const [trips, setTrips] = useState<YearTrip[]>(() => loadYearTrips());
  const [tab, setTab] = useState<Tab>("overview");
  const [year, setYear] = useState(new Date(trip.paidStart).getFullYear());
  const summary = useMemo(() => summarizeYear(trips, profile, year), [trips, profile, year]);

  function persistTrips(next: YearTrip[]) { setTrips(next); saveYearTrips(next); }
  function addCurrentTrip() {
    const next = snapshotTrip(trip, profile);
    const duplicate = trips.some(t => t.startDate.slice(0, 10) === next.startDate.slice(0, 10));
    if (!duplicate) persistTrips([...trips, next]);
    setYear(new Date(next.startDate).getFullYear()); setTab("trips");
  }
  function updateTrip(id: string, patch: Partial<YearTrip>) {
    persistTrips(trips.map(t => t.id === id ? { ...t, ...patch } : t));
  }
  function persistProfile(next: UserProfile) { setProfile(next); saveUserProfile(next); }

  return <Modal onClose={onClose} labelledBy="my-year-title" className="my-year-modal">
    <div className="modal-header"><div><span className="eyebrow">OffshorePlus</span><h2 id="my-year-title">Mitt år</h2></div><button className="icon-button" onClick={onClose} aria-label="Lukk">×</button></div>
    <div className="year-toolbar"><button onClick={() => setYear(year - 1)}>‹</button><strong>{year}</strong><button onClick={() => setYear(year + 1)}>›</button><button className="primary year-add" onClick={addCurrentTrip}>+ Legg aktiv tur til året</button></div>
    <div className="segmented year-tabs"><button className={tab === "overview" ? "selected" : ""} onClick={() => setTab("overview")}>Oversikt</button><button className={tab === "trips" ? "selected" : ""} onClick={() => setTab("trips")}>Turer ({summary.rows.length})</button><button className={tab === "profile" ? "selected" : ""} onClick={() => setTab("profile")}>Profil</button></div>

    {tab === "overview" && <div className="year-content">
      {summary.rows.length === 0 ? <div className="year-empty"><strong>Start årsoversikten din</strong><p>Legg den aktive turen til {year}. Alt lagres lokalt på denne enheten.</p><button className="primary" onClick={addCurrentTrip}>Legg til aktiv tur</button></div> : <>
        <section className="year-forecast"><span className="eyebrow">Forventet årslønn akkurat nå</span><strong>{money(summary.projectedGross)}</strong><small>Basert på registrerte turer hittil · forventet netto {money(summary.projectedNet)}</small></section>
        <div className="year-kpis"><article><span>Brutto opptjent</span><strong>{money(summary.gross)}</strong></article><article><span>Netto registrert</span><strong>{money(summary.actualNet)}</strong></article><article><span>Feriepenger opptjent</span><strong>{money(summary.holidayAccrued)}</strong></article><article><span>Offshore</span><strong>{summary.offshoreDays} døgn</strong></article><article><span>Overtid</span><strong>{summary.overtimeHours.toFixed(1)} t</strong></article><article><span>Avvik mot estimat</span><strong className={summary.variance < 0 ? "negative" : "positive"}>{money(summary.variance)}</strong></article></div>
        <section className="card year-breakdown"><h3>Hva du har tjent</h3><div><span>Ordinær lønn</span><strong>{money(summary.regular)}</strong></div><div><span>Overtid</span><strong>{money(summary.overtime)}</strong></div><div><span>Natt og andre tillegg</span><strong>{money(summary.additions)}</strong></div><div className="total"><span>Brutto opptjent</span><strong>{money(summary.gross)}</strong></div></section>
      </>}
    </div>}

    {tab === "trips" && <div className="year-content trip-list">{summary.rows.length === 0 ? <p className="muted">Ingen turer registrert i {year}.</p> : summary.rows.sort((a,b) => b.startDate.localeCompare(a.startDate)).map(t => <article className="card year-trip" key={t.id}><div className="year-trip-head"><div><strong>{t.title}</strong><span>{formatDate(new Date(t.startDate))}–{formatDate(new Date(t.endDate))}</span></div><strong>{money(t.grossEarned)}</strong></div><div className="trip-meta"><span>{t.offshoreDays} døgn</span><span>{t.overtimeHours.toFixed(1)} t overtid</span><span>Estimert netto {money(t.expectedNet)}</span></div><div className="trip-controls"><label>Utbetalingsmåned<input type="month" value={t.paymentMonth} onChange={e => updateTrip(t.id, { paymentMonth: e.target.value })}/></label><label>Faktisk utbetalt<input inputMode="decimal" placeholder="Ikke registrert" value={t.actualPaid ?? ""} onChange={e => updateTrip(t.id, { actualPaid: e.target.value === "" ? undefined : Number(e.target.value.replace(",", ".")) })}/></label><button className="danger-text" onClick={() => persistTrips(trips.filter(row => row.id !== t.id))}>Slett</button></div></article>)}</div>}

    {tab === "profile" && <div className="year-content profile-form"><div className="year-note"><strong>Profilen brukes i hele årsoversikten</strong><span>Første versjon lagres bare lokalt på denne enheten. Konto og synkronisering kan kobles på senere.</span></div><label>Navn<input value={profile.name} placeholder="Ditt navn" onChange={e => persistProfile({...profile, name:e.target.value})}/></label><label>Arbeidsgiver<input value={profile.employer} placeholder="Arbeidsgiver / installasjon" onChange={e => persistProfile({...profile, employer:e.target.value})}/></label><div className="form-grid"><label>Feriepengesats<input type="number" min="0" max="20" step="0.1" value={profile.holidayPayRate} onChange={e => persistProfile({...profile, holidayPayRate:Number(e.target.value)})}/></label><label>Skatteprosent<input type="number" min="0" max="60" value={profile.defaultTaxRate} onChange={e => persistProfile({...profile, defaultTaxRate:Number(e.target.value)})}/></label></div><label>Rotasjon<input value={profile.rotationLabel} placeholder="2 / 4" onChange={e => persistProfile({...profile, rotationLabel:e.target.value})}/></label></div>}
  </Modal>;
}
