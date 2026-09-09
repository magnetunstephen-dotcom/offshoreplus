import { useState } from "react";
import type { TripSetup, TripExtension } from "../types";
import { addDays, formatDateTime, toDateTimeLocal } from "../lib/date";
import { tripSetupForDate } from "../lib/rotation";
import { extensionCalculation, extensionForTrip, lastOrdinaryShift } from "../lib/extension";
import { useClock } from "../hooks/useClock";

export function TripExtensionForm({ trip, onSave }: { trip: TripSetup; onSave: (trip: TripSetup) => void }) {
  const now=useClock();
  const current=tripSetupForDate(trip,now);
  const saved=extensionForTrip(current);
  const normalEnd=addDays(new Date(current.heliDeparture),current.rotationOnDays);
  const nextTrip=addDays(new Date(current.heliDeparture),current.rotationOnDays+current.rotationOffDays);
  const [editing,setEditing]=useState(false);
  const [end,setEnd]=useState(toDateTimeLocal(saved ? new Date(saved.end) : addDays(normalEnd,3)));
  const [start,setStart]=useState(toDateTimeLocal(saved ? new Date(saved.start) : normalEnd));
  const [shift,setShift]=useState<"day"|"night">(saved?.shift ?? lastOrdinaryShift(current));
  const [shiftStart,setShiftStart]=useState(saved?.shiftStart ?? (lastOrdinaryShift(current)==="day" ? "07:00" : "19:00"));
  const [swing,setSwing]=useState<"auto"|"none">(saved?.swing ?? "auto");
  const [advanced,setAdvanced]=useState(false);
  const [workEnd,setWorkEnd]=useState(saved?.workEnd ? toDateTimeLocal(new Date(saved.workEnd)) : "");
  const [previousShiftStart,setPreviousShiftStart]=useState(saved?.previousShiftStart ?? (lastOrdinaryShift(current)==="night" ? "19:00" : "07:00"));
  const [nightAllowance,setNightAllowance]=useState(saved?.nightAllowance ?? 0);
  const [roundOvertime,setRoundOvertime]=useState(saved?.roundOvertime ?? trip.roundOvertime ?? true);
  const draft: TripExtension={departure:current.heliDeparture,start,end,shift,shiftStart,swing,workEnd:workEnd || undefined,previousShiftStart,nightAllowance,roundOvertime};
  const draftTrip={...current,extension:draft};
  const valid=Boolean(extensionForTrip(draftTrip));
  const projected=extensionCalculation(draftTrip,new Date(end));
  const live=extensionCalculation(current,now);
  const changed=projected.swingHours>0;
  const hours=(n:number)=>n.toLocaleString("nb-NO",{maximumFractionDigits:2});
  const projectedPay=projected.billedOvertimeHours*trip.overtimeRate+projected.waitingHours*trip.hourlyRate+projected.swingHours*Math.max(0,trip.overtimeRate-trip.hourlyRate)+projected.nightHours*nightAllowance;
  function beginEditing() {
    setEnd(toDateTimeLocal(saved ? new Date(saved.end) : addDays(normalEnd,3)));
    setStart(toDateTimeLocal(saved ? new Date(saved.start) : normalEnd));
    setShift(saved?.shift ?? lastOrdinaryShift(current));
    setShiftStart(saved?.shiftStart ?? (lastOrdinaryShift(current)==="day" ? "07:00" : "19:00"));
    setSwing(saved?.swing ?? "auto");
    setWorkEnd(saved?.workEnd ? toDateTimeLocal(new Date(saved.workEnd)) : "");
    setPreviousShiftStart(saved?.previousShiftStart ?? (lastOrdinaryShift(current)==="night" ? "19:00" : "07:00"));
    setNightAllowance(saved?.nightAllowance ?? 0);
    setRoundOvertime(saved?.roundOvertime ?? trip.roundOvertime ?? true);
    setAdvanced(false);
    setEditing(true);
  }
  function persist(extension: TripExtension) {
    // Finish old manual live counters; automatic time replaces any overlapping hours.
    const cutoff=Math.min(now.getTime(),new Date(extension.start).getTime());
    onSave({...trip,extension,additionSessions:(trip.additionSessions??[]).map(session=>session.end ? session : {...session,end:new Date(Math.max(new Date(session.start).getTime(),cutoff)).toISOString()})});
    setEditing(false);
  }
  return <section className="extension-card">
    <span className="eyebrow">AUTOMATISK OVERTID OG VENTETID</span>
    <h3>Jeg blir lenger offshore</h3>
    {!editing ? <>
      {saved ? <><p>{live.active ? (live.working ? "Overtid på skift teller nå." : "Ventetid av skift teller nå.") : now < new Date(saved.start) ? "Ekstraperioden er planlagt." : "Ekstraperioden er avsluttet."} Hjemreise: {formatDateTime(new Date(saved.end))}.</p>
      <p>{hours(live.overtimeHours)} t overtid · {hours(live.waitingHours)} t ventetid · {hours(live.swingHours)} t svingskift opptjent.</p></> : <p>Velg ny hjemreise og skift én gang. Appen veksler automatisk mellom overtid på skift og ventetid av skift, også når den er lukket.</p>}
      <button className="primary full-width" onClick={beginEditing}>{saved ? "Endre ekstraperioden" : "Planlegg ekstra dager"}</button>
      {saved && live.active && <button className="secondary full-width" onClick={()=>persist({...saved,end:now.toISOString(),workEnd:saved.workEnd && new Date(saved.workEnd)>now ? now.toISOString() : saved.workEnd})}>Jeg reiser hjem nå</button>}
    </> : <>
      <label>Når går helikopteret fra land?<input type="datetime-local" value={end} min={start} max={toDateTimeLocal(nextTrip)} onChange={e=>setEnd(e.target.value)} /></label>
      <label>Skift i ekstraperioden<select value={shift} onChange={e=>{const value=e.target.value as "day"|"night";setShift(value);setShiftStart(value==="day"?"07:00":"19:00");}}><option value="day">Dagskift · 07–19</option><option value="night">Nattskift · 19–07</option></select></label>
      {valid && <div className="extension-summary"><strong>{changed && swing!=="none" ? "Svingskift legges til automatisk" : "Ingen automatisk svingskiftkompensasjon"}</strong>
      <p>Planlagt: {hours(projected.overtimeHours)} t overtid, {hours(projected.waitingHours)} t ventetid og {hours(projected.swingHours)} t svingskift.</p>
      <p>Ekstraperioden gir ca. {Math.round(projectedPay).toLocaleString("nb-NO")} kr før skatt med dine valgte satser.</p>
      <small>Svingskift opptjenes bare for faktisk jobbet tid, maksimalt de to første 12-timersskiftene.</small></div>}
      <button className="secondary full-width" aria-expanded={advanced} aria-controls="extension-advanced" onClick={()=>setAdvanced(!advanced)}>{advanced ? "Skjul avansert" : "Avansert – tilpass beregningen"}</button>
      {advanced && <div id="extension-advanced" className="advanced-settings">
        <p>Valgfritt. Standardoppsettet følger 12-timersskift. Endre bare det som er annerledes for deg.</p>
        <label>Ferdig på jobb siste dag<input type="datetime-local" value={workEnd} min={start} max={end} onChange={e=>setWorkEnd(e.target.value)} /><small>La stå tomt for vanlig skift. Etter dette tidspunktet beregnes bare ventetid frem til helikopteret går.</small></label>
        <label>Ekstraperioden starter<input type="datetime-local" min={toDateTimeLocal(normalEnd)} value={start} onChange={e=>setStart(e.target.value)} /></label>
        <label>Skiftet starter (12 timer)<input type="time" value={shiftStart} onChange={e=>setShiftStart(e.target.value)} /></label>
        <label>Siste ordinære skift startet kl.<input type="time" value={previousShiftStart} onChange={e=>setPreviousShiftStart(e.target.value)} /><small>Brukes til å finne timer utenfor opprinnelig skift, også ved delvis forskyvning.</small></label>
        <label>Nattillegg på ekstraskift (kr/t)<input type="number" min="0" step="0.01" value={nightAllowance} onChange={e=>setNightAllowance(Number(e.target.value))} /><small>0 betyr ikke inkludert. Sett sats bare dersom avtalen din gir nattillegg i ekstraperioden. Beregnes for arbeid kl. 19–07.</small></label>
        <label>Avrunding av avsluttede overtidsøkter<select value={roundOvertime ? "half" : "exact"} onChange={e=>setRoundOvertime(e.target.value==="half")}><option value="half">Opp til nærmeste halvtime</option><option value="exact">Nøyaktig tid (lokal ordning)</option></select><small>Live-telleren går jevnt. Ventetid og svingskift bruker faktisk tid, selv om overtidsbetalingen avrundes.</small></label>
        <label>Svingskift for ekstraperioden<select value={swing} onChange={e=>setSwing(e.target.value as "auto"|"none")}><option value="auto">Automatisk fra skifttidene</option><option value="none">Ingen kompensasjon (unntak)</option></select></label>
        <p>Overtid: {trip.overtimeRate} kr/t. Ventetid: {trip.hourlyRate} kr/t. Svingskift: {Math.max(0,trip.overtimeRate-trip.hourlyRate).toFixed(2)} kr/t i tillegg. Ordinær rotasjon etter ekstraperioden beholdes.</p>
        <p className="field-help">Timesatser, feriepenger og helligdagsbetaling kan tilpasses under Innstillinger → Avansert. Beregningen er et estimat.</p>
      </div>}
      {!valid && <p role="alert">Velg gyldige tider. Start må være fra opprinnelig hjemreise, og ny hjemreise må være senere enn start og senest ved neste ordinære utreise. Arbeidsslutt må ligge mellom start og hjemreise.</p>}
      {(trip.additionSessions??[]).some(s=>!s.end) && <p>Den manuelle telleren avsluttes når du lagrer. Overlappende tid beregnes bare én gang.</p>}
      <div className="welcome-actions"><button className="primary" disabled={!valid} onClick={()=>persist({...draft,start:new Date(start).toISOString(),end:new Date(end).toISOString(),workEnd:workEnd ? new Date(workEnd).toISOString() : undefined})}>Lagre automatisk ekstraperiode</button><button className="secondary" onClick={()=>setEditing(false)}>Avbryt</button></div>
      {saved && <button className="text-button danger-text" onClick={()=>{onSave({...trip,extension:undefined});setEditing(false);}}>Fjern ekstraperioden og tilhørende beregning</button>}
    </>}
  </section>;
}
