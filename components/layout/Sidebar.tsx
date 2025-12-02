"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  FiBookOpen,
  FiBook,
  FiStar,
  FiSearch,
  FiSettings,
  FiHelpCircle,
  FiLogIn,
  FiLogOut
} from "react-icons/fi";
import styles from "./Sidebar.module.css";

const menuItems = [
  { icon: FiBookOpen, label: "For You", path: "/for-you", disabled: false },
  { icon: FiBook, label: "Library", path: "/library", disabled: false },
  { icon: FiStar, label: "Highlights", path: "#", disabled: true },
  { icon: FiSearch, label: "Search", path: "#", disabled: true },
  { icon: FiSettings, label: "Settings", path: "/settings", disabled: false },
  { icon: FiHelpCircle, label: "Help & Support", path: "#", disabled: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);

  const handleAuth = () => {
    if (user) {
      signOut(auth);
    } else {
      dispatch(setAuthModalOpen(true));
    }
  };

  const handleNavigate = (event: React.MouseEvent<HTMLAnchorElement>, disabled: boolean) => {
    if (disabled) {
      event.preventDefault();
    }
  };

  // Don't show sidebar on home and choose-plan pages
  if (pathname === "/" || pathname === "/choose-plan") {
    return null;
  }

  return (
    <aside className={styles.root}>
      <Link href="/" className={styles.brand}>
        Summarist
      </Link>
      <nav className={styles.menu}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          const linkClassName = [
            styles.link,
            isActive ? styles.linkActive : "",
            item.disabled ? styles.linkDisabled : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <Link
              key={item.label}
              href={item.path}
              className={linkClassName}
              aria-disabled={item.disabled}
              tabIndex={item.disabled ? -1 : 0}
              onClick={item.disabled ? (event) => handleNavigate(event, item.disabled) : undefined}
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

