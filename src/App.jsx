// src/App.jsx
import * as React from "react";
import { Plane, ShieldCheck, Package, PlusCircle, Languages, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/** 多语言文案 */
const i18n = {
  zh: {
    app: "AirBag",
    searchPlaceholder: "输入航班号 / 出发地 → 目的地",
    findQuota: "找行李额",
    sellQuota: "出租行李额",
    publishTitle: "发布行李额",
    flightNo: "航班号",
    routeFrom: "出发城市",
    routeTo: "到达城市",
    weight: "可出租重量 (kg)",
    pricePerKg: "单价 / kg",
    submit: "提交发布",
    hotRoutes: "热门航线",
    available: "可用余量",
    perKg: "元/公斤",
    when: "日期",
    publishOk: "发布成功",
    safetyTips: "请确认：无违禁品、可拍照核验、遵守海关法规。",
    checklist1: "我保证没有违禁品",
    checklist2: "我同意拍照存证并接受检查",
    checklist3: "我遵守海关及航空规定",
    lang: "语言",
  },
  en: {
    app: "AirBag",
    searchPlaceholder: "Flight No. / From → To",
    findQuota: "Find Allowance",
    sellQuota: "Sell Allowance",
    publishTitle: "Publish Allowance",
    flightNo: "Flight No.",
    routeFrom: "From City",
    routeTo: "To City",
    weight: "Available Weight (kg)",
    pricePerKg: "Price / kg",
    submit: "Submit",
    hotRoutes: "Popular Routes",
    available: "Available",
    perKg: "/kg",
    when: "Date",
    publishOk: "Published",
    safetyTips: "Confirm: no prohibited items, photo check, comply customs.",
    checklist1: "No prohibited items",
    checklist2: "Agree to photo evidence & inspection",
    checklist3: "Comply with customs/aviation rules",
    lang: "Language",
  }
};

function useI18n() {
  const [lang, setLang] = React.useState(() => localStorage.getItem('airbag_lang') || 'zh');
  const t = (k) => i18n[lang]?.[k] ?? k;
  React.useEffect(()=> { try { localStorage.setItem('airbag_lang', lang); } catch {} }, [lang]);
  return { lang, setLang, t };
}

function Card({ children }) {
  return <div className="bg-white p-4 rounded-2xl shadow-md">{children}</div>;
}

/** 内置城市兜底（接口不可用时使用） */
const CITY_FALLBACK = [
  { code: "BKK", name: "曼谷" }, { code: "CNX", name: "清迈" },
  { code: "CAN", name: "广州" }, { code: "PVG", name: "上海浦东" },
  { code: "SHA", name: "上海虹桥" }, { code: "PEK", name: "北京首都" },
  { code: "PKX", name: "北京大兴" },
];

export default function App() {
  const { lang, setLang, t } = useI18n();
  const [homeTab, setHomeTab] = React.useState("find");
  const [query, setQuery] = React.useState("");
  const [toast, setToast] = React.useState(null);
  const [checks, setChecks] = React.useState({ c1:false, c2:false, c3:false });

  // 航班列表：本地持久化
  const [flights, setFlights] = React.useState(()=>{
    try { return JSON.parse(localStorage.getItem('airbag_flights')||'[]'); } catch { return []; }
  });
  React.useEffect(()=>{ try { localStorage.setItem('airbag_flights', JSON.stringify(flights)); } catch {} }, [flights]);

  // 表单
  const [form, setForm] = React.useState({ code:"", date:"", fromCity:"", toCity:"", avail:"", price:"" });

  // 城市下拉：从接口拉，失败则用内置兜底
  const [cities, setCities] = React.useState(CITY_FALLBACK);
  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/airports');
        const j = await r.json();
        if (j?.ok && Array.isArray(j.data) && j.data.length) setCities(j.data);
      } catch { /* ignore, keep fallback */ }
    })();
  }, []);

  // 实时航班校验后锁定下拉
  const [lockedByAPI, setLockedByAPI] = React.useState(false);

  // 航班号/日期变化 -> 调用后端校验并回填
  React.useEffect(() => {
    if (!form.code || !form.date) return;
    let aborted = false;
    (async () => {
      try {
        const r = await fetch(`/api/flight/verify?flight=${encodeURIComponent(form.code)}&date=${form.date}`);
        const j = await r.json();
        if (aborted) return;

        if (j?.ok && j.route) {
          const { dep_iata, dep_city, arr_iata, arr_city } = j.route;
          const list = cities?.length ? cities : CITY_FALLBACK;
          const from = list.find(c => c.code === dep_iata) || list.find(c => c.name === dep_city);
          const to   = list.find(c => c.code === arr_iata) || list.find(c => c.name === arr_city);
          setForm(f => ({
            ...f,
            fromCity: from ? from.code : f.fromCity,
            toCity:   to   ? to.code   : f.toCity
          }));
          setLockedByAPI(true);
          setToast({ type: 'ok', text: '已根据航班自动填充出发/到达' });
        } else {
          setLockedByAPI(false);
          const tip = j?.msg === 'missing AVIATIONSTACK_KEY'
            ? '后端未配置航班API密钥（AVIATIONSTACK_KEY）'
            : (j?.msg === 'not found' ? '未查到该航班，请核对航班号/日期' : '航班校验失败，请稍后重试');
          setToast({ type: 'warn', text: tip });
        }
      } catch {
        setLockedByAPI(false);
        setToast({ type: 'warn', text: '航班校验异常，请稍后重试' });
      }
    })();
    return () => { aborted = true; };
  }, [form.code, form.date, cities]);

  // 搜索过滤（本地）
  const filtered = flights.filter(f => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (f.code||'').toLowerCase().includes(q) || (f.from||'').toLowerCase().includes(q) || (f.to||'').toLowerCase().includes(q);
  });

  function publish() {
    if (!checks.c1 || !checks.c2 || !checks.c3) { setToast({type:"warn", text:t("safetyTips")}); return; }
    if (!form.code || !form.fromCity || !form.toCity) { setToast({type:"warn", text:"请完善航班号/城市/日期"}); return; }

    const fromOpt = cities.find(c=>c.code===form.fromCity) || CITY_FALLBACK.find(c=>c.code===form.fromCity);
    const toOpt   = cities.find(c=>c.code===form.toCity)   || CITY_FALLBACK.find(c=>c.code===form.toCity);
    const newFlight = {
      id: flights.length + 1,
      code: form.code,
      from: fromOpt?.name || form.fromCity,
      to: toOpt?.name || form.toCity,
      fromIata: form.fromCity,
      toIata: form.toCity,
      date: form.date || new Date().toISOString().split("T")[0],
      avail: parseInt(form.avail)||0,
      price: parseInt(form.price)||0,
      verified: lockedByAPI, // 通过API校验则更可信
      rating: 0,
    };
    setFlights([...flights, newFlight]);
    setForm({ code:"", date:"", fromCity:"", toCity:"", avail:"", price:"" });
    setChecks({ c1:false, c2:false, c3:false });
    setLockedByAPI(false);
    setToast({ type:"ok", text: t("publishOk") });
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 顶部 */}
      <header className="sticky top-0 z-20 bg-gray-50/80 backdrop-blur flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-blue-600">{t("app")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2"><Bell className="w-5 h-5 text-gray-600"/></button>
          <button onClick={() => setLang(lang === "zh" ? "en" : "zh")} className="flex items-center gap-1 text-sm text-gray-600">
            <Languages className="w-4 h-4" /> {t("lang")}
          </button>
        </div>
      </header>

      {/* 主体 */}
      <div className="px-4">
        <div className="mb-3">
          <input value={query} onChange={e=>setQuery(e.target.value)} type="text" placeholder={t("searchPlaceholder")} className="w-full p-3 border rounded-2xl shadow-sm"/>
        </div>

        <div className="flex mb-4 rounded-2xl overflow-hidden">
          <button onClick={()=>setHomeTab("find")} className={`flex-1 py-2 ${homeTab==="find"?"bg-blue-500 text-white":"bg-white text-gray-600"}`}>{t("findQuota")}</button>
          <button onClick={()=>setHomeTab("sell")} className={`flex-1 py-2 ${homeTab==="sell"?"bg-blue-500 text-white":"bg-white text-gray-600"}`}>{t("sellQuota")}</button>
        </div>

        {homeTab==="find" && (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(f => (
              <Card key={f.id}>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold">{f.code} · {f.from} → {f.to}</h3>
                  <span className="text-xs text-gray-500">{f.date}</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {t("available")}：{f.avail} · {f.price}{lang==="zh"?"元/公斤":t("perKg")}
                </p>
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4"/> {f.verified? "KYC":"Basic"} · ⭐{f.rating}
                </span>
              </Card>
            ))}
          </div>
        )}

        {homeTab==="sell" && (
          <div className="space-y-3">
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-600"/><h2 className="text-lg font-semibold">{t("publishTitle")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.code} onChange={e=>setForm({...form, code:e.target.value})} type="text" placeholder={t("flightNo")} className="p-3 border rounded-xl"/>
                <input value={form.date} onChange={e=>setForm({...form, date:e.target.value})} type="date" className="p-3 border rounded-xl" title={t("when")}/>
                <select disabled={lockedByAPI} value={form.fromCity} onChange={e=>setForm({...form, fromCity:e.target.value})} className="p-3 border rounded-xl">
                  <option value="">{t("routeFrom")}</option>
                  {(cities?.length ? cities : CITY_FALLBACK).map(opt => <option key={opt.code} value={opt.code}>{opt.name}（{opt.code}）</option>)}
                </select>
                <select disabled={lockedByAPI} value={form.toCity} onChange={e=>setForm({...form, toCity:e.target.value})} className="p-3 border rounded-xl">
                  <option value="">{t("routeTo")}</option>
                  {(cities?.length ? cities : CITY_FALLBACK).map(opt => <option key={opt.code} value={opt.code}>{opt.name}（{opt.code}）</option>)}
                </select>
                <input value={form.avail} onChange={e=>setForm({...form, avail:e.target.value})} type="number" placeholder={t("weight")} className="p-3 border rounded-xl"/>
                <input value={form.price} onChange={e=>setForm({...form, price:e.target.value})} type="number" placeholder={t("pricePerKg")} className="p-3 border rounded-xl"/>
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" checked={checks.c1} onChange={e=>setChecks(v=>({...v, c1:e.target.checked}))}/> {t("checklist1")}</label>
                <label className="flex items-center gap-2 text-sm mb-1"><input type="checkbox" checked={checks.c2} onChange={e=>setChecks(v=>({...v, c2:e.target.checked}))}/> {t("checklist2")}</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={checks.c3} onChange={e=>setChecks(v=>({...v, c3:e.target.checked}))}/> {t("checklist3")}</label>
              </div>
              <button onClick={publish} className="mt-4 w-full bg-blue-500 text-white py-3 rounded-2xl flex items-center justify-center gap-2">
                <PlusCircle className="w-5 h-5"/> {t("submit")}
              </button>
            </Card>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className={`fixed bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow text-white ${toast.type==="ok"?"bg-green-600":"bg-yellow-600"}`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
