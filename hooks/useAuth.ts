"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/slices/authSlice";
import { getSubscription } from "@/lib/subscription";
import {
  setSubscription,
  setLoading as setSubscriptionLoading,
  setError as setSubscriptionError,
} from "@/store/slices/subscriptionSlice";

export function useAuthListener(): void {
  const dispatch = useDispatch();

  useEffect(() => {
    const authInstance = getAuthInstance();
    if (!authInstance) {
      // Silently handle missing Firebase - don't log warnings that break the app
      // Authentication features will simply be unavailable
      return;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser: any) => {
      if (firebaseUser) {
        dispatch(
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName ?? undefined,
            photoURL: firebaseUser.photoURL ?? undefined,
          })
        );
        dispatch(setSubscriptionLoading(true));
        // Don't block page load - fetch subscription in background
        getSubscription(firebaseUser.uid)
          .then((subscription) => {
            dispatch(setSubscription(subscription));
            dispatch(setSubscriptionError(null));
            dispatch(setSubscriptionLoading(false));
          })
          .catch((error: any) => {
            dispatch(setSubscription(null));
            dispatch(setSubscriptionError(error?.message ?? "Failed to load subscription status."));
            dispatch(setSubscriptionLoading(false));
          });
      } else {
        // Check for guest session in localStorage
        if (typeof window !== 'undefined') {
          const guestSession = localStorage.getItem('guestSession');
          if (guestSession) {
            try {
              const session = JSON.parse(guestSession);
              // Restore guest user if session is less than 30 days old
              const sessionAge = Date.now() - (session.timestamp || 0);
              const thirtyDays = 30 * 24 * 60 * 60 * 1000;
              if (sessionAge < thirtyDays && session.uid) {
                dispatch(setUser({
                  uid: session.uid,
                  email: null,
                  displayName: null,
                  isAnonymous: true,
                } as any));
                return;
              }
            } catch (e) {
              // Invalid session data, clear it
              localStorage.removeItem('guestSession');
            }
          }
        }
        dispatch(setUser(null));
        dispatch(setSubscription(null));
        dispatch(setSubscriptionLoading(false));
        dispatch(setSubscriptionError(null));
      }
    });
    return () => unsubscribe();
  }, [dispatch]);
}
