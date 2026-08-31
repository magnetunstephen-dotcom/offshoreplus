import { useState } from "react";
import type { TripSetup } from "../types";
import { Modal } from "./Modal";

interface SettingsModalProps {
  trip: TripSetup;
  onSave: (trip: TripSetup) => void;
  onClose: () => void;
}

export function SettingsModal({ trip, onSave, onClose }: SettingsModalProps) {
  const [hourlyRate, setHourlyRate] = useState(trip.hourlyRate);
  const [monthlyBaseGross, setMonthlyBaseGross] = useState(trip.monthlyBaseGross ? String(trip.monthlyBaseGross) : "");
  const [nightAllowance, setNightAllowance] = useState(trip.nightAllowance);
  const [taxRate, setTaxRate] = useState(String(trip.taxRate));
  const [rotationOnDays, setRotationOnDays] = useState(trip.rotationOnDays);
  const [rotationOffDays, setRotationOffDays] = useState(trip.rotationOffDays);

  return (
    <Modal onClose={onClose} labelledBy="settings-title">
      <h2 id="settings-title">Innstillinger</h2>
      <p className="muted">
        De fleste trenger ikke å endre dette. Oppsettet lagres automatisk på
        enheten.
      </p>
      <div className="form-grid one-column">
        <label>
          Fast månedslønn fra lønnsslipp
          <input
            type="text"
            inputMode="decimal"
            value={monthlyBaseGross}
            placeholder="Eksempel: 68564,92"
            onChange={(event) => setMonthlyBaseGross(event.target.value)}
          />
          <small className="field-help">Når dette fylles inn, brukes beløpet foran tariffmatrisen.</small>
        </label>
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
        <label>
          Skatteprosent
          <input
            type="number"
            min={0}
            max={60}
            step={0.1}
            value={taxRate}
            onChange={(event) => setTaxRate(event.target.value)}
          />
        </label>
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
          onClick={() => onSave({ ...trip, monthlyBaseGross: Number(monthlyBaseGross.replace(",", ".")) || undefined, hourlyRate, nightAllowance, taxRate: Math.min(60, Math.max(0, Number(taxRate) || trip.taxRate)), rotationOnDays, rotationOffDays })}
        >
          Lagre
        </button>
      </div>
    </Modal>
  );
}
