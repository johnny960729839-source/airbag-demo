export const config = { runtime: "edge" };

const KEY = process.env.AVIATIONSTACK_KEY || "4731750f816dc02bb466448243569224";

export default async function handler(req) {
  try {
    if (!KEY || KEY === "4731750f816dc02bb466448243569224") {
      return json({ ok: false, msg: "missing AVIATIONSTACK_KEY" });
    }

    const urlReq = new URL(req.url);
    const flight = (urlReq.searchParams.get("flight") || "").trim();
    const date   = (urlReq.searchParams.get("date") || "").trim();

    if (!flight || !date) return json({ ok: false, msg: "missing params" });

    // ★ aviationstack 免费层必须 http
    const url = new URL("http://api.aviationstack.com/v1/flights");
    url.searchParams.set("access_key", KEY);
    url.searchParams.set("flight_iata", flight);
    url.searchParams.set("flight_date", date);
    url.searchParams.set("limit", "1");

    const r = await fetch(url, { method: "GET" });
    const body = await r.json();

    const one = Array.isArray(body?.data) ? body.data[0] : null;
    if (!one) {
      return json({
        ok: false,
        msg: body?.error ? (body.error.type || "api error") : "not found",
        debug: { url: String(url), pagination: body?.pagination || null },
      });
    }

    const route = {
      dep_iata: one?.departure?.iata || "",
      dep_city: one?.departure?.airport || "",
      arr_iata: one?.arrival?.iata || "",
      arr_city: one?.arrival?.airport || "",
    };
    return json({ ok: true, route, debug: { url: String(url) } });
  } catch (e) {
    return json({ ok: false, msg: String(e) }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    headers: { "content-type": "application/json; charset=utf-8" },
    status,
  });
}
