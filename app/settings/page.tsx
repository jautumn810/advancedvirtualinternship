"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/store";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import Sidebar from "@/components/layout/Sidebar";
import SearchBar from "@/components/layout/SearchBar";
import { FiMail, FiUser, FiCreditCard } from "react-icons/fi";
import Link from "next/link";
import styles from "./page.module.css";
import typographyStyles from "@/styles/components/typography.module.css";
import buttonStyles from "@/styles/components/button.module.css";

export default function SettingsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((s: RootState) => s.auth);
  const { subscription, isLoading: isSubscriptionLoading, error: subscriptionError } = useSelector(
    (s: RootState) => s.subscription
  );

  const handleUpgrade = () => {
    router.push("/choose-plan");
  };

  const handleLogin = () => {
    dispatch(setAuthModalOpen(true));
  };

  // Not logged in state
  if (!user) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.content}>
          <SearchBar />
          <div className={styles.loginCard}>
            <FiUser className={styles.loginIcon} />
            <h2 className={styles.loginTitle}>Please log in</h2>
            <p className={styles.loginBody}>
              Sign in to manage your account preferences and subscription status.
            </p>
            <button
              type="button"
              onClick={handleLogin}
              className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.md}`}
            >
              Log in
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Get subscription status
  const subscriptionStatus =
    subscription?.status === "active"
      ? subscription.type === "premium-plus"
        ? "Premium Plus"
        : subscription.type === "premium"
        ? "Premium"
        : "Basic"
      : "Basic";

  const isSubscribed = subscription?.status === "active" && subscription.type !== "basic";

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <SearchBar />
        <header className={styles.header}>
          <h1 className={`${typographyStyles.h2} ${styles.title}`}>Settings</h1>
          <p className={styles.ctaNote}>
            Manage your account details and subscription preferences.
          </p>
        </header>

        <section className={styles.cards}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>
                <FiMail />
              </span>
              <div>
                <h2 className={styles.cardTitle}>Email address</h2>
                <p className={styles.cardBody}>{user.email}</p>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>
                <FiCreditCard />
              </span>
              <div>
                <div className={styles.ctaRow}>
                  <h2 className={styles.cardTitle}>Subscription</h2>
                  {isSubscribed && <span className={styles.badge}>Active</span>}
                </div>
                {isSubscriptionLoading ? (
                  <p className={styles.cardBody}>Loading subscription...</p>
                ) : (
                  <p className={styles.cardBody}>
                    Current plan: {subscriptionStatus}
                  </p>
                )}
                {subscriptionError && (
                  <p className={styles.errorMessage}>{subscriptionError}</p>
                )}
              </div>
            </div>

            {!isSubscribed ? (
              <div className={styles.cta}>
                <button
                  type="button"
                  onClick={handleUpgrade}
                  className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.md}`}
                >
                  Upgrade plan
                </button>
                <p className={styles.ctaNote}>
                  Upgrade to Premium or Premium Plus to unlock the full Summarist library and features.
                </p>
              </div>
            ) : (
              <div className={styles.cta}>
                <p className={styles.ctaNote}>
                  ✅ You have an active {subscriptionStatus} subscription. Enjoy unlimited listening and summaries.
                </p>
              </div>
            )}
          </article>

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Account information</h2>
            <p className={styles.cardBody}>
              Your account is secured with email authentication. To manage your subscription or update payment methods,
              visit the{" "}
              <Link href="/choose-plan" className={buttonStyles.btnLink}>
                Choose Plan
              </Link>{" "}
              page.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}

