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
        <strong>Dette er en fremdriftsmåler – ikke ekstra lønn per tur.</strong>
        Den faste månedslønnen fordeles over de {trip.rotationOnDays * 12} planlagte
        arbeidstimene på {trip.rotationOnDays}-dagersperioden. Når for eksempel
        halvparten av timene er gjennomført, viser telleren halvparten av den
        faste månedslønnen. Overtid, ventetid og andre tillegg legges til
        fortløpende.
      </p>

      <div className="example-box">
        <strong className="example-title">Opptjent hittil</strong>
        <div className="example-row"><span>Fastlønn jobbet inn hittil</span><b>{money(calculation.accruedRegularGross)}</b></div>
        <div className="example-row"><span>Tillegg registrert hittil</span><b>+ {money(calculation.activeExtrasGross)}</b></div>
        <div className="example-row"><span>Sum før skatt hittil</span><b>{money(calculation.accruedNextPayoutGross)}</b></div>
        {usesTable && <div className="example-row"><span>Estimert tabelltrekk {trip.taxTable || "–"}</span><b>− {money(tableResult.tax ?? 0)}</b></div>}
        <div className="example-total"><span>Estimert etter skatt hittil</span><strong>ca. {money(displayedNet)}</strong></div>
      </div>

      <p className="muted small-copy">Den ordinære månedslønnen er hele den faste lønnen for måneden. Derfor er den høyere enn fastlønnen jobbet inn hittil før alle planlagte timer er gjennomført.</p>

      <p className="muted small-copy">{usesTable ? `Trekkpliktig lønn slås opp i Skatteetatens månedstabell ${trip.taxTable || "–"} for 2026.` : `Fastlønn og trekkpliktige tillegg bruker ${trip.taxRate}% fra prosentkortet.`} Trekkfrie refusjoner legges til etterpå. Feriepenger, halv skatt og andre lønnstrekk kan gi avvik.</p>

      <p className="muted small-copy">
        Beløpene er estimater. Kontroller alltid lønnsslippen og gjeldende avtale.
      </p>
      <button className="primary full-width" onClick={onClose}>
        Skjønner
      </button>
    </Modal>
  );
}
