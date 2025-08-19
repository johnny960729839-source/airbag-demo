// api/pay/stripe-create-intent.js
import Stripe from 'stripe';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok:false, msg: 'Method Not Allowed' });
    const { amount, currency = 'usd', orderId, description = 'AirBag allowance escrow' } = req.body || {};
    if (!amount || !orderId) return res.status(400).json({ ok:false, msg: 'missing amount or orderId' });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    // 使用 manual capture：先授权（hold），稍后捕获或取消
    const paymentIntent = await stripe.paymentIntents.create({
      amount,                 // 以最小货币单位计价，如 $10.00 -> 1000
      currency,               // 'usd' / 'eur' / 'thb'...
      capture_method: 'manual',
      description,
      metadata: { orderId },
      automatic_payment_methods: { enabled: true }, // 开启多支付方式（测试环境卡最方便）
    });

    return res.status(200).json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (e) {
    console.error('[stripe-create-intent]', e);
    return res.status(500).json({ ok:false, msg:'server error', error: String(e) });
  }
}
