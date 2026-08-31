import type { TripSetup } from "../types";
import { calculateTrip } from "../lib/calculation";
import { Modal } from "./Modal";

interface EarningsInfoModalProps {
  trip: TripSetup;
  onClose: () => void;
}

function money(value: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(value);
}

export function EarningsInfoModal({ trip, onClose }: EarningsInfoModalProps) {
  const calculation = calculateTrip(trip);

  return (
    <Modal onClose={onClose} labelledBy="earnings-info-title">
      <h2 id="earnings-info-title">Hva betyr tallene?</h2>
      <p>
        <strong>Opptjent denne turen</strong> viser lønn som bygges opp mens du
        jobber offshore. Det er ikke månedslønnen på lønnsslippen.
      </p>
      <p>
        <strong>Estimert full tur</strong> er beregnet lønn for én komplett
        offshoreperiode, inkludert registrerte tillegg.
      </p>
      <p>
        <strong>Opptjent mot neste lønn</strong> fordeler den faste
        månedslønnen fra tariff-/lønnstabellen over den planlagte 14-dagersturen.
        Telleren starter på 0 og når full estimert fastlønn når alle planlagte
        arbeidstimer er gjennomført. Variable tillegg legges på fortløpende.
      </p>

      <div className="example-box">
        <span>Eksempel med ditt oppsett</span>
        <strong>{money(calculation.accruedNextPayoutGross)} brutto opptjent nå</strong>
        <span>Fast månedslønn: {money(calculation.regularMonthlyGross)}</span>
        <span>Tillegg opptjent på aktiv tur: {money(calculation.activeExtrasGross)}</span>
        <strong>≈ {money(calculation.accruedNextPayoutNet)} estimert netto opptjent</strong>
      </div>

      <p className="muted small-copy">Ordinær lønn bruker skattetrekket du har valgt. Tillegg beregnes med 50 % estimert forskuddstrekk. Arbeidsgiverens lønnskjøringsfrist, tabelltrekk, feriepenger og andre trekk kan gjøre at lønnsslippen avviker.</p>

      <p className="muted small-copy">
        OffshorePlus er en motivasjons- og estimatkalkulator. Kontroller alltid
        lønnsslippen og gjeldende avtale.
      </p>
      <button className="primary full-width" onClick={onClose}>
        Skjønner
      </button>
    </Modal>
  );
}
