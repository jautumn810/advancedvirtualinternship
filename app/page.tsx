"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import {
  FiArrowRight,
  FiBookOpen,
  FiCompass,
  FiMic,
  FiStar,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import styles from "./page.module.css";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const featureCards = [
  {
    icon: FiBookOpen,
    title: "Read or listen",
    description: "Save time by getting the core ideas from the best books.",
  },
  {
    icon: FiCompass,
    title: "Find your next read",
    description: "Explore book lists and personalized recommendations.",
  },
  {
    icon: FiMic,
    title: "Briefcasts",
    description: "Gain valuable insights from briefcasts.",
  },
];

const growthHeadings = [
  {
    text: "Enhance your knowledge",
  },
  {
    text: "Achieve greater success",
    highlight: true,
  },
  {
    text: "Improve your health",
  },
  {
    text: "Develop better parenting skills",
  },
  {
    text: "Increase happiness",
  },
  {
    text: "Be the best version of yourself!",
  },
];

const growthSecondaryHeadings = [
  {
    text: "Expand your learning",
  },
  {
    text: "Accomplish your goals",
  },
  {
    text: "Strengthen your vitality",
  },
  {
    text: "Become a better caregiver",
  },
  {
    text: "Improve your mood",
  },
  {
    text: "Maximize your abilities",
    highlight: true,
  },
];

const statisticsData = [
  {
    value: "93%",
    description: "of Summarist members significantly increase reading frequency.",
  },
  {
    value: "96%",
    description: "of Summarist members establish better habits.",
  },
  {
    value: "90%",
    description: "have made significant positive change to their lives.",
  },
  {
    value: "91%",
    description: "report feeling more productive after incorporating the service.",
  },
  {
    value: "94%",
    description: "have noticed an improvement in comprehension and retention.",
  },
  {
    value: "88%",
    description: "feel more informed about current events and industry trends.",
  },
];

const testimonialList = [
  {
    name: "Hanna M.",
    quote:
      "This app has been a game-changer for me! It's saved me so much time and effort in reading and comprehending books. Highly recommend it to all book lovers.",
  },
  {
    name: "David B.",
    quote:
      "I love this app! It provides concise and accurate summaries of books in a way that is easy to understand. It's also very user-friendly and intuitive.",
  },
  {
    name: "Nathan S.",
    quote:
      "This app is a great way to get the main takeaways from a book without having to read the entire thing. The summaries are well-written and informative.",
  },
  {
    name: "Ryan R.",
    quote:
      "If you're a busy person who loves reading but doesn't have the time to read every book in full, this app is for you! The summaries are thorough and provide a great overview of the book's content.",
  },
];

const growthNumbers = [
  {
    icon: FiUsers,
    value: "3 Million",
    description: "Downloads on all platforms",
  },
  {
    icon: FiStar,
    value: "4.5 Stars",
    description: "Average ratings on iOS and Google Play",
  },
  {
    icon: FiTrendingUp,
    value: "97%",
    description: "Of Summarist members create a better reading habit",
  },
];

