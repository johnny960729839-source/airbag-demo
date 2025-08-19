// api/flights.js
// 这是一个无框架 Node 函数（Vercel/Netlify/Render 的 serverless 目录都能用）。
// 作用：后端代理调用 aviationstack（用 http 协议），并转发给前端。
// 好处：避免浏览器 CORS，避免在前端暴露密钥。

const KEY = process.env.AVIATIONSTACK_KEY || "4731750f816dc02bb466448243569224"; // 建议先把你的 key 粘到引号里

module.exports = async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    const { dep_iata, arr_iata, flight_date, limit = 10 } = req.query || {};

    if (!KEY || KEY === "PASTE_YOUR_KEY_HERE") {
      return res.status(400).json({ error: "Missing AVIATIONSTACK_KEY" });
    }

    // aviationstack 免费层务必用 http（不是 https）
    const url = new URL("http://api.aviationstack.com/v1/flights");
    url.searchParams.set("access_key", KEY);
    if (dep_iata) url.searchParams.set("dep_iata", dep_iata);
    if (arr_iata) url.searchParams.set("arr_iata", arr_iata);
    if (flight_date) url.searchParams.set("flight_date", flight_date); // 仅限当天/近期历史，非未来时刻表
    url.searchParams.set("limit", String(limit));

    const r = await fetch(url.toString(), { method: "GET" });
    const data = await r.json();

    // 把关键调试信息也带回去，方便排错
    return res.status(r.status).json({
      status: r.status,
      ok: r.ok,
      requested_url: url.toString(),
      pagination: data?.pagination,
      error: data?.error,
      count: Array.isArray(data?.data) ? data.data.length : 0,
      data: data?.data || [],
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
};
