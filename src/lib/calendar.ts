import type { TripSetup } from "../types";
import { addDays } from "./date";

function dateOnly(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function escapeIcs(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;")
    .replaceAll("\n", "\\n");
}

export function createRotationCalendar(setup: TripSetup, years: number): string {
  const start = new Date(setup.heliDeparture);
  const limit = new Date(start);
  limit.setFullYear(limit.getFullYear() + years);
  const cycleDays = setup.rotationOnDays + setup.rotationOffDays;
  const events: string[] = [];

  for (let tripStart = new Date(start); tripStart < limit; tripStart = addDays(tripStart, cycleDays)) {
    const tripEnd = addDays(tripStart, setup.rotationOnDays);
    const uid = `${dateOnly(tripStart)}-offshore@offshoreplus.no`;

    events.push(
      [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTART;VALUE=DATE:${dateOnly(tripStart)}`,
        `DTEND;VALUE=DATE:${dateOnly(tripEnd)}`,
        "SUMMARY:Offshore",
        `DESCRIPTION:${escapeIcs("Opprettet av OffshorePlus")}`,
        "END:VEVENT",
      ].join("\r\n"),
    );
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OffshorePlus//NO",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadCalendar(contents: string): void {
  const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "offshore-turnus.ics";
  anchor.click();
  URL.revokeObjectURL(url);
}
