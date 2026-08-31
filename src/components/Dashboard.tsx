import { calculateTrip } from "../lib/calculation";
import { formatDate, formatDateTime } from "../lib/date";
import { holidaysDuringTrip } from "../lib/holidays";
import { rotationLabel, rotationStatus } from "../lib/rotation";
import { useClock } from "../hooks/useClock";
import { useMonthlyTableTax } from "../hooks/useMonthlyTableTax";
import { salaryAgreements } from "../data/salaries";
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
  const accruedTable = useMonthlyTableTax(trip.taxTable ?? "", calculation.accruedTaxableGross);
  const finalTable = useMonthlyTableTax(trip.taxTable ?? "", calculation.estimatedTaxableGross);
  const usesTable = trip.taxMethod === "table";
  const accruedNet = usesTable && accruedTable.tax !== null
    ? calculation.accruedTaxableGross - accruedTable.tax + calculation.accruedTaxFreeGross
    : calculation.accruedNextPayoutNet;
  const finalNet = usesTable && finalTable.tax !== null
    ? calculation.estimatedTaxableGross - finalTable.tax + calculation.estimatedTaxFreeGross
    : calculation.estimatedMonthlyNet;
  const holidays = holidaysDuringTrip(new Date(trip.paidStart));
  const status = rotationStatus(trip, now);
  const countdown = countdownParts(status.nextHelicopter, now);
  const progress = Math.min(100, Math.max(0, (status.phaseDay / status.phaseLength) * 100));
  const activeSession = (trip.additionSessions ?? []).find((session) => !session.end);
  const salaryAgreement = salaryAgreements[trip.agreementId];
  const salaryStep = salaryAgreement?.steps[trip.stepIndex] ?? String(trip.stepIndex + 1);
  const view = trip.earningsView ?? "monthly-net";

  const heroLabel = view === "trip"
    ? "Opptjent denne turen"
    : view === "monthly-gross" ? "Brutto opptjent mot neste lønn" : "Opptjent mot neste lønn";
  const heroValue = view === "trip"
    ? calculation.gross
    : view === "monthly-gross" ? calculation.accruedNextPayoutGross : accruedNet;
  const liveMoney = calculation.isMoneyRunning;

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
          {view === "monthly-net" && <span className="muted">Brutto opptjent {money(calculation.accruedNextPayoutGross)}</span>}
          {view === "monthly-gross" && <span className="muted">Ca. {money(accruedNet)} utbetalt</span>}
          {view === "trip" && <span className="muted">Brutto opptjent på aktiv tur</span>}
          {view !== "trip" && <div className="pay-target"><span>Ved fullført tur, med tillegg hittil</span><strong>{view === "monthly-gross" ? money(calculation.estimatedMonthlyGross) : `ca. ${money(finalNet)} netto`}</strong><small>{salaryAgreement?.name} · gruppe {trip.group} · trinn {salaryStep}{usesTable ? ` · tabell ${trip.taxTable || "mangler"}` : ` · ${trip.taxRate}% trekk`}</small></div>}
          {usesTable && (accruedTable.loading || finalTable.loading) && <span className="tax-table-state">Laster Skatteetatens 2026-tabell …</span>}
          {usesTable && (accruedTable.error || finalTable.error) && <span className="tax-table-state error">{accruedTable.error || finalTable.error}</span>}
          {view === "trip" && (
            <span className="money-caption">{calculation.isMoneyRunning ? "Lønn opptjenes nå" : "Telleren står stille mens du ikke opptjener lønn"}</span>
          )}
          <div className="segmented earnings-toggle" aria-label="Velg lønnsvisning">
            <button className={view === "monthly-net" ? "selected" : ""} onClick={() => onChangeEarningsView("monthly-net")}>Neste utbetaling</button>
            <button className={view === "monthly-gross" ? "selected" : ""} onClick={() => onChangeEarningsView("monthly-gross")}>Brutto opptjent</button>
            <button className={view === "trip" ? "selected" : ""} onClick={() => onChangeEarningsView("trip")}>Denne turen</button>
          </div>
          {view !== "trip" && <span className="tax-note">Viser hvor mye av den faste månedslønnen du har opptjent gjennom denne 14-dagersturen. {usesTable ? `Trekkpliktig lønn beregnes med tabell ${trip.taxTable || "–"}.` : "Fastlønn og trekkpliktige tillegg bruker valgt skatteprosent."} Trekkfrie refusjoner legges til uten trekk.</span>}
          {view !== "trip" && <div className={`live-calculation-note ${calculation.isMoneyRunning ? "active" : "paused"}`}><span className="status-dot" /> <strong>{calculation.isMoneyRunning ? "Teller live nå" : "Telleren står nå"}</strong><span>{calculation.isMoneyRunning ? "Beløpet oppdateres mens aktivt skift eller tillegg pågår." : "Beløpet øker igjen ved neste planlagte skift eller aktive tillegg."}</span></div>}
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
            <span className="muted">{calculation.usesAgreementMonthlySalary ? "Direkte fra valgt lønnstabell" : "Full tur × 8,7 ÷ 12"}</span>
          </article>
          <button className="card summary-card addition-summary" onClick={onAdditions}>
            <span className="eyebrow">Tillegg denne turen</span>
            <strong className="metric accent-money">+{money(calculation.activeExtrasGross)}</strong>
            <span className="summary-link">Opptjent live · se / registrer <ChevronRightIcon size={16} /></span>
          </button>
        </section>

        <details className="card pay-breakdown op-details">
          <summary>
            <span>Se lønnsdetaljer</span>
            <strong>{money(calculation.gross)}</strong>
          </summary>
          <div className="breakdown-content">
            {view !== "trip" && <>
              <div className="breakdown-explainer"><strong>Slik er estimatet bygget opp</strong><span>{usesTable ? `Samlet trekkpliktig beløp slås opp i månedstabell ${trip.taxTable || "–"} for 2026. Trekkfrie refusjoner legges til etterpå.` : `Fastlønn og trekkpliktige tillegg bruker ${trip.taxRate}% fra prosentkortet. Trekkfrie refusjoner bruker 0%.`}</span></div>
              <div className="breakdown-row"><span>Fastlønn opptjent · {hours(calculation.paidHours)} av {trip.rotationOnDays * 12} t</span><strong>{money(calculation.accruedRegularGross)}</strong></div>
              <div className="breakdown-row"><span>Variable tillegg opptjent</span><strong>+{money(calculation.activeExtrasGross)}</strong></div>
              {usesTable ? <>
                <div className="breakdown-row"><span>Trekkpliktig grunnlag</span><strong>{money(calculation.accruedTaxableGross)}</strong></div>
                <div className="breakdown-row sub-row"><span>Tabelltrekk 2026</span><strong>-{money(accruedTable.tax ?? 0)}</strong></div>
                {calculation.accruedTaxFreeGross > 0 && <div className="breakdown-row"><span>Trekkfrie beløp</span><strong>+{money(calculation.accruedTaxFreeGross)}</strong></div>}
              </> : <>
                <div className="breakdown-row sub-row"><span>Estimert netto fastlønn etter {trip.taxRate}%</span><strong>{money(calculation.accruedRegularNet)}</strong></div>
                <div className="breakdown-row sub-row"><span>Estimert netto av tillegg</span><strong>+{money(calculation.activeExtrasNet)}</strong></div>
              </>}
              <div className="breakdown-row total-row"><span>Estimert netto opptjent</span><strong>{money(accruedNet)}</strong></div>
            </>}
            {view === "trip" && <>
            <div className="breakdown-row"><span>Grunnlønn</span><strong>{money(calculation.basePay)}</strong></div>
            <div className="breakdown-row"><span>Nattillegg</span><strong>{money(calculation.nightPay)}</strong></div>
            <div className="breakdown-row"><span>Overtid · {hours(calculation.overtimeHours)}</span><strong>{money(calculation.overtimePay)}</strong></div>
            <div className="breakdown-row"><span>Ventetid · {hours(calculation.waitingHours)}</span><strong>{money(calculation.waitingPay)}</strong></div>
            <div className="breakdown-row"><span>Svingskift · {trip.swingCompHours ?? 0} t</span><strong>{money(calculation.swingPay)}</strong></div>
            {calculation.customAdditionResults.map((addition) => (
              <div className="breakdown-row" key={addition.id}><span>{addition.name}</span><strong>{money(addition.tripPay)}</strong></div>
            ))}
            </>}
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
