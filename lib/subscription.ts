import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDbInstance } from "./firebase";
import { Subscription } from "@/types";

const COLLECTION_NAME = "subscriptions";

export async function getSubscription(userId: string): Promise<Subscription | null> {
  try {
    const db = getDbInstance();
    if (!db) {
      // Firebase not initialized - return null silently
      return null;
    }
    
    // Add timeout to prevent blocking page load
    const fetchPromise = getDoc(doc(db, COLLECTION_NAME, userId));
    const timeoutPromise = new Promise<Awaited<ReturnType<typeof getDoc>>>((_, reject) => {
      setTimeout(() => reject(new Error("Subscription fetch timeout")), 3000);
    });
    
    const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.data() as Subscription;
  } catch (error) {
    // Silently handle errors - don't log in production
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching subscription:", error);
    }
    // Return null instead of throwing to prevent blocking
    return null;
  }
}

export async function saveSubscription(userId: string, subscription: Subscription): Promise<void> {
  try {
    const db = getDbInstance();
    if (!db) {
      throw new Error("Firebase is not initialized");
    }
    
    await setDoc(
      doc(db, COLLECTION_NAME, userId),
      {
        ...subscription,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error saving subscription:", error);
    }
    throw error;
  }
}

