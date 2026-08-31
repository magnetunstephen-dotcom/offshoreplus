import { calculateTrip } from "../lib/calculation";
import { formatDate, formatDateTime } from "../lib/date";
import { holidaysDuringTrip } from "../lib/holidays";
import { rotationLabel, rotationStatus } from "../lib/rotation";
import { useClock } from "../hooks/useClock";
import type { TripSetup } from "../types";
import {
  CalendarIcon,
  ChevronRightIcon,
  FlameIcon,
  HelicopterIcon,
  HomeIcon,
  InfoIcon,
  SettingsIcon,
} from "./Icons";

interface DashboardProps {
  trip: TripSetup;
  onNewTrip: () => void;
  onCalendar: () => void;
  onSettings: () => void;
  onAdditions: () => void;
  onEarningsInfo: () => void;
  onCv: () => void;
  onCertificates: () => void;
  onChangeEarningsView: (view: "monthly-net" | "monthly-gross" | "trip") => void;
}

function money(value: number, decimals = 0): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function countdownParts(target: Date, now: Date) {
  const total = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}

function hours(value: number): string {
  return `${value.toFixed(value < 10 ? 1 : 0)} t`;
}

function phaseMessage(isOffshore: boolean, phaseDay: number, phaseLength: number) {
  const remaining = Math.max(0, phaseLength - phaseDay);
  if (isOffshore && remaining === 0) return "Siste dag offshore";
  if (isOffshore && remaining === 1) return "Én dag igjen av turen";
  if (isOffshore) return `${remaining} dager igjen offshore`;
  if (remaining === 0) return "Utreise i dag";
  return `${remaining} dager igjen hjemme`;
}

