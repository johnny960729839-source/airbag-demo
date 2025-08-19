// api/flight/verify.js
// 用 aviationstack 按航班号 + 日期查一次，返回路由信息，供表单自动回填。
// ★ 免费层务必使用 http（不是 https）

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

    const flight = (req.query.flight || "").trim();   // 如 MU511、TG103 等
    const date   = (req.query.date   || "").trim();   // YYYY-MM-DD
    if (!flight || !date) {
      return res.status(200).json({ ok: false, msg: "missing params" });
    }

    const url = new URL("http://api.aviationstack.com/v1/flights");
    url.searchParams.set("access_key", KEY);
    url.searchParams.set("flight_iata", flight);      // 关键：用 IATA 航班号
    url.searchParams.set("flight_date", date);        // 仅支持当天/历史，非未来时刻表
    url.searchParams.set("limit", "1");

    const r = await fetch(url.toString());
    const body = await r.json();

    const one = Array.isArray(body?.data) ? body.data[0] : null;
    if (!one) {
      return res.status(200).json({
        ok: false,
        msg: body?.error ? (body.error.type || "api error") : "not found",
        debug: { url: url.toString(), pagination: body?.pagination || null },
      });
    }

    const route = {
      dep_iata: one?.departure?.iata || "",
      dep_city: one?.departure?.airport || "",
      arr_iata: one?.arrival?.iata || "",
      arr_city: one?.arrival?.airport || "",
    };

    return res.status(200).json({
      ok: true,
      route,
      debug: { url: url.toString() }
    });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: String(e) });
  }
};
