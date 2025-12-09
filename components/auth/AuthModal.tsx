"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setAuthModalOpen, setError, setLoading, setUser } from "@/store/slices/authSlice";
import { getAuthInstance, getGoogleProvider } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  signInAnonymously,
} from "firebase/auth";
import Image from "next/image";
import styles from "./AuthModal.module.css";

export default function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isAuthModalOpen, isLoading, user, error } = useSelector((s: RootState) => s.auth);
  const [tab, setTab] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      dispatch(setError(null));
    }
  }, [isAuthModalOpen, dispatch]);

  const close = () => {
    console.log("Closing modal");
    dispatch(setAuthModalOpen(false));
  };

  const getAuth = () => {
    let auth = getAuthInstance();
    if (!auth) {
      // Force retry multiple times
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          auth = getAuthInstance();
        }, i * 100);
      }
      auth = getAuthInstance();
    }
    return auth;
  };

  const onLogin = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log("Login clicked", { email, password });
    
    // Close modal immediately for dummy login (accept any input)
    close();
    
    const authInstance = getAuth();
    if (!authInstance) {
      console.error("No auth instance");
      // Modal already closed, just return
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));
    
    try {
      console.log("Attempting login...");
      await signInWithEmailAndPassword(authInstance, email, password);
      console.log("Login successful");
      // Redirect to /for-you if on home or choose-plan page, otherwise stay on current page
      if (pathname === "/" || pathname === "/choose-plan") {
        router.push("/for-you");
      }
    } catch (e: any) {
      console.error("Login error:", e);
      // Don't show error for dummy login - modal is already closed
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error("Login failed:", e?.message);
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onRegister = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log("Register clicked", { email, password });
    
    const authInstance = getAuth();
    if (!authInstance) {
      console.error("No auth instance");
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));
    
    try {
      console.log("Attempting registration...");
      await createUserWithEmailAndPassword(authInstance, email, password);
      console.log("Registration successful");
      close();
      // Redirect to /for-you if on home or choose-plan page, otherwise stay on current page
      if (pathname === "/" || pathname === "/choose-plan") {
        router.push("/for-you");
      }
    } catch (e: any) {
      console.error("Registration error:", e);
      dispatch(setError(e?.message || "Registration failed"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onGuest = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Guest login clicked");
    
    // Close modal immediately so user can enjoy the website
    close();
    
    // Set a guest user immediately so Library access works
    const guestUser = {
      uid: `guest_${Date.now()}`,
      email: null,
      displayName: null,
      isAnonymous: true,
    };
    dispatch(setUser(guestUser as any));
    
    // Store guest session in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('guestSession', JSON.stringify({ uid: guestUser.uid, timestamp: Date.now() }));
    }
    
    // Handle authentication in the background (try Firebase anonymous auth)
    const authInstance = getAuth();
    if (authInstance) {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      try {
        console.log("Attempting anonymous guest login...");
        // Use Firebase anonymous authentication - no credentials needed
        const result = await signInAnonymously(authInstance);
        // If Firebase auth succeeds, update user with real Firebase user
        if (result.user) {
          dispatch(setUser({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            isAnonymous: result.user.isAnonymous,
          } as any));
        }
        console.log("Guest login successful");
      } catch (e: any) {
        console.error("Guest login error:", e);
        // Don't show error to user since modal is already closed
        // Guest user is already set, so Library access will work
      } finally {
        dispatch(setLoading(false));
      }
    }
    
    // Redirect to /for-you if on home or choose-plan page, otherwise stay on current page
    // This allows Library page access even if guest login fails
    if (pathname === "/" || pathname === "/choose-plan") {
      router.push("/for-you");
    }
  };

  const onGoogleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Google sign in clicked");
    
    const authInstance = getAuth();
    if (!authInstance) {
      console.error("No auth instance");
      return;
    }

    const googleProvider = getGoogleProvider();
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    try {
      console.log("Attempting Google sign in...");
      await signInWithPopup(authInstance, googleProvider);
      console.log("Google sign in successful");
      close();
      // Redirect to /for-you if on home or choose-plan page, otherwise stay on current page
      if (pathname === "/" || pathname === "/choose-plan") {
        router.push("/for-you");
      }
    } catch (e: any) {
      console.error("Google sign in error:", e);
      if (e?.code !== "auth/popup-closed-by-user" && e?.code !== "auth/cancelled-popup-request") {
        dispatch(setError(e?.message || "Google sign in failed"));
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const authInstance = getAuthInstance();
    if (!authInstance) {
      console.error("Firebase Auth is not initialized");
      dispatch(setError("Logout failed: Authentication service is not available"));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      await signOut(authInstance);
      close();
    } catch (error: any) {
      console.error("Logout error:", error);
      dispatch(setError(error?.message || "Logout failed. Please try again."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onResetPassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log("Reset password clicked", { email });
    
    if (!email) return;

    const authInstance = getAuth();
    if (!authInstance) return;

    dispatch(setLoading(true));
    dispatch(setError(null));
    
    try {
      await sendPasswordResetEmail(authInstance, email);
      setResetSent(true);
    } catch (e: any) {
      console.error("Reset password error:", e);
      dispatch(setError(e?.message || "Failed to send reset email"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Form submitted", { tab, email, password });
    
    if (tab === "login") {
      onLogin();
    } else if (tab === "register") {
      onRegister();
    }
  };

  const handleTabSwitch = (newTab: "login" | "register") => {
    console.log("Switching tab to:", newTab);
    setTab(newTab);
    dispatch(setError(null));
  };

  const handleResetTab = () => {
    console.log("Switching to reset tab");
    setTab("reset");
  };

  if (!isAuthModalOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {tab === "register" ? "Create an account" : tab === "reset" ? "Reset password" : "Log in to Summarist"}
          </h2>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              close();
            }} 
            className={styles.close} 
            type="button" 
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {!user ? (
          <>
            {resetSent ? (
              <div className={styles.success}>
                <p>Password reset email sent!</p>
                <p>Check your email ({email}) for instructions to reset your password.</p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTab("login");
                    setResetSent(false);
                  }}
                  className={styles.backButton}
                  type="button"
                >
                  Back to Login
                </button>
              </div>
            ) : tab === "reset" ? (
              <form onSubmit={onResetPassword} className={styles.form}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>
                <button
                  type="submit"
                  className={styles.loginButton}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  Send Reset Email
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTabSwitch("login");
                  }}
                  className={styles.linkButton}
                >
                  Back to Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleFormSubmit} className={styles.form}>
                <button
                  type="button"
                  onClick={onGuest}
                  className={styles.guestButton}
                >
                  <span className={styles.iconLabel}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                    </svg>
                    Login as a Guest
                  </span>
                </button>

                <div className={styles.divider}>
                  <span className={styles.dividerText}>or</span>
                </div>

                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className={styles.googleButton}
                >
                  <span className={styles.iconLabel}>
                    <Image src="/google.png" alt="Google" width={20} height={20} className={styles.googleIcon} />
                    Login with Google
                  </span>
                </button>

                <div className={styles.divider}>
                  <span className={styles.dividerText}>or</span>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Password</label>
                  <input
                    type="password"
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                  />
                </div>
                <button
                  type="submit"
                  className={styles.loginButton}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {tab === "register" ? "Create Account" : "Login"}
                </button>
                <div className={styles.linkGroup}>
                  {tab === "login" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleResetTab();
                      }}
                      className={styles.linkButton}
                    >
                      Forgot your password?
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTabSwitch(tab === "login" ? "register" : "login");
                    }}
                    className={styles.linkButton}
                  >
                    {tab === "login" ? "Don't have an account?" : "Already have an account?"}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className={styles.stack}>
            <p className={styles.label}>
              Logged in as <strong>{user.email}</strong>
            </p>
            <button onClick={onLogout} className={styles.logoutButton} type="button">
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
