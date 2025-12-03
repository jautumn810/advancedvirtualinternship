"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import styles from "./Navbar.module.css";
import containerStyles from "@/styles/components/container.module.css";
import buttonStyles from "@/styles/components/button.module.css";

const navLinks = [
  { label: "Discover", href: "/" },
  { label: "For You", href: "/for-you" },
  { label: "Books", href: "/books" },
  { label: "Library", href: "/library" },
  { label: "Pricing", href: "/choose-plan" },
];

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isMenuOpen, setMenuOpen] = useState(false);

  const handleAuthClick = () => {
    setMenuOpen(false);
    dispatch(setAuthModalOpen(true));
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut(auth);
  };

  return (
    <nav className={styles.root}>
      <div className={`${containerStyles.container} ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          Summarist
        </Link>

        <div className={styles.navLinks}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.active : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className={styles.actions}>
          {!user ? (
            <>
              <button
                className={`${buttonStyles.btn} ${buttonStyles.btnGhost} ${buttonStyles.sm}`}
                onClick={handleAuthClick}
                type="button"
              >
                Log in
              </button>
              <Link
                href="/choose-plan"
                className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.sm}`}
              >
                Start free trial
              </Link>
            </>
          ) : (
            <>
              <Link href="/settings" className={`${buttonStyles.btn} ${buttonStyles.btnGhost} ${buttonStyles.sm}`}>
                Account
              </Link>
              <button
                className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.sm}`}
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          )}
        </div>

        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <span className={styles.menuToggleIcon} />
        </button>
      </div>

      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuLinks}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${pathname === link.href ? styles.active : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className={styles.mobileMenuActions}>
            {!user ? (
              <>
                <button
                  className={`${buttonStyles.btn} ${buttonStyles.btnGhost} ${buttonStyles.md}`}
                  onClick={handleAuthClick}
                  type="button"
                >
                  Log in
                </button>
                <Link
                  href="/choose-plan"
                  className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.md}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Start free trial
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/settings"
                  className={`${buttonStyles.btn} ${buttonStyles.btnGhost} ${buttonStyles.md}`}
                  onClick={() => setMenuOpen(false)}
                >
                  Account
                </Link>
                <button
                  className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.md}`}
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

