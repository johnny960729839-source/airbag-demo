import * as React from "react";
import { Plane, ShieldCheck, MessageCircle, User, Package, Send, PlusCircle, ChevronRight, Languages, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Simple i18n (same as before)
const i18n = {
  zh: {
    app: "AirBag",
    searchPlaceholder: "输入航班号 / 出发地 → 目的地",
    findQuota: "找行李额",
    sellQuota: "出租行李额",
    verifyRequired: "实名认证 · 风险管控",
    contact: "联系",
    book: "预订",
    publishTitle: "发布行李额",
    flightNo: "航班号",
    route: "出发地 → 目的地",
    weight: "可出租重量 (kg)",
    pricePerKg: "单价 / kg",
    submit: "提交发布",
    myOrders: "我的订单",
    inProgress: "进行中",
    completed: "已完成",
    dispute: "纠纷处理中",
    home: "首页",
    orders: "订单",
    messages: "消息",
    me: "我的",
    lang: "语言 / Language",
    safety: "安全与合规",
    safetyTips: "请确认：无违禁品、可拍照核验、遵守海关法规。",
    checklist1: "我保证没有易燃、易爆、毒品、管制刀具等违禁品",
    checklist2: "我同意交付前后拍照存证，并接受随机开包检查",
    checklist3: "我已了解并遵守出入境海关及航空运输规定",
    publishOk: "发布成功",
    match: "智能匹配",
    kg: "公斤",
    total: "合计",
    confirm: "确认",
    cancel: "取消",
    chat: "聊天",
    typeMsg: "输入消息…",
    profile: "个人中心",
    kyc: "实名认证",
    wallet: "钱包余额",
    rating: "信用分",
    help: "帮助与客服",
    legal: "法律条款",
    hotRoutes: "热门航线",
    available: "可用余量",
    perKg: "元/公斤",
    when: "日期",
  },
  en: {
    app: "AirBag",
    searchPlaceholder: "Flight No. / From → To",
    findQuota: "Find Allowance",
    sellQuota: "Sell Allowance",
    verifyRequired: "KYC Required · Risk Control",
    contact: "Contact",
    book: "Book",
    publishTitle: "Publish Allowance",
    flightNo: "Flight No.",
    route: "From → To",
    weight: "Available Weight (kg)",
    pricePerKg: "Price / kg",
    submit: "Submit",
    myOrders: "My Orders",
    inProgress: "In Progress",
    completed: "Completed",
    dispute: "In Dispute",
    home: "Home",
    orders: "Orders",
    messages: "Messages",
    me: "Me",
    lang: "Language",
    safety: "Safety & Compliance",
    safetyTips: "Confirm: no prohibited items, photo verification, customs compliant.",
    checklist1: "I confirm no explosives, drugs, weapons or prohibited items",
    checklist2: "I agree to photo evidence and random inspection",
    checklist3: "I understand and will follow customs & aviation rules",
    publishOk: "Published",
    match: "Smart Match",
    kg: "kg",
    total: "Total",
    confirm: "Confirm",
    cancel: "Cancel",
    chat: "Chat",
    typeMsg: "Type a message…",
    profile: "Profile",
    kyc: "Identity Verification",
    wallet: "Wallet Balance",
    rating: "Rating",
    help: "Help & Support",
    legal: "Legal",
    hotRoutes: "Popular Routes",
    available: "Available",
    perKg: "/kg",
    when: "Date",
  },
  th: {
    app: "AirBag",
    searchPlaceholder: "เที่ยวบิน / ต้นทาง → ปลายทาง",
    findQuota: "หาน้ำหนักว่าง",
    sellQuota: "ปล่อยน้ำหนัก",
    verifyRequired: "ยืนยันตัวตน · ควบคุมความเสี่ยง",
    contact: "ติดต่อ",
    book: "จอง",
    publishTitle: "ลงประกาศน้ำหนัก",
    flightNo: "เที่ยวบิน",
    route: "ต้นทาง → ปลายทาง",
    weight: "น้ำหนักว่าง (กก.)",
    pricePerKg: "ราคา / กก.",
    submit: "ส่ง",
    myOrders: "ออเดอร์ของฉัน",
    inProgress: "ระหว่างดำเนินการ",
    completed: "เสร็จสิ้น",
    dispute: "ข้อพิพาท",
    home: "หน้าแรก",
    orders: "ออเดอร์",
    messages: "ข้อความ",
    me: "ฉัน",
    lang: "ภาษา",
    safety: "ความปลอดภัย",
    safetyTips: "ยืนยัน: ไม่มีของต้องห้าม, ถ่ายรูปตรวจสอบ, ปฏิบัติตามศุลกากร",
    checklist1: "ยืนยันว่าไม่มีวัตถุอันตราย/ของผิดกฎหมาย",
    checklist2: "ยอมรับการถ่ายรูปหลักฐานและสุ่มตรวจ",
    checklist3: "เข้าใจและปฏิบัติตามกฎศุลกากรและการบิน",
    publishOk: "ประกาศสำเร็จ",
    match: "จับคู่อัจฉริยะ",
    kg: "กก.",
    total: "รวม",
    confirm: "ยืนยัน",
    cancel: "ยกเลิก",
    chat: "แชท",
    typeMsg: "พิมพ์ข้อความ…",
    profile: "โปรไฟล์",
    kyc: "ยืนยันตัวตน",
    wallet: "กระเป๋าเงิน",
    rating: "เรตติ้ง",
    help: "ศูนย์ช่วยเหลือ",
    legal: "ข้อกฎหมาย",
    hotRoutes: "เส้นทางยอดนิยม",
    available: "ว่าง",
    perKg: "/กก.",
    when: "วันที่",
  },
};

function useI18n() {
  const [lang, setLang] = React.useState("zh");
  const t = (k) => i18n[lang]?.[k] ?? k;
  return { lang, setLang, t };
}

function Badge({ children }) {
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{children}</span>
  );
}

