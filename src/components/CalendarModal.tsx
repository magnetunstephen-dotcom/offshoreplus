import { useMemo, useState } from "react";
import { createRotationCalendar, downloadCalendar } from "../lib/calendar";
import { holidaysDuringTrip } from "../lib/holidays";
import { isOffshoreDate, offshorePeriodsForYear, rotationLabel } from "../lib/rotation";
import type { TripSetup } from "../types";
import { Modal } from "./Modal";

interface CalendarModalProps {
  trip: TripSetup;
  onClose: () => void;
}

const monthNames = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Desember",
];
const weekdayNames = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

function daysInMonth(year: number, month: number): Array<Date | null> {
  const first = new Date(year, month, 1);
  const count = new Date(year, month + 1, 0).getDate();
  const mondayIndex = (first.getDay() + 6) % 7;
  const cells: Array<Date | null> = Array.from({ length: mondayIndex }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function CalendarModal({ trip, onClose }: CalendarModalProps) {
  const initialYear = new Date(trip.heliDeparture).getFullYear();
  const [year, setYear] = useState(initialYear);
  const [yearsToExport, setYearsToExport] = useState(2);
  const periods = useMemo(() => offshorePeriodsForYear(trip, year), [trip, year]);
  const today = new Date();

  const holidayKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let month = 0; month < 12; month += 1) {
      const start = new Date(year, month, 1);
      holidaysDuringTrip(start, new Date(year, month + 1, 0).getDate()).forEach((holiday) => {
        keys.add(dateKey(holiday.date));
      });
    }
    return keys;
  }, [year]);

  return (
    <Modal onClose={onClose} labelledBy="calendar-title" className="calendar-modal">
      <div className="calendar-header">
        <div>
          <span className="eyebrow">📅 Automatisk {rotationLabel(trip)}-turnus</span>
          <h2 id="calendar-title">Turnuskalender</h2>
          <p className="muted">
            Offshoreperiodene regnes automatisk fra helikopteravgangen du la inn.
          </p>
        </div>
        <button className="calendar-close" onClick={onClose} aria-label="Lukk">✕</button>
      </div>

      <div className="year-toolbar">
        <button className="secondary" onClick={() => setYear((value) => value - 1)}>← {year - 1}</button>
        <strong>{year}</strong>
        <button className="secondary" onClick={() => setYear((value) => value + 1)}>{year + 1} →</button>
      </div>

      <div className="calendar-legend">
        <span><i className="legend-dot offshore" /> Offshore</span>
        <span><i className="legend-dot holiday" /> Hellig-/tariffdag</span>
        <span><i className="legend-dot today" /> I dag</span>
      </div>

      <div className="year-calendar">
        {monthNames.map((name, month) => (
          <section className="month-card" key={name}>
            <h3>{name}</h3>
            <div className="month-grid weekday-row">
              {weekdayNames.map((weekday) => <span key={weekday}>{weekday}</span>)}
            </div>
            <div className="month-grid">
              {daysInMonth(year, month).map((date, index) => {
                if (!date) return <span className="day-cell empty" key={`empty-${index}`} />;
                const offshore = isOffshoreDate(date, periods);
                const holiday = holidayKeys.has(dateKey(date));
                const isToday =
                  date.getFullYear() === today.getFullYear() &&
                  date.getMonth() === today.getMonth() &&
                  date.getDate() === today.getDate();
                return (
                  <span
                    className={`day-cell${offshore ? " offshore" : ""}${holiday ? " holiday" : ""}${isToday ? " today" : ""}`}
                    key={date.toISOString()}
                    title={offshore ? "Offshore" : "Fri"}
                  >
                    {date.getDate()}
                  </span>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="calendar-export">
        <div>
          <strong>Legg turnusen i telefonkalenderen</strong>
          <p className="muted">
            Kalenderfilen virker med Google Kalender, Apple Kalender, Outlook og Samsung Kalender.
          </p>
        </div>
        <div className="calendar-export-controls">
          <label>
            Hvor langt frem?
            <select value={yearsToExport} onChange={(event) => setYearsToExport(Number(event.target.value))}>
              {[1, 2, 3, 5].map((value) => (
                <option key={value} value={value}>{value} år</option>
              ))}
            </select>
          </label>
          <button
            className="primary"
            onClick={() => downloadCalendar(createRotationCalendar(trip, yearsToExport))}
          >
            📲 Lagre turnus i egen kalender
          </button>
        </div>
      </section>
    </Modal>
  );
}
