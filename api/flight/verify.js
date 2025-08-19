// /api/flight/verify.js  —— 默认 Node 运行时
export default async function handler(req, res) {
  const flight = (req.query.flight || "").trim();
  const date   = (req.query.date || "").trim();

  if (!flight || !date) {
    return res.status(400).json({ ok: false, msg: "missing params: flight/date" });
  }

  const key = process.env.AVIATIONSTACK_KEY;          // ← 必须是这个名字
  if (!key) {
    return res.status(200).json({ ok: false, msg: "missing AVIATIONSTACK_KEY" });
  }

  try {
    const url =
      `http://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(key)}` +
      `&flight_iata=${encodeURIComponent(flight)}&flight_date=${encodeURIComponent(date)}`;

    const r = await fetch(url);
    const j = await r.json();
    const item = Array.isArray(j?.data) && j.data.length ? j.data[0] : null;

    if (!item) return res.status(200).json({ ok: false, msg: "not found", raw: j?.error || null });

    const route = {
      dep_iata: item?.departure?.iata || item?.departure?.airport_iata,
      dep_city: item?.departure?.city || item?.departure?.airport,
      arr_iata: item?.arrival?.iata   || item?.arrival?.airport_iata,
      arr_city: item?.arrival?.city   || item?.arrival?.airport
    };
    return res.status(200).json({ ok: true, route });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: "api error", detail: String(e) });
  }
}
