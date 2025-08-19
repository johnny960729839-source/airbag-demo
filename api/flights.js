export const config = { runtime: "edge" };

const KEY = process.env.AVIATIONSTACK_KEY || "PASTE_YOUR_KEY_HERE";

export default async function handler(req) {
  try {
    if (!KEY || KEY === "PASTE_YOUR_KEY_HERE") {
      return json({ ok: false, msg: "missing AVIATIONSTACK_KEY" });
    }

    const u = new URL(req.url);
    const dep_iata = u.searchParams.get("dep_iata") || "";
    const arr_iata = u.searchParams.get("arr_iata") || "";
    const limit = u.searchParams.get("limit") || "10";

    const url = new URL("http://api.aviationstack.com/v1/flights");
    url.searchParams.set("access_key", KEY);
    if (dep_iata) url.searchParams.set("dep_iata", dep_iata);
    if (arr_iata) url.searchParams.set("arr_iata", arr_iata);
    url.searchParams.set("limit", limit);

    const r = await fetch(url, { method: "GET" });
    const body = await r.json();

    return json({
      ok: r.ok,
      requested_url: String(url),
      error: body?.error || null,
      pagination: body?.pagination || null,
      count: Array.isArray(body?.data) ? body.data.length : 0,
      data: Array.isArray(body?.data) ? body.data : [],
    }, r.ok ? 200 : 500);
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
