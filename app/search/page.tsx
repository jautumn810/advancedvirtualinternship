"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import SearchBar from "@/components/layout/SearchBar";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useAudioDurations } from "@/hooks/useAudioDuration";
import forYouStyles from "../for-you/page.module.css";

export default function SearchPage() {
  const router = useRouter();
  const { searchResults, isLoading } = useSelector((state: RootState) => state.books);
  const durations = useAudioDurations(searchResults);

  // Redirect to for-you page since search results are shown there
  useEffect(() => {
    if (searchResults.length > 0) {
      router.push("/for-you");
    }
  }, [searchResults, router]);

  return (
    <div className={forYouStyles.page}>
      <Sidebar />
      <main className={forYouStyles.content}>
        <div className={forYouStyles.toolbar}>
          <SearchBar />
        </div>
        <section className={forYouStyles.section}>
          <h2 className={forYouStyles.sectionHeading}>Search</h2>
          <p className={forYouStyles.sectionDescription}>
            Use the search bar above to find books by title, author, or topic.
          </p>
          {isLoading && (
            <p className={forYouStyles.emptyState}>Searching...</p>
          )}
          {!isLoading && searchResults.length === 0 && (
            <p className={forYouStyles.emptyState}>
              No search results yet. Start typing in the search bar to find books.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

