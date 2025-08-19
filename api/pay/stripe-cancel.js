// api/pay/stripe-cancel.js
import Stripe from 'stripe';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok:false, msg: 'Method Not Allowed' });
    const { paymentIntentId } = req.body || {};
    if (!paymentIntentId) return res.status(400).json({ ok:false, msg:'missing paymentIntentId' });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
    const pi = await stripe.paymentIntents.cancel(paymentIntentId);
    return res.status(200).json({ ok:true, paymentIntent: pi });
  } catch (e) {
    console.error('[stripe-cancel]', e);
    return res.status(500).json({ ok:false, msg:'server error', error: String(e) });
  }
}
