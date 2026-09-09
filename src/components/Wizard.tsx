import { useMemo, useState } from "react";
import { salaryAgreements } from "../data/salaries";
import { addDays, formatDate, toDateTimeLocal } from "../lib/date";
import { DateTime24Input } from "./DateTime24Input";
import { holidaysDuringTrip } from "../lib/holidays";
import { deriveCustomSalary } from "../lib/customSalary";
import type { AgreementId, ShiftPattern, TaxMethod, TripSetup } from "../types";
import { Modal } from "./Modal";

interface WizardProps {
  existingTrip: TripSetup | null;
  onComplete: (trip: TripSetup) => void;
  onCancel?: () => void;
}

const patterns: Array<{ id: ShiftPattern; title: string; detail: string }> = [
  { id: "day", title: "☀️ Dag hele turen", detail: "07:00–19:00" },
  { id: "night", title: "🌙 Natt hele turen", detail: "19:00–07:00" },
  {
    id: "night-day",
    title: "🌙 Natt → ☀️ dag",
    detail: "Standard snuing settes automatisk.",
  },
  {
    id: "day-night",
    title: "☀️ Dag → 🌙 natt",
    detail: "Standard snuing settes automatisk.",
  },
];

export function Wizard({ existingTrip, onComplete, onCancel }: WizardProps) {
  const now = new Date();
  const [step, setStep] = useState(1);
  const [heliDeparture, setHeliDeparture] = useState(
    existingTrip?.heliDeparture ?? toDateTimeLocal(now),
  );
  const [paidStart, setPaidStart] = useState(
    existingTrip?.paidStart ?? toDateTimeLocal(addDays(now, 0)),
  );
  const [agreementId, setAgreementId] = useState<AgreementId>(
    existingTrip?.agreementId ?? "sokkel4a2025",
  );
  const agreement = salaryAgreements[agreementId];
  const initialGroup =
    existingTrip && agreement.groups[existingTrip.group]
      ? existingTrip.group
      : Object.keys(agreement.groups)[0];
  const [group, setGroup] = useState(initialGroup);
  const [stepIndex, setStepIndex] = useState(existingTrip?.stepIndex ?? 0);
  const [pattern, setPattern] = useState<ShiftPattern>(
    existingTrip?.pattern ?? "night-day",
  );
  const [nightAllowance, setNightAllowance] = useState(existingTrip?.nightAllowance ?? 136);
  const [taxRate, setTaxRate] = useState(String(existingTrip?.taxRate ?? 35));
  const [taxMethod, setTaxMethod] = useState<TaxMethod>(existingTrip?.taxMethod ?? "percentage");
  const [taxTable, setTaxTable] = useState(existingTrip?.taxTable ?? "");
  const [taxUnknown, setTaxUnknown] = useState(false);
  const [rotation, setRotation] = useState(existingTrip ? `${existingTrip.rotationOnDays}-${existingTrip.rotationOffDays}` : "14-28");
  const [customOnDays, setCustomOnDays] = useState(existingTrip?.rotationOnDays ?? 14);
  const [customOffDays, setCustomOffDays] = useState(existingTrip?.rotationOffDays ?? 28);
  const [customMonthlySalary, setCustomMonthlySalary] = useState(existingTrip?.customMonthlySalary ?? 60000);
  const [customHourlyRate, setCustomHourlyRate] = useState(existingTrip?.agreementId === "custom" ? existingTrip.hourlyRate : 450);
  const [customOvertimeRate, setCustomOvertimeRate] = useState(existingTrip?.agreementId === "custom" ? existingTrip.overtimeRate : 750);
  const [customAnnualSalary, setCustomAnnualSalary] = useState(existingTrip?.customAnnualSalary ?? 0);
  const [customAnnualIncludesHolidayPay, setCustomAnnualIncludesHolidayPay] = useState(existingTrip?.customAnnualIncludesHolidayPay ?? false);
  const [holidayPayRate, setHolidayPayRate] = useState(existingTrip?.holidayPayRate ?? 12);

  const holidays = useMemo(
    () => (paidStart ? holidaysDuringTrip(new Date(paidStart)) : []),
    [paidStart],
  );

  function chooseAgreement(next: AgreementId) {
    setAgreementId(next);
    setGroup(Object.keys(salaryAgreements[next].groups)[0]);
    setStepIndex(0);
  }

  function next() {
    if (step === 1 && !heliDeparture) return;
    if (step === 2 && !paidStart) return;
    setStep((current) => Math.min(5, current + 1));
  }

  function complete() {
    const [presetOn, presetOff] = rotation.split("-").map(Number);
    const rotationOnDays = rotation === "custom" ? customOnDays : presetOn;
    const rotationOffDays = rotation === "custom" ? customOffDays : presetOff;
    const derivedSalary = deriveCustomSalary(customAnnualSalary, customAnnualIncludesHolidayPay, holidayPayRate, rotationOnDays, rotationOffDays);
    const usesAnnualSalary = agreementId === "custom" && customAnnualSalary > 0;
    const hourlyRate = agreementId === "custom" ? (usesAnnualSalary ? derivedSalary.hourlyRate : customHourlyRate) : agreement.groups[group].hourly[stepIndex];
    const overtimeRate = agreementId === "custom" ? (usesAnnualSalary ? derivedSalary.overtimeRate : customOvertimeRate) : agreement.groups[group].overtime[stepIndex];
    onComplete({
      hourlyRatesIncludeHolidayPay: existingTrip?.hourlyRatesIncludeHolidayPay,
      roundOvertime: existingTrip?.roundOvertime,
      holidayCompensationRate: existingTrip?.holidayCompensationRate,
      heliDeparture,
      paidStart,
      agreementId,
      group,
      stepIndex,
      pattern,
      taxRate: taxUnknown ? 35 : Math.min(60, Math.max(0, Number(taxRate) || 35)),
      taxMethod,
      taxTable,
      hourlyRate,
      nightAllowance,
      overtimeHours: existingTrip?.overtimeHours ?? 0,
      overtimeRate,
      customMonthlySalary: agreementId === "custom" ? (usesAnnualSalary ? derivedSalary.monthlySalary : customMonthlySalary) : undefined,
      customAnnualSalary: usesAnnualSalary ? customAnnualSalary : undefined,
      customAnnualIncludesHolidayPay: usesAnnualSalary ? customAnnualIncludesHolidayPay : undefined,
      holidayPayRate,
      rotationOnDays,
      rotationOffDays,
      additionSessions: existingTrip?.additionSessions ?? [],
      swingCompHours: existingTrip?.swingCompHours ?? 0,
      earningsView: existingTrip?.earningsView ?? "monthly-net",
      customAdditions: existingTrip?.customAdditions ?? [],
    });
  }

  return (
    <Modal onClose={onCancel} labelledBy="wizard-title">
      <button className="modal-corner-close" onClick={onCancel} aria-label="Lukk oppsett">×</button>
      <div className="progress" aria-label={`Steg ${step} av 5`}>
        {[1, 2, 3, 4, 5].map((number) => (
          <span className={number <= step ? "active" : ""} key={number} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <div className="step-emoji">🚁</div>
          <h2 id="wizard-title">Når gikk helikopteret fra land?</h2>
          <p className="muted">
            Dette brukes som reiseinformasjon. Lønnstelleren starter ikke her.
          </p>
          <label>
            Dato og klokkeslett
            <DateTime24Input value={heliDeparture} onChange={setHeliDeparture} />
          </label>
          <label>
            Rotasjon
            <select value={rotation} onChange={(event) => setRotation(event.target.value)}>
              <option value="14-28">2/4 · 14 på / 28 av</option>
              <option value="14-21">14 på / 21 av</option>
              <option value="15-21">15 på / 21 av</option>
              <option value="14-14">14 på / 14 av</option>
              <option value="7-7">7 på / 7 av</option>
              <option value="12-16">12 på / 16 av</option>
              <option value="21-21">21 på / 21 av</option>
              <option value="custom">Egendefinert</option>
            </select>
          </label>
          {rotation === "custom" && (
            <div className="form-grid">
              <label>
                Dager offshore
                <input type="number" min={1} value={customOnDays || ""} onChange={(event) => setCustomOnDays(Number(event.target.value))} />
              </label>
              <label>
                Dager fri
                <input type="number" min={0} value={customOffDays || ""} onChange={(event) => setCustomOffDays(Number(event.target.value))} />
              </label>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="step-emoji">⏱️</div>
          <h2 id="wizard-title">Når var første betalte arbeidstime?</h2>
          <p className="muted">
            Fra dette tidspunktet begynner arbeidstid og lønn å telle.
          </p>
          <label>
            Dato og klokkeslett
            <DateTime24Input value={paidStart} onChange={setPaidStart} />
          </label>
          {holidays.length > 0 && (
            <div className="holiday-preview">
              <strong>
                🎉 Turen inneholder {holidays.length} hellig-/tariffdag
                {holidays.length > 1 ? "er" : ""}:
              </strong>
              {holidays.map((holiday) => (
                <span key={`${holiday.name}-${holiday.date.toISOString()}`}>
                  {holiday.name} – {formatDate(holiday.date)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="step-emoji">💰</div>
          <h2 id="wizard-title">Velg lønn</h2>
          <div className="choice-list">
            {(Object.keys(salaryAgreements) as AgreementId[]).map((id) => {
              const option = salaryAgreements[id];
              return (
                <label className="choice" key={id}>
                  <input
                    type="radio"
                    name="agreement"
                    checked={agreementId === id}
                    onChange={() => chooseAgreement(id)}
                  />
                  <span>
                    <strong>{option.name}</strong>
                    <small>{option.description}</small>
                    {option.effectiveFrom && <small className="agreement-date">{option.effectiveFrom}</small>}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="form-grid">
            <label>
              Gruppe
              <select
                value={group}
                onChange={(event) => {
                  setGroup(event.target.value);
                  setStepIndex(0);
                }}
              >
                {Object.keys(agreement.groups).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Trinn
              <select
                value={stepIndex}
                onChange={(event) => setStepIndex(Number(event.target.value))}
              >
                {agreement.steps.map((value, index) => (
                  <option key={value} value={index}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {agreement.groupDescriptions?.[group] && <p className="muted agreement-group-help"><strong>Gruppe {group}:</strong> {agreement.groupDescriptions[group]}</p>}
          {agreementId === "custom" && <div className="custom-salary-box">
            {(() => {
              const [presetOn, presetOff] = rotation.split("-").map(Number);
              const onDays = rotation === "custom" ? customOnDays : presetOn;
              const offDays = rotation === "custom" ? customOffDays : presetOff;
              const derived = deriveCustomSalary(customAnnualSalary, customAnnualIncludesHolidayPay, holidayPayRate, onDays, offDays);
              return <>
                <div className="form-grid">
                  <label>Årslønn (valgfritt)<input type="number" min={0} step={1000} placeholder="F.eks. 900 000" value={customAnnualSalary || ""} onChange={event => setCustomAnnualSalary(Number(event.target.value))} /><small className="field-help">Fyll inn denne for automatisk utregning</small></label>
                  <label>Årslønnen er<select value={customAnnualIncludesHolidayPay ? "with" : "without"} onChange={event => setCustomAnnualIncludesHolidayPay(event.target.value === "with")}><option value="without">Uten feriepenger</option><option value="with">Inkludert feriepenger</option></select></label>
                </div>
                {customAnnualSalary > 0 && <div className="info-box compact-info"><strong>Automatisk beregnet for {onDays}/{offDays}-rotasjon</strong><span>Grunnlønn per måned: {Math.round(derived.monthlySalary).toLocaleString("nb-NO")} kr</span><span>Timelønn: {derived.hourlyRate.toFixed(2).replace(".", ",")} kr · overtid: {derived.overtimeRate.toFixed(2).replace(".", ",")} kr/time</span><small>{Math.round(derived.annualWorkHours).toLocaleString("nb-NO")} planlagte arbeidstimer per år · overtid beregnet med 165 %</small></div>}
              </>;
            })()}
            <div className="form-grid">
              <label>Fast månedslønn<input type="number" min={0} step={100} readOnly={customAnnualSalary > 0} value={customAnnualSalary > 0 ? Math.round(deriveCustomSalary(customAnnualSalary, customAnnualIncludesHolidayPay, holidayPayRate, rotation === "custom" ? customOnDays : Number(rotation.split("-")[0]), rotation === "custom" ? customOffDays : Number(rotation.split("-")[1])).monthlySalary) : (customMonthlySalary || "")} onChange={event => setCustomMonthlySalary(Number(event.target.value))} /><small className="field-help">Brutto før tillegg</small></label>
              <label>Timelønn<input type="number" min={0} step={0.01} readOnly={customAnnualSalary > 0} value={customAnnualSalary > 0 ? deriveCustomSalary(customAnnualSalary, customAnnualIncludesHolidayPay, holidayPayRate, rotation === "custom" ? customOnDays : Number(rotation.split("-")[0]), rotation === "custom" ? customOffDays : Number(rotation.split("-")[1])).hourlyRate.toFixed(2) : (customHourlyRate || "")} onChange={event => setCustomHourlyRate(Number(event.target.value))} /></label>
              <label>Overtid per time<input type="number" min={0} step={0.01} readOnly={customAnnualSalary > 0} value={customAnnualSalary > 0 ? deriveCustomSalary(customAnnualSalary, customAnnualIncludesHolidayPay, holidayPayRate, rotation === "custom" ? customOnDays : Number(rotation.split("-")[0]), rotation === "custom" ? customOffDays : Number(rotation.split("-")[1])).overtimeRate.toFixed(2) : (customOvertimeRate || "")} onChange={event => setCustomOvertimeRate(Number(event.target.value))} /></label>
              <label>Feriepenger<input type="number" min={0} max={20} step={0.1} value={holidayPayRate || ""} onChange={event => setHolidayPayRate(Number(event.target.value))} /><small className="field-help">Vanligvis 10,2 % eller 12 %</small></label>
            </div>
          </div>}
          {agreement.notes && <div className="info-box compact-info agreement-notes">{agreement.notes.map(note => <span key={note}>{note}</span>)}</div>}
        </div>
      )}

      {step === 4 && (
        <div>
          <div className="step-emoji">🕒</div>
          <h2 id="wizard-title">Hvordan jobber du denne turen?</h2>
          <div className="choice-list">
            {patterns.map((option) => (
              <label className="choice" key={option.id}>
                <input
                  type="radio"
                  name="pattern"
                  checked={pattern === option.id}
                  onChange={() => setPattern(option.id)}
                />
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.detail}</small>
                </span>
              </label>
            ))}
          </div>
          <div className="info-box compact-info">
            Overtid, ventetid og svingskift registreres live fra dashboardet når det skjer.
          </div>
          {pattern !== "day" && <div className="night-allowance-picker">
            <span className="eyebrow">Nattillegg per time</span>
            <div className="segmented">
              <button className={nightAllowance === 136 ? "selected" : ""} onClick={() => setNightAllowance(136)}>136 kr · med handover</button>
              <button className={nightAllowance === 106 ? "selected" : ""} onClick={() => setNightAllowance(106)}>106 kr · uten</button>
            </div>
            <label>Egen sats<input type="number" min={0} step={0.01} value={nightAllowance || ""} onChange={(event) => setNightAllowance(Number(event.target.value))} /></label>
            <small className="field-help">2026-sats: 136 kr når nødvendig konferanse/handover ved skiftbytte inngår, ellers 106 kr.</small>
          </div>}
        </div>
      )}

      {step === 5 && (
        <div>
          <div className="step-emoji">🧾</div>
          <h2 id="wizard-title">Vet du cirka skatteprosent?</h2>
          <p className="muted">Velg samme trekkmetode som står på skattekortet.</p>
          <div className="segmented"><button className={taxMethod === "percentage" ? "selected" : ""} onClick={() => setTaxMethod("percentage")}>Prosenttrekk</button><button className={taxMethod === "table" ? "selected" : ""} onClick={() => setTaxMethod("table")}>Tabelltrekk</button></div>
          {taxMethod === "percentage" ? <><label>
            Skattetrekk
            <div className="suffix-field">
              <input
                type="number"
                min={0}
                max={60}
                step={0.1}
                value={taxRate}
                disabled={taxUnknown}
                onChange={(event) => setTaxRate(event.target.value)}
              />
              <span>%</span>
            </div>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={taxUnknown}
              onChange={(event) => setTaxUnknown(event.target.checked)}
            />
            Jeg vet ikke – bruk 35 %
          </label></> : <label>Tabellnummer<input inputMode="numeric" maxLength={4} value={taxTable} placeholder="Eksempel: 8000" onChange={(event) => setTaxTable(event.target.value.replace(/\D/g, "").slice(0, 4))} /><small className="field-help">Bruk tabellnummeret fra skattekortet. OffshorePlus bruker månedstabellen for lønn i Skatteetatens 2026-data.</small></label>}
        </div>
      )}

      <div className="modal-actions">
        {step > 1 && (
          <button className="secondary" onClick={() => setStep(step - 1)}>
            Tilbake
          </button>
        )}
        {step < 5 ? (
          <button className="primary" onClick={next}>
            Neste
          </button>
        ) : (
          <button className="primary" onClick={complete}>
            Start kalkulatoren
          </button>
        )}
      </div>
    </Modal>
  );
}
