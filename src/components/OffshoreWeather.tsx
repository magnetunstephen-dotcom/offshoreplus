import { useEffect, useState } from "react";

const FIELDS = [
  { name: "Valhall", lat: 56.278, lon: 3.392 },
  { name: "Ekofisk", lat: 56.546, lon: 3.212 },
  { name: "Johan Sverdrup", lat: 58.835, lon: 2.594 },
  { name: "Troll A", lat: 60.645, lon: 3.724 },
  { name: "Gullfaks A", lat: 61.181, lon: 2.188 },
  { name: "Heidrun", lat: 65.326, lon: 7.328 },
];
type Forecast = { time: string; data: { instant: { details: { air_temperature?: number; wind_speed?: number; wind_from_direction?: number } } } };
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
    <summary><span>🌤️ Offshorevær · {installation || selected.name}</span><span className="op-weather-hint">{details ? `${Math.round(details.wind_speed ?? 0)} m/s · ${Math.round(details.air_temperature ?? 0)}°C` : "Se værvarsel"} ▾</span></summary>
    <div className="op-weather-content">
      <label htmlFor="op-weather-field">Velg installasjon</label>
      <select id="op-weather-field" value={selected.name} disabled={Boolean(installation)} onChange={e => setField(e.target.value)}>{FIELDS.map(f => <option key={f.name}>{f.name}</option>)}</select>
      {installation && !matched && <small>Værdata for {installation} er ikke koblet til ennå. Viser {selected.name} som alternativ.</small>}
      {installation && matched && <small>Endres under Ny tur.</small>}
      {loading && <p>Henter værvarsel …</p>}
      {error && <p role="status">{error}</p>}
      {details && <div className="op-weather-metrics"><span>🌡️ Temperatur <strong>{details.air_temperature?.toFixed(1) ?? "–"} °C</strong></span><span>💨 Vind <strong>{details.wind_speed?.toFixed(1) ?? "–"} m/s</strong></span><span>🧭 Vindretning <strong>{details.wind_from_direction?.toFixed(0) ?? "–"}°</strong></span></div>}
      {forecast && <small>Prognose: {new Date(forecast.time).toLocaleString("nb-NO")} · Kilde: MET Norway. Ikke til operativ bruk.</small>}
      <small>Bølgevarsel kommer i en senere versjon.</small>
    </div>
  </details>;
}
