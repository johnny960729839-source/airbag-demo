function delay(ms){ return new Promise(r=>setTimeout(r, ms)); }
function makeHit({ flight='MU5101', date='2025-08-20', dep='SHA', arr='PEK', status='scheduled' }){
  return { flight_date:date, status,
    dep:{ iata:dep, time:`${date}T08:00:00+00:00`, airport:'Shanghai Hongqiao' },
    arr:{ iata:arr, time:`${date}T10:10:00+00:00`, airport:'Beijing Capital' },
    airline:'Sample Air', iata:flight, icao:'SMP5101', number: (flight.match(/\d+/)||['5101'])[0]
  };
}
function makeSamples({ flight='MU5101', dep='SHA', arr='PEK' }){
  const dates = ['2025-08-16','2025-08-12','2025-08-11','2025-08-10'];
  return dates.map(d=>makeHit({ flight, date:d, dep, arr, status:d==='2025-08-16'?'landed':'scheduled' }));
}
export default async function handler(req, res){
  const flight=(req.query.flight||'').toString().toUpperCase();
  const date=(req.query.date||'').toString();
  const dep=(req.query.dep||'SHA').toString().toUpperCase();
  const arr=(req.query.arr||'PEK').toString().toUpperCase();
  const strict=req.query.strict==='1';
  await delay(350);
  if(!flight) return res.status(400).json({ok:false,msg:'missing flight'});
  if (flight.startsWith('OK')) return res.status(200).json({ok:true,count:1,data:[makeHit({flight,date:date||'2025-08-20',dep,arr})],raw:{mock:true}});
  if (flight.startsWith('NF')) return res.status(200).json({ok:false,msg:'not found on given date',count:0,raw:{mock:true}});
  if (date && Math.random()>0.5) return res.status(200).json({ok:true,count:1,data:[makeHit({flight,date,dep,arr})],raw:{mock:true}});
  if (strict && date) return res.status(200).json({ok:false,msg:'not found on given date',count:0,raw:{mock:true}});
  const samples=makeSamples({flight,dep,arr});
  return res.status(200).json({ok:false,msg:'not found on given date; showing recent samples',count:samples.length,samples,raw:{mock:true}});
}
