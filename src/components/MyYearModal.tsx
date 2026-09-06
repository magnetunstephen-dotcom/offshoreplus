import { useEffect, useMemo, useState } from "react";
import type { TripSetup, UserProfile, YearTrip } from "../types";
import { formatDate } from "../lib/date";
import { loadAutoDisabledYears, loadUserProfile, loadYearTrips, saveAutoDisabledYears, saveUserProfile, saveYearTrips } from "../lib/storage";
import { changeYearTripPattern, refreshMatchingYearTrip, snapshotTrip, summarizeYear, upgradeLegacyYearTrips } from "../lib/year";
import { Modal } from "./Modal";
import { calculateTrip } from "../lib/calculation";

interface Props { trip: TripSetup; onClose: () => void; }
type Tab = "overview" | "trips" | "profile";
const money = (n: number) => new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(n);

export function MyYearModal({ trip, onClose }: Props) {
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());
  const [trips, setTrips] = useState<YearTrip[]>(() => loadYearTrips());
  const [tab, setTab] = useState<Tab>("overview");
  const [year, setYear] = useState(new Date(trip.paidStart).getFullYear());
  const summary = useMemo(() => summarizeYear(trips, profile, year), [trips, profile, year]);
  const salary = useMemo(() => {
    const calculation = calculateTrip(trip);
    const monthlyGross = calculation.regularMonthlyGross;
    const taxRate = Math.min(60, Math.max(0, trip.taxRate ?? profile.defaultTaxRate));
    const monthlyTax = monthlyGross * taxRate / 100;
    const annualGross = monthlyGross * 12;
    const annualTax = annualGross * taxRate / 100;
    return {
      monthlyGross,
      monthlyTax,
      monthlyNet: monthlyGross - monthlyTax,
      annualGross,
      annualTax,
      annualNet: annualGross - annualTax,
      annualHolidayPay: annualGross * (trip.holidayPayRate ?? profile.holidayPayRate) / 100,
      taxRate,
    };
  }, [trip, profile.defaultTaxRate, profile.holidayPayRate]);

  useEffect(() => {
    const upgraded = upgradeLegacyYearTrips(trips, trip, profile);
    const refreshed = refreshMatchingYearTrip(upgraded, trip, profile);
    if (refreshed !== trips) { setTrips(refreshed); saveYearTrips(refreshed); }
  }, []);

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
  function deleteYear() {
    if (!window.confirm(`Slette alle turer i ${year}? Året blir ikke fylt inn automatisk igjen.`)) return;
    persistTrips(trips.map(row => new Date(row.startDate).getFullYear() === year ? { ...row, excluded: true } : row));
    saveAutoDisabledYears([...loadAutoDisabledYears(), year]);
  }

  return <Modal onClose={onClose} labelledBy="my-year-title" className="my-year-modal">
    <div className="modal-header"><div><span className="eyebrow">OffshorePlus</span><h2 id="my-year-title">Mitt år</h2></div><button className="icon-button" onClick={onClose} aria-label="Lukk">×</button></div>
    <div className="year-toolbar"><div className="year-picker"><button className="year-nav" onClick={() => setYear(year - 1)} aria-label="Forrige år">‹</button><strong>{year}</strong><button className="year-nav" onClick={() => setYear(year + 1)} aria-label="Neste år">›</button></div><button className="year-delete" onClick={deleteYear}>Slett året</button></div>
    <div className="segmented year-tabs"><button className={tab === "overview" ? "selected" : ""} onClick={() => setTab("overview")}>Oversikt</button><button className={tab === "trips" ? "selected" : ""} onClick={() => setTab("trips")}>Turer ({summary.rows.length})</button><button className={tab === "profile" ? "selected" : ""} onClick={() => setTab("profile")}>Profil</button></div>

    {tab === "overview" && <div className="year-content">
      <section className="year-forecast"><span className="eyebrow">Fast årslønn før skatt</span><strong>{money(salary.annualGross)}</strong><small>12 × {money(salary.monthlyGross)} per måned · uten variable tillegg</small></section>
      <div className="year-kpis">
        <article><span>Månedslønn før skatt</span><strong>{money(salary.monthlyGross)}</strong></article>
        <article><span>Månedslønn etter skatt</span><strong>{money(salary.monthlyNet)}</strong></article>
        <article><span>Beregnet skatt per måned</span><strong>{money(salary.monthlyTax)}</strong></article>
        <article><span>Årslønn etter skatt</span><strong>{money(salary.annualNet)}</strong></article>
        <article><span>Beregnet skatt per år</span><strong>{money(salary.annualTax)}</strong></article>
        <article><span>Feriepenger av fastlønn</span><strong>{money(salary.annualHolidayPay)}</strong></article>
      </div>
      <p className="muted">Etter skatt er et estimat med {salary.taxRate}% trekk. Feriepenger, halv skatt, fradrag og tabelltrekk kan gi et annet faktisk årsresultat.</p>
      {summary.rows.length === 0 ? <div className="year-empty"><strong>Ingen fullførte turer i {year}</strong><p>Fullførte turer legges automatisk til fra turnuskalenderen. Turene brukes til å registrere tillegg og overtid.</p><button className="primary" onClick={addCurrentTrip}>Legg til aktiv tur</button></div> : <>
        <section className="card year-breakdown"><h3>Registrert utover fastlønn i {year}</h3><div><span>Overtid · {summary.overtimeHours.toFixed(1)} t</span><strong>{money(summary.overtime)}</strong></div><div><span>Natt, ventetid og andre tillegg</span><strong>{money(summary.additions)}</strong></div><div className="total"><span>Tillegg registrert totalt</span><strong>{money(summary.overtime + summary.additions)}</strong></div></section>
        <div className="year-kpis"><article><span>Fullførte turer</span><strong>{summary.rows.length}</strong></article><article><span>Døgn offshore</span><strong>{summary.offshoreDays}</strong></article><article><span>Overtid registrert</span><strong>{summary.overtimeHours.toFixed(1)} t</strong></article></div>
      </>}
    </div>}

    {tab === "trips" && <div className="year-content trip-list">{summary.rows.length === 0 ? <p className="muted">Ingen turer registrert i {year}.</p> : summary.rows.sort((a,b) => b.startDate.localeCompare(a.startDate)).map(t => <article className="card year-trip" key={t.id}><div className="year-trip-head"><div><strong>{t.title}</strong><span>{formatDate(new Date(t.startDate))}–{formatDate(new Date(t.endDate))}{t.autoGenerated ? " · Automatisk" : ""}</span></div></div><div className="trip-meta"><span>{t.offshoreDays} døgn</span><span>{t.overtimeHours.toFixed(1)} t overtid</span><span>Tillegg {money(t.nightPay + t.overtimePay + t.waitingPay + t.swingPay + t.otherAdditions)}</span></div><div className="trip-controls"><label>Skift denne turen<select value={t.shiftPattern ?? "day"} onChange={e => persistTrips(trips.map(row => row.id === t.id ? changeYearTripPattern(row, e.target.value as TripSetup["pattern"], profile) : row))}><option value="day">Dag hele turen</option><option value="night">Natt hele turen</option><option value="night-day">Natt → dag</option><option value="day-night">Dag → natt</option></select></label><label>Utbetalingsmåned<input type="month" value={t.paymentMonth} onChange={e => updateTrip(t.id, { paymentMonth: e.target.value })}/></label><label>Faktisk utbetalt<input inputMode="decimal" placeholder="Ikke registrert" value={t.actualPaid ?? ""} onChange={e => updateTrip(t.id, { actualPaid: e.target.value === "" ? undefined : Number(e.target.value.replace(",", ".")) })}/></label><button className="danger-text" onClick={() => persistTrips(t.autoGenerated ? trips.map(row => row.id === t.id ? { ...row, excluded: true } : row) : trips.filter(row => row.id !== t.id))}>Slett tur</button></div></article>)}</div>}

    {tab === "profile" && <div className="year-content profile-form"><div className="year-note"><strong>Profilen brukes i hele årsoversikten</strong><span>Første versjon lagres bare lokalt på denne enheten. Konto og synkronisering kan kobles på senere.</span></div><label>Navn<input value={profile.name} placeholder="Ditt navn" onChange={e => persistProfile({...profile, name:e.target.value})}/></label><label>Arbeidsgiver<input value={profile.employer} placeholder="Arbeidsgiver / installasjon" onChange={e => persistProfile({...profile, employer:e.target.value})}/></label><div className="form-grid"><label>Feriepengesats<input type="number" min="0" max="20" step="0.1" value={profile.holidayPayRate} onChange={e => persistProfile({...profile, holidayPayRate:Number(e.target.value)})}/></label><label>Skatteprosent<input type="number" min="0" max="60" value={profile.defaultTaxRate} onChange={e => persistProfile({...profile, defaultTaxRate:Number(e.target.value)})}/></label></div><label>Rotasjon<input value={profile.rotationLabel} placeholder="2 / 4" onChange={e => persistProfile({...profile, rotationLabel:e.target.value})}/></label></div>}
  </Modal>;
}
