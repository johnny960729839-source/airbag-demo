export default async function handler(req, res) {
  try {
    const key = process.env.AVIATIONSTACK_KEY;
    if (!key) return res.status(500).json({ ok: false, msg: 'missing AVIATIONSTACK_KEY' });

    const flight = (req.query.flight || '').toString().trim();
    const date   = (req.query.date   || '').toString().trim();
    const dep    = (req.query.dep    || '').toString().trim().toUpperCase();
    const arr    = (req.query.arr    || '').toString().trim().toUpperCase();
    const strict = req.query.strict === '1';
    if (!flight) return res.status(400).json({ ok: false, msg: 'missing flight' });

    const base = 'https://api.aviationstack.com/v1/flights';
    const fetchJson = async (u) => { const r = await fetch(u, { cache: 'no-store' }); return r.json(); };
    const buildUrl = (p) => {
      const u = new URL(base);
      u.searchParams.set('access_key', key);
      u.searchParams.set('limit', p.limit || '100');
      if (p.flight_iata)   u.searchParams.set('flight_iata', p.flight_iata);
      if (p.flight_number) u.searchParams.set('flight_number', p.flight_number);
      if (p.airline_iata)  u.searchParams.set('airline_iata', p.airline_iata);
      if (p.flight_date)   u.searchParams.set('flight_date', p.flight_date);
      if (p.dep)           u.searchParams.set('dep_iata', p.dep);
      if (p.arr)           u.searchParams.set('arr_iata', p.arr);
      return u.toString();
    };
    const isIata = /^[A-Z]{2}\d+$/i.test(flight);
    const filterDepArr = (L) => L.filter(it => (dep? it?.departure?.iata===dep : true) && (arr? it?.arrival?.iata===arr : true));

    // 1) 先查（含日期）
    let url1 = buildUrl({ limit:'100', flight_date:date||'', dep:dep||'', arr:arr||'', ...(isIata? {flight_iata:flight.toUpperCase()} : {flight_number:flight}) });
    let j = await fetchJson(url1);
    let list = Array.isArray(j?.data) ? filterDepArr(j.data) : [];

    // 2) 拆航司+数字
    if (list.length===0 && isIata) {
      const airline_iata = flight.slice(0,2).toUpperCase();
      const flight_number = flight.slice(2);
      const url2 = buildUrl({ limit:'100', flight_date:date||'', airline_iata, flight_number, dep:dep||'', arr:arr||'' });
      j = await fetchJson(url2);
      list = Array.isArray(j?.data) ? filterDepArr(j.data) : [];
    }

    // 3) 回退（不带日期）
    if (list.length===0) {
      if (strict && date) return res.status(200).json({ ok:false, msg:'not found on given date', count:0, raw:j?.pagination });
      const url3 = buildUrl({ limit:'5', ...(isIata? {flight_iata:flight.toUpperCase()} : {flight_number:flight}), dep:dep||'', arr:arr||'' });
      const j3 = await fetchJson(url3);
      const samples = (Array.isArray(j3?.data) ? filterDepArr(j3.data) : []).slice(0,5).map(it => ({
        flight_date: it.flight_date, status: it.flight_status,
        dep:{ iata: it.departure?.iata, time: it.departure?.scheduled, airport: it.departure?.airport },
        arr:{ iata: it.arrival?.iata,  time: it.arrival?.scheduled,  airport: it.arrival?.airport  },
        airline: it.airline?.name, iata: it.flight?.iata, icao: it.flight?.icao, number: it.flight?.number
      }));
      return res.status(200).json({ ok:false, msg:'not found on given date; showing recent samples', count:samples.length, samples, raw:j3?.pagination });
    }

    const data = list.map(it => ({
      flight_date: it.flight_date, status: it.flight_status,
      dep:{ iata: it.departure?.iata, time: it.departure?.scheduled, airport: it.departure?.airport },
      arr:{ iata: it.arrival?.iata,  time: it.arrival?.scheduled,  airport: it.arrival?.airport  },
      airline: it.airline?.name, iata: it.flight?.iata, icao: it.flight?.icao, number: it.flight?.number
    }));
    return res.status(200).json({ ok:true, count:data.length, data, raw:j?.pagination });

  } catch (e) {
    return res.status(500).json({ ok:false, msg:'server error', error:String(e) });
  }
}
