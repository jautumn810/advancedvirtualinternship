"use client";

import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import Image from "next/image";
import styles from "./page.module.css";
import typographyStyles from "@/styles/components/typography.module.css";
import buttonStyles from "@/styles/components/button.module.css";
import { RootState } from "@/store";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import { setSubscription } from "@/store/slices/subscriptionSlice";
import { saveSubscription } from "@/lib/subscription";
import { Subscription } from "@/types";
import { FiBookOpen, FiUsers, FiTarget } from "react-icons/fi";

const faqs = [
  {
    q: "How does the free 7-day trial work?",
    a: "Begin your complimentary 7-day trial with a Summarist annual membership. You are under no obligation to continue your subscription, and you will only be billed when the trial period expires.",
  },
  {
    q: "Can I switch subscriptions from monthly to yearly, or yearly to monthly?",
    a: "Yes! You can switch plans at any time in your account settings. Your billing will adjust automatically based on the new cadence.",
  },
  {
    q: "What's included in the Premium plan?",
    a: "Premium unlocks unlimited access to our audio library, exclusive briefcasts, and personalized book recommendations tailored to your goals.",
  },
  {
    q: "Can I cancel during my trial or subscription?",
    a: "Absolutely. You can cancel at any point. If you cancel during the trial, you won't be charged.",
  },
];

type BillingCadence = "monthly" | "yearly";
type PlanTier = "premium" | "premiumPlus";

const PLAN_PRICING = {
  monthly: { premium: 9.99, premiumPlus: 14.99 },
  yearly: { premium: 89.99, premiumPlus: 129.99 },
} as const;

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
  if (!publishableKey) {
    return null;
  }
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

interface CheckoutFormProps {
  clientSecret: string | null;
  planName: string;
  amount: number;
  billing: BillingCadence;
  plan: PlanTier | null;
  onClose: () => void;
  onComplete: (subscription: Subscription) => Promise<void>;
  isProcessing: boolean;
  setProcessing: (value: boolean) => void;
  errorMessage: string | null;
  setErrorMessage: (value: string | null) => void;
  success: boolean;
  setSuccess: (value: boolean) => void;
  userEmail?: string | null;
}

