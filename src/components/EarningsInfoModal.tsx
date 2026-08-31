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
        <strong>Forventet utbetalt måned</strong> normaliserer ordinær full
        turverdi med 8,7 turer per år og deler på 12. Registrert overtid,
        helligdagstillegg og andre ekstra tillegg legges direkte oppå og blir
        ikke annualisert.
      </p>

      <div className="example-box">
        <span>Eksempel med ditt oppsett</span>
        <strong>{money(calculation.regularMonthlyGross)} ordinær brutto måned</strong>
        <span>+ {money(calculation.activeExtrasGross)} ekstra på aktiv tur</span>
        <strong>≈ {money(calculation.estimatedMonthlyNet)} forventet utbetalt</strong>
      </div>

      <p className="muted small-copy">Ordinær lønn bruker skattetrekket du har valgt. Overtid og ekstra tillegg beregnes med 50 % estimert forskuddstrekk. Det er ikke nødvendigvis den endelige skatten.</p>

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
