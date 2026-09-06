interface DateTime24InputProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateTime24Input({ value, onChange }: DateTime24InputProps) {
  const date = value.slice(0, 10);
  const storedTime = value.slice(11, 16) || "00:00";
  const changeDate = (nextDate: string) => onChange(`${nextDate}T${storedTime}`);

  return <div className="datetime-24-input">
    <input type="date" lang="nb-NO" value={date} onChange={event => changeDate(event.target.value)} />
    <label className="clock-24-field"><span>Klokkeslett (24 t)</span><input type="time" step={60} value={storedTime} onChange={event => onChange(`${date}T${event.target.value || storedTime}`)} aria-label="Klokkeslett i 24-timersformat" /></label>
  </div>;
}
