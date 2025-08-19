// /api/flight/verify.js
export default async function handler(req, res) {
  const flight = (req.query.flight || "").trim();   // 如：AA100
  const date   = (req.query.date || "").trim();     // YYYY-MM-DD

  if (!flight || !date) {
    return res.status(400).json({ ok: false, msg: "missing params: flight/date" });
  }

  const key = process.env.AVIATIONSTACK_KEY;
  if (!key) {
    return res.status(200).json({ ok: false, msg: "missing AVIATIONSTACK_KEY" });
  }

  try {
    const url =
      `http://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(key)}` +
      `&flight_iata=${encodeURIComponent(flight)}&flight_date=${encodeURIComponent(date)}`;

    const r = await fetch(url);
    const j = await r.json();

    // aviationstack 正常数据在 j.data 数组里
    const item = Array.isArray(j?.data) && j.data.length ? j.data[0] : null;

    if (!item) {
      return res.status(200).json({ ok: false, msg: "not found", raw: j?.error || null });
    }

    const route = {
      dep_iata: item?.departure?.iata || item?.departure?.airport_iata,
      dep_city: item?.departure?.city || item?.departure?.airport,
      arr_iata: item?.arrival?.iata   || item?.arrival?.airport_iata,
      arr_city: item?.arrival?.city   || item?.arrival?.airport,
    };

    return res.status(200).json({ ok: true, route, raw: { flight_date: item?.flight_date, airline: item?.airline?.name } });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: "api error", detail: String(err) });
  }
}
