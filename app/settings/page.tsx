"use client";

import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/store";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import Sidebar from "@/components/layout/Sidebar";
import SearchBar from "@/components/layout/SearchBar";
import { SkeletonText } from "@/components/ui/Skeleton";
import { FiCreditCard } from "react-icons/fi";
import styles from "./page.module.css";
import typographyStyles from "@/styles/components/typography.module.css";

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
          <div className={styles.toolbar}>
            <SearchBar />
          </div>
          <h1 className={styles.title}>Settings</h1>
          <div className={styles.loginCard}>
            <div className={styles.illustration}>
              <Image
                src="/login.png"
                alt="Log in illustration"
                fill
                sizes="(max-width: 600px) 80vw, 440px"
                className={styles.illustrationImage}
              />
            </div>
            <p className={styles.loginText}>Log in to your account to see your details.</p>
            <button
              type="button"
              onClick={handleLogin}
              className={styles.loginButton}
            >
              Login
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
        <div className={styles.toolbar}>
          <SearchBar />
        </div>
        <h1 className={styles.title}>Settings</h1>

        <section className={styles.subscriptionCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>
              <FiCreditCard />
            </span>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>Subscription</h2>
              {isSubscriptionLoading ? (
                <div className={styles.skeletonWrapper}>
                  <SkeletonText lines={1} />
                </div>
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

          {!isSubscribed && (
            <div className={styles.upgradeSection}>
              <button
                type="button"
                onClick={handleUpgrade}
                className={styles.upgradeButton}
              >
                Upgrade plan
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

