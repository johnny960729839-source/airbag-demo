// api/flight/verify.js
export default async function handler(req, res) {
  try {
    const key = process.env.AVIATIONSTACK_KEY;
    if (!key) return res.status(500).json({ ok: false, msg: 'missing AVIATIONSTACK_KEY' });

    const flight = (req.query.flight || '').toString().trim();   // 支持 MU5101 或 5101
    const date   = (req.query.date   || '').toString().trim();   // YYYY-MM-DD（UTC）
    const dep    = (req.query.dep    || '').toString().trim().toUpperCase(); // 可选：出发机场 IATA
    const arr    = (req.query.arr    || '').toString().trim().toUpperCase(); // 可选：到达机场 IATA
    const strict = req.query.strict === '1'; // 严格模式：必须命中指定日期

    if (!flight) return res.status(400).json({ ok: false, msg: 'missing flight' });

    const base = 'https://api.aviationstack.com/v1/flights';
    const fetchJson = async (u) => {
      const r = await fetch(u, { cache: 'no-store' });
      return r.json();
    };

    const buildUrl = (params) => {
      const u = new URL(base);
      u.searchParams.set('access_key', key);
      u.searchParams.set('limit', params.limit || '100');
      if (params.flight_iata)   u.searchParams.set('flight_iata', params.flight_iata);
      if (params.flight_number) u.searchParams.set('flight_number', params.flight_number);
      if (params.airline_iata)  u.searchParams.set('airline_iata', params.airline_iata);
      if (params.flight_date)   u.searchParams.set('flight_date', params.flight_date);
      if (params.dep)           u.searchParams.set('dep_iata', params.dep);
      if (params.arr)           u.searchParams.set('arr_iata', params.arr);
      return u.toString();
    };

    const isIataForm = /^[A-Z]{2}\d+$/i.test(flight); // MU5101 这种格式

    // --- 1) 先用 flight_iata + date ---
    let url1 = buildUrl({
      limit: '100',
      flight_date: date || '',
      dep: dep || '',
      arr: arr || '',
      ...(isIataForm ? { flight_iata: flight.toUpperCase() } : { flight_number: flight })
    });
    let j = await fetchJson(url1);
    let list = Array.isArray(j?.data) ? j.data : [];

    // dep/arr 二次过滤
    const filterByDepArr = (arrData) => arrData.filter(it => {
      const okDep = dep ? (it?.departure?.iata === dep) : true;
      const okArr = arr ? (it?.arrival?.iata  === arr) : true;
      return okDep && okArr;
    });

    if (list.length > 0) list = filterByDepArr(list);

    // --- 2) 如果是 MU5101 这种且没找到，就拆 airline+number ---
    if (list.length === 0 && isIataForm) {
      const airline_iata  = flight.slice(0, 2).toUpperCase();
      const flight_number = flight.slice(2);
      const url2 = buildUrl({
        limit: '100',
        flight_date: date || '',
        airline_iata,
        flight_number,
        dep: dep || '',
        arr: arr || ''
      });
      j = await fetchJson(url2);
      list = Array.isArray(j?.data) ? filterByDepArr(j.data) : [];
    }

    // --- 3) 还没有结果 ---
    if (list.length === 0) {
      if (strict && date) {
        return res.status(200).json({ ok: false, msg: 'not found on given date', count: 0, raw: j?.pagination });
      }
      // 宽松模式：返回最近样本
      const url3 = buildUrl({
        limit: '5',
        ...(isIataForm ? { flight_iata: flight.toUpperCase() } : { flight_number: flight }),
        dep: dep || '',
        arr: arr || ''
      });
      const j3 = await fetchJson(url3);
      const samples = (Array.isArray(j3?.data) ? filterByDepArr(j3.data) : []).slice(0, 5).map(it => ({
        flight_date: it.flight_date,
        status: it.flight_status,
        dep: { iata: it.departure?.iata, time: it.departure?.scheduled, airport: it.departure?.airport },
        arr: { iata: it.arrival?.iata,  time: it.arrival?.scheduled,  airport: it.arrival?.airport  },
        airline: it.airline?.name,
        iata: it.flight?.iata,
        icao: it.flight?.icao,
        number: it.flight?.number,
      }));
      return res.status(200).json({
        ok: false,
        msg: 'not found on given date; showing recent samples',
        count: samples.length,
        samples,
        raw: j3?.pagination
      });
    }

    // --- 找到数据，精简返回 ---
    const data = list.map(it => ({
      flight_date: it.flight_date,
      status: it.flight_status,
      dep: { iata: it.departure?.iata, time: it.departure?.scheduled, airport: it.departure?.airport },
      arr: { iata: it.arrival?.iata,  time: it.arrival?.scheduled,  airport: it.arrival?.airport  },
      airline: it.airline?.name,
      iata: it.flight?.iata,
      icao: it.flight?.icao,
      number: it.flight?.number,
    }));

    return res.status(200).json({ ok: true, count: data.length, data, raw: j?.pagination });

  } catch (e) {
    return res.status(500).json({ ok: false, msg: 'server error', error: String(e) });
  }
}