function Card({ children }) {
  return <div className="bg-white p-4 rounded-2xl shadow-md">{children}</div>;
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className="w-4 h-4 text-blue-600" />}
      <h2 className="text-lg font-semibold">{children}</h2>
    </div>
  );
}

export default function AppPrototype() {
  const { lang, setLang, t } = useI18n();
  const [tab, setTab] = React.useState("home");
  const [homeTab, setHomeTab] = React.useState("find");
  const [query, setQuery] = React.useState("");
  const [bookTarget, setBookTarget] = React.useState(null);
  const [bookKg, setBookKg] = React.useState(1);
  const [toast, setToast] = React.useState(null);
  const [checks, setChecks] = React.useState({ c1: false, c2: false, c3: false });
  const [messages, setMessages] = React.useState([{ from: "system", text: "欢迎使用 AirBag！" }]);
  const [chatOpen, setChatOpen] = React.useState(false);

  // Local state for flights instead of static mock
  const [flights, setFlights] = React.useState([
    { id: 1, code: "CZ311", from: "广州", to: "曼谷", date: "2025-08-22", avail: 12, price: 80, verified: true, rating: 4.8 },
    { id: 2, code: "MU559", from: "上海", to: "清迈", date: "2025-08-21", avail: 8, price: 70, verified: true, rating: 4.6 },
    { id: 3, code: "FD323", from: "曼谷", to: "清迈", date: "2025-08-19", avail: 5, price: 65, verified: false, rating: 4.2 },
  ]);

  const [form, setForm] = React.useState({ code: "", date: "", route: "", avail: "", price: "" });

  const filteredFlights = flights.filter((f) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      f.code.toLowerCase().includes(q) ||
      f.from.toLowerCase().includes(q) ||
      f.to.toLowerCase().includes(q)
    );
  });

  function publish() {
    if (!checks.c1 || !checks.c2 || !checks.c3) {
      setToast({ type: "warn", text: t("safetyTips") });
      return;
    }
    if (!form.code || !form.route) {
      setToast({ type: "warn", text: "请输入完整信息" });
      return;
    }
    const [from, to] = form.route.split("→").map(s => s.trim());
    const newFlight = {
      id: flights.length + 1,
      code: form.code,
      from: from || "",
      to: to || "",
      date: form.date || new Date().toISOString().split("T")[0],
      avail: parseInt(form.avail) || 0,
      price: parseInt(form.price) || 0,
      verified: false,
      rating: 0,
    };
    setFlights([...flights, newFlight]);
    setForm({ code: "", date: "", route: "", avail: "", price: "" });
    setToast({ type: "ok", text: t("publishOk") });
  }

  function sendMessage(text) {
    if (!text) return;
    setMessages((m) => [...m, { from: "me", text }]);
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gray-50/80 backdrop-blur flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-blue-600">{t("app")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab("messages")} className="relative p-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button
            onClick={() => setLang(lang === "zh" ? "en" : lang === "en" ? "th" : "zh")}
            className="flex items-center gap-1 text-sm text-gray-600"
          >
            <Languages className="w-4 h-4" /> {t("lang")}
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="px-4">
        <div className="mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder={t("searchPlaceholder")}
            className="w-full p-3 border rounded-2xl shadow-sm"
          />
        </div>

        {/* Home Tabs */}
        {tab === "home" && (
          <div>
            <div className="flex mb-4 rounded-2xl overflow-hidden">
              <button
                onClick={() => setHomeTab("find")}
                className={`flex-1 py-2 ${homeTab === "find" ? "bg-blue-500 text-white" : "bg-white text-gray-600"}`}
              >
                {t("findQuota")}
              </button>
              <button
                onClick={() => setHomeTab("sell")}
                className={`flex-1 py-2 ${homeTab === "sell" ? "bg-blue-500 text-white" : "bg-white text-gray-600"}`}
              >
                {t("sellQuota")}
              </button>
            </div>

            {homeTab === "find" && (
              <div className="grid grid-cols-2 gap-3">
                {filteredFlights.map((f) => (
                  <Card key={f.id}>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold">{f.code} · {f.from} → {f.to}</h3>
                      <span className="text-xs text-gray-500">{f.date}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {t("available")}：{f.avail}{t("kg")} · {f.price}{lang === "zh" ? "元/公斤" : t("perKg")}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> {f.verified ? "KYC" : "Basic"} · ⭐{f.rating}
                      </span>
                      <button onClick={() => { setBookTarget(f); setBookKg(1); }} className="px-3 py-1 rounded-xl bg-blue-500 text-white flex items-center gap-1">
                        <Package className="w-4 h-4" /> {t("book")}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {homeTab === "sell" && (
              <div className="space-y-3">
                <Card>
                  <SectionTitle icon={Package}>{t("publishTitle")}</SectionTitle>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.code} onChange={(e)=>setForm({...form, code:e.target.value})} type="text" placeholder={t("flightNo")} className="p-3 border rounded-xl" />
                    <input value={form.date} onChange={(e)=>setForm({...form, date:e.target.value})} type="date" className="p-3 border rounded-xl" title={t("when")} />
                    <input value={form.route} onChange={(e)=>setForm({...form, route:e.target.value})} type="text" placeholder={t("route")} className="col-span-2 p-3 border rounded-xl" />
                    <input value={form.avail} onChange={(e)=>setForm({...form, avail:e.target.value})} type="number" placeholder={t("weight")} className="p-3 border rounded-xl" />
                    <input value={form.price} onChange={(e)=>setForm({...form, price:e.target.value})} type="number" placeholder={t("pricePerKg")} className="p-3 border rounded-xl" />
                  </div>
                  <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" onChange={(e)=>setChecks(v=>({...v, c1:e.target.checked}))} /> {t("checklist1")}</label>
                    <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" onChange={(e)=>setChecks(v=>({...v, c2:e.target.checked}))} /> {t("checklist2")}</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={(e)=>setChecks(v=>({...v, c3:e.target.checked}))} /> {t("checklist3")}</label>
                  </div>
                  <button onClick={publish} className="mt-4 w-full bg-blue-500 text-white py-3 rounded-2xl flex items-center justify-center gap-2">
                    <PlusCircle className="w-5 h-5" /> {t("submit")}
                  </button>
                </Card>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className={`fixed bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow text-white ${toast.type === "ok" ? "bg-green-600" : "bg-yellow-600"}`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
