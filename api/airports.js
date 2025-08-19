export const config = { runtime: "edge" };

export default async function handler(req) {
  const data = [
    { code: "BKK", name: "曼谷" },
    { code: "CNX", name: "清迈" },
    { code: "PEK", name: "北京首都" },
    { code: "PKX", name: "北京大兴" },
    { code: "PVG", name: "上海浦东" },
    { code: "SHA", name: "上海虹桥" },
    { code: "CAN", name: "广州" },
  ];
  return new Response(JSON.stringify({ ok: true, data }), {
    headers: { "content-type": "application/json; charset=utf-8" },
    status: 200,
  });
}
