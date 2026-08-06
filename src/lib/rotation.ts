import type { TripSetup } from "../types";
import { addDays } from "./date";

export interface RotationPeriod {
  start: Date;
  end: Date;
}

export interface RotationStatus {
  isOffshore: boolean;
  periodStart: Date;
  periodEnd: Date;
  nextHelicopter: Date;
  countdownLabel: string;
  phaseDay: number;
  phaseLength: number;
}

export function cycleDays(trip: TripSetup): number {
  return trip.rotationOnDays + trip.rotationOffDays;
}

export function rotationLabel(trip: TripSetup): string {
  const onWeeks = trip.rotationOnDays / 7;
  const offWeeks = trip.rotationOffDays / 7;
  if (Number.isInteger(onWeeks) && Number.isInteger(offWeeks)) return `${onWeeks} / ${offWeeks}`;
  return `${trip.rotationOnDays} på / ${trip.rotationOffDays} av`;
}

export function rotationStatus(trip: TripSetup, now = new Date()): RotationStatus {
  const anchor = new Date(trip.heliDeparture);
  const cycle = cycleDays(trip);
  const cycleMs = cycle * 86_400_000;
  const elapsed = now.getTime() - anchor.getTime();

  let cycleIndex = Math.floor(elapsed / cycleMs);
  if (elapsed < 0) cycleIndex = -1;

  if (cycleIndex < 0) {
    return {
      isOffshore: false,
      periodStart: now,
      periodEnd: anchor,
      nextHelicopter: anchor,
      countdownLabel: "Neste helikopter fra land",
      phaseDay: 1,
      phaseLength: Math.max(1, Math.ceil((anchor.getTime() - now.getTime()) / 86_400_000)),
    };
  }

  const cycleStart = new Date(anchor.getTime() + cycleIndex * cycleMs);
  const offshoreEnd = addDays(cycleStart, trip.rotationOnDays);
  const nextCycleStart = addDays(cycleStart, cycle);
  const isOffshore = now >= cycleStart && now < offshoreEnd;
  const phaseStart = isOffshore ? cycleStart : offshoreEnd;
  const phaseEnd = isOffshore ? offshoreEnd : nextCycleStart;
  const phaseLength = isOffshore ? trip.rotationOnDays : trip.rotationOffDays;
  const phaseDay = Math.min(phaseLength, Math.max(1, Math.floor((now.getTime() - phaseStart.getTime()) / 86_400_000) + 1));

  return {
    isOffshore,
    periodStart: phaseStart,
    periodEnd: phaseEnd,
    nextHelicopter: phaseEnd,
    countdownLabel: isOffshore ? "Helikopter fra land / hjemreise" : "Neste helikopter fra land",
    phaseDay,
    phaseLength,
  };
}

export function offshorePeriodsForYear(trip: TripSetup, year: number): RotationPeriod[] {
  const anchor = new Date(trip.heliDeparture);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const cycleMs = cycleDays(trip) * 86_400_000;

  let index = Math.floor((yearStart.getTime() - anchor.getTime()) / cycleMs) - 1;
  let start = new Date(anchor.getTime() + index * cycleMs);
  const periods: RotationPeriod[] = [];

  while (start < yearEnd) {
    const end = addDays(start, trip.rotationOnDays);
    if (end > yearStart && start < yearEnd) periods.push({ start, end });
    index += 1;
    start = new Date(anchor.getTime() + index * cycleMs);
  }
  return periods;
}

export function isOffshoreDate(date: Date, periods: RotationPeriod[]): boolean {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return periods.some(({ start, end }) => {
    const from = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const to = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return day >= from && day < to;
  });
}
