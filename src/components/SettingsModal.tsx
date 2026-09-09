import { useState } from "react";
import { salaryAgreements } from "../data/salaries";
import type { AgreementId, TaxMethod, TripSetup } from "../types";
import { Modal } from "./Modal";
import { deriveCustomSalary } from "../lib/customSalary";

interface SettingsModalProps {
  trip: TripSetup;
  onSave: (trip: TripSetup) => void;
  onClose: () => void;
}

export function SettingsModal({ trip, onSave, onClose }: SettingsModalProps) {
  const [agreementId, setAgreementId] = useState<AgreementId>(trip.agreementId);
  const [group, setGroup] = useState(trip.group);
  const [stepIndex, setStepIndex] = useState(trip.stepIndex);
  const [hourlyRate, setHourlyRate] = useState(trip.hourlyRate);
  const [nightAllowance, setNightAllowance] = useState(trip.nightAllowance);
  const [taxRate, setTaxRate] = useState(String(trip.taxRate));
  const [taxMethod, setTaxMethod] = useState<TaxMethod>(trip.taxMethod ?? "percentage");
  const [taxTable, setTaxTable] = useState(trip.taxTable ?? "");
  const [rotationOnDays, setRotationOnDays] = useState(trip.rotationOnDays);
  const [rotationOffDays, setRotationOffDays] = useState(trip.rotationOffDays);
  const [overtimeRate, setOvertimeRate] = useState(trip.overtimeRate);
  const [monthlySalary, setMonthlySalary] = useState(trip.customMonthlySalary ?? 0);
  const [annualSalary, setAnnualSalary] = useState(trip.customAnnualSalary ?? 0);
  const [annualIncludesHolidayPay, setAnnualIncludesHolidayPay] = useState(trip.customAnnualIncludesHolidayPay ?? false);
  const [holidayPayRate, setHolidayPayRate] = useState(trip.holidayPayRate ?? 12);
  const [advanced,setAdvanced]=useState(false);
  const [hourlyRatesIncludeHolidayPay,setHourlyRatesIncludeHolidayPay]=useState(trip.hourlyRatesIncludeHolidayPay ?? false);
  const [roundOvertime,setRoundOvertime]=useState(trip.roundOvertime ?? true);
  const [holidayCompensationRate,setHolidayCompensationRate]=useState(trip.holidayCompensationRate ?? 0);
  const agreement = salaryAgreements[agreementId];

  function chooseAgreement(next: AgreementId) {
    const nextGroup = Object.keys(salaryAgreements[next].groups)[0];
    setAgreementId(next);
    setGroup(nextGroup);
    setStepIndex(0);
  }

  function selectedRates() {
    if (agreementId === "custom") {
      if (annualSalary > 0) {
        const derived = deriveCustomSalary(annualSalary, annualIncludesHolidayPay, holidayPayRate, rotationOnDays, rotationOffDays);
        return { hourlyRate: derived.hourlyRate, overtimeRate: derived.overtimeRate };
      }
      return { hourlyRate, overtimeRate };
    }
    return {
      hourlyRate: agreement.groups[group].hourly[stepIndex],
      overtimeRate: agreement.groups[group].overtime[stepIndex],
    };
  }

  const derivedSalary = deriveCustomSalary(annualSalary, annualIncludesHolidayPay, holidayPayRate, rotationOnDays, rotationOffDays);

  return (
    <Modal onClose={onClose} labelledBy="settings-title">
      <div className="account-header">
        <div><span className="eyebrow">OFFSHOREPLUS</span><h2 id="settings-title">Innstillinger</h2></div>
        <button className="calendar-close" onClick={onClose} aria-label="Lukk">×</button>
      </div>
      <p className="muted">
        De fleste trenger ikke å endre dette. Oppsettet lagres automatisk på
        enheten.
      </p>
      <div className="form-grid one-column">
        <label>Lønnsavtale
          <select value={agreementId} onChange={(event) => chooseAgreement(event.target.value as AgreementId)}>
            {(Object.keys(salaryAgreements) as AgreementId[]).map((id) => <option key={id} value={id}>{salaryAgreements[id].name}</option>)}
          </select>
        </label>
        <div className="form-grid">
          <label>Gruppe
            <select value={group} onChange={(event) => { setGroup(event.target.value); setStepIndex(0); }}>
              {Object.keys(agreement.groups).map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>Trinn
            <select value={stepIndex} onChange={(event) => setStepIndex(Number(event.target.value))}>
              {agreement.steps.map((value, index) => <option key={value} value={index}>{value}</option>)}
            </select>
          </label>
        </div>
        {agreementId === "custom" && <>
          <div className="form-grid">
            <label>Årslønn (valgfritt)<input type="number" min={0} step={1000} placeholder="F.eks. 900 000" value={annualSalary || ""} onChange={event => setAnnualSalary(Number(event.target.value))} /><small className="field-help">Gir automatisk måneds-, time- og overtidslønn</small></label>
            <label>Årslønnen er<select value={annualIncludesHolidayPay ? "with" : "without"} onChange={event => setAnnualIncludesHolidayPay(event.target.value === "with")}><option value="without">Uten feriepenger</option><option value="with">Inkludert feriepenger</option></select></label>
          </div>
          {annualSalary > 0 && <div className="info-box compact-info"><strong>Automatisk beregnet for {rotationOnDays}/{rotationOffDays}-rotasjon</strong><span>Grunnlønn per måned: {Math.round(derivedSalary.monthlySalary).toLocaleString("nb-NO")} kr</span><span>Timelønn: {derivedSalary.hourlyRate.toFixed(2).replace(".", ",")} kr · overtid: {derivedSalary.overtimeRate.toFixed(2).replace(".", ",")} kr/time</span><small>{Math.round(derivedSalary.annualWorkHours).toLocaleString("nb-NO")} planlagte timer per år · overtid 165 %</small></div>}
        </>}
        <label>
          Timelønn
          <input
            type="number"
            min={0}
            step={0.01}
            value={agreementId === "custom" ? (annualSalary > 0 ? derivedSalary.hourlyRate.toFixed(2) : (hourlyRate || "")) : agreement.groups[group].hourly[stepIndex]}
            readOnly={agreementId !== "custom" || annualSalary > 0}
            onChange={(event) => setHourlyRate(Number(event.target.value))}
          />
        </label>
        {agreementId === "custom" && <label>Fast månedslønn<input type="number" min={0} step={100} readOnly={annualSalary > 0} value={annualSalary > 0 ? Math.round(derivedSalary.monthlySalary) : (monthlySalary || "")} onChange={event => setMonthlySalary(Number(event.target.value))} /></label>}
        <label>Overtidssats per time<input type="number" min={0} step={0.01} value={agreementId === "custom" ? (annualSalary > 0 ? derivedSalary.overtimeRate.toFixed(2) : (overtimeRate || "")) : agreement.groups[group].overtime[stepIndex]} readOnly={agreementId !== "custom" || annualSalary > 0} onChange={event => setOvertimeRate(Number(event.target.value))} /></label>
        <label>Feriepengesats<input type="number" min={0} max={20} step={0.1} value={holidayPayRate || ""} onChange={event => setHolidayPayRate(Number(event.target.value))} /><small className="field-help">Vises som opptjening og legges ikke til neste lønn.</small></label>
        <label>
          Natt-tillegg per time
          <input
            type="number"
            min={0}
            step={0.01}
            value={nightAllowance || ""}
            onChange={(event) => setNightAllowance(Number(event.target.value))}
          />
        </label>
        <label>Skattemetode<select value={taxMethod} onChange={(event) => setTaxMethod(event.target.value as TaxMethod)}><option value="percentage">Prosenttrekk</option><option value="table">Tabelltrekk</option></select></label>
        {taxMethod === "percentage" ? <label>
          Skatteprosent
          <input
            type="number"
            min={0}
            max={60}
            step={0.1}
            value={taxRate}
            onChange={(event) => setTaxRate(event.target.value)}
          />
        </label> : <label>Tabellnummer<input inputMode="numeric" maxLength={4} value={taxTable} placeholder="Eksempel: 8000" onChange={(event) => setTaxTable(event.target.value.replace(/\D/g, "").slice(0, 4))} /><small className="field-help">Månedstabell for lønn · Skatteetatens 2026-tabeller</small></label>}
        <div className="form-grid">
          <label>
            Dager offshore
            <input type="number" min={1} value={rotationOnDays || ""} onChange={(event) => setRotationOnDays(Number(event.target.value))} />
          </label>
          <label>
            Dager fri
            <input type="number" min={0} value={rotationOffDays || ""} onChange={(event) => setRotationOffDays(Number(event.target.value))} />
          </label>
        </div>
      </div>
      <button className="secondary full-width" aria-expanded={advanced} aria-controls="pay-advanced" onClick={()=>setAdvanced(!advanced)}>{advanced ? "Skjul avansert" : "Avansert – satser og beregningsvalg"}</button>
      {advanced && <div id="pay-advanced" className="advanced-settings">
        <p>Tilpass etter lønnsslippen eller lokal avtale. Disse valgene påvirker estimatet, men endrer ikke valgt grunnlønn.</p>
        <label>Inkluderer time- og overtidssatsene feriepenger?<select value={hourlyRatesIncludeHolidayPay ? "yes" : "no"} onChange={e=>setHourlyRatesIncludeHolidayPay(e.target.value==="yes")}><option value="no">Nei – beregn feriepengeopptjening i tillegg</option><option value="yes">Ja – ikke beregn feriepenger på disse beløpene igjen</option></select><small>Gjelder ventetid, overtid og svingskift. Fast månedslønn forutsettes oppgitt uten feriepenger. Kontroller satsgrunnlaget før du endrer.</small></label>
        <label>Manuell overtid – avsluttede økter<select value={roundOvertime ? "half" : "exact"} onChange={e=>setRoundOvertime(e.target.value==="half")}><option value="half">Avrund opp til nærmeste halvtime</option><option value="exact">Nøyaktig tid (lokal ordning)</option></select></label>
        <label>Helligdagsgodtgjørelse (kr per dag)<input type="number" min="0" step="1" value={holidayCompensationRate} onChange={e=>setHolidayCompensationRate(Math.max(0,Number(e.target.value)))} /><small>0 = ikke inkludert. Teller registrerte offshore-datoer, inkludert ekstra dager og hjemreisedagen. Heliport før utreise registreres som eget tillegg.</small></label>
        <button className="secondary" onClick={()=>setHolidayCompensationRate(2400)}>Bruk sokkelsats 2026: 2400 kr/dag</button>
        <p>Nattillegg på ordinær tur: velg vanlig skift/natt eller sats med konferansetid, hvis den gjelder deg.</p>
        <div className="welcome-actions"><button className="secondary" onClick={()=>setNightAllowance(106)}>106 kr/t · skift/natt</button><button className="secondary" onClick={()=>setNightAllowance(136)}>136 kr/t · med konferansetid</button></div>
        <small>Valgt nattillegg: {nightAllowance} kr/t. Lagre for å ta i bruk endringen. Nattillegg under ekstratur velges separat der.</small>
        <p><a href="https://styrke.no/nyhet/ingen-streik-i-sokkeloppgjoret/" target="_blank" rel="noreferrer">Sokkeloppgjøret 2026 – kilde til satsforslagene</a></p>
      </div>}
      <div className="modal-actions">
        <button className="secondary" onClick={onClose}>Lukk</button>
        <button
          className="primary"
          onClick={() => onSave({ ...trip, hourlyRatesIncludeHolidayPay, roundOvertime, holidayCompensationRate, agreementId, group, stepIndex, ...selectedRates(), customMonthlySalary: agreementId === "custom" ? (annualSalary > 0 ? derivedSalary.monthlySalary : monthlySalary) : undefined, customAnnualSalary: agreementId === "custom" && annualSalary > 0 ? annualSalary : undefined, customAnnualIncludesHolidayPay: agreementId === "custom" && annualSalary > 0 ? annualIncludesHolidayPay : undefined, holidayPayRate, nightAllowance, taxMethod, taxTable, taxRate: Math.min(60, Math.max(0, Number(taxRate) || trip.taxRate)), rotationOnDays, rotationOffDays })}
        >
          Lagre
        </button>
      </div>
    </Modal>
  );
}
