"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: 'LITE' | 'PRO' | 'ENTERPRISE') => {
    if (plan === 'ENTERPRISE') {
      // Enterprise requires contact
      window.location.href = 'mailto:sales@tryvirlo.com?subject=Enterprise Plan Inquiry';
      return;
    }

    setSubscribingPlan(plan);

    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          billingCycle
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to checkout
      window.location.href = data.checkoutUrl;
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.message || 'Failed to start subscription process');
      setSubscribingPlan(null);
    }
  };

  return (
    <>
      {/* Page Header */}
      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-4">
          Simple, Credit-Based Pricing
        </h1>
        <p className="text-xl text-[#9CA3AF]">
          One subscription gives you credits to use across all AI models
        </p>
      </section>

      {/* Billing Toggle */}
      <section className="flex flex-col items-center justify-center gap-4 mb-12">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-[#10B981] text-white">
          Save 30%
        </div>
        <div className="inline-flex bg-white/5 border border-white/10 rounded-full p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white/10 text-white'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            Yearly
          </button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lite Plan */}
          <PricingCard
            plan="Lite"
            description="For beginners"
            monthlyPrice={9}
            yearlyPrice={79}
            credits={500}
            features={[
              "5 AI models",
              "720p quality",
              "Standard speed",
              "Email support"
            ]}
            billingCycle={billingCycle}
            highlighted={false}
            onSubscribe={handleSubscribe}
            isLoading={subscribingPlan === 'LITE'}
          />

          {/* Pro Plan */}
          <PricingCard
            plan="Pro"
            badge="Most Popular"
            description="Best value for creators"
            monthlyPrice={29}
            yearlyPrice={249}
            credits={2000}
            features={[
              "All 10+ AI models",
              "4K quality",
              "Fast, no queue",
              "Priority support",
              "API access",
              "Commercial use"
            ]}
            billingCycle={billingCycle}
            highlighted={true}
            onSubscribe={handleSubscribe}
            isLoading={subscribingPlan === 'PRO'}
          />

          {/* Enterprise Plan */}
          <PricingCard
            plan="Enterprise"
            description="For teams and businesses"
            monthlyPrice={99}
            yearlyPrice={899}
            credits={-1}
            features={[
              "Everything in Pro",
              "Dedicated support",
              "Custom integrations",
              "SLA guarantee",
              "Team features"
            ]}
            billingCycle={billingCycle}
            highlighted={false}
            onSubscribe={handleSubscribe}
            isLoading={subscribingPlan === 'ENTERPRISE'}
          />
        </div>
      </section>

      {/* Credits Reference */}
      <section className="px-6 pb-20 max-w-2xl mx-auto">
        <div className="glass rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-white text-center mb-8">
            How Credits Work
          </h2>
          <div className="space-y-4">
            <CreditRow
              name="Text to Video (10s)"
              credits="~50 credits"
            />
            <CreditRow
              name="Image to Video (5s)"
              credits="~30 credits"
            />
            <CreditRow
              name="Text to Image"
              credits="~5 credits"
            />
            <CreditRow
              name="Video Upscale (4K)"
              credits="~100 credits"
            />
          </div>
        </div>
      </section>
    </>
  );
}

interface PricingCardProps {
  plan: string;
  badge?: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  credits: number;
  features: string[];
  billingCycle: 'monthly' | 'yearly';
  highlighted: boolean;
  onSubscribe: (plan: 'LITE' | 'PRO' | 'ENTERPRISE') => void;
  isLoading: boolean;
}

function PricingCard({
  plan,
  badge,
  description,
  monthlyPrice,
  yearlyPrice,
  credits,
  features,
  billingCycle,
  highlighted,
  onSubscribe,
  isLoading,
}: PricingCardProps) {
  const price = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;
  const monthlyEquivalent = billingCycle === 'yearly'
    ? (yearlyPrice / 12).toFixed(2)
    : null;

  return (
    <div
      className={`relative rounded-2xl p-8 transition-all ${
        highlighted
          ? 'bg-[rgba(255,64,129,0.1)] border-2 border-[rgba(255,64,129,0.5)] shadow-glow'
          : 'bg-[rgba(255,255,255,0.05)] border border-white/10'
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center px-4 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white">
          {badge}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-semibold text-white mb-2">{plan}</h3>
        <p className="text-sm text-[#9CA3AF] mb-4">{description}</p>

        <div className="mb-4">
          <div className="text-4xl font-bold text-white">
            ${price}
            <span className="text-lg font-normal text-[#9CA3AF]">
              /{billingCycle === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
          {monthlyEquivalent && (
            <p className="text-xs text-[#9CA3AF]">≈ ${monthlyEquivalent}/month</p>
          )}
        </div>

        <p className="text-lg font-semibold text-[#FF4081]">
          {credits === -1 ? 'Unlimited' : `${credits.toLocaleString()}`} credits
          <span className="text-sm font-normal text-[#9CA3AF]"> / month</span>
        </p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm text-[#E5E5E5]">
            <span className="mr-2 text-[#10B981]">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSubscribe(plan.toUpperCase() as 'LITE' | 'PRO' | 'ENTERPRISE')}
        disabled={isLoading}
        className={`w-full py-3 rounded-full font-semibold transition-all ${
          highlighted
            ? 'bg-gradient-to-r from-[#FF4081] to-[#E91E63] text-white hover:translate-y-[-2px] hover:shadow-glow'
            : 'bg-transparent border border-white/20 text-white hover:bg-white/5'
        } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
      >
        {isLoading ? 'Processing...' : plan === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
      </button>
    </div>
  );
}

function CreditRow({ name, credits }: { name: string; credits: string }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
      <span className="text-[#E5E5E5]">{name}</span>
      <span className="font-mono text-[#FF4081] font-semibold">{credits}</span>
    </div>
  );
}
