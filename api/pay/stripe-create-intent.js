import Stripe from 'stripe';
export default async function handler(req, res){
  try{
    if (req.method!=='POST') return res.status(405).json({ok:false,msg:'Method Not Allowed'});
    const { amount, currency='usd', orderId, description='AirBag allowance escrow' } = req.body||{};
    if (!amount || !orderId) return res.status(400).json({ok:false,msg:'missing amount or orderId'});
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion:'2024-06-20' });
    const pi = await stripe.paymentIntents.create({
      amount, currency, capture_method:'manual', description,
      metadata:{ orderId }, automatic_payment_methods:{ enabled:true }
    });
    return res.status(200).json({ ok:true, clientSecret:pi.client_secret, paymentIntentId:pi.id });
  }catch(e){ console.error('[stripe-create-intent]', e); return res.status(500).json({ok:false,msg:'server error',error:String(e)}); }
}
