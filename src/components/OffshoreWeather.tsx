import { useEffect, useState } from "react";

const FIELDS = [
  { name: "Valhall", lat: 56.278, lon: 3.392 },
  { name: "Ekofisk", lat: 56.546, lon: 3.212 },
  { name: "Johan Sverdrup", lat: 58.835, lon: 2.594 },
  { name: "Troll A", lat: 60.645, lon: 3.724 },
  { name: "Gullfaks A", lat: 61.181, lon: 2.188 },
  { name: "Heidrun", lat: 65.326, lon: 7.328 },
];
type Forecast = { time: string; data: { instant: { details: { air_temperature?: number; wind_speed?: number; wind_from_direction?: number; wind_speed_of_gust?: number } } } };
const windLine = (speed?: number, gust?: number, knots = false) => {
  if (speed == null) return "–";
  const factor = knots ? 1.943844 : 1;
  return `${(speed * factor).toFixed(1)} ${knots ? "knop" : "m/s"}${gust == null ? "" : ` (${(gust * factor).toFixed(1)})`}`;
};
export function OffshoreWeather({ installation }: { installation?: string }) {
  const [field, setField] = useState(() => localStorage.getItem("op-weather-field") || "Valhall");
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const matched = FIELDS.find(f => f.name === (installation || field));
  const selected = matched ?? FIELDS.find(f => f.name === field) ?? FIELDS[0];
  useEffect(() => {
    if (!installation) localStorage.setItem("op-weather-field", selected.name);
    const controller = new AbortController();
    setLoading(true); setError(""); setForecast(null);
    fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${selected.lat}&lon=${selected.lon}`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error("Værdata er utilgjengelige"); return r.json(); })
      .then(data => setForecast(data.properties?.timeseries?.[0] ?? null))
      .catch(e => { if (e.name !== "AbortError") setError("Kunne ikke hente værvarsel akkurat nå."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [selected.name, selected.lat, selected.lon]);
  const details = forecast?.data.instant.details;
  return <details className="card op-weather-card">
    <summary><span>🌤️ Offshorevær · {installation || selected.name}</span><span className="op-weather-hint">{details ? `${windLine(details.wind_speed, details.wind_speed_of_gust)} · ${Math.round(details.air_temperature ?? 0)}°C` : "Se værvarsel"} ▾</span></summary>
    <div className="op-weather-content">
      <label htmlFor="op-weather-field">Velg installasjon</label>
      <select id="op-weather-field" value={selected.name} disabled={Boolean(installation)} onChange={e => setField(e.target.value)}>{FIELDS.map(f => <option key={f.name}>{f.name}</option>)}</select>
      {installation && !matched && <small>Værdata for {installation} er ikke koblet til ennå. Viser {selected.name} som alternativ.</small>}
      {installation && matched && <small>Endres under Ny tur.</small>}
      {loading && <p>Henter værvarsel …</p>}
      {error && <p role="status">{error}</p>}
      {details && <div className="op-weather-metrics">
        <span>🌡️ Temperatur <strong>{details.air_temperature?.toFixed(1) ?? "–"} °C</strong></span>
        <span>💨 Vind
          <strong style={{ display: "block", whiteSpace: "nowrap" }}>{windLine(details.wind_speed, details.wind_speed_of_gust)}</strong>
          <strong style={{ display: "block", whiteSpace: "nowrap" }}>{windLine(details.wind_speed, details.wind_speed_of_gust, true)}</strong>
        </span>
        <span>🧭 Vindretning
          {details.wind_from_direction != null && <svg viewBox="0 0 100 100" width="84" height="84" role="img" aria-label={`Vind fra ${Math.round(details.wind_from_direction)} grader`} style={{ display: "block", margin: "5px auto" }}>
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeOpacity=".4" strokeWidth="2" />
            <text x="50" y="11" textAnchor="middle" fontSize="12" fill="currentColor">N</text>
            <text x="94" y="54" textAnchor="middle" fontSize="12" fill="currentColor">Ø</text>
            <text x="50" y="98" textAnchor="middle" fontSize="12" fill="currentColor">S</text>
            <text x="7" y="54" textAnchor="middle" fontSize="12" fill="currentColor">V</text>
            <g transform={`rotate(${details.wind_from_direction} 50 50)`}>
              <path d="M50 18 L42 60 L50 54 L58 60 Z" fill="#39c6a2" />
              <circle cx="50" cy="50" r="4" fill="currentColor" />
            </g>
          </svg>}
          <strong style={{ display: "block", textAlign: "center" }}>{details.wind_from_direction?.toFixed(0) ?? "–"}°</strong>
        </span>
      </div>}
      {details && details.wind_speed_of_gust == null && <small>Vindkast er ikke tilgjengelig i dette værvarselet.</small>}{forecast && <small>Prognose: {new Date(forecast.time).toLocaleString("nb-NO")} · Kilde: MET Norway. Ikke til operativ bruk.</small>}
      <small>Bølgevarsel kommer i en senere versjon.</small>
    </div>
  </details>;
}
