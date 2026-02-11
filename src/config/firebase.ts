import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getDatabase, ref, get, set, onValue, DatabaseReference, DataSnapshot } from 'firebase/database';

// Firebase configuration - Replace with your own Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDemo-StableFlow-Key",
  authDomain: "stableflow-demo.firebaseapp.com",
  databaseURL: "https://stableflow-demo-default-rtdb.firebaseio.com",
  projectId: "stableflow-demo",
  storageBucket: "stableflow-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Auth functions
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Database functions
export const getUserBalance = async (userId: string): Promise<number> => {
  try {
    const balanceRef = ref(database, `users/${userId}/balance`);
    const snapshot = await get(balanceRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return 0;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
};

export const setUserBalance = async (userId: string, balance: number) => {
  try {
    const balanceRef = ref(database, `users/${userId}/balance`);
    await set(balanceRef, balance);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const subscribeToBalance = (userId: string, callback: (balance: number) => void) => {
  const balanceRef = ref(database, `users/${userId}/balance`);
  return onValue(balanceRef, (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(0);
    }
  });
};

export const getUserData = async (userId: string) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

export const initializeUserData = async (userId: string, email: string) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, {
      email: email,
      balance: 1000.00,
      createdAt: new Date().toISOString(),
      transactions: [],
      expenseRequests: []
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export { ref, set, get, onValue };
export type { User, DatabaseReference, DataSnapshot };
