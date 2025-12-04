"use client";

import Sidebar from "@/components/layout/Sidebar";
import SearchBar from "@/components/layout/SearchBar";
import { FiHelpCircle, FiMail, FiMessageCircle, FiBook } from "react-icons/fi";
import styles from "./page.module.css";
import typographyStyles from "@/styles/components/typography.module.css";

export default function HelpSupportPage() {
  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <SearchBar />
        </div>
        <header className={styles.header}>
          <h1 className={typographyStyles.h2}>Help & Support</h1>
          <p className={styles.description}>
            Get help with your account, subscription, or using Summarist.
          </p>
        </header>
        <section className={styles.section}>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <FiBook className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Getting Started</h2>
              <p className={styles.cardText}>
                Learn how to browse books, listen to summaries, and build your library.
              </p>
            </div>
            <div className={styles.card}>
              <FiMessageCircle className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>FAQs</h2>
              <p className={styles.cardText}>
                Find answers to common questions about subscriptions, features, and more.
              </p>
            </div>
            <div className={styles.card}>
              <FiMail className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>Contact Us</h2>
              <p className={styles.cardText}>
                Need more help? Reach out to our support team and we&apos;ll get back to you.
              </p>
            </div>
          </div>
        </section>
        <section className={styles.section}>
          <div className={styles.helpContent}>
            <FiHelpCircle className={styles.helpIcon} />
            <h2 className={styles.helpTitle}>How can we help you?</h2>
            <p className={styles.helpText}>
              Our support team is here to assist you with any questions or issues you may have.
              Please check our FAQs first, or contact us directly if you need additional assistance.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

