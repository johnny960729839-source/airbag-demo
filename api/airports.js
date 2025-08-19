// api/airports.js
// 供前端下拉使用：成功时 { ok:true, data:[{code,name}, ...] }

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // 先给常用兜底；后续需要可替换为你自己的机场库
  const data = [
    { code: "BKK", name: "曼谷" },
    { code: "CNX", name: "清迈" },
    { code: "PEK", name: "北京首都" },
    { code: "PKX", name: "北京大兴" },
    { code: "PVG", name: "上海浦东" },
    { code: "SHA", name: "上海虹桥" },
    { code: "CAN", name: "广州" },
  ];
  return res.status(200).json({ ok: true, data });
};
