import { calculateTrip } from "../lib/calculation";
import { formatDate, formatDateTime } from "../lib/date";
import { holidaysDuringTrip } from "../lib/holidays";
import { rotationLabel, rotationStatus } from "../lib/rotation";
import { useClock } from "../hooks/useClock";
import type { TripSetup } from "../types";

interface DashboardProps {
  trip: TripSetup;
  onNewTrip: () => void;
  onCalendar: () => void;
  onSettings: () => void;
  onAdditions: () => void;
  onEarningsInfo: () => void;
  onChangeEarningsView: (view: "trip" | "monthly") => void;
}

function money(value: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
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

export function Dashboard({
  trip,
  onNewTrip,
  onCalendar,
  onSettings,
  onAdditions,
  onEarningsInfo,
  onChangeEarningsView,
}: DashboardProps) {
  const now = useClock();
  const calculation = calculateTrip(trip, now);
  const holidays = holidaysDuringTrip(new Date(trip.paidStart));
  const status = rotationStatus(trip, now);
  const countdown = countdownParts(status.nextHelicopter, now);
  const progress = Math.min(100, Math.max(0, (status.phaseDay / status.phaseLength) * 100));
  const activeSession = (trip.additionSessions ?? []).find((session) => !session.end);
  const view = trip.earningsView ?? "trip";

  const heroLabel = view === "trip" ? "Opptjent denne turen" : "Estimert månedslønn";
  const heroValue = view === "trip" ? calculation.gross : calculation.estimatedMonthlyGross;
  const heroNet = view === "trip" ? calculation.net : calculation.estimatedMonthlyNet;

  return (
    <>
      <main className="page">
        <section className="countdown-card">
          <div className="countdown-heading">
            <div>
              <span className="eyebrow">🚁 {status.countdownLabel}</span>
              <strong className="departure-date">{formatDateTime(status.nextHelicopter)}</strong>
            </div>
            <span className="status-pill">{rotationLabel(trip)}</span>
          </div>

          <div className="countdown-grid" aria-label="Nedtelling til neste helikopter">
            <div><strong>{countdown.days}</strong><span>dager</span></div>
            <div><strong>{String(countdown.hours).padStart(2, "0")}</strong><span>timer</span></div>
            <div><strong>{String(countdown.minutes).padStart(2, "0")}</strong><span>min</span></div>
            <div><strong>{String(countdown.seconds).padStart(2, "0")}</strong><span>sek</span></div>
          </div>
        </section>

        <section className="trip-progress-card">
          <div className="trip-progress-top">
            <div>
              <span className="eyebrow">{status.isOffshore ? "Aktiv offshoretur" : "Friperiode"}</span>
              <strong>Dag {status.phaseDay} av {status.phaseLength}</strong>
            </div>
            <span>{Math.round(progress)} %</span>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className={`earning-status-card ${calculation.status}`}>
          <span className="status-dot" aria-hidden="true" />
          <div>
            <span className="eyebrow">Status akkurat nå</span>
            <strong>{calculation.statusLabel}</strong>
          </div>
          <span className="status-running">{calculation.isMoneyRunning ? "● LIVE" : "⏸"}</span>
        </section>

        <section className="hero-card earnings-hero">
          <div className="earnings-header-row">
            <span className="eyebrow">{heroLabel}</span>
            <button className="info-button" onClick={onEarningsInfo} aria-label="Forklaring av lønnstall">?</button>
          </div>
          <strong className="hero-money">{money(heroValue)}</strong>
          <span className="muted">
            Ca. {money(heroNet)} etter {trip.taxRate}% skatt
          </span>
          <div className="segmented earnings-toggle" aria-label="Velg lønnsvisning">
            <button className={view === "trip" ? "selected" : ""} onClick={() => onChangeEarningsView("trip")}>Tur-opptjening</button>
            <button className={view === "monthly" ? "selected" : ""} onClick={() => onChangeEarningsView("monthly")}>Månedslønn</button>
          </div>
        </section>

        {activeSession && (
          <button className={`live-addition-banner ${activeSession.type}`} onClick={onAdditions}>
            <div>
              <span className="eyebrow">Live teller</span>
              <strong>{activeSession.type === "overtime" ? "🔥 Overtid pågår" : "☕ Ventetid pågår"}</strong>
            </div>
            <span>Trykk for detaljer →</span>
          </button>
        )}

        <section className="dashboard-grid salary-breakdown-grid">
          <article className="card">
            <span className="eyebrow">Estimert full tur</span>
            <strong className="metric">{money(calculation.estimatedGross)}</strong>
            <span className="muted">≈ {calculation.tripsPerYear.toFixed(1)} turer per år</span>
          </article>
          <article className="card additions-card">
            <span className="eyebrow">Tillegg denne turen</span>
            <strong className="metric accent-money">+{money(calculation.additionsPay)}</strong>
            <button className="text-button" onClick={onAdditions}>Registrer / se tillegg</button>
          </article>
        </section>

        <section className="card pay-breakdown">
          <div className="breakdown-heading">
            <strong>Hva består lønnen av?</strong>
            <span>{money(calculation.gross)}</span>
          </div>
          <div className="breakdown-row"><span>Grunnlønn</span><strong>{money(calculation.basePay)}</strong></div>
          <div className="breakdown-row"><span>Nattillegg</span><strong>{money(calculation.nightPay)}</strong></div>
          <div className="breakdown-row"><span>Overtid · {hours(calculation.overtimeHours)}</span><strong>{money(calculation.overtimePay)}</strong></div>
          <div className="breakdown-row"><span>Ventetid · {hours(calculation.waitingHours)}</span><strong>{money(calculation.waitingPay)}</strong></div>
          <div className="breakdown-row"><span>Svingskift · {trip.swingCompHours ?? 0} t</span><strong>{money(calculation.swingPay)}</strong></div>
          {calculation.customAdditionResults.map((addition) => (
            <div className="breakdown-row" key={addition.id}><span>{addition.name}</span><strong>{money(addition.tripPay)}</strong></div>
          ))}
        </section>

        <section className="quick-actions" aria-label="Hurtigvalg">
          <button onClick={onAdditions}><span>🔥</span><strong>Tillegg</strong><small>Overtid, ventetid og svingskift</small></button>
          <button onClick={onCalendar}><span>📅</span><strong>Turnuskalender</strong><small>Se hele året og eksporter</small></button>
          <button onClick={onSettings}><span>⚙️</span><strong>Innstillinger</strong><small>Lønn, skatt og rotasjon</small></button>
        </section>

        {holidays.length > 0 && (
          <section className="card holiday-card">
            <strong>🎉 Hellig-/tariffdager på denne turen</strong>
            {holidays.map((holiday) => (
              <span key={`${holiday.name}-${holiday.date.toISOString()}`}>
                {holiday.name} – {formatDate(holiday.date)}
              </span>
            ))}
            <small>Kontroller alltid hvilke tillegg som gjelder i avtalen din.</small>
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Hovedmeny">
        <button onClick={onNewTrip}>🚁<span>Ny tur</span></button>
        <button onClick={onAdditions}>🔥<span>Tillegg</span></button>
        <button onClick={onCalendar}>📅<span>Kalender</span></button>
        <button onClick={onSettings}>⚙️<span>Innstillinger</span></button>
      </nav>
    </>
  );
}
