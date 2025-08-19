// api/flights.js
// 通用查询端点：/api/flights?dep_iata=BKK&arr_iata=CNX&limit=5

const KEY = process.env.AVIATIONSTACK_KEY || "4731750f816dc02bb466448243569224";

module.exports = async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    if (!KEY || KEY === "PASTE_YOUR_KEY_HERE") {
      return res.status(200).json({ ok: false, msg: "missing AVIATIONSTACK_KEY" });
    }

    const { dep_iata, arr_iata, limit = 10 } = req.query || {};

    const url = new URL("http://api.aviationstack.com/v1/flights");
    url.searchParams.set("access_key", KEY);
    if (dep_iata) url.searchParams.set("dep_iata", dep_iata);
    if (arr_iata) url.searchParams.set("arr_iata", arr_iata);
    url.searchParams.set("limit", String(limit));

    const r = await fetch(url.toString());
    const body = await r.json();

    return res.status(r.status).json({
      ok: r.ok,
      requested_url: url.toString(),
      error: body?.error || null,
      pagination: body?.pagination || null,
      count: Array.isArray(body?.data) ? body.data.length : 0,
      data: Array.isArray(body?.data) ? body.data : [],
    });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: String(e) });
  }
};
