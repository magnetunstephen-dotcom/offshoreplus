import type {
  CustomAddition,
  LiveAdditionSession,
  ShiftPattern,
  TripSetup,
  TaxTreatment,
} from "../types";
import { addDays } from "./date";
import { salaryAgreements } from "../data/salaries";

export type EarningsStatus = "work" | "rest" | "overtime" | "waiting" | "home" | "upcoming";

export interface CustomAdditionResult {
  id: string;
  name: string;
  tripPay: number;
  monthlyPay: number;
  isMonthlyFixed: boolean;
  taxTreatment: TaxTreatment;
}

export interface TripCalculation {
  elapsedSeconds: number;
  paidHours: number;
  nightHours: number;
  basePay: number;
  nightPay: number;
  waitingHours: number;
  waitingPay: number;
  overtimeHours: number;
  overtimePay: number;
  swingPay: number;
  customAdditionsPay: number;
  customMonthlyPay: number;
  customAdditionResults: CustomAdditionResult[];
  additionsPay: number;
  gross: number;
  net: number;
  estimatedGross: number;
  estimatedMonthlyGross: number;
  estimatedMonthlyNet: number;
  regularMonthlyGross: number;
  regularMonthlyNet: number;
  activeExtrasGross: number;
  activeExtrasNet: number;
  accruedNextPayoutGross: number;
  accruedNextPayoutNet: number;
  accruedHolidayPay: number;
  estimatedHolidayPay: number;
  tripHolidayPay: number;
  holidayPayRate: number;
  accruedRegularGross: number;
  accruedRegularNet: number;
  usesAgreementMonthlySalary: boolean;
  accruedTaxableGross: number;
  accruedTaxFreeGross: number;
  estimatedTaxableGross: number;
  estimatedTaxFreeGross: number;
  tripsPerYear: number;
  dayNumber: number;
  homeDate: Date;
  status: EarningsStatus;
  statusLabel: string;
  nextStatusDate?: Date;
  isMoneyRunning: boolean;
}

function shiftIsNight(pattern: ShiftPattern, dayIndex: number): boolean {
  if (pattern === "night") return true;
  if (pattern === "day") return false;
  if (pattern === "night-day") return dayIndex < 7;
  return dayIndex >= 7;
}

function overlapHours(
  rangeStart: Date,
  rangeEnd: Date,
  shiftStart: Date,
  shiftEnd: Date,
): number {
  const start = Math.max(rangeStart.getTime(), shiftStart.getTime());
  const end = Math.min(rangeEnd.getTime(), shiftEnd.getTime());
  return Math.max(0, (end - start) / 3_600_000);
}

function sessionHours(session: LiveAdditionSession, now: Date): number {
  const start = new Date(session.start);
  const end = session.end ? new Date(session.end) : now;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
}

function customRate(addition: CustomAddition, setup: TripSetup): number {
  if (addition.rateBasis === "overtime") return setup.overtimeRate;
  if (addition.rateBasis === "custom") return addition.customRate;
  return setup.hourlyRate;
}

function calculateCustomAdditions(
  additions: CustomAddition[],
  setup: TripSetup,
  tripsPerYear: number,
): CustomAdditionResult[] {
  return additions
    .filter((addition) => addition.enabled)
    .map((addition) => {
      if (addition.kind === "monthly-fixed") {
        const monthlyPay = Math.max(0, addition.amount);
        return {
          id: addition.id,
          name: addition.name,
          monthlyPay,
          tripPay: tripsPerYear > 0 ? (monthlyPay * 12) / tripsPerYear : 0,
          isMonthlyFixed: true,
          taxTreatment: addition.taxTreatment ?? "normal",
        };
      }

      if (addition.kind === "trip-hours") {
        const tripPay =
          Math.max(0, addition.hours) *
          Math.max(0, addition.occurrences) *
          Math.max(0, customRate(addition, setup));
        return {
          id: addition.id,
          name: addition.name,
          tripPay,
          monthlyPay: (tripPay * tripsPerYear) / 12,
          isMonthlyFixed: false,
          taxTreatment: addition.taxTreatment ?? "normal",
        };
      }

      const tripPay = Math.max(0, addition.amount) * Math.max(0, addition.occurrences);
      return {
        id: addition.id,
        name: addition.name,
        tripPay,
        monthlyPay: (tripPay * tripsPerYear) / 12,
        isMonthlyFixed: false,
        taxTreatment: addition.taxTreatment ?? "normal",
      };
    });
}

