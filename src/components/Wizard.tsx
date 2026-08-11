import { useMemo, useState } from "react";
import { salaryAgreements } from "../data/salaries";
import { addDays, formatDate, toDateTimeLocal } from "../lib/date";
import { holidaysDuringTrip } from "../lib/holidays";
import type { AgreementId, ShiftPattern, TripSetup } from "../types";
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
    existingTrip?.agreementId ?? "safe2025",
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
  const [taxRate, setTaxRate] = useState(existingTrip?.taxRate ?? 35);
  const [taxUnknown, setTaxUnknown] = useState(false);
  const [rotation, setRotation] = useState(existingTrip ? `${existingTrip.rotationOnDays}-${existingTrip.rotationOffDays}` : "14-28");
  const [customOnDays, setCustomOnDays] = useState(existingTrip?.rotationOnDays ?? 14);
  const [customOffDays, setCustomOffDays] = useState(existingTrip?.rotationOffDays ?? 28);

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
    const hourlyRate = agreement.groups[group].hourly[stepIndex];
    const overtimeRate = agreement.groups[group].overtime[stepIndex];
    const [presetOn, presetOff] = rotation.split("-").map(Number);
    const rotationOnDays = rotation === "custom" ? customOnDays : presetOn;
    const rotationOffDays = rotation === "custom" ? customOffDays : presetOff;
    onComplete({
      heliDeparture,
      paidStart,
      agreementId,
      group,
      stepIndex,
      pattern,
      taxRate: taxUnknown ? 35 : taxRate,
      hourlyRate,
      nightAllowance: existingTrip?.nightAllowance ?? 113.5,
      overtimeHours: existingTrip?.overtimeHours ?? 0,
      overtimeRate,
      rotationOnDays,
      rotationOffDays,
      additionSessions: existingTrip?.additionSessions ?? [],
      swingCompHours: existingTrip?.swingCompHours ?? 0,
      earningsView: existingTrip?.earningsView ?? "trip",
      customAdditions: existingTrip?.customAdditions ?? [],
    });
  }

  return (
    <Modal onClose={onCancel} labelledBy="wizard-title">
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
            <input
              type="datetime-local"
              value={heliDeparture}
              onChange={(event) => setHeliDeparture(event.target.value)}
            />
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
                <input type="number" min={1} value={customOnDays} onChange={(event) => setCustomOnDays(Number(event.target.value))} />
              </label>
              <label>
                Dager fri
                <input type="number" min={0} value={customOffDays} onChange={(event) => setCustomOffDays(Number(event.target.value))} />
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
            <input
              type="datetime-local"
              value={paidStart}
              onChange={(event) => setPaidStart(event.target.value)}
            />
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
        </div>
      )}

      {step === 5 && (
        <div>
          <div className="step-emoji">🧾</div>
          <h2 id="wizard-title">Vet du cirka skatteprosent?</h2>
          <p className="muted">Brukes bare til et grovt nettoestimat.</p>
          <label>
            Skattetrekk
            <div className="suffix-field">
              <input
                type="number"
                min={0}
                max={60}
                step={0.1}
                value={taxRate}
                disabled={taxUnknown}
                onChange={(event) => setTaxRate(Number(event.target.value))}
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
          </label>
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
