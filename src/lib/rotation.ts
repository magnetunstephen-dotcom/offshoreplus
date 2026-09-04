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
  const elapsed = now.getTime() - anchor.getTime();

  // Finn omtrentlig syklus først, og korriger med kalenderdager. Dette gjør at
  // eksempelvis tirsdag kl. 12:45 forblir tirsdag kl. 12:45 også over
  // overgang mellom sommer- og vintertid.
  let cycleIndex = elapsed < 0 ? -1 : Math.floor(elapsed / (cycle * 86_400_000));
  while (cycleIndex >= 0 && addDays(anchor, (cycleIndex + 1) * cycle) <= now) cycleIndex += 1;
  while (cycleIndex > 0 && addDays(anchor, cycleIndex * cycle) > now) cycleIndex -= 1;

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

  const cycleStart = addDays(anchor, cycleIndex * cycle);
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

export function tripSetupForDate(trip: TripSetup, now = new Date()): TripSetup {
  const anchor = new Date(trip.heliDeparture);
  const cycle = cycleDays(trip);
  if (now < anchor) return trip;
  let index = Math.floor((now.getTime() - anchor.getTime()) / (cycle * 86_400_000));
  while (addDays(anchor, (index + 1) * cycle) <= now) index += 1;
  while (index > 0 && addDays(anchor, index * cycle) > now) index -= 1;
  const departure = addDays(anchor, index * cycle);
  const paidOffset = new Date(trip.paidStart).getTime() - anchor.getTime();
  const paidStart = new Date(departure.getTime() + paidOffset);
  const tripEnd = addDays(paidStart, trip.rotationOnDays);
  return {
    ...trip,
    heliDeparture: departure.toISOString(),
    paidStart: paidStart.toISOString(),
    additionSessions: (trip.additionSessions ?? []).filter(session => {
      const sessionStart = new Date(session.start);
      return sessionStart >= paidStart && sessionStart < tripEnd;
    }),
    overtimeHours: index === 0 ? trip.overtimeHours : 0,
    swingCompHours: index === 0 ? trip.swingCompHours : 0,
    customAdditions: index === 0 ? trip.customAdditions : (trip.customAdditions ?? []).filter(addition => addition.kind === "monthly-fixed"),
  };
}

export function offshorePeriodsForYear(trip: TripSetup, year: number): RotationPeriod[] {
  const anchor = new Date(trip.heliDeparture);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const cycle = cycleDays(trip);

  let index = Math.floor((yearStart.getTime() - anchor.getTime()) / (cycle * 86_400_000)) - 1;
  let start = addDays(anchor, index * cycle);
  const periods: RotationPeriod[] = [];

  while (start < yearEnd) {
    const end = addDays(start, trip.rotationOnDays);
    if (end > yearStart && start < yearEnd) periods.push({ start, end });
    index += 1;
    start = addDays(anchor, index * cycle);
  }
  return periods;
}

export function isOffshoreDate(date: Date, periods: RotationPeriod[]): boolean {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return periods.some(({ start, end }) => {
    const from = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const to = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    // Hjemreisedagen er fortsatt en offshore-/arbeidsdag i kalenderen. Selve
    // rotasjonsstatusen skifter ved klokkeslettet for helikopteret, men en
    // dagskalender må derfor vise både utreise- og hjemreisedatoen.
    return day >= from && day <= to;
  });
}