function currentScheduledStatus(setup: TripSetup, now: Date) {
  const start = new Date(setup.paidStart);
  const tripEnd = addDays(start, setup.rotationOnDays);

  if (now < start) {
    return { status: "upcoming" as const, label: "Venter på første betalte skift", next: start };
  }
  if (now >= tripEnd) {
    return { status: "home" as const, label: "Fri / hjemme" };
  }

  for (let index = 0; index < setup.rotationOnDays; index += 1) {
    const base = addDays(start, index);
    const isNight = shiftIsNight(setup.pattern, index);
    const shiftStart = new Date(base);
    shiftStart.setHours(isNight ? 19 : 7, 0, 0, 0);
    const shiftEnd = new Date(shiftStart.getTime() + 12 * 3_600_000);

    if (now >= shiftStart && now < shiftEnd) {
      return {
        status: "work" as const,
        label: isNight ? "Nattskift · lønn og tillegg teller" : "Dagskift · lønn teller",
        next: shiftEnd,
      };
    }
    if (now < shiftStart) {
      return { status: "rest" as const, label: "Hviletid · telleren står", next: shiftStart };
    }
  }

  return { status: "rest" as const, label: "Hviletid · telleren står", next: tripEnd };
}

export function calculateTrip(setup: TripSetup, now = new Date()): TripCalculation {
  const start = new Date(setup.paidStart);
  const tripEnd = addDays(start, setup.rotationOnDays);
  const effectiveEnd = new Date(Math.min(now.getTime(), tripEnd.getTime()));
  const elapsedSeconds = Math.max(0, (now.getTime() - start.getTime()) / 1000);

  let paidHours = 0;
  let nightHours = 0;

  for (let index = 0; index < setup.rotationOnDays; index += 1) {
    const base = addDays(start, index);
    const isNight = shiftIsNight(setup.pattern, index);
    const shiftStart = new Date(base);
    shiftStart.setHours(isNight ? 19 : 7, 0, 0, 0);
    const shiftEnd = new Date(shiftStart.getTime() + 12 * 3_600_000);
    const hours = overlapHours(start, effectiveEnd, shiftStart, shiftEnd);
    paidHours += hours;
    if (isNight) nightHours += hours;
  }

  const sessions = setup.additionSessions ?? [];
  const liveWaitingHours = sessions
    .filter((session) => session.type === "waiting")
    .reduce((sum, session) => sum + sessionHours(session, now), 0);
  const liveOvertimeHours = sessions
    .filter((session) => session.type === "overtime")
    .reduce((sum, session) => sum + sessionHours(session, now), 0);

  const manualOvertimeHours = setup.overtimeHours ?? 0;
  const overtimeHours = manualOvertimeHours + liveOvertimeHours;
  const waitingHours = liveWaitingHours;

  const cycleDays = Math.max(1, setup.rotationOnDays + setup.rotationOffDays);
  const tripsPerYear = 365.2425 / cycleDays;
  const customAdditionResults = calculateCustomAdditions(
    setup.customAdditions ?? [],
    setup,
    tripsPerYear,
  );
  const customAdditionsPay = customAdditionResults.reduce((sum, result) => sum + result.tripPay, 0);
  const customMonthlyPay = customAdditionResults.reduce((sum, result) => sum + result.monthlyPay, 0);

  const basePay = paidHours * setup.hourlyRate;
  const nightPay = nightHours * setup.nightAllowance;
  const waitingPay = waitingHours * setup.hourlyRate;
  const overtimePay = overtimeHours * setup.overtimeRate;
  const swingRate = Math.max(0, setup.overtimeRate - setup.hourlyRate);
  const swingPay = (setup.swingCompHours ?? 0) * swingRate;
  const additionsPay = waitingPay + overtimePay + swingPay + customAdditionsPay;
  const gross = basePay + nightPay + additionsPay;
  const net = gross * (1 - setup.taxRate / 100);

  let totalNightHours = 0;
  for (let index = 0; index < setup.rotationOnDays; index += 1) {
    if (shiftIsNight(setup.pattern, index)) totalNightHours += 12;
  }

  const totalPaidHours = setup.rotationOnDays * 12;
  const estimatedGross =
    totalPaidHours * setup.hourlyRate +
    totalNightHours * setup.nightAllowance +
    waitingPay +
    overtimePay +
    swingPay +
    customAdditionsPay;

  // Bruk avtalens oppgitte månedslønn når den finnes. Andre avtaler bruker
  // normalisert full tur som reserve. Tillegg på aktiv tur annualiseres aldri.
  const regularFullTripGross = totalPaidHours * setup.hourlyRate + totalNightHours * setup.nightAllowance;
  const agreementMonthlyGross = setup.agreementId === "custom"
    ? setup.customMonthlySalary
    : salaryAgreements[setup.agreementId]?.groups[setup.group]?.monthly?.[setup.stepIndex];
  const regularMonthlyGross = agreementMonthlyGross && agreementMonthlyGross > 0
    ? agreementMonthlyGross
    : (regularFullTripGross * tripsPerYear) / 12;
  const regularMonthlyNet = regularMonthlyGross * (1 - setup.taxRate / 100);
  const tripCustomExtrasPay = customAdditionResults
    .filter(result => !result.isMonthlyFixed)
    .reduce((sum, result) => sum + result.tripPay, 0);
  const monthlyFixedPay = customAdditionResults
    .filter(result => result.isMonthlyFixed)
    .reduce((sum, result) => sum + result.monthlyPay, 0);
  const customTripExtrasNet = customAdditionResults
    .filter(result => !result.isMonthlyFixed)
    .reduce((sum, result) => {
      const keep = result.taxTreatment === "tax-free" ? 1 : 1 - setup.taxRate / 100;
      return sum + result.tripPay * keep;
    }, 0);
  const taxableTripCustomGross = customAdditionResults
    .filter(result => !result.isMonthlyFixed && result.taxTreatment !== "tax-free")
    .reduce((sum, result) => sum + result.tripPay, 0);
  const taxFreeTripCustomGross = customAdditionResults
    .filter(result => !result.isMonthlyFixed && result.taxTreatment === "tax-free")
    .reduce((sum, result) => sum + result.tripPay, 0);
  const taxableMonthlyFixedGross = customAdditionResults
    .filter(result => result.isMonthlyFixed && result.taxTreatment !== "tax-free")
    .reduce((sum, result) => sum + result.monthlyPay, 0);
  const taxFreeMonthlyFixedGross = customAdditionResults
    .filter(result => result.isMonthlyFixed && result.taxTreatment === "tax-free")
    .reduce((sum, result) => sum + result.monthlyPay, 0);
  const monthlyFixedNet = customAdditionResults
    .filter(result => result.isMonthlyFixed)
    .reduce((sum, result) => {
      const keep = result.taxTreatment === "tax-free" ? 1 : 1 - setup.taxRate / 100;
      return sum + result.monthlyPay * keep;
    }, 0);
  const liveTaxedExtrasGross = nightPay + waitingPay + overtimePay + swingPay;
  const activeExtrasGross = liveTaxedExtrasGross + tripCustomExtrasPay;
  const activeExtrasNet = liveTaxedExtrasGross * (1 - setup.taxRate / 100) + customTripExtrasNet;
  const estimatedMonthlyGross = regularMonthlyGross + monthlyFixedPay + activeExtrasGross;
  const estimatedMonthlyNet = regularMonthlyNet + monthlyFixedNet + activeExtrasNet;
  const regularEarnedRatio = totalPaidHours > 0 ? Math.min(1, paidHours / totalPaidHours) : 0;
  const accruedRegularGross = regularMonthlyGross * regularEarnedRatio;
  const accruedRegularNet = accruedRegularGross * (1 - setup.taxRate / 100);
  const accruedNextPayoutGross = accruedRegularGross + monthlyFixedPay * regularEarnedRatio + activeExtrasGross;
  const accruedNextPayoutNet = accruedRegularNet + monthlyFixedNet * regularEarnedRatio + activeExtrasNet;
  const accruedTaxableGross = accruedRegularGross + taxableMonthlyFixedGross * regularEarnedRatio + liveTaxedExtrasGross + taxableTripCustomGross;
  const accruedTaxFreeGross = taxFreeMonthlyFixedGross * regularEarnedRatio + taxFreeTripCustomGross;
  const estimatedTaxableGross = regularMonthlyGross + taxableMonthlyFixedGross + liveTaxedExtrasGross + taxableTripCustomGross;
  const estimatedTaxFreeGross = taxFreeMonthlyFixedGross + taxFreeTripCustomGross;
  const holidayPayRate = setup.holidayPayRate ?? 12;
  // Trekkfrie refusjoner skal ikke inngå i det estimerte feriepengegrunnlaget.
  const accruedHolidayPay = accruedTaxableGross * holidayPayRate / 100;
  const estimatedHolidayPay = estimatedTaxableGross * holidayPayRate / 100;
  const tripHolidayPay = (gross - taxFreeTripCustomGross) * holidayPayRate / 100;

  const activeSession = sessions.find((session) => !session.end);
  const scheduled = currentScheduledStatus(setup, now);
  const status = activeSession?.type === "overtime"
    ? "overtime"
    : activeSession?.type === "waiting"
      ? "waiting"
      : scheduled.status;
  const statusLabel = activeSession?.type === "overtime"
    ? "Overtid · lønn teller raskere"
    : activeSession?.type === "waiting"
      ? "Ventetid · lønn teller"
      : scheduled.label;

  return {
    elapsedSeconds,
    paidHours,
    nightHours,
    basePay,
    nightPay,
    waitingHours,
    waitingPay,
    overtimeHours,
    overtimePay,
    swingPay,
    customAdditionsPay,
    customMonthlyPay,
    customAdditionResults,
    additionsPay,
    gross,
    net,
    estimatedGross,
    estimatedMonthlyGross,
    estimatedMonthlyNet,
    regularMonthlyGross,
    regularMonthlyNet,
    activeExtrasGross,
    activeExtrasNet,
    accruedNextPayoutGross,
    accruedNextPayoutNet,
    accruedHolidayPay,
    estimatedHolidayPay,
    tripHolidayPay,
    holidayPayRate,
    accruedRegularGross,
    accruedRegularNet,
    usesAgreementMonthlySalary: Boolean(agreementMonthlyGross && agreementMonthlyGross > 0),
    accruedTaxableGross,
    accruedTaxFreeGross,
    estimatedTaxableGross,
    estimatedTaxFreeGross,
    tripsPerYear,
    dayNumber: Math.min(
      setup.rotationOnDays,
      Math.max(1, Math.floor(elapsedSeconds / 86_400) + 1),
    ),
    homeDate: tripEnd,
    status,
    statusLabel,
    nextStatusDate: activeSession ? undefined : scheduled.next,
    isMoneyRunning: status === "work" || status === "overtime" || status === "waiting",
  };
}
