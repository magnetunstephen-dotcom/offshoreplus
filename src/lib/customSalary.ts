export interface DerivedCustomSalary {
  baseAnnualSalary: number;
  monthlySalary: number;
  annualWorkHours: number;
  hourlyRate: number;
  overtimeRate: number;
}

export function deriveCustomSalary(
  statedAnnualSalary: number,
  includesHolidayPay: boolean,
  holidayPayRate: number,
  rotationOnDays: number,
  rotationOffDays: number,
): DerivedCustomSalary {
  const annualSalary = Math.max(0, statedAnnualSalary || 0);
  const holidayFactor = 1 + Math.max(0, holidayPayRate || 0) / 100;
  const baseAnnualSalary = includesHolidayPay ? annualSalary / holidayFactor : annualSalary;
  const cycleDays = Math.max(1, rotationOnDays + rotationOffDays);
  const annualWorkHours = 365.2425 * (Math.max(1, rotationOnDays) / cycleDays) * 12;
  const hourlyRate = annualWorkHours > 0 ? baseAnnualSalary / annualWorkHours : 0;

  return {
    baseAnnualSalary,
    monthlySalary: baseAnnualSalary / 12,
    annualWorkHours,
    hourlyRate,
    // Offshoretabellene i appen bruker full overtidsbetaling på omtrent 165 %.
    overtimeRate: hourlyRate * 1.65,
  };
}
