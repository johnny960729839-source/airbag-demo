// src/components/CheckoutButton.jsx
import * as React from 'react';
import { loadStripe } from '@stripe/stripe-js';

export default function CheckoutButton({ orderId, amountUSD = 500, label = '支付授权（不扣款）' }) {
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');

  async function onPay() {
    setLoading(true); setMsg('');
    try {
      // 1) 后端创建 PaymentIntent（manual capture）
      const r = await fetch('/api/pay/stripe-create-intent', {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        body: JSON.stringify({
          orderId,
          amount: amountUSD, // 单位：美分（100 = $1.00）
          currency: 'usd',
          description: `AirBag Escrow for order ${orderId}`
        })
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.msg || 'create_intent_failed');

      // 2) 客户端确认支付
      const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || window.STRIPE_PUBLISHABLE_KEY);
      if (!stripe) throw new Error('Stripe not loaded');

      const { error } = await stripe.confirmPayment({
        clientSecret: j.clientSecret,
        // 弹出内置付款 UI，测试卡：4242 4242 4242 4242 / 任意未来日期 / 任意3位CVV / 任意邮编
        confirmParams: {
          return_url: window.location.href, // 不跳转也行，Stripe 会在当前页内置弹窗
        }
      });

      if (error) {
        setMsg(error.message || '支付授权失败');
      } else {
        setMsg('已完成授权，等待交接后由平台扣款或取消');
      }
    } catch (e) {
      setMsg(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        disabled={loading}
        onClick={onPay}
        className={`px-4 py-2 rounded-2xl ${loading? 'bg-gray-300':'bg-blue-600 hover:bg-blue-700'} text-white`}>
        {loading ? '处理中…' : label}
      </button>
      {msg && <div className="text-xs text-gray-600 mt-2">{msg}</div>}
    </div>
  );
}