export function Dashboard({
  trip,
  onNewTrip,
  onCalendar,
  onSettings,
  onAdditions,
  onEarningsInfo,
  onCv,
  onCertificates,
  onChangeEarningsView,
}: DashboardProps) {
  const now = useClock();
  const calculation = calculateTrip(trip, now);
  const holidays = holidaysDuringTrip(new Date(trip.paidStart));
  const status = rotationStatus(trip, now);
  const countdown = countdownParts(status.nextHelicopter, now);
  const progress = Math.min(100, Math.max(0, (status.phaseDay / status.phaseLength) * 100));
  const activeSession = (trip.additionSessions ?? []).find((session) => !session.end);
  const view = trip.earningsView ?? "monthly-net";

  const heroLabel = view === "trip"
    ? "Opptjent denne turen"
    : view === "monthly-gross" ? "Estimert brutto måned" : "Forventet utbetalt måned";
  const heroValue = view === "trip"
    ? calculation.gross
    : view === "monthly-gross" ? calculation.estimatedMonthlyGross : calculation.estimatedMonthlyNet;
  const liveMoney = calculation.isMoneyRunning && view === "trip";

  return (
    <>
      <main className="page mobile-dashboard">
        <section className="op-hero-section">
          <div className="op-flight-topline">
            <div className="op-icon-chip"><HelicopterIcon size={20} /></div>
            <div className="op-flight-copy">
              <span className="eyebrow">{status.countdownLabel}</span>
              <strong className="departure-date">{formatDateTime(status.nextHelicopter)}</strong>
            </div>
            <span className="rotation-badge">{rotationLabel(trip)} rotasjon</span>
          </div>

          <div className="countdown-grid" aria-label="Nedtelling til neste helikopter">
            <div><strong>{countdown.days}</strong><span>dager</span></div>
            <div><strong>{String(countdown.hours).padStart(2, "0")}</strong><span>timer</span></div>
            <div><strong>{String(countdown.minutes).padStart(2, "0")}</strong><span>min</span></div>
            <div><strong>{String(countdown.seconds).padStart(2, "0")}</strong><span>sek</span></div>
          </div>
        </section>

        <section className="trip-progress-card op-progress-card">
          <div className="trip-progress-top">
            <div>
              <span className="eyebrow">{status.isOffshore ? "Offshore" : "Friperiode"}</span>
              <strong>Dag {status.phaseDay} av {status.phaseLength}</strong>
            </div>
            <div className="op-progress-meta">
              <strong>{Math.round(progress)}%</strong>
              <small>{phaseMessage(status.isOffshore, status.phaseDay, status.phaseLength)}</small>
            </div>
          </div>
          <div className="progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
        </section>

        <section className={`earning-status-card ${calculation.status}`}>
          <span className="status-dot" aria-hidden="true" />
          <div>
            <span className="eyebrow">Akkurat nå</span>
            <strong>{calculation.statusLabel}</strong>
          </div>
          <span className={`status-running ${calculation.isMoneyRunning ? "live" : "paused"}`}>
            {calculation.isMoneyRunning ? "LIVE" : "PAUSE"}
          </span>
        </section>

        <section className={`hero-card earnings-hero ${liveMoney ? "money-running" : ""}`}>
          <div className="earnings-header-row">
            <span className="eyebrow">{heroLabel}</span>
            <button className="info-button" onClick={onEarningsInfo} aria-label="Forklaring av lønnstall"><InfoIcon size={18} /></button>
          </div>
          <strong className="hero-money">{money(heroValue, liveMoney ? 2 : 0)}</strong>
          {view === "monthly-net" && <span className="muted">Brutto {money(calculation.estimatedMonthlyGross)}</span>}
          {view === "monthly-gross" && <span className="muted">Ca. {money(calculation.estimatedMonthlyNet)} utbetalt</span>}
          {view === "trip" && <span className="muted">Brutto opptjent på aktiv tur</span>}
          {view === "trip" && (
            <span className="money-caption">{calculation.isMoneyRunning ? "Lønn opptjenes nå" : "Telleren står stille mens du ikke opptjener lønn"}</span>
          )}
          <div className="segmented earnings-toggle" aria-label="Velg lønnsvisning">
            <button className={view === "monthly-net" ? "selected" : ""} onClick={() => onChangeEarningsView("monthly-net")}>Utbetalt måned</button>
            <button className={view === "monthly-gross" ? "selected" : ""} onClick={() => onChangeEarningsView("monthly-gross")}>Brutto måned</button>
            <button className={view === "trip" ? "selected" : ""} onClick={() => onChangeEarningsView("trip")}>Denne turen</button>
          </div>
          {view !== "trip" && <span className="tax-note">Ordinær lønn bruker valgt skattetrekk. Overtid og ekstra tillegg er estimert med 50 % forskuddstrekk – dette er ikke nødvendigvis endelig skatt.</span>}
        </section>

        {activeSession && (
          <button className={`live-addition-banner ${activeSession.type}`} onClick={onAdditions}>
            <div className="op-icon-chip small"><FlameIcon size={18} /></div>
            <div>
              <span className="eyebrow">Live tillegg</span>
              <strong>{activeSession.type === "overtime" ? "Overtid pågår" : "Ventetid pågår"}</strong>
            </div>
            <ChevronRightIcon size={20} />
          </button>
        )}

        <section className="op-summary-grid">
          <article className="card summary-card">
            <span className="eyebrow">Ordinær månedslønn</span>
            <strong className="metric">{money(calculation.regularMonthlyGross)}</strong>
            <span className="muted">Full tur × 8,7 ÷ 12</span>
          </article>
          <button className="card summary-card addition-summary" onClick={onAdditions}>
            <span className="eyebrow">Tillegg denne turen</span>
            <strong className="metric accent-money">+{money(calculation.activeExtrasGross)}</strong>
            <span className="summary-link">Se / registrer <ChevronRightIcon size={16} /></span>
          </button>
        </section>

        <details className="card pay-breakdown op-details">
          <summary>
            <span>Se lønnsdetaljer</span>
            <strong>{money(calculation.gross)}</strong>
          </summary>
          <div className="breakdown-content">
            <div className="breakdown-row"><span>Grunnlønn</span><strong>{money(calculation.basePay)}</strong></div>
            <div className="breakdown-row"><span>Nattillegg</span><strong>{money(calculation.nightPay)}</strong></div>
            <div className="breakdown-row"><span>Overtid · {hours(calculation.overtimeHours)}</span><strong>{money(calculation.overtimePay)}</strong></div>
            <div className="breakdown-row"><span>Ventetid · {hours(calculation.waitingHours)}</span><strong>{money(calculation.waitingPay)}</strong></div>
            <div className="breakdown-row"><span>Svingskift · {trip.swingCompHours ?? 0} t</span><strong>{money(calculation.swingPay)}</strong></div>
            {calculation.customAdditionResults.map((addition) => (
              <div className="breakdown-row" key={addition.id}><span>{addition.name}</span><strong>{money(addition.tripPay)}</strong></div>
            ))}
          </div>
        </details>

        <section className="quick-actions op-tools" aria-label="Hurtigvalg">
          <button onClick={onCertificates}><span className="action-icon">✓</span><strong>Kurs & sertifikater</strong><small>Status og gjenbruk i CV</small><ChevronRightIcon size={18} /></button>
          <button onClick={onAdditions}><span className="action-icon"><FlameIcon /></span><strong>Tillegg</strong><small>Overtid og ventetid</small><ChevronRightIcon className="action-chevron" size={17}/></button>
          <button onClick={onCalendar}><span className="action-icon"><CalendarIcon /></span><strong>Kalender</strong><small>Turnus og eksport</small><ChevronRightIcon className="action-chevron" size={17}/></button>
          <button onClick={onCv}><span className="action-icon">CV</span><strong>Profil & CV</strong><small>Lag profesjonell PDF</small><ChevronRightIcon className="action-chevron" size={17}/></button>
          <button onClick={onSettings}><span className="action-icon"><SettingsIcon /></span><strong>Innstillinger</strong><small>Lønn og oppsett</small><ChevronRightIcon className="action-chevron" size={17}/></button>
        </section>

        {holidays.length > 0 && (
          <section className="card holiday-card">
            <strong>Hellig-/tariffdager på denne turen</strong>
            {holidays.map((holiday) => <span key={`${holiday.name}-${holiday.date.toISOString()}`}>{holiday.name} – {formatDate(holiday.date)}</span>)}
            <small>Kontroller alltid hvilke tillegg som gjelder i avtalen din.</small>
          </section>
        )}
      </main>

      <nav className="bottom-nav op-bottom-nav" aria-label="Hovedmeny">
        <button className="active" aria-current="page"><HomeIcon/><span>Hjem</span></button>
        <button onClick={onAdditions}><FlameIcon/><span>Tillegg</span></button>
        <button onClick={onCalendar}><CalendarIcon/><span>Kalender</span></button>
        <button onClick={onCv}><strong className="nav-cv-icon">CV</strong><span>Profil</span></button>
      </nav>

      <button className="floating-new-trip" onClick={onNewTrip} aria-label="Start ny tur"><HelicopterIcon size={19}/><span>Ny tur</span></button>
    </>
  );
}
