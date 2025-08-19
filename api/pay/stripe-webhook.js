import Stripe from 'stripe';
export const config = { api: { bodyParser: false } };
function buffer(readable){ return new Promise((resolve,reject)=>{ const chunks=[]; readable.on('data',(c)=>chunks.push(Buffer.from(c))); readable.on('end',()=>resolve(Buffer.concat(chunks))); readable.on('error',reject); }); }
export default async function handler(req, res){
  if (req.method!=='POST') return res.status(405).send('Method Not Allowed');
  const sig = req.headers['stripe-signature']; const buf = await buffer(req);
  try{
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion:'2024-06-20' });
    const event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    // 根据 event.type 更新订单状态（可暂时留空）
    return res.json({ received:true });
  }catch(err){ console.error('[stripe-webhook]', err); return res.status(400).send(`Webhook Error: ${err.message}`); }
}