function CheckoutForm({
  clientSecret,
  planName,
  amount,
  billing,
  plan,
  onClose,
  onComplete,
  setProcessing,
  isProcessing,
  errorMessage,
  setErrorMessage,
  success,
  setSuccess,
  userEmail,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!stripe || !elements || !clientSecret || !plan) {
        return;
      }
      const card = elements.getElement(CardElement);
      if (!card) {
        setErrorMessage("Card details are missing.");
        return;
      }
      setProcessing(true);
      setErrorMessage(null);
      try {
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card,
            billing_details: {
              email: userEmail ?? undefined,
            },
          },
        });
        if (result.error) {
          setErrorMessage(result.error.message ?? "Payment failed. Please try again.");
          setProcessing(false);
          return;
        }
        const intentId = result.paymentIntent?.id ?? "";
        const startDate = new Date();
        const endDate = new Date(startDate);
        if (billing === "monthly") {
          endDate.setMonth(endDate.getMonth() + 1);
        } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }
        const subscription: Subscription = {
          id: plan,
          type: plan === "premium" ? "premium" : "premium-plus",
          status: "active",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          billingInterval: billing,
          paymentIntentId: intentId,
        };
        await onComplete(subscription);
        setSuccess(true);
      } catch (error: any) {
        console.error("Payment error", error);
        setErrorMessage(error?.message ?? "Payment failed. Please try again.");
      } finally {
        setProcessing(false);
      }
    },
    [
      stripe,
      elements,
      clientSecret,
      plan,
      billing,
      onComplete,
      setProcessing,
      setErrorMessage,
      setSuccess,
      userEmail,
    ]
  );

  return (
    <form className={styles.checkoutForm} onSubmit={handleSubmit}>
      <h3 className={typographyStyles.h3}>Complete purchase</h3>
      <p className={styles.checkoutSummary}>
        {planName} · {billing === "monthly" ? "Billed monthly" : "Billed yearly"} · ${amount / 100}
      </p>
      <div className={styles.cardElement}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "var(--color-text)",
                "::placeholder": {
                  color: "rgba(203, 213, 247, 0.5)",
                },
              },
              invalid: {
                color: "#f87171",
              },
            },
          }}
        />
      </div>
      {errorMessage && <p className={styles.checkoutError}>{errorMessage}</p>}
      {success && (
        <p className={styles.checkoutSuccess}>
          Payment succeeded! You now have access to all premium content.
        </p>
      )}
      <div className={styles.modalActions}>
        <button
          type="button"
          className={`${buttonStyles.btn} ${buttonStyles.btnGhost} ${buttonStyles.md}`}
          onClick={onClose}
          disabled={isProcessing}
        >
          {success ? "Close" : "Cancel"}
        </button>
        {!success && (
          <button
            type="submit"
            className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.md}`}
            disabled={isProcessing || !stripe || !elements}
          >
            {isProcessing ? "Processing..." : "Pay now"}
          </button>
        )}
      </div>
    </form>
  );
}

export default function ChoosePlanPage() {
  const [billing, setBilling] = useState<BillingCadence>("monthly");
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanTier | null>(null);
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { subscription } = useSelector((state: RootState) => state.subscription);

  const stripePromiseValue = useMemo(() => getStripe(), []);

  // Get subscription status
  const subscriptionStatus = useMemo(() => {
    if (!subscription || subscription.status !== "active") {
      return null;
    }
    if (subscription.type === "premium-plus") {
      return "Premium Plus";
    }
    if (subscription.type === "premium") {
      return "Premium";
    }
    return null;
  }, [subscription]);

  const closeCheckout = useCallback(() => {
    setIsCheckoutOpen(false);
    setCheckoutClientSecret(null);
    setCheckoutPlan(null);
    setCheckoutAmount(0);
    setCheckoutError(null);
    setCheckoutSuccess(false);
  }, []);

  const handleCheckout = useCallback(
    async (plan: PlanTier) => {
      if (!user) {
        dispatch(setAuthModalOpen(true));
        return;
      }
      if (!publishableKey) {
        setCheckoutError("Stripe is not configured. Please contact support.");
        setIsCheckoutOpen(true);
        return;
      }
      try {
        const planKey = plan === "premium" ? "premium" : "premiumPlus";
        const amountCents =
          billing === "monthly"
            ? Math.round(PLAN_PRICING.monthly[planKey] * 100)
            : Math.round(PLAN_PRICING.yearly[planKey] * 100);

        const response = await fetch("/api/stripe/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amountCents }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error?.error ?? "Unable to start checkout.");
        }
        const { clientSecret } = await response.json();
        setCheckoutClientSecret(clientSecret);
        setCheckoutPlan(plan);
        setCheckoutAmount(amountCents);
        setIsCheckoutOpen(true);
        setCheckoutError(null);
      } catch (error: any) {
        console.error("Checkout error:", error);
        setCheckoutError(error?.message ?? "Unable to initiate checkout. Please try again.");
        setIsCheckoutOpen(true);
      }
    },
    [billing, dispatch, user]
  );

  const handleSubscriptionComplete = useCallback(
    async (subscription: Subscription) => {
      if (!user) return;
      const record: Subscription = {
        ...subscription,
        id: user.uid,
      };
      await saveSubscription(user.uid, record);
      dispatch(setSubscription(record));
    },
    [dispatch, user]
  );

  const getPrice = (plan: "premium" | "premiumPlus") => {
    return PLAN_PRICING[billing][plan];
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <Image src="/pricing-top.png" alt="Pricing" width={200} height={200} className={styles.heroImage} priority />
          <h1 className={styles.heroTitle}>Get unlimited access to many amazing books to read</h1>
          <p className={styles.heroSubtitle}>Turn ordinary moments into amazing learning opportunities.</p>
        </div>
      </section>

      <div className={styles.content}>
        {user && (
          <section className={styles.accountInfo}>
            {user.email && (
              <div className={styles.accountItem}>
                <span className={styles.accountLabel}>Email:</span>
                <span className={styles.accountValue}>{user.email}</span>
              </div>
            )}
            {subscriptionStatus && (
              <div className={styles.accountItem}>
                <span className={styles.accountLabel}>Current Plan:</span>
                <span className={styles.accountValue}>{subscriptionStatus}</span>
              </div>
            )}
          </section>
        )}

        <section className={styles.highlights}>
          {[
            {
              icon: <FiBookOpen />,
              title: "Key ideas in few min",
              description: "with many books to read",
            },
            {
              icon: <FiUsers />,
              title: "3 million people growing",
              description: "with Summarist everyday",
            },
            {
              icon: <FiTarget />,
              title: "Precise recommendations",
              description: "collections curated by experts",
            },
          ].map((item) => (
            <div key={item.title} className={styles.highlightCard}>
              <span className={styles.highlightIcon}>{item.icon}</span>
              <h3 className={styles.highlightTitle}>{item.title}</h3>
              <p className={styles.highlightDescription}>{item.description}</p>
            </div>
          ))}
        </section>

        <section className={styles.planSection}>
          <h2 className={styles.planSectionTitle}>Choose the plan that fits you</h2>
          <div className={styles.billingToggle} role="group" aria-label="Billing cadence">
            <button
              className={`${styles.billingOption} ${billing === "monthly" ? styles.billingOptionActive : ""}`}
              onClick={() => setBilling("monthly")}
              type="button"
            >
              Monthly
            </button>
            <button
              className={`${styles.billingOption} ${billing === "yearly" ? styles.billingOptionActive : ""}`}
              onClick={() => setBilling("yearly")}
              type="button"
            >
              Yearly
            </button>
          </div>
          {billing === "yearly" && <p className={styles.toggleNote}>7-day free trial included with yearly billing</p>}

          <div className={styles.plans}>
            {[
              {
                id: "premium",
                name: "Premium",
                description: "Access premium book summaries and audio",
                perks: ["Unlimited summaries", "Audio versions", "Offline access"],
                accent: false,
              },
              {
                id: "premium-plus",
                name: "Premium Plus",
                description: "All Premium features plus priority support",
                perks: ["Everything in Premium", "Priority support", "Early access to new features"],
                accent: true,
              },
            ].map((plan) => {
              const planKey: PlanTier = plan.accent ? "premiumPlus" : "premium";
              return (
                <div
                  key={plan.id}
                  className={`${styles.planCard} ${plan.accent ? styles.planCardAccent : ""}`}
                >
                  {plan.accent && <span className={styles.planBadge}>Best value</span>}
                  <div className={styles.planHeader}>
                    <h3 className={styles.planTitle}>{plan.name}</h3>
                    <p className={styles.planDescription}>{plan.description}</p>
                  </div>
                  <div className={styles.planPrice}>
                    <span className={styles.planPriceValue}>${getPrice(planKey)}</span>
                    <span className={styles.planPriceUnit}>/{billing === "monthly" ? "mo" : "yr"}</span>
                  </div>
                  {billing === "yearly" && (
                    <p className={styles.planTrial}>
                      7-day free trial, then ${PLAN_PRICING.yearly[planKey]} per year
                    </p>
                  )}
                  <ul className={styles.planPerks}>
                    {plan.perks.map((perk) => (
                      <li key={perk}>{perk}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => handleCheckout(plan.id === "premium" ? "premium" : "premiumPlus")}
                    className={styles.planAction}
                  >
                    {plan.accent ? "Get Premium Plus" : "Get Premium"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.faqSection}>
          <h3 className={styles.faqTitle}>FAQ</h3>
          <div className={styles.faqList}>
            {faqs.map((item, idx) => (
              <details key={idx} className={styles.faqItem}>
                <summary className={styles.faqQuestion}>{item.q}</summary>
                <p className={styles.faqAnswer}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.ctaPanel}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={() => handleCheckout("premiumPlus")}
          >
            Start your free 7-day trial
          </button>
          <p className={styles.ctaCaption}>
            Cancel your trial at any time before it ends, and you won&apos;t be charged.
          </p>
        </section>
      </div>

      {isCheckoutOpen && checkoutPlan && (
        <div className={styles.checkoutOverlay}>
          <div className={styles.checkoutModal}>
            {!stripePromiseValue && !checkoutClientSecret ? (
              <p className={styles.checkoutError}>
                Stripe is not configured yet. Please add your publishable key.
              </p>
            ) : checkoutClientSecret && stripePromiseValue ? (
              <Elements stripe={stripePromiseValue} options={{ clientSecret: checkoutClientSecret }}>
                <CheckoutForm
                  clientSecret={checkoutClientSecret}
                  planName={checkoutPlan === "premium" ? "Premium" : "Premium Plus"}
                  amount={checkoutAmount}
                  billing={billing}
                  plan={checkoutPlan}
                  onClose={closeCheckout}
                  onComplete={handleSubscriptionComplete}
                  isProcessing={isProcessing}
                  setProcessing={setIsProcessing}
                  errorMessage={checkoutError}
                  setErrorMessage={setCheckoutError}
                  success={checkoutSuccess}
                  setSuccess={setCheckoutSuccess}
                  userEmail={user?.email}
                />
              </Elements>
            ) : (
              <div className={styles.checkoutForm}>
                <p className={styles.checkoutError}>
                  Unable to initialise Stripe. Please refresh or try again later.
                </p>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.md}`}
                    onClick={closeCheckout}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
