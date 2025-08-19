import * as React from "react";
import { Plane, ShieldCheck, Package, PlusCircle, Languages, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CheckoutButton from "./components/CheckoutButton";

const i18n = {
  zh: { app:"AirBag", searchPlaceholder:"输入航班号 / 出发地 → 目的地", findQuota:"找行李额", sellQuota:"出租行李额",
    publishTitle:"发布行李额", flightNo:"航班号", routeFrom:"出发城市", routeTo:"到达城市",
    weight:"可出租重量 (kg)", pricePerKg:"单价 / kg", submit:"提交发布", available:"可用余量", perKg:"元/公斤",
    when:"日期", publishOk:"发布成功", safetyTips:"请确认：无违禁品、可拍照核验、遵守海关法规。",
    checklist1:"我保证没有违禁品", checklist2:"我同意拍照存证并接受检查", checklist3:"我遵守海关及航空规定",
    lang:"语言", mock:"模拟", verify:"校验", hotRoutes:"热门航线"
  },
  en: { app:"AirBag", searchPlaceholder:"Flight No. / From → To", findQuota:"Find Allowance", sellQuota:"Sell Allowance",
    publishTitle:"Publish Allowance", flightNo:"Flight No.", routeFrom:"From City", routeTo:"To City",
    weight:"Available Weight (kg)", pricePerKg:"Price / kg", submit:"Submit", available:"Available", perKg:"/kg",
    when:"Date", publishOk:"Published", safetyTips:"Confirm: no prohibited items, photo check, comply customs.",
    checklist1:"No prohibited items", checklist2:"Agree to photo evidence & inspection", checklist3:"Comply with customs/aviation rules",
    lang:"Language", mock:"Mock", verify:"Verify", hotRoutes:"Popular Routes"
  }
};
function useI18n() {
  const [lang, setLang] = React.useState('zh');
  React.useEffect(()=>{ try { setLang(localStorage.getItem('airbag_lang') || 'zh'); } catch {} }, []);
  const t = (k) => i18n[lang]?.[k] ?? k;
  React.useEffect(()=>{ try { localStorage.setItem('airbag_lang', lang); } catch {} }, [lang]);
  return { lang, setLang, t };
}
function Card({ children }) { return <div className="bg-white p-4 rounded-2xl shadow-md">{children}</div>; }
const CITY_FALLBACK = [
  { code: "BKK", name: "曼谷" }, { code: "CNX", name: "清迈" },
  { code: "CAN", name: "广州" }, { code: "PVG", name: "上海浦东" },
  { code: "SHA", name: "上海虹桥" }, { code: "PEK", name: "北京首都" },
  { code: "PKX", name: "北京大兴" },
];
const HOT_ROUTES = [{from:"BKK",to:"CNX"},{from:"SHA",to:"PEK"},{from:"PVG",to:"CAN"},{from:"PEK",to:"PKX"}];

export default function App() {
  const { lang, setLang, t } = useI18n();
  const [homeTab, setHomeTab] = React.useState("find");
  const [query, setQuery] = React.useState("");
  const [toast, setToast] = React.useState(null);
  const [checks, setChecks] = React.useState({ c1:false, c2:false, c3:false });
  const [mockOn, setMockOn] = React.useState(true);

  const [flights, setFlights] = React.useState([]);
  React.useEffect(()=>{ try { const raw=localStorage.getItem('airbag_flights'); if(raw) setFlights(JSON.parse(raw)||[]);} catch{} },[]);
  React.useEffect(()=>{ try { localStorage.setItem('airbag_flights', JSON.stringify(flights)); } catch {} }, [flights]);

  const [form, setForm] = React.useState({ code:"", date:"", fromCity:"", toCity:"", avail:"", price:"" });
  const [lockedByAPI, setLockedByAPI] = React.useState(false);
  const [loadingVerify, setLoadingVerify] = React.useState(false);

  const [cities, setCities] = React.useState(CITY_FALLBACK);
  React.useEffect(()=>{ (async()=>{ try{ const r=await fetch('/api/airports'); const j=await r.json(); if(j?.ok && Array.isArray(j.data)&&j.data.length) setCities(j.data);}catch{}})(); },[]);

  const filtered = flights.filter(f=>{
    if(!query) return true; const q=query.toLowerCase();
    return (f.code||'').toLowerCase().includes(q) || (f.from||'').toLowerCase().includes(q) || (f.to||'').toLowerCase().includes(q);
  });

  async function doVerify() {
    if (!form.code || !form.date) { setToast({type:'warn', text:'请先填写航班号和日期'}); return; }
    setLoadingVerify(true);
    try {
      const url = mockOn ? `/api/proxy/mock?flight=${encodeURIComponent(form.code)}&date=${form.date}` :
                           `/api/proxy/verify?flight=${encodeURIComponent(form.code)}&date=${form.date}`;
      const r = await fetch(url); const j = await r.json();
      const arr = Array.isArray(j?.data)&&j.data.length ? j.data : (Array.isArray(j?.samples)&&j.samples.length ? j.samples : []);
      const item = arr[0];
      if (item?.dep?.iata || item?.arr?.iata) {
        const from = cities.find(c=>c.code===item.dep?.iata); const to = cities.find(c=>c.code===item.arr?.iata);
        setForm(f => ({ ...f, fromCity: from?.code||f.fromCity, toCity: to?.code||f.toCity }));
        setLockedByAPI(true); setToast({ type:'ok', text:'已根据航班自动填充出发/到达' });
      } else { setLockedByAPI(false); setToast({ type:'warn', text: j?.msg || '未查到该航班' }); }
    } catch { setLockedByAPI(false); setToast({ type:'warn', text:'航班校验异常' }); }
    finally { setLoadingVerify(false); }
  }

  function publish() {
    if (!checks.c1 || !checks.c2 || !checks.c3) { setToast({type:"warn", text:t("safetyTips")}); return; }
    if (!form.code || !form.fromCity || !form.toCity) { setToast({type:"warn", text:"请完善航班号/城市/日期"}); return; }
    const fromOpt = cities.find(c=>c.code===form.fromCity) || {name:form.fromCity};
    const toOpt   = cities.find(c=>c.code===form.toCity)   || {name:form.toCity};
    const newFlight = {
      id: flights.length + 1, code: form.code,
      from: fromOpt.name, to: toOpt.name, fromIata: form.fromCity, toIata: form.toCity,
      date: form.date || new Date().toISOString().split("T")[0],
      avail: parseInt(form.avail)||0, price: parseInt(form.price)||0,
      verified: lockedByAPI, rating: 0,
    };
    setFlights([...flights, newFlight]);
    setForm({ code:"", date:"", fromCity:"", toCity:"", avail:"", price:"" });
    setChecks({ c1:false, c2:false, c3:false }); setLockedByAPI(false);
    setToast({ type:"ok", text: t("publishOk") });
  }

  return (
    <div className="bg-gray-50 min-h-[640px] pb-20">
      <header className="sticky top-0 z-20 bg-gray-50/80 backdrop-blur flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-blue-600">{t("app")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-sm text-gray-600 select-none">
            <input type="checkbox" checked={mockOn} onChange={e=>setMockOn(e.target.checked)} /> {t('mock')}
          </label>
          <button className="relative p-2"><Bell className="w-5 h-5 text-gray-600"/></button>
          <button onClick={() => setLang(lang === "zh" ? "en" : "zh")} className="flex items-center gap-1 text-sm text-gray-600">
            <Languages className="w-4 h-4" /> {t("lang")}
          </button>
        </div>
      </header>

      <div className="px-4 max-w-3xl mx-auto">
        <div className="mb-3">
          <input value={query} onChange={e=>setQuery(e.target.value)} type="text" placeholder={t("searchPlaceholder")} className="w-full p-3 border rounded-2xl shadow-sm"/>
        </div>

        <div className="flex mb-4 rounded-2xl overflow-hidden">
          <button onClick={()=>setHomeTab("find")} className={`flex-1 py-2 ${homeTab==="find"?"bg-blue-500 text-white":"bg-white text-gray-600"}`}>{t("findQuota")}</button>
          <button onClick={()=>setHomeTab("sell")} className={`flex-1 py-2 ${homeTab==="sell"?"bg-blue-500 text-white":"bg-white text-gray-600"}`}>{t("sellQuota")}</button>
        </div>

        {homeTab==="find" && (
          <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
            {filtered.map(f => (
              <Card key={f.id}>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold">{f.code} · {f.from} → {f.to}</h3>
                  <span className="text-xs text-gray-500">{f.date}</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {t("available")}：{f.avail} · {f.price}{lang==="zh"?"元/公斤":t("perKg")}
                </p>
                <span className="text-xs text-green-600 flex items-center gap-1 mb-3">
                  <ShieldCheck className="w-4 h-4"/> {f.verified? "KYC":"Basic"} · ⭐{f.rating}
                </span>
                <CheckoutButton orderId={`order-${f.id}`} amountCents={500} label="支付授权（不扣款）" />
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500 bg-white p-4 rounded-2xl shadow-md">暂无发布，去“{t('sellQuota')}”试试发布一条吧～</div>
            )}
          </div>
        )}

        {homeTab==="sell" && (
          <div className="space-y-3">
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-600"/><h2 className="text-lg font-semibold">{t("publishTitle")}</h2>
              </div>
              <div className="grid md:grid-cols-3 grid-cols-2 gap-3">
                <input value={form.code} onChange={e=>setForm({...form, code:e.target.value})} type="text" placeholder={t("flightNo")} className="p-3 border rounded-xl"/>
                <input value={form.date} onChange={e=>setForm({...form, date:e.target.value})} type="date" className="p-3 border rounded-xl" title={t("when")}/>
                <button onClick={doVerify} disabled={loadingVerify} className={`p-3 rounded-xl border ${loadingVerify? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}>{t('verify')}{loadingVerify?'…':''}</button>
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

            <Card>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{t('hotRoutes')}</h3>
                <span className="text-xs text-gray-400">{mockOn ? 'Mock' : 'Live'}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {HOT_ROUTES.map((r, idx)=> (
                  <button key={idx} onClick={()=>setForm(f=>({...f, fromCity:r.from, toCity:r.to}))} className="p-3 border rounded-xl hover:bg-gray-50 text-sm">
                    {r.from} → {r.to}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow text-white ${toast.type==="ok"?"bg-green-600":"bg-yellow-600"}`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
