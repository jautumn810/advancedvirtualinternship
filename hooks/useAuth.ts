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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = onAuthStateChanged(getAuthInstance(), async (firebaseUser: any) => {
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
        dispatch(setUser(null));
        dispatch(setSubscription(null));
        dispatch(setSubscriptionLoading(false));
        dispatch(setSubscriptionError(null));
      }
    });
    return () => unsubscribe();
  }, [dispatch]);
}
