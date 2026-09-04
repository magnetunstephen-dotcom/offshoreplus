import { useState } from "react";
import type { TaxMethod, TripSetup } from "../types";
import { Modal } from "./Modal";

interface SettingsModalProps {
  trip: TripSetup;
  onSave: (trip: TripSetup) => void;
  onClose: () => void;
}

export function SettingsModal({ trip, onSave, onClose }: SettingsModalProps) {
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

  return (
    <Modal onClose={onClose} labelledBy="settings-title">
      <h2 id="settings-title">Innstillinger</h2>
      <p className="muted">
        De fleste trenger ikke å endre dette. Oppsettet lagres automatisk på
        enheten.
      </p>
      <div className="form-grid one-column">
        <label>
          Timelønn
          <input
            type="number"
            min={0}
            step={0.01}
            value={hourlyRate}
            onChange={(event) => setHourlyRate(Number(event.target.value))}
          />
        </label>
        {trip.agreementId === "custom" && <label>Fast månedslønn<input type="number" min={0} step={100} value={monthlySalary} onChange={event => setMonthlySalary(Number(event.target.value))} /></label>}
        <label>Overtidssats per time<input type="number" min={0} step={0.01} value={overtimeRate} onChange={event => setOvertimeRate(Number(event.target.value))} /></label>
        <label>Feriepengesats<input type="number" min={0} max={20} step={0.1} value={holidayPayRate} onChange={event => setHolidayPayRate(Number(event.target.value))} /><small className="field-help">Vises som opptjening og legges ikke til neste lønn.</small></label>
        <label>
          Natt-tillegg per time
          <input
            type="number"
            min={0}
            step={0.01}
            value={nightAllowance}
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
            <input type="number" min={1} value={rotationOnDays} onChange={(event) => setRotationOnDays(Number(event.target.value))} />
          </label>
          <label>
            Dager fri
            <input type="number" min={0} value={rotationOffDays} onChange={(event) => setRotationOffDays(Number(event.target.value))} />
          </label>
        </div>
      </div>
      <div className="modal-actions">
        <button className="secondary" onClick={onClose}>Lukk</button>
        <button
          className="primary"
          onClick={() => onSave({ ...trip, hourlyRate, overtimeRate, customMonthlySalary: trip.agreementId === "custom" ? monthlySalary : undefined, holidayPayRate, nightAllowance, taxMethod, taxTable, taxRate: Math.min(60, Math.max(0, Number(taxRate) || trip.taxRate)), rotationOnDays, rotationOffDays })}
        >
          Lagre
        </button>
      </div>
    </Modal>
  );
}
