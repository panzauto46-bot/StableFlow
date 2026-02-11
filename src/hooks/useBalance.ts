import { useState, useEffect, useCallback } from 'react';
import { subscribeToBalance, setUserBalance, database, ref, get } from '../config/firebase';
import { mockUserData } from '../models/User';

interface BalanceState {
  balance: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface BalanceActions {
  refreshBalance: () => Promise<void>;
  updateBalance: (newBalance: number) => Promise<{ success: boolean; error?: string }>;
  addToBalance: (amount: number) => Promise<{ success: boolean; error?: string }>;
  subtractFromBalance: (amount: number) => Promise<{ success: boolean; error?: string }>;
}

export const useBalance = (userId: string | undefined): BalanceState & BalanceActions => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!userId) {
      // Use mock data for demo mode
      setBalance(mockUserData.balance);
      setIsLoading(false);
      setLastUpdated(new Date());
      return;
    }

    setIsLoading(true);
    
    // Subscribe to real-time balance updates
    const unsubscribe = subscribeToBalance(userId, (newBalance) => {
      setBalance(newBalance);
      setIsLoading(false);
      setLastUpdated(new Date());
      setError(null);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [userId]);

  const refreshBalance = useCallback(async () => {
    if (!userId) {
      setBalance(mockUserData.balance);
      setLastUpdated(new Date());
      return;
    }

    setIsLoading(true);
    try {
      const balanceRef = ref(database, `users/${userId}/balance`);
      const snapshot = await get(balanceRef);
      if (snapshot.exists()) {
        setBalance(snapshot.val());
      }
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat saldo');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const updateBalance = useCallback(async (newBalance: number) => {
    if (!userId) {
      setBalance(newBalance);
      return { success: true };
    }

    try {
      const result = await setUserBalance(userId, newBalance);
      if (result.success) {
        setBalance(newBalance);
        setLastUpdated(new Date());
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [userId]);

  const addToBalance = useCallback(async (amount: number) => {
    const newBalance = balance + amount;
    return updateBalance(newBalance);
  }, [balance, updateBalance]);

  const subtractFromBalance = useCallback(async (amount: number) => {
    if (amount > balance) {
      return { success: false, error: 'Saldo tidak mencukupi' };
    }
    const newBalance = balance - amount;
    return updateBalance(newBalance);
  }, [balance, updateBalance]);

  return {
    balance,
    isLoading,
    error,
    lastUpdated,
    refreshBalance,
    updateBalance,
    addToBalance,
    subtractFromBalance
  };
};

export default useBalance;
