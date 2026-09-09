import type { TripSetup } from "../types";
import { addDays } from "./date";

const HOUR = 3_600_000;
export function extensionForTrip(trip: TripSetup) {
  const e = trip.extension;
  if (!e || new Date(e.departure).getTime() !== new Date(trip.heliDeparture).getTime()) return undefined;
  const start = new Date(e.start), end = new Date(e.end);
  const normalEnd = addDays(new Date(trip.heliDeparture), trip.rotationOnDays);
  const nextDeparture = addDays(new Date(trip.heliDeparture), trip.rotationOnDays + trip.rotationOffDays);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start < normalEnd || end <= start || end > nextDeparture || !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.shiftStart)) return undefined;
  if (e.workEnd && (!Number.isFinite(new Date(e.workEnd).getTime()) || new Date(e.workEnd) < start || new Date(e.workEnd) > end)) return undefined;
  if (e.previousShiftStart && !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.previousShiftStart)) return undefined;
  if (e.nightAllowance !== undefined && (!Number.isFinite(e.nightAllowance) || e.nightAllowance < 0)) return undefined;
  return e;
}
export function lastOrdinaryShift(trip: TripSetup): "day" | "night" {
  if (trip.pattern === "day" || trip.pattern === "night") return trip.pattern;
  const lastDay = trip.rotationOnDays - 1;
  return (trip.pattern === "night-day" ? lastDay < 7 : lastDay >= 7) ? "night" : "day";
}
export function extensionCalculation(trip: TripSetup, now = new Date()) {
  const e = extensionForTrip(trip);
  if (!e) return { overtimeHours:0, billedOvertimeHours:0, nightHours:0, waitingHours:0, swingHours:0, active:false, working:false, next:undefined as Date | undefined };
  const start = new Date(e.start), end = new Date(e.end);
  const workEnd = e.workEnd ? new Date(e.workEnd) : end;
  const priorStart = e.previousShiftStart ?? (lastOrdinaryShift(trip) === "night" ? "19:00" : "07:00");
  const [priorHour,priorMinute] = priorStart.split(":").map(Number);
  const overlap = (a:number,b:number,c:number,d:number) => Math.max(0,Math.min(b,d)-Math.max(a,c))/HOUR;
  const until = Math.max(start.getTime(), Math.min(now.getTime(), end.getTime()));
  const [hour, minute] = e.shiftStart.split(":").map(Number);
  const day = addDays(start, -1); day.setHours(hour, minute, 0, 0);
  let overtimeHours=0, billedOvertimeHours=0, nightHours=0, swingHours=0, periods=0, working=false;
  let next = end;
  // Calendar-day shift starts preserve local clock times over DST boundaries.
  for (let index=0; index<370; index++) {
    const from = addDays(day,index);
    if (from >= workEnd) break;
    const to = new Date(Math.min(from.getTime()+12*HOUR,workEnd.getTime()));
    if (to <= start) continue;
    const hours = Math.max(0,(Math.min(until,to.getTime())-Math.max(start.getTime(),from.getTime()))/HOUR);
    overtimeHours += hours;
    billedOvertimeHours += (e.roundOvertime ?? trip.roundOvertime ?? true) && now >= to ? Math.ceil(hours*2-1e-9)/2 : hours;
    const actualFrom=Math.max(start.getTime(),from.getTime()), actualTo=Math.min(until,to.getTime());
    let priorOverlap=0;
    for(let offset=-1;offset<=1;offset++) {
      const previous=addDays(from,offset); previous.setHours(priorHour,priorMinute,0,0);
      priorOverlap += overlap(actualFrom,actualTo,previous.getTime(),previous.getTime()+12*HOUR);
      const night=addDays(from,offset); night.setHours(19,0,0,0);
      nightHours += overlap(actualFrom,actualTo,night.getTime(),night.getTime()+12*HOUR);
    }
    if (periods < 2 && e.swing !== "none") swingHours += Math.max(0,hours-priorOverlap);
    periods++;
    if (now >= from && now < to) { working=true; next=new Date(Math.min(to.getTime(),end.getTime())); }
    else if (from > now && from < next) next=from;
  }
  return { overtimeHours, billedOvertimeHours, nightHours, waitingHours:Math.max(0,(until-start.getTime())/HOUR-overtimeHours), swingHours,
    active:now >= start && now < end, working, next };
}
// Manual registrations outside the automatic interval remain valid; overlaps count once.
export function manualHoursOutsideExtension(trip: TripSetup, from: Date, to: Date) {
  const total = Math.max(0,(to.getTime()-from.getTime())/HOUR);
  const e=extensionForTrip(trip);
  if (!e) return total;
  return Math.max(0,total-Math.max(0,(Math.min(to.getTime(),new Date(e.end).getTime())-Math.max(from.getTime(),new Date(e.start).getTime()))/HOUR));
}
