import { useState } from "react";

const HELIPORTS = [
  { code: "SVG", name: "Stavanger / Sola" },
  { code: "BGO", name: "Bergen / Flesland" },
  { code: "FRO", name: "Florø" },
  { code: "KSU", name: "Kristiansund / Kvernberget" },
  { code: "BNN", name: "Brønnøysund" },
  { code: "HFT", name: "Hammerfest" },
];

export function HomeFlight({ homeDate, isOffshore }: { homeDate: Date; isOffshore: boolean }) {
  const [heliport, setHeliport] = useState(() => localStorage.getItem("op-home-heliport") || "SVG");
  const [flight, setFlight] = useState(() => localStorage.getItem("op-home-flight") || "");
  const [open, setOpen] = useState(false);
  const hoursUntilHome = (homeDate.getTime() - Date.now()) / 3600000;
  if (!isOffshore || hoursUntilHome > 72 || hoursUntilHome < -24) return null;
  const heliportName = HELIPORTS.find(h => h.code === heliport)?.name ?? heliport;
  return <section className="card" style={{ marginTop: 12, padding: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
      <div><strong>🚁 Følg hjemreisen</strong><div className="muted" style={{ fontSize: 13 }}>{flight ? `${heliportName} · Flight ${flight}` : "Velg heliport og flight når du har fått flynummeret."}</div></div>
      <button className="secondary" onClick={() => setOpen(v => !v)}>{open ? "Lukk" : flight ? "Endre" : "Velg flight"}</button>
    </div>
    {open && <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
      <label>Heliport på land<select value={heliport} onChange={e => { setHeliport(e.target.value); localStorage.setItem("op-home-heliport", e.target.value); }}>{HELIPORTS.map(h => <option key={h.code} value={h.code}>{h.name}</option>)}</select></label>
      <label>Flightnummer (valgfritt inntil flylisten er koblet til)<input value={flight} placeholder="Skriv flightnummer" onChange={e => { setFlight(e.target.value); localStorage.setItem("op-home-flight", e.target.value); }} /></label>
      <small className="muted">Automatisk flyliste og live status er ikke tilkoblet ennå. Opplysninger om avgang og forsinkelse må sjekkes hos flyoperatøren.</small>
      <a href="https://heliport.no/" target="_blank" rel="noopener noreferrer">Åpne Heliport.no ↗</a>
    </div>}
    {!open && flight && <small className="muted">Flystatus er ikke tilgjengelig i OffshorePlus ennå.</small>}
  </section>;
}
