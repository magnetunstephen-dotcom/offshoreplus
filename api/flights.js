// Vercel serverless endpoint. Cache shared across visitors at the edge.
const PORTS = new Set(["SVG","BGO","FRO","KSU","BNN","HFT"]);
export default async function handler(req, res) {
  const airport = String(req.query?.airport || "").toUpperCase();
  if (!PORTS.has(airport)) return res.status(400).json({ error: "Ugyldig heliport" });
  res.setHeader("Cache-Control", "public, s-maxage=180, stale-while-revalidate=60");
  try {
    const url = new URL("https://asrv.avinor.no/XmlFeed/v1.0");
    Object.entries({ airport, TimeFrom: "2", TimeTo: "24", direction: "A", serviceType: "E" }).forEach(([k,v]) => url.searchParams.set(k,v));
    const upstream = await fetch(url, { headers: { Accept: "application/xml" }, signal: AbortSignal.timeout(10000) });
    if (!upstream.ok) throw new Error("Avinor svarte ikke");
    const xml = await upstream.text();
    // XML is returned unchanged and parsed by the browser's native DOMParser.
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.status(200).send(xml);
  } catch {
    return res.status(502).json({ error: "Flydata er midlertidig utilgjengelige" });
  }
}
