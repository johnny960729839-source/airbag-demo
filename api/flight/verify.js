// api/flight/verify.js
export default async function handler(req, res) {
  const { flight, date } = req.query; // flight: 航班号, date: YYYY-MM-DD
  if (!flight || !date) {
    return res.status(200).json({ ok: false, msg: 'missing params' });
  }

  if (!process.env.AVIATIONSTACK_KEY) {
    return res.status(200).json({ ok: false, msg: 'missing AVIATIONSTACK_KEY' });
  }

  try {
    const url =
      `https://api.aviationstack.com/v1/flights` +
      `?access_key=${process.env.AVIATIONSTACK_KEY}` +
      `&flight_iata=${encodeURIComponent(flight)}` +
      `&flight_date=${encodeURIComponent(date)}`;

    const r = await fetch(url, { cache: 'no-store' });
    const j = await r.json();

    const item = Array.isArray(j?.data) ? j.data[0] : null;
    if (!item) return res.status(200).json({ ok: false, msg: 'not found' });

    return res.status(200).json({
      ok: true,
      route: {
        dep_iata: item?.departure?.iata || '',
        dep_city: item?.departure?.city || item?.departure?.airport || '',
        dep_time: item?.departure?.scheduled || item?.departure?.estimated || '',
        arr_iata: item?.arrival?.iata || '',
        arr_city: item?.arrival?.city || item?.arrival?.airport || '',
        arr_time: item?.arrival?.scheduled || item?.arrival?.estimated || '',
        status: item?.flight_status || ''
      }
    });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: 'upstream error' });
  }
}
