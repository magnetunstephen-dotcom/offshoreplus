import type { TripSetup } from "../types";
import { calculateTrip } from "../lib/calculation";
import { Modal } from "./Modal";
import { useMonthlyTableTax } from "../hooks/useMonthlyTableTax";

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
  const tableResult = useMonthlyTableTax(trip.taxTable ?? "", calculation.accruedTaxableGross);
  const usesTable = trip.taxMethod === "table";
  const displayedNet = usesTable && tableResult.tax !== null
    ? calculation.accruedTaxableGross - tableResult.tax + calculation.accruedTaxFreeGross
    : calculation.accruedNextPayoutNet;

  return (
    <Modal onClose={onClose} labelledBy="earnings-info-title">
      <h2 id="earnings-info-title">Hva betyr tallene?</h2>
      <p>
        <strong>Opptjent mot neste lønn</strong> tar årslønnen fra
        tariff-/lønnstabellen, deler den på 12 og fordeler denne faste
        månedslønnen over den planlagte 14-dagersperioden.
        Telleren starter på 0 og når full estimert fastlønn når alle planlagte
        arbeidstimer er gjennomført. Variable tillegg legges på fortløpende.
      </p>

      <div className="example-box">
        <span>Eksempel med ditt oppsett</span>
        <strong>{money(calculation.accruedNextPayoutGross)} brutto opptjent nå</strong>
        <span>Fast månedslønn: {money(calculation.regularMonthlyGross)}</span>
        <span>Tillegg opptjent på aktiv tur: {money(calculation.activeExtrasGross)}</span>
        {usesTable && <span>Tabelltrekk {trip.taxTable || "–"}: {money(tableResult.tax ?? 0)}</span>}
        <strong>≈ {money(displayedNet)} estimert netto opptjent</strong>
      </div>

      <p className="muted small-copy">{usesTable ? `Trekkpliktig lønn slås opp i Skatteetatens månedstabell ${trip.taxTable || "–"} for 2026.` : `Fastlønn og trekkpliktige tillegg bruker ${trip.taxRate}% fra prosentkortet.`} Trekkfrie refusjoner legges til etterpå. Feriepenger, halv skatt og andre lønnstrekk kan gi avvik.</p>

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
