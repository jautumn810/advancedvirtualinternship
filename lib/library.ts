import { getDbInstance } from "./firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Book } from "@/types";

const LIBRARY_COLLECTION = "library";
const FINISHED_COLLECTION = "finished";

// Helper functions for localStorage (for guest users)
const getGuestLibraryKey = (userId: string) => `guest_library_${userId}`;
const getGuestFinishedKey = (userId: string) => `guest_finished_${userId}`;

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
  // Check if user is a guest (starts with "guest_")
  const isGuest = userId.startsWith("guest_");
  
  if (isGuest && typeof window !== 'undefined') {
    // Use localStorage for guest users
    const key = getGuestLibraryKey(userId);
    const existing = localStorage.getItem(key);
    const library: LibraryBook[] = existing ? JSON.parse(existing) : [];
    
    // Check if book already exists to prevent duplicates
    if (library.some(b => b.id === book.id)) {
      return; // Book already in library, silently return
    }
    
    // Add book to library
    library.push({
      ...book,
      userId,
      addedAt: new Date().toISOString(),
    });
    
    localStorage.setItem(key, JSON.stringify(library));
    return;
  }
  
  try {
    const db = getDbInstance();
    if (!db) {
      throw new Error("Firebase is not initialized. Please configure Firebase environment variables.");
    }
    
    // Check if book already exists in library to prevent duplicates
    const q = query(
      collection(db, LIBRARY_COLLECTION),
      where("userId", "==", userId),
      where("id", "==", book.id)
    );
    const querySnapshot = await getDocs(q);
    
    // If book already exists, don't add it again
    if (!querySnapshot.empty) {
      return; // Book already in library, silently return
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
  // Check if user is a guest (starts with "guest_")
  const isGuest = userId.startsWith("guest_");
  
  if (isGuest && typeof window !== 'undefined') {
    // Use localStorage for guest users
    const key = getGuestLibraryKey(userId);
    const existing = localStorage.getItem(key);
    return existing ? JSON.parse(existing) : [];
  }
  
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
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Preserve the book's original ID from the document data
      // Don't overwrite it with the Firestore document ID
      return {
        ...data,
        id: data.id || doc.id, // Use book's original ID, fallback to doc ID if missing
      } as LibraryBook;
    });
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
  // Check if user is a guest (starts with "guest_")
  const isGuest = userId.startsWith("guest_");
  
  if (isGuest && typeof window !== 'undefined') {
    // Use localStorage for guest users
    const key = getGuestLibraryKey(userId);
    const existing = localStorage.getItem(key);
    if (existing) {
      const library: LibraryBook[] = JSON.parse(existing);
      const filtered = library.filter(b => b.id !== bookId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
    return;
  }
  
  try {
    const db = getDbInstance();
    if (!db) {
      throw new Error("Firebase is not initialized. Please configure Firebase environment variables.");
    }
    
    // Query by userId and the book's original ID (stored in the document data)
    const q = query(
      collection(db, LIBRARY_COLLECTION),
      where("userId", "==", userId),
      where("id", "==", bookId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // If no documents found with the book ID, try to find by document ID as fallback
      // This handles edge cases where the book ID might not be stored correctly
      const docRef = doc(db, LIBRARY_COLLECTION, bookId);
      try {
        await deleteDoc(docRef);
        return;
      } catch {
        // Document doesn't exist or already deleted, which is fine
        return;
      }
    }
    
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

