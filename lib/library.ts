import { getDbInstance } from "./firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Book } from "@/types";

const LIBRARY_COLLECTION = "library";
const FINISHED_COLLECTION = "finished";

export interface LibraryBook extends Book {
  userId: string;
  addedAt: string;
}

export interface FinishedBook extends Book {
  userId: string;
  finishedAt: string;
}

// Add book to library
export async function addToLibrary(userId: string, book: Book): Promise<void> {
  try {
    const db = getDbInstance();
    if (!db) {
      throw new Error("Firebase is not initialized. Please configure Firebase environment variables.");
    }
    
    await addDoc(collection(db, LIBRARY_COLLECTION), {
      ...book,
      userId,
      addedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error adding book to library:", error);
    }
    throw error;
  }
}

// Get user's library books
export async function getLibraryBooks(userId: string): Promise<LibraryBook[]> {
  try {
    const db = getDbInstance();
    if (!db) {
      // Return empty array if Firebase is not initialized
      return [];
    }
    
    const q = query(
      collection(db, LIBRARY_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as LibraryBook[];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching library books:", error);
    }
    // Return empty array instead of throwing to prevent blocking
    return [];
  }
}

// Remove book from library
export async function removeFromLibrary(userId: string, bookId: string): Promise<void> {
  try {
    const db = getDbInstance();
    if (!db) {
      throw new Error("Firebase is not initialized. Please configure Firebase environment variables.");
    }
    
    const q = query(
      collection(db, LIBRARY_COLLECTION),
      where("userId", "==", userId),
      where("id", "==", bookId)
    );
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((document) =>
      deleteDoc(doc(db, LIBRARY_COLLECTION, document.id))
    );
    await Promise.all(deletePromises);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error removing book from library:", error);
    }
    throw error;
  }
}

// Add book to finished
export async function addToFinished(userId: string, book: Book): Promise<void> {
  try {
    const db = getDbInstance();
    if (!db) {
      throw new Error("Firebase is not initialized. Please configure Firebase environment variables.");
    }
    
    await addDoc(collection(db, FINISHED_COLLECTION), {
      ...book,
      userId,
      finishedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error adding book to finished:", error);
    }
    throw error;
  }
}

// Get user's finished books
export async function getFinishedBooks(userId: string): Promise<FinishedBook[]> {
  try {
    const db = getDbInstance();
    if (!db) {
      // Return empty array if Firebase is not initialized
      return [];
    }
    
    const q = query(
      collection(db, FINISHED_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as FinishedBook[];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error fetching finished books:", error);
    }
    // Return empty array instead of throwing to prevent blocking
    return [];
  }
}

