// api/pay/stripe-webhook.js
import Stripe from 'stripe';

// Vercel 默认解析 body，会破坏原始签名，这里禁用它：
export const config = { api: { bodyParser: false } };

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
    const event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'payment_intent.amount_capturable_updated':
        // 授权成功，等待捕获
        // 你可以在此把订单状态改为 “已授权，等待交接”
        break;
      case 'payment_intent.succeeded':
        // 捕获成功 → 放款成功
        // 你可以在此把订单状态改为 “交易完成”
        break;
      case 'payment_intent.canceled':
        // 授权被取消
        // 更新订单为已取消/退款
        break;
      case 'payment_intent.payment_failed':
        // 支付失败
        break;
      default:
        // 其他事件按需处理
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook]', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
