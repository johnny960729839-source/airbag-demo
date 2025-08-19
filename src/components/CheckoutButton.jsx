import * as React from 'react';
import { loadStripe } from '@stripe/stripe-js';

export default function CheckoutButton({ orderId, amountCents = 500, label = '支付授权（不扣款）' }) {
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  async function onPay() {
    setLoading(true); setMsg('');
    try {
      const r = await fetch('/api/pay/stripe-create-intent', {
        method: 'POST', headers: { 'content-type':'application/json' },
        body: JSON.stringify({ orderId, amount: amountCents, currency:'usd', description:`AirBag Escrow for ${orderId}` })
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.msg || 'create_intent_failed');
      const stripe = await loadStripe(window.STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      if (!stripe) throw new Error('Stripe not loaded');
      const { error } = await stripe.confirmPayment({ clientSecret: j.clientSecret, confirmParams: { return_url: window.location.href } });
      setMsg(error ? (error.message || '支付授权失败') : '已完成授权，等待交接后由平台放款或取消');
    } catch (e) { setMsg(String(e.message || e)); } finally { setLoading(false); }
  }
  return (
    <div>
      <button disabled={loading} onClick={onPay} className={`px-4 py-2 rounded-2xl ${loading? 'bg-gray-300':'bg-blue-600 hover:bg-blue-700'} text-white`}>
        {loading ? '处理中…' : label}
      </button>
      {msg && <div className="text-xs text-gray-600 mt-2">{msg}</div>}
    </div>
  );
}
