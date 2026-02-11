/**
 * ExpenseViewModel
 * ViewModel untuk mengelola state dan logic ExpenseRequest
 * Equivalent to ExpenseViewModel.java dalam Android MVVM Architecture
 */

import { useState, useCallback } from 'react';
import { 
  ExpenseRequest, 
  ExpenseCategory, 
  ExpenseStatus, 
  createExpenseRequest, 
  validateExpenseRequest 
} from '../models/ExpenseRequest';
import { database, ref, set, get, onValue } from '../config/firebase';

interface ExpenseState {
  expenses: ExpenseRequest[];
  isLoading: boolean;
  error: string | null;
  selectedExpense: ExpenseRequest | null;
}

interface ExpenseFilters {
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  dateFrom?: string;
  dateTo?: string;
}

export const useExpenseViewModel = (userId: string) => {
  const [state, setState] = useState<ExpenseState>({
    expenses: [],
    isLoading: false,
    error: null,
    selectedExpense: null
  });

  // Load all expenses for user
  const loadExpenses = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const expensesRef = ref(database, `users/${userId}/expenseRequests`);
      const snapshot = await get(expensesRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const expensesList: ExpenseRequest[] = Object.values(data);
        setState(prev => ({ 
          ...prev, 
          expenses: expensesList.sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          ),
          isLoading: false 
        }));
      } else {
        setState(prev => ({ ...prev, expenses: [], isLoading: false }));
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Gagal memuat data klaim',
        isLoading: false 
      }));
    }
  }, [userId]);

  // Subscribe to real-time updates
  const subscribeToExpenses = useCallback(() => {
    const expensesRef = ref(database, `users/${userId}/expenseRequests`);
    
    return onValue(expensesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const expensesList: ExpenseRequest[] = Object.values(data);
        setState(prev => ({ 
          ...prev, 
          expenses: expensesList.sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          )
        }));
      } else {
        setState(prev => ({ ...prev, expenses: [] }));
      }
    });
  }, [userId]);

  // Create new expense request
  const createExpense = useCallback(async (
    title: string,
    description: string,
    amount: number,
    category: ExpenseCategory,
    receiptUrl?: string
  ): Promise<{ success: boolean; error?: string; expense?: ExpenseRequest }> => {
    // Validate input
    const validation = validateExpenseRequest({ title, description, amount, category });
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const newExpense = createExpenseRequest(userId, title, description, amount, category, receiptUrl);
      const expenseRef = ref(database, `users/${userId}/expenseRequests/${newExpense.id}`);
      await set(expenseRef, newExpense);

      setState(prev => ({
        ...prev,
        expenses: [newExpense, ...prev.expenses],
        isLoading: false
      }));

      return { success: true, expense: newExpense };
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Gagal membuat klaim',
        isLoading: false
      }));
      return { success: false, error: error.message };
    }
  }, [userId]);

  // Update expense request
  const updateExpense = useCallback(async (
    expenseId: string,
    updates: Partial<ExpenseRequest>
  ): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const expenseRef = ref(database, `users/${userId}/expenseRequests/${expenseId}`);
      const snapshot = await get(expenseRef);
      
      if (!snapshot.exists()) {
        return { success: false, error: 'Klaim tidak ditemukan' };
      }

      const currentExpense = snapshot.val();
      const updatedExpense = { ...currentExpense, ...updates };
      await set(expenseRef, updatedExpense);

      setState(prev => ({
        ...prev,
        expenses: prev.expenses.map(exp => 
          exp.id === expenseId ? updatedExpense : exp
        ),
        isLoading: false
      }));

      return { success: true };
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Gagal memperbarui klaim',
        isLoading: false
      }));
      return { success: false, error: error.message };
    }
  }, [userId]);

  // Cancel expense request
  const cancelExpense = useCallback(async (
    expenseId: string
  ): Promise<{ success: boolean; error?: string }> => {
    return updateExpense(expenseId, { status: 'CANCELLED' });
  }, [updateExpense]);

  // Get expenses by status
  const getExpensesByStatus = useCallback((status: ExpenseStatus): ExpenseRequest[] => {
    return state.expenses.filter(exp => exp.status === status);
  }, [state.expenses]);

  // Get expenses by category
  const getExpensesByCategory = useCallback((category: ExpenseCategory): ExpenseRequest[] => {
    return state.expenses.filter(exp => exp.category === category);
  }, [state.expenses]);

  // Filter expenses
  const filterExpenses = useCallback((filters: ExpenseFilters): ExpenseRequest[] => {
    return state.expenses.filter(exp => {
      if (filters.status && exp.status !== filters.status) return false;
      if (filters.category && exp.category !== filters.category) return false;
      if (filters.dateFrom && new Date(exp.submittedAt) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(exp.submittedAt) > new Date(filters.dateTo)) return false;
      return true;
    });
  }, [state.expenses]);

  // Calculate total by status
  const getTotalByStatus = useCallback((status: ExpenseStatus): number => {
    return state.expenses
      .filter(exp => exp.status === status)
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [state.expenses]);

  // Get expense statistics
  const getStatistics = useCallback(() => {
    const pending = getTotalByStatus('PENDING');
    const approved = getTotalByStatus('APPROVED');
    const paid = getTotalByStatus('PAID');
    const rejected = getTotalByStatus('REJECTED');
    const total = state.expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      totalCount: state.expenses.length,
      pendingCount: getExpensesByStatus('PENDING').length,
      approvedCount: getExpensesByStatus('APPROVED').length,
      pendingAmount: pending,
      approvedAmount: approved,
      paidAmount: paid,
      rejectedAmount: rejected,
      totalAmount: total
    };
  }, [state.expenses, getTotalByStatus, getExpensesByStatus]);

  // Select expense for detail view
  const selectExpense = useCallback((expense: ExpenseRequest | null) => {
    setState(prev => ({ ...prev, selectedExpense: expense }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    expenses: state.expenses,
    isLoading: state.isLoading,
    error: state.error,
    selectedExpense: state.selectedExpense,

    // Actions
    loadExpenses,
    subscribeToExpenses,
    createExpense,
    updateExpense,
    cancelExpense,
    selectExpense,
    clearError,

    // Queries
    getExpensesByStatus,
    getExpensesByCategory,
    filterExpenses,
    getTotalByStatus,
    getStatistics
  };
};

export default useExpenseViewModel;
