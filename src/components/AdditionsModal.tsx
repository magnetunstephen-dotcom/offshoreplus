import { useMemo, useState } from "react";
import type {
  CustomAddition,
  CustomAdditionKind,
  CustomAdditionRateBasis,
  LiveAdditionType,
  TripSetup,
} from "../types";
import { Modal } from "./Modal";

interface AdditionsModalProps {
  trip: TripSetup;
  onSave: (trip: TripSetup) => void;
  onClose: () => void;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatClock(value: string): string {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function smokeDiverPreset(): CustomAddition {
  return {
    id: newId(),
    name: "Røykdykker på beredskapsplan",
    kind: "monthly-fixed",
    enabled: true,
    amount: 500,
    hours: 0,
    occurrences: 1,
    rateBasis: "custom",
    customRate: 0,
    note: "Standardverdi fra SAFE/NR 2022–2024. Kontroller oppdatert sats.",
  };
}

function rescueExercisePreset(): CustomAddition {
  return {
    id: newId(),
    name: "Redningslagsøvelse / høyderedning",
    kind: "trip-hours",
    enabled: true,
    amount: 0,
    hours: 1,
    occurrences: 1,
    rateBasis: "hourly",
    customRate: 0,
    note: "Lokalt tillegg. Sett antall gjennomførte øvelser denne turen.",
  };
}

export function AdditionsModal({ trip, onSave, onClose }: AdditionsModalProps) {
  const sessions = trip.additionSessions ?? [];
  const customAdditions = trip.customAdditions ?? [];
  const active = useMemo(
    () => sessions.find((session) => !session.end),
    [sessions],
  );
  const [showBuilder, setShowBuilder] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CustomAdditionKind>("trip-hours");
  const [rateBasis, setRateBasis] = useState<CustomAdditionRateBasis>("hourly");
  const [hours, setHours] = useState(1);
  const [amount, setAmount] = useState(0);
  const [customRate, setCustomRate] = useState(0);

  function start(type: LiveAdditionType) {
    if (active) return;
    onSave({
      ...trip,
      additionSessions: [
        ...sessions,
        { id: newId(), type, start: new Date().toISOString() },
      ],
    });
  }

  function stop() {
    if (!active) return;
    const now = new Date().toISOString();
    onSave({
      ...trip,
      additionSessions: sessions.map((session) =>
        session.id === active.id ? { ...session, end: now } : session,
      ),
    });
  }

  function setSwing(value: number) {
    onSave({ ...trip, swingCompHours: value });
  }

  function removeSession(id: string) {
    onSave({
      ...trip,
      additionSessions: sessions.filter((session) => session.id !== id),
    });
  }

  function addPreset(preset: "smoke" | "rescue") {
    const addition = preset === "smoke" ? smokeDiverPreset() : rescueExercisePreset();
    onSave({ ...trip, customAdditions: [...customAdditions, addition] });
  }

  function updateCustom(id: string, patch: Partial<CustomAddition>) {
    onSave({
      ...trip,
      customAdditions: customAdditions.map((addition) =>
        addition.id === id ? { ...addition, ...patch } : addition,
      ),
    });
  }

  function removeCustom(id: string) {
    onSave({
      ...trip,
      customAdditions: customAdditions.filter((addition) => addition.id !== id),
    });
  }

  function createCustom() {
    if (!name.trim()) return;
    const addition: CustomAddition = {
      id: newId(),
      name: name.trim(),
      kind,
      enabled: true,
      amount: Math.max(0, amount),
      hours: Math.max(0, hours),
      occurrences: 1,
      rateBasis,
      customRate: Math.max(0, customRate),
    };
    onSave({ ...trip, customAdditions: [...customAdditions, addition] });
    setName("");
    setShowBuilder(false);
  }

  return (
    <Modal onClose={onClose} labelledBy="additions-title">
      <h2 id="additions-title">Tillegg denne turen</h2>
      <p className="muted">
        Start live-teller for overtid eller ventetid. Legg også inn faste og lokale tillegg.
      </p>

      {active ? (
        <section className="active-addition">
          <span className="eyebrow">Aktiv teller</span>
          <strong>{active.type === "overtime" ? "🔥 Overtid" : "☕ Ventetid"}</strong>
          <span>Startet {formatClock(active.start)}</span>
          <button className="danger-button" onClick={stop}>Stopp teller</button>
        </section>
      ) : (
        <div className="addition-start-grid">
          <button onClick={() => start("overtime")}>
            <span>🔥</span><strong>Start overtid</strong><small>Valgt overtidsats teller live</small>
          </button>
          <button onClick={() => start("waiting")}>
            <span>☕</span><strong>Start ventetid</strong><small>Ordinær timelønn teller live</small>
          </button>
        </div>
      )}

      <section className="swing-section">
        <span className="eyebrow">Svingskiftkompensasjon</span>
        <p className="muted">Velg faktisk kompensasjon. Maks to arbeidsperioder.</p>
        <div className="segmented three">
          {[0, 12, 24].map((value) => (
            <button
              className={(trip.swingCompHours ?? 0) === value ? "selected" : ""}
              key={value}
              onClick={() => setSwing(value)}
            >
              {value === 0 ? "Ingen" : `${value} t`}
            </button>
          ))}
        </div>
        <small className="field-help">Beregnes som 65 % tillegg, ikke full overtidsbetaling.</small>
      </section>

      <section className="custom-additions-section">
        <div className="section-title-row">
          <div><span className="eyebrow">Mine tillegg</span><strong>Faste og lokale tillegg</strong></div>
          <button className="text-button" onClick={() => setShowBuilder(!showBuilder)}>+ Eget tillegg</button>
        </div>

        <div className="preset-grid">
          <button onClick={() => addPreset("smoke")}><span>🧯</span><strong>Røykdykker</strong><small>500 kr per måned</small></button>
          <button onClick={() => addPreset("rescue")}><span>🪢</span><strong>Redningslagsøvelse</strong><small>1 time per gjennomføring</small></button>
        </div>

        {showBuilder && (
          <div className="custom-builder">
            <label>Navn<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Eksempel: Lokalt beredskapstillegg" /></label>
            <label>Hvordan beregnes det?
              <select value={kind} onChange={(event) => setKind(event.target.value as CustomAdditionKind)}>
                <option value="trip-hours">Timer per gjennomføring</option>
                <option value="trip-fixed">Fast beløp per gjennomføring</option>
                <option value="monthly-fixed">Fast beløp per måned</option>
              </select>
            </label>
            {kind === "trip-hours" && (
              <>
                <label>Timer<input type="number" min={0} step={0.25} value={hours} onChange={(event) => setHours(Number(event.target.value))} /></label>
                <label>Sats
                  <select value={rateBasis} onChange={(event) => setRateBasis(event.target.value as CustomAdditionRateBasis)}>
                    <option value="hourly">Ordinær timelønn</option>
                    <option value="overtime">Overtidssats</option>
                    <option value="custom">Egen timesats</option>
                  </select>
                </label>
                {rateBasis === "custom" && <label>Egen timesats<input type="number" min={0} step={0.01} value={customRate} onChange={(event) => setCustomRate(Number(event.target.value))} /></label>}
              </>
            )}
            {kind !== "trip-hours" && <label>Beløp<input type="number" min={0} step={1} value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label>}
            <button className="primary" onClick={createCustom}>Lagre tillegg</button>
          </div>
        )}

        {customAdditions.length === 0 && <p className="empty-copy">Ingen faste eller lokale tillegg lagt inn ennå.</p>}
        {customAdditions.map((addition) => (
          <article className="custom-addition-row" key={addition.id}>
            <div className="custom-addition-main">
              <label className="switch-row">
                <input type="checkbox" checked={addition.enabled} onChange={(event) => updateCustom(addition.id, { enabled: event.target.checked })} />
                <span><strong>{addition.name}</strong><small>{addition.note ?? (addition.kind === "monthly-fixed" ? `${addition.amount} kr per måned` : addition.kind === "trip-hours" ? `${addition.hours} t per gjennomføring` : `${addition.amount} kr per gjennomføring`)}</small></span>
              </label>
            </div>
            {addition.kind !== "monthly-fixed" && (
              <label className="compact-number">Antall denne turen<input type="number" min={0} step={1} value={addition.occurrences} onChange={(event) => updateCustom(addition.id, { occurrences: Number(event.target.value) })} /></label>
            )}
            <button className="text-button danger-text" onClick={() => removeCustom(addition.id)}>Slett</button>
          </article>
        ))}
      </section>

      {sessions.length > 0 && (
        <section className="addition-history">
          <span className="eyebrow">Live-registreringer</span>
          {sessions.slice().reverse().map((session) => (
            <div className="history-row" key={session.id}>
              <div><strong>{session.type === "overtime" ? "Overtid" : "Ventetid"}</strong><small>{formatClock(session.start)}{session.end ? ` – ${formatClock(session.end)}` : " – pågår"}</small></div>
              <button className="text-button danger-text" onClick={() => removeSession(session.id)}>Slett</button>
            </div>
          ))}
        </section>
      )}

      <button className="secondary full-width" onClick={onClose}>Lukk</button>
    </Modal>
  );
}
