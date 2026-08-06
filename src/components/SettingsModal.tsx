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
  const [nightAllowance, setNightAllowance] = useState(trip.nightAllowance);
  const [taxRate, setTaxRate] = useState(trip.taxRate);
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
            onChange={(event) => setTaxRate(Number(event.target.value))}
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
          onClick={() => onSave({ ...trip, hourlyRate, nightAllowance, taxRate, rotationOnDays, rotationOffDays })}
        >
          Lagre
        </button>
      </div>
    </Modal>
  );
}
