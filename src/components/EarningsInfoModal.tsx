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
        <strong>Estimert månedslønn</strong> fordeler årsopptjeningen jevnt over
        12 måneder. Faktisk utbetaling kan avvike på grunn av lønnssystem,
        trekk, ferie, andre tillegg og arbeidsgivers praksis.
      </p>

      <div className="example-box">
        <span>Eksempel med ditt oppsett</span>
        <strong>{money(calculation.estimatedGross)} per tur</strong>
        <span>× {calculation.tripsPerYear.toFixed(1)} turer per år</span>
        <strong>≈ {money(calculation.estimatedMonthlyGross)} per måned</strong>
      </div>

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
