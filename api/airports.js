// /api/airports.js
const LIST = [
  { code: "BKK", name: "曼谷" }, { code: "CNX", name: "清迈" },
  { code: "CAN", name: "广州" }, { code: "PVG", name: "上海浦东" },
  { code: "SHA", name: "上海虹桥" }, { code: "PEK", name: "北京首都" },
  { code: "PKX", name: "北京大兴" }
];

export default function handler(req, res) {
  res.status(200).json({ ok: true, data: LIST });
}
