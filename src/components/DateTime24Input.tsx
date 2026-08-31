import { useEffect, useState } from "react";

interface DateTime24InputProps {
  value: string;
  onChange: (value: string) => void;
}

const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;

export function DateTime24Input({ value, onChange }: DateTime24InputProps) {
  const date = value.slice(0, 10);
  const storedTime = value.slice(11, 16) || "00:00";
  const [time, setTime] = useState(storedTime);

  useEffect(() => setTime(storedTime), [storedTime]);

  const changeDate = (nextDate: string) => onChange(`${nextDate}T${validTime.test(time) ? time : storedTime}`);
  const changeTime = (nextTime: string) => {
    const cleaned = nextTime.replace(/[^0-9:]/g, "").slice(0, 5);
    setTime(cleaned);
    if (validTime.test(cleaned)) onChange(`${date}T${cleaned}`);
  };
  const validateTime = () => {
    if (!validTime.test(time)) setTime(storedTime);
  };

  return <div className="datetime-24-input">
    <input type="date" lang="nb-NO" value={date} onChange={event => changeDate(event.target.value)} />
    <label className="clock-24-field"><span>Klokkeslett (24 t)</span><input type="text" inputMode="numeric" value={time} placeholder="19:00" maxLength={5} pattern="([01][0-9]|2[0-3]):[0-5][0-9]" onChange={event => changeTime(event.target.value)} onBlur={validateTime} aria-label="Klokkeslett i 24-timersformat" /></label>
  </div>;
}
