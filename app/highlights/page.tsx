"use client";

import Sidebar from "@/components/layout/Sidebar";
import SearchBar from "@/components/layout/SearchBar";
import { FiEdit3 } from "react-icons/fi";
import styles from "./page.module.css";
import typographyStyles from "@/styles/components/typography.module.css";

export default function HighlightsPage() {
  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <SearchBar />
        </div>
        <header className={styles.header}>
          <h1 className={typographyStyles.h2}>Highlights</h1>
          <p className={styles.description}>
            Your saved highlights and notes from books will appear here.
          </p>
        </header>
        <section className={styles.section}>
          <div className={styles.emptyState}>
            <FiEdit3 className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>No highlights yet</h2>
            <p className={styles.emptyText}>
              Start reading books and save your favorite quotes and insights here.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

