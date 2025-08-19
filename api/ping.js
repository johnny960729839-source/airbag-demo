export const config = { runtime: "edge" };

export default async function handler(req) {
  return new Response(JSON.stringify({ ok: true, msg: "edge alive" }), {
    headers: { "content-type": "application/json; charset=utf-8" },
    status: 200,
  });
}
