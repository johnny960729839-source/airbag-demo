export default async function handler(req, res) {
  try {
    const { flight, date } = req.query; // flight=CJ3812  date=2025-08-20
    const key = process.env.AVIATIONSTACK_KEY;
    if (!key) return res.status(500).json({ ok:false, msg:'missing AVIATIONSTACK_KEY' });

    if (!flight || !date) return res.status(400).json({ ok:false, msg:'missing flight or date' });

    const base = 'http://api.aviationstack.com/v1/flights'; // 免费层建议 http
    const url = `${base}?access_key=${key}&flight_iata=${encodeURIComponent(flight)}&flight_date=${encodeURIComponent(date)}&limit=100`;

    const r = await fetch(url);
    const json = await r.json();

    if (!json || !Array.isArray(json.data)) {
      return res.status(502).json({ ok:false, msg:'upstream error', raw: json });
    }

    // 保险起见，再按航班号与日期过滤一次
    const list = json.data.filter(it =>
      (it?.flight?.iata === flight || it?.flight?.number === flight) &&
      it?.flight_date === date
    );

    if (list.length === 0) {
      return res.status(200).json({ ok:false, msg:'not found', count: 0, raw: json?.pagination });
    }

    // 只返回你前端需要的字段
    const simplified = list.map(it => ({
      flight_date: it.flight_date,
      status: it.flight_status,
      dep_iata: it.departure?.iata,
      dep_airport: it.departure?.airport,
      dep_time: it.departure?.scheduled,
      arr_iata: it.arrival?.iata,
      arr_airport: it.arrival?.airport,
      arr_time: it.arrival?.scheduled,
      airline: it.airline?.name,
      flight_iata: it.flight?.iata || it.flight?.number,
      flight_icao: it.flight?.icao,
    }));

    return res.status(200).json({ ok:true, count: simplified.length, data: simplified });
  } catch (e) {
    return res.status(500).json({ ok:false, msg:'server error', error: String(e) });
  }
}
