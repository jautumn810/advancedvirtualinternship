"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import { signOut } from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";
import {
  FiHome,
  FiBookmark,
  FiEdit3,
  FiSearch,
  FiSettings,
  FiHelpCircle,
  FiLogIn,
  FiLogOut
} from "react-icons/fi";
import styles from "./Sidebar.module.css";

const menuItems = [
  { icon: FiHome, label: "For you", path: "/for-you" },
  { icon: FiBookmark, label: "Library", path: "/library" },
  { icon: FiEdit3, label: "Highlights", path: "/highlights" },
  { icon: FiSearch, label: "Search", path: "/search" },
  { icon: FiSettings, label: "Settings", path: "/settings" },
  { icon: FiHelpCircle, label: "Help & Support", path: "/help-support" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);

  const handleAuth = async () => {
    if (user) {
      try {
        const authInstance = getAuthInstance();
        if (!authInstance) {
          console.error("Firebase Auth is not initialized");
          return;
        }
        await signOut(authInstance);
      } catch (error: any) {
        console.error("Logout failed:", error);
        // Error is handled by Firebase auth state listener
        // If logout fails, the user state will remain the same
      }
    } else {
      dispatch(setAuthModalOpen(true));
    }
  };

  // Don't show sidebar on home and choose-plan pages
  if (pathname === "/" || pathname === "/choose-plan") {
    return null;
  }

  return (
    <aside className={styles.root}>
      <Link href="/" className={styles.brand}>
        <Image
          src="/logo.png"
          alt="Summarist"
          width={24}
          height={24}
          className={styles.brandIcon}
        />
        <span>Summarist</span>
      </Link>
      <nav className={styles.menu}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          const linkClassName = [
            styles.link,
            isActive ? styles.linkActive : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <Link
              key={item.label}
              href={item.path}
              className={linkClassName}
            >
              <Icon className={styles.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button onClick={handleAuth} className={styles.authButton}>
          {user ? (
            <>
              <FiLogOut className={styles.icon} />
              <span>Logout</span>
            </>
          ) : (
            <>
              <FiLogIn className={styles.icon} />
              <span>Login</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

