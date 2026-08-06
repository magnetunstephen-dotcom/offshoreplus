import type { HolidayEntry } from "../types";
import { addDays } from "./date";

function easterSunday(year: number): Date {
  const floor = Math.floor;
  const a = year % 19;
  const b = floor(year / 100);
  const c = year % 100;
  const d = floor(b / 4);
  const e = b % 4;
  const f = floor((b + 8) / 25);
  const g = floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = floor((a + 11 * h + 22 * l) / 451);
  const month = floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function key(date: Date): string {
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

export function holidaysDuringTrip(start: Date, days = 14): HolidayEntry[] {
  const result: HolidayEntry[] = [];
  const years = new Set<number>();

  for (let offset = 0; offset < days; offset += 1) {
    years.add(addDays(start, offset).getFullYear());
  }

  const entries = new Map<string, { name: string; tariffOnly?: boolean }>();

  years.forEach((year) => {
    const fixed = [
      [new Date(year, 0, 1), "1. nyttårsdag", false],
      [new Date(year, 4, 1), "Arbeidernes dag", false],
      [new Date(year, 4, 17), "Grunnlovsdagen", false],
      [new Date(year, 11, 24), "Julaften", true],
      [new Date(year, 11, 25), "1. juledag", false],
      [new Date(year, 11, 26), "2. juledag", false],
      [new Date(year, 11, 31), "Nyttårsaften", true],
    ] as const;

    const easter = easterSunday(year);
    const movable = [
      [addDays(easter, -3), "Skjærtorsdag"],
      [addDays(easter, -2), "Langfredag"],
      [easter, "1. påskedag"],
      [addDays(easter, 1), "2. påskedag"],
      [addDays(easter, 39), "Kristi himmelfartsdag"],
      [addDays(easter, 49), "1. pinsedag"],
      [addDays(easter, 50), "2. pinsedag"],
    ] as const;

    fixed.forEach(([date, name, tariffOnly]) => {
      entries.set(`${year}-${key(date)}`, { name, tariffOnly });
    });
    movable.forEach(([date, name]) => {
      entries.set(`${year}-${key(date)}`, { name });
    });
  });

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(start, offset);
    const match = entries.get(`${date.getFullYear()}-${key(date)}`);
    if (match) result.push({ date, ...match });
  }

  return result;
}
