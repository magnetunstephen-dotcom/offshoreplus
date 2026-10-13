import { useEffect, useState } from "react";

const HELIPORTS = [
  { code: "SVG", name: "Stavanger / Sola" },
  { code: "BGO", name: "Bergen / Flesland" },
  { code: "FRO", name: "Florø" },
  { code: "KSU", name: "Kristiansund / Kvernberget" },
  { code: "BNN", name: "Brønnøysund" },
  { code: "HFT", name: "Hammerfest" },
];
type Flight = { id: string; number: string; scheduled: string; airport: string; status: string; delayed: boolean; statusTime: string };
const formatTime = (date: string) => date ? new Date(date).toLocaleString("nb-NO", { timeZone: "Europe/Oslo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "–";
function parseFlights(xml: string): Flight[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Ugyldig flydata");
  return Array.from(doc.querySelectorAll("flight")).filter(el => el.getAttribute("arr_dep") === "A").map(el => {
    const get = (name: string) => el.querySelector(name)?.textContent?.trim() ?? "";
    const status = el.querySelector("status");
    return { id: el.getAttribute("uniqueId") || get("flight_id") + get("schedule_time"), number: get("flight_id"), scheduled: get("schedule_time"), airport: get("airport"), status: status?.getAttribute("code") || "", delayed: get("delayed") === "Y", statusTime: status?.getAttribute("time") || "" };
  }).filter(f => f.number && f.scheduled).sort((a,b) => a.scheduled.localeCompare(b.scheduled));
}
function statusLabel(f: Flight) {
  if (f.status === "A") return "Landet";
  if (f.status === "C") return "Kansellert";
  if (f.status === "D") return "Avreist (status fra Avinor)";
  if (f.delayed || f.status === "E") return "Endret / estimert tid";
  return "Planlagt";
}
export function HomeFlight({ homeDate, isOffshore }: { homeDate: Date; isOffshore: boolean }) {
  const [heliport, setHeliport] = useState(() => localStorage.getItem("op-home-heliport") || "SVG");
  const [flight, setFlight] = useState(() => localStorage.getItem("op-home-flight") || "");
  const [open, setOpen] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hoursUntilHome = (homeDate.getTime() - Date.now()) / 3600000;
  const visible = isOffshore && hoursUntilHome <= 72 && hoursUntilHome >= -24;
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    const refresh = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/flights?airport=${encodeURIComponent(heliport)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Flydata utilgjengelige");
        const data = parseFlights(await res.text());
        if (!controller.signal.aborted) { setFlights(data); setError(""); }
      } catch {
        if (!controller.signal.aborted) setError("Kunne ikke hente flydata. Sjekk Heliport.no for oppdatert informasjon.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void refresh();
    const interval = window.setInterval(refresh, 180000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [heliport, visible]);
  if (!visible) return null;
  const chosen = flights.find(f => f.id === flight || f.number === flight);
  const heliportName = HELIPORTS.find(h => h.code === heliport)?.name ?? heliport;
  return <section className="card" style={{ marginTop: 12, padding: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
      <div><strong>🚁 Følg hjemreisen</strong><div className="muted" style={{ fontSize: 13 }}>{chosen ? `${chosen.number} · ${heliportName}` : flight ? `Valgt flight: ${flight}` : "Velg ankomstheliport og flight."}</div></div>
      <button className="secondary" onClick={() => setOpen(v => !v)}>{open ? "Lukk" : flight ? "Endre" : "Velg flight"}</button>
    </div>
    {chosen && <div style={{ marginTop: 10 }}><strong>{statusLabel(chosen)}</strong> · Planlagt ankomst {formatTime(chosen.scheduled)}{chosen.statusTime && <div className="muted">Oppdatert tidspunkt: {formatTime(chosen.statusTime)}</div>}</div>}
    {open && <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
      <label>Heliport på land<select value={heliport} onChange={e => { setHeliport(e.target.value); setFlight(""); localStorage.setItem("op-home-heliport", e.target.value); localStorage.removeItem("op-home-flight"); }}>{HELIPORTS.map(h => <option key={h.code} value={h.code}>{h.name}</option>)}</select></label>
      <label>Velg ankommende flight<select value={flight} onChange={e => { setFlight(e.target.value); localStorage.setItem("op-home-flight", e.target.value); }}><option value="">Velg flight</option>{flights.map(f => <option key={f.id} value={f.id}>{f.number} · {formatTime(f.scheduled)} · {f.airport || "Offshore"} · {statusLabel(f)}</option>)}</select></label>
      {loading && <small className="muted">Henter flydata fra Avinor …</small>}
      {!loading && !error && flights.length === 0 && <small className="muted">Ingen registrerte ankomster i tidsvinduet. Sjekk nærmere avgangsdagen.</small>}
      {error && <small role="status">{error}</small>}
      <small className="muted">Kilde: Avinor. Status gjelder ankomst til land og er ikke en bekreftelse på avgang fra offshore. Kontroller alltid med operatøren.</small>
      <a href="https://heliport.no/" target="_blank" rel="noopener noreferrer">Åpne Heliport.no ↗</a>
    </div>}
    {!open && !chosen && flight && <small className="muted">Valgt flight finnes ikke i siste flyliste. Kontroller status hos operatøren.</small>}
  </section>;
}
