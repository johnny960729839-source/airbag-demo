// api/flight/verify.js
export default async function handler(req, res) {
  let { flight, date } = req.query; // flight: 航班号, date: YYYY-MM-DD or YYYY/MM/DD

  if (!flight) return res.status(200).json({ ok:false, msg:'missing params' });
  if (!process.env.AVIATIONSTACK_KEY) {
    return res.status(200).json({ ok:false, msg:'missing AVIATIONSTACK_KEY' });
  }

  // 1) 规范化日期：YYYY/MM/DD -> YYYY-MM-DD
  if (date && date.includes('/')) date = date.replace(/\//g, '-');

  async function callAviationstack(params) {
    // 免费计划很多时候只能 http；在 Serverless 里用 http 没问题
    const base = `http://api.aviationstack.com/v1/flights`;
    const qs = new URLSearchParams({
      access_key: process.env.AVIATIONSTACK_KEY,
      flight_iata: flight,
      ...(params?.date ? { flight_date: params.date } : {})
    });
    const url = `${base}?${qs.toString()}`;
    const r = await fetch(url, { cache: 'no-store' });
    const j = await r.json();
    return Array.isArray(j?.data) && j.data.length ? j.data[0] : null;
  }

  try {
    // 2) 先按“航班号+日期”查
    let item = date ? await callAviationstack({ date }) : null;

    // 3) 若无结果，再尝试“仅航班号”（取最近一次）
    if (!item) item = await callAviationstack({});

    if (!item) return res.status(200).json({ ok:false, msg:'not found' });

    const out = {
      dep_iata: item?.departure?.iata || '',
      dep_city: item?.departure?.city || item?.departure?.airport || '',
      dep_time: item?.departure?.scheduled || item?.departure?.estimated || '',
      arr_iata: item?.arrival?.iata || '',
      arr_city: item?.arrival?.city || item?.arrival?.airport || '',
      arr_time: item?.arrival?.scheduled || item?.arrival?.estimated || '',
      status: item?.flight_status || ''
    };
    return res.status(200).json({ ok:true, route: out });
  } catch (e) {
    // 打点日志方便在 Vercel Functions 里查看
    console.error('verify error', e);
    return res.status(500).json({ ok:false, msg:'upstream error' });
  }
}
