import { useState } from "react";
import { salaryAgreements } from "../data/salaries";
import type { AgreementId, TaxMethod, TripSetup } from "../types";
import { Modal } from "./Modal";

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
  const [holidayPayRate, setHolidayPayRate] = useState(trip.holidayPayRate ?? 12);
  const agreement = salaryAgreements[agreementId];

  function chooseAgreement(next: AgreementId) {
    const nextGroup = Object.keys(salaryAgreements[next].groups)[0];
    setAgreementId(next);
    setGroup(nextGroup);
    setStepIndex(0);
  }

  function selectedRates() {
    if (agreementId === "custom") return { hourlyRate, overtimeRate };
    return {
      hourlyRate: agreement.groups[group].hourly[stepIndex],
      overtimeRate: agreement.groups[group].overtime[stepIndex],
    };
  }

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
        <label>
          Timelønn
          <input
            type="number"
            min={0}
            step={0.01}
            value={agreementId === "custom" ? (hourlyRate || "") : agreement.groups[group].hourly[stepIndex]}
            readOnly={agreementId !== "custom"}
            onChange={(event) => setHourlyRate(Number(event.target.value))}
          />
        </label>
        {agreementId === "custom" && <label>Fast månedslønn<input type="number" min={0} step={100} value={monthlySalary || ""} onChange={event => setMonthlySalary(Number(event.target.value))} /></label>}
        <label>Overtidssats per time<input type="number" min={0} step={0.01} value={agreementId === "custom" ? (overtimeRate || "") : agreement.groups[group].overtime[stepIndex]} readOnly={agreementId !== "custom"} onChange={event => setOvertimeRate(Number(event.target.value))} /></label>
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
      <div className="modal-actions">
        <button className="secondary" onClick={onClose}>Lukk</button>
        <button
          className="primary"
          onClick={() => onSave({ ...trip, agreementId, group, stepIndex, ...selectedRates(), customMonthlySalary: agreementId === "custom" ? monthlySalary : undefined, holidayPayRate, nightAllowance, taxMethod, taxTable, taxRate: Math.min(60, Math.max(0, Number(taxRate) || trip.taxRate)), rotationOnDays, rotationOffDays })}
        >
          Lagre
        </button>
      </div>
    </Modal>
  );
}
