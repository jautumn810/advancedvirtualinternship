"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setAuthModalOpen, setError, setLoading } from "@/store/slices/authSlice";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
} from "firebase/auth";
import Image from "next/image";
import styles from "./AuthModal.module.css";

export default function AuthModal() {
  const dispatch = useDispatch();
  const { isAuthModalOpen, isLoading, error, user } = useSelector((s: RootState) => s.auth);
  const [tab, setTab] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const close = () => dispatch(setAuthModalOpen(false));

  const onLogin = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      await signInWithEmailAndPassword(auth, email, password);
      close();
    } catch (e: any) {
      dispatch(setError(e?.message ?? "Login failed"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onRegister = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      close();
    } catch (e: any) {
      dispatch(setError(e?.message ?? "Registration failed"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onGuest = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      await signInWithEmailAndPassword(auth, "guest@gmail.com", "guest123");
      close();
    } catch (e: any) {
      dispatch(setError("Guest login failed. Ensure guest account exists."));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onGoogleSignIn = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      await signInWithPopup(auth, googleProvider);
      close();
    } catch (e: any) {
      const message =
        e?.code === "auth/popup-closed-by-user"
          ? "Google sign-in was cancelled."
          : e?.message ?? "Google sign-in failed";
      dispatch(setError(message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onLogout = async () => {
    await signOut(auth);
  };

  const onResetPassword = async () => {
    if (!email) {
      dispatch(setError("Please enter your email address"));
      return;
    }
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (e: any) {
      dispatch(setError(e?.message ?? "Failed to send reset email"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Log in to Summarist</h2>
          <button onClick={close} className={styles.close} type="button" aria-label="Close">
            ×
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {!user ? (
          <>
            {resetSent ? (
              <div className={styles.success}>
                <p>Password reset email sent!</p>
                <p>Check your email ({email}) for instructions to reset your password.</p>
                <button
                  onClick={() => {
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onResetPassword();
                }}
                className={styles.form}
              >
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
                  disabled={isLoading}
                  className={styles.loginButton}
                >
                  {isLoading ? "Sending..." : "Send Reset Email"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    dispatch(setError(null));
                  }}
                  className={styles.linkButton}
                >
                  Back to Login
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  tab === "login" ? onLogin() : onRegister();
                }}
                className={styles.form}
              >
                <button
                  type="button"
                  onClick={onGuest}
                  className={styles.guestButton}
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                    minLength={6}
                    placeholder="Enter your password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={styles.loginButton}
                >
                  {isLoading ? "Please wait..." : "Login"}
                </button>
                <div className={styles.linkGroup}>
                  <button
                    type="button"
                    onClick={() => setTab("reset")}
                    className={styles.linkButton}
                  >
                    Forgot your password?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("register");
                      dispatch(setError(null));
                    }}
                    className={styles.linkButton}
                  >
                    Don&apos;t have an account?
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
