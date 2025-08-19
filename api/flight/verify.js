export default async function handler(req, res) {
  try {
    const { flight, date, airline } = req.query; 
    // flight 可以是 MU5101 或 5101；airline 可选：MU/CZ/CA...
    const key = process.env.AVIATIONSTACK_KEY;
    if (!key) return res.status(500).json({ ok:false, msg:'missing AVIATIONSTACK_KEY' });

    if (!flight) return res.status(400).json({ ok:false, msg:'missing flight' });

    const base = 'https://api.aviationstack.com/v1/flights';
    const fetchJson = async (u) => (await fetch(u)).json();

    // 1) iata + date
    const url1 = new URL(base);
    url1.searchParams.set('access_key', key);
    url1.searchParams.set('limit', '100');
    // 如果传进来的是 MU5101/CA1206 这种，直接放到 flight_iata
    if (/^[A-Z]{2}\d+/i.test(String(flight))) {
      url1.searchParams.set('flight_iata', String(flight).toUpperCase());
    } else {
      // 不是完整 IATA，就当 number
      url1.searchParams.set('flight_number', String(flight));
      if (airline) url1.searchParams.set('airline_iata', String(airline).toUpperCase());
    }
    if (date) url1.searchParams.set('flight_date', String(date));

    let j = await fetchJson(url1.toString());
    let list = Array.isArray(j?.data) ? j.data : [];

    // 2) 如果是 MU5101 但返回 0，尝试拆分 airline+number
    if (list.length === 0 && /^[A-Z]{2}\d+/i.test(String(flight))) {
      const airline_iata = String(flight).slice(0,2).toUpperCase();
      const flight_number = String(flight).slice(2);
      const url2 = new URL(base);
      url2.searchParams.set('access_key', key);
      url2.searchParams.set('limit', '100');
      url2.searchParams.set('airline_iata', airline_iata);
      url2.searchParams.set('flight_number', flight_number);
      if (date) url2.searchParams.set('flight_date', String(date));
      j = await fetchJson(url2.toString());
      list = Array.isArray(j?.data) ? j.data : [];
    }

    // 3) 仍然 0，则去掉日期取最近记录（方便前端验证链路）
    if (list.length === 0) {
      const url3 = new URL(base);
      url3.searchParams.set('access_key', key);
      url3.searchParams.set('limit', '5');
      if (/^[A-Z]{2}\d+/i.test(String(flight))) {
        url3.searchParams.set('flight_iata', String(flight).toUpperCase());
      } else {
        url3.searchParams.set('flight_number', String(flight));
        if (airline) url3.searchParams.set('airline_iata', String(airline).toUpperCase());
      }
      j = await fetchJson(url3.toString());
      const fallback = Array.isArray(j?.data) ? j.data : [];
      return res.status(200).json({
        ok:false,
        msg:'not found on given date; showing recent samples',
        count: fallback.length,
        samples: fallback.slice(0,5)
          .map(it => ({
            flight_date: it.flight_date,
            status: it.flight_status,
            dep: { iata: it.departure?.iata, time: it.departure?.scheduled },
            arr: { iata: it.arrival?.iata, time: it.arrival?.scheduled },
            airline: it.airline?.name,
            iata: it.flight?.iata,
            icao: it.flight?.icao,
            number: it.flight?.number,
          })),
        raw: j?.pagination
      });
    }

    // 命中则精简返回
    const data = list.map(it => ({
      flight_date: it.flight_date,
      status: it.flight_status,
      dep: { iata: it.departure?.iata, airport: it.departure?.airport, time: it.departure?.scheduled },
      arr: { iata: it.arrival?.iata, airport: it.arrival?.airport, time: it.arrival?.scheduled },
      airline: it.airline?.name,
      iata: it.flight?.iata,
      icao: it.flight?.icao,
      number: it.flight?.number,
    }));

    return res.status(200).json({ ok:true, count: data.length, data, raw: j?.pagination });

  } catch (e) {
    return res.status(500).json({ ok:false, msg:'server error', error: String(e) });
  }
}
