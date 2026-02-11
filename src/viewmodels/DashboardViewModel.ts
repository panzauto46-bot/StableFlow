/**
 * DashboardViewModel
 * ViewModel untuk mengelola state dan logic Dashboard
 * Equivalent to DashboardViewModel.java dalam Android MVVM Architecture
 */

import { useState, useCallback, useEffect } from 'react';
import { Transaction, mockTransactions } from '../models/User';
import { ExpenseRequest } from '../models/ExpenseRequest';
import { database, ref, get, onValue, set } from '../config/firebase';

interface DashboardState {
  balance: number;
  transactions: Transaction[];
  recentExpenses: ExpenseRequest[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastSyncTime: Date | null;
}

interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  pendingReimbursements: number;
  approvedReimbursements: number;
  transactionCount: number;
}

export const useDashboardViewModel = (userId: string) => {
  const [state, setState] = useState<DashboardState>({
    balance: 0,
    transactions: mockTransactions,
    recentExpenses: [],
    isLoading: true,
    isRefreshing: false,
    error: null,
    lastSyncTime: null
  });

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load balance
      const balanceRef = ref(database, `users/${userId}/balance`);
      const balanceSnapshot = await get(balanceRef);
      const balance = balanceSnapshot.exists() ? balanceSnapshot.val() : 0;

      // Load transactions
      const transactionsRef = ref(database, `users/${userId}/transactions`);
      const transactionsSnapshot = await get(transactionsRef);
      const transactions = transactionsSnapshot.exists() 
        ? Object.values(transactionsSnapshot.val() as Record<string, Transaction>)
        : mockTransactions;

      // Load recent expenses
      const expensesRef = ref(database, `users/${userId}/expenseRequests`);
      const expensesSnapshot = await get(expensesRef);
      const expenses = expensesSnapshot.exists()
        ? Object.values(expensesSnapshot.val() as Record<string, ExpenseRequest>)
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            .slice(0, 5)
        : [];

      setState(prev => ({
        ...prev,
        balance,
        transactions,
        recentExpenses: expenses,
        isLoading: false,
        lastSyncTime: new Date()
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Gagal memuat data dashboard',
        isLoading: false
      }));
    }
  }, [userId]);

  // Subscribe to real-time balance updates
  const subscribeToBalance = useCallback(() => {
    const balanceRef = ref(database, `users/${userId}/balance`);
    
    return onValue(balanceRef, (snapshot) => {
      if (snapshot.exists()) {
        setState(prev => ({ ...prev, balance: snapshot.val() }));
      }
    });
  }, [userId]);

  // Refresh dashboard data
  const refreshDashboard = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    await loadDashboardData();
    setState(prev => ({ ...prev, isRefreshing: false }));
  }, [loadDashboardData]);

  // Calculate dashboard statistics
  const getStatistics = useCallback((): DashboardStats => {
    const totalIncome = state.transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = state.transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const pendingReimbursements = state.recentExpenses
      .filter(e => e.status === 'PENDING' || e.status === 'UNDER_REVIEW')
      .reduce((sum, e) => sum + e.amount, 0);

    const approvedReimbursements = state.recentExpenses
      .filter(e => e.status === 'APPROVED' || e.status === 'PAID')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      totalIncome,
      totalExpense,
      pendingReimbursements,
      approvedReimbursements,
      transactionCount: state.transactions.length
    };
  }, [state.transactions, state.recentExpenses]);

  // Get recent transactions (last 5)
  const getRecentTransactions = useCallback((): Transaction[] => {
    return [...state.transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [state.transactions]);

  // Send USDC
  const sendUSDC = useCallback(async (
    toAddress: string,
    amount: number,
    description?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (amount <= 0) {
      return { success: false, error: 'Jumlah harus lebih dari 0' };
    }

    if (amount > state.balance) {
      return { success: false, error: 'Saldo tidak mencukupi' };
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Update balance
      const newBalance = state.balance - amount;
      const balanceRef = ref(database, `users/${userId}/balance`);
      await set(balanceRef, newBalance);

      // Create transaction record
      const transaction: Transaction = {
        id: `TXN-${Date.now()}`,
        type: 'TRANSFER',
        amount: -amount,
        currency: 'USDC',
        description: description || `Transfer to ${toAddress}`,
        timestamp: new Date().toISOString(),
        status: 'COMPLETED',
        toAddress
      };

      const transactionRef = ref(database, `users/${userId}/transactions/${transaction.id}`);
      await set(transactionRef, transaction);

      setState(prev => ({
        ...prev,
        balance: newBalance,
        transactions: [transaction, ...prev.transactions],
        isLoading: false
      }));

      return { success: true };
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: error.message };
    }
  }, [userId, state.balance]);

  // Format currency
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (userId) {
      loadDashboardData();
    }
  }, [userId, loadDashboardData]);

  return {
    // State
    balance: state.balance,
    transactions: state.transactions,
    recentExpenses: state.recentExpenses,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    lastSyncTime: state.lastSyncTime,

    // Actions
    loadDashboardData,
    subscribeToBalance,
    refreshDashboard,
    sendUSDC,
    clearError,

    // Computed
    getStatistics,
    getRecentTransactions,

    // Utilities
    formatCurrency,
    formatDate
  };
};

export default useDashboardViewModel;