const footerColumns = [
  {
    title: "Actions",
    links: ["Summarist Magazine", "Cancel Subscription", "Help", "Contact us"],
  },
  {
    title: "Useful Links",
    links: ["Pricing", "Summarist Business", "Gift Cards", "Authors & Publishers"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Partners", "Code of Conduct"],
  },
  {
    title: "Other",
    links: ["Sitemap", "Legal Notice", "Terms of Service", "Privacy Policies"],
  },
];

const heroIllustration = "/landing.png";

export default function Home() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const currentYear = new Date().getFullYear();
  
  // Combine all headings for animation
  const allHeadings = [...growthHeadings, ...growthSecondaryHeadings];
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightedIndex((prev) => (prev + 1) % allHeadings.length);
    }, 2000); // Change highlight every 2 seconds

    return () => clearInterval(interval);
  }, [allHeadings.length]);

  return (
    <main className={styles.main}>
      <section className={cn(styles.section, styles.heroSection)}>
        <div className={styles.row}>
          <div className={styles.heroWrapper}>
            <div className={styles.heroContent}>
              <Image src="/logo.png" alt="Summarist" width={170} height={40} className={styles.heroLogo} priority />
              <h1 className={styles.heroTitle}>Gain more knowledge in less time</h1>
              <p className={styles.heroSubtitle}>
                Great summaries for busy people, individuals who barely have time to read, and even people who don’t like
                to read.
              </p>
              <div className={styles.heroActions}>
                {!user ? (
                  <button className={styles.heroButton} type="button" onClick={() => dispatch(setAuthModalOpen(true))}>
                    Login
                    <FiArrowRight />
                  </button>
                ) : (
                  <Link href="/for-you" className={styles.heroButton}>
                    Continue
                    <FiArrowRight />
                  </Link>
                )}
              </div>
            </div>
            <div className={styles.heroVisual} aria-hidden="true">
              <Image
                src={heroIllustration}
                alt=""
                width={400}
                height={360}
                priority
                className={styles.heroImage}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.row}>
          <h2 className={styles.sectionTitle}>Understand books in few minutes</h2>
          <div className={styles.featuresGrid}>
            {featureCards.map((feature) => (
              <article className={styles.featureCard} key={feature.title}>
                <div className={styles.featureIcon}>
                  <feature.icon />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.row}>
          <div className={styles.statisticsWrapper}>
            <div className={styles.statisticsHeadings}>
              {growthHeadings.map((heading, index) => {
                const isHighlighted = highlightedIndex === index;
                return (
                  <h3
                    key={heading.text}
                    className={cn(styles.statisticsHeading, isHighlighted && styles.statisticsHeadingHighlight)}
                  >
                    {heading.text}
                  </h3>
                );
              })}
            </div>
            <div className={cn(styles.statisticsHeadings, styles.statisticsHeadingsSecondary)}>
              {growthSecondaryHeadings.map((heading, index) => {
                const isHighlighted = highlightedIndex === growthHeadings.length + index;
                return (
                  <h3
                    key={heading.text}
                    className={cn(styles.statisticsHeading, isHighlighted && styles.statisticsHeadingHighlight)}
                  >
                    {heading.text}
                  </h3>
                );
              })}
            </div>
            <div className={styles.statisticsDetails}>
              {statisticsData.map((stat) => (
                <div className={styles.statisticsItem} key={`${stat.value}-${stat.description}`}>
                  <span className={styles.statisticsItemValue}>{stat.value}</span>
                  <p className={styles.statisticsItemText}>{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.row}>
          <h2 className={styles.sectionTitle}>What our members say</h2>
          <div className={styles.reviewsWrapper}>
            {testimonialList.map((testimonial) => (
              <article className={styles.reviewCard} key={testimonial.name}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewName}>{testimonial.name}</span>
                  <div className={styles.reviewStars}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <FiStar key={index} />
                    ))}
                  </div>
                </div>
                <p className={styles.reviewBody}>{testimonial.quote}</p>
              </article>
            ))}
          </div>
          <div className={styles.reviewsAction}>
            <button 
              className={styles.reviewsLoginButton} 
              type="button" 
              onClick={() => dispatch(setAuthModalOpen(true))}
            >
              Login
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.row}>
          <div className={styles.numbersWrapper}>
            {growthNumbers.map((number) => (
              <article className={styles.numberCard} key={number.value}>
                <div className={styles.numberIcon}>
                  <number.icon />
                </div>
                <h3 className={styles.numberTitle}>{number.value}</h3>
                <p className={styles.numberSubtitle}>{number.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.row}>
          <div className={styles.footerTop}>
            {footerColumns.map((column) => (
              <div className={styles.footerColumn} key={column.title}>
                <h4 className={styles.footerColumnTitle}>{column.title}</h4>
                <ul className={styles.footerLinks}>
                  {column.links.map((link) => (
                    <li key={link}>
                      <span className={styles.footerLink}>{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className={styles.footerBottom}>
            <p className={styles.footerCopyright}>Copyright © {currentYear} Summarist.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

