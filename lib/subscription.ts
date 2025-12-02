import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Subscription } from "@/types";

const COLLECTION_NAME = "subscriptions";

export async function getSubscription(userId: string): Promise<Subscription | null> {
  try {
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
    console.error("Error fetching subscription:", error);
    // Return null instead of throwing to prevent blocking
    return null;
  }
}

export async function saveSubscription(userId: string, subscription: Subscription): Promise<void> {
  try {
    await setDoc(
      doc(db, COLLECTION_NAME, userId),
      {
        ...subscription,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving subscription:", error);
    throw error;
  }
}

