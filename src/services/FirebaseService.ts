/**
 * StableFlow - Firebase Service
 * Production-ready Firebase operations for expense management
 */

import { database, auth } from '../config/firebase';
import { ref, set, get, push, update, onValue, remove, query, orderByChild, equalTo } from 'firebase/database';
import { ExpenseRequest, ExpenseStatus, ExpenseCategory } from '../models/ExpenseRequest';

// Employee Model
export interface Employee {
    uid: string;
    email: string;
    displayName: string;
    walletAddress?: string;
    department: string;
    position: string;
    salary?: number;
    hireDate: string;
    isActive: boolean;
    role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
    managerId?: string;
    createdAt: string;
    updatedAt: string;
}

// Expense with blockchain data
export interface ExpenseWithTx extends ExpenseRequest {
    txSignature?: string;
    txExplorerUrl?: string;
    paidAt?: string;
    payerAddress?: string;
}

// Payment Record
export interface PaymentRecord {
    id: string;
    expenseId: string;
    employeeId: string;
    employeeName: string;
    amount: number;
    walletAddress: string;
    txSignature: string;
    txExplorerUrl: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    createdAt: string;
    processedBy: string;
}

class FirebaseService {
    // =====================
    // EMPLOYEE MANAGEMENT
    // =====================

    /**
     * Create new employee
     */
    async createEmployee(employee: Omit<Employee, 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; employeeId?: string; error?: string }> {
        try {
            const employeesRef = ref(database, 'employees');
            const newEmployeeRef = push(employeesRef);
            const employeeData: Employee = {
                ...employee,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await set(newEmployeeRef, employeeData);
            return { success: true, employeeId: newEmployeeRef.key! };
        } catch (error: any) {
            console.error('Create employee error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update employee wallet address
     */
    async updateEmployeeWallet(employeeId: string, walletAddress: string): Promise<{ success: boolean; error?: string }> {
        try {
            const employeeRef = ref(database, `employees/${employeeId}`);
            await update(employeeRef, {
                walletAddress,
                updatedAt: new Date().toISOString(),
            });
            return { success: true };
        } catch (error: any) {
            console.error('Update wallet error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get employee by ID
     */
    async getEmployee(employeeId: string): Promise<Employee | null> {
        try {
            const employeeRef = ref(database, `employees/${employeeId}`);
            const snapshot = await get(employeeRef);
            if (snapshot.exists()) {
                return { ...snapshot.val(), uid: employeeId };
            }
            return null;
        } catch (error) {
            console.error('Get employee error:', error);
            return null;
        }
    }

    /**
     * Get all employees
     */
    async getAllEmployees(): Promise<Employee[]> {
        try {
            const employeesRef = ref(database, 'employees');
            const snapshot = await get(employeesRef);
            if (!snapshot.exists()) return [];

            const employees: Employee[] = [];
            snapshot.forEach((child) => {
                employees.push({ ...child.val(), uid: child.key! });
            });
            return employees;
        } catch (error) {
            console.error('Get all employees error:', error);
            return [];
        }
    }

    /**
     * Subscribe to employee list changes
     */
    subscribeToEmployees(callback: (employees: Employee[]) => void): () => void {
        const employeesRef = ref(database, 'employees');
        const unsubscribe = onValue(employeesRef, (snapshot) => {
            const employees: Employee[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    employees.push({ ...child.val(), uid: child.key! });
                });
            }
            callback(employees);
        });
        return unsubscribe;
    }

    // =====================
    // EXPENSE MANAGEMENT
    // =====================

    /**
     * Submit new expense request
     */
    async submitExpense(expense: Omit<ExpenseRequest, 'id' | 'submittedAt'>): Promise<{ success: boolean; expenseId?: string; error?: string }> {
        try {
            const expensesRef = ref(database, 'expenses');
            const newExpenseRef = push(expensesRef);
            const expenseData: ExpenseRequest = {
                ...expense,
                id: newExpenseRef.key!,
                submittedAt: new Date().toISOString(),
            };
            await set(newExpenseRef, expenseData);
            return { success: true, expenseId: newExpenseRef.key! };
        } catch (error: any) {
            console.error('Submit expense error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update expense status
     */
    async updateExpenseStatus(
        expenseId: string,
        status: ExpenseStatus,
        processedBy: string,
        rejectionReason?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const expenseRef = ref(database, `expenses/${expenseId}`);
            const updateData: Partial<ExpenseRequest> = {
                status,
                processedAt: new Date().toISOString(),
                approvedBy: processedBy,
            };

            if (rejectionReason) {
                updateData.rejectionReason = rejectionReason;
            }

            await update(expenseRef, updateData);
            return { success: true };
        } catch (error: any) {
            console.error('Update expense status error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Mark expense as paid with transaction details
     */
    async markExpenseAsPaid(
        expenseId: string,
        txSignature: string,
        txExplorerUrl: string,
        payerAddress: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const expenseRef = ref(database, `expenses/${expenseId}`);
            await update(expenseRef, {
                status: 'PAID',
                txSignature,
                txExplorerUrl,
                payerAddress,
                paidAt: new Date().toISOString(),
            });
            return { success: true };
        } catch (error: any) {
            console.error('Mark expense paid error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get expense by ID
     */
    async getExpense(expenseId: string): Promise<ExpenseWithTx | null> {
        try {
            const expenseRef = ref(database, `expenses/${expenseId}`);
            const snapshot = await get(expenseRef);
            if (snapshot.exists()) {
                return snapshot.val();
            }
            return null;
        } catch (error) {
            console.error('Get expense error:', error);
            return null;
        }
    }

    /**
     * Get all expenses (for managers)
     */
    async getAllExpenses(): Promise<ExpenseWithTx[]> {
        try {
            const expensesRef = ref(database, 'expenses');
            const snapshot = await get(expensesRef);
            if (!snapshot.exists()) return [];

            const expenses: ExpenseWithTx[] = [];
            snapshot.forEach((child) => {
                expenses.push({ ...child.val(), id: child.key! });
            });

            // Sort by submitted date (newest first)
            return expenses.sort((a, b) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
            );
        } catch (error) {
            console.error('Get all expenses error:', error);
            return [];
        }
    }

    /**
     * Get expenses by user ID
     */
    async getExpensesByUser(userId: string): Promise<ExpenseWithTx[]> {
        try {
            const expensesRef = ref(database, 'expenses');
            const snapshot = await get(expensesRef);
            if (!snapshot.exists()) return [];

            const expenses: ExpenseWithTx[] = [];
            snapshot.forEach((child) => {
                const expense = child.val();
                if (expense.userId === userId) {
                    expenses.push({ ...expense, id: child.key! });
                }
            });

            return expenses.sort((a, b) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
            );
        } catch (error) {
            console.error('Get expenses by user error:', error);
            return [];
        }
    }

    /**
     * Get pending expenses (for approval queue)
     */
    async getPendingExpenses(): Promise<ExpenseWithTx[]> {
        const allExpenses = await this.getAllExpenses();
        return allExpenses.filter(e => e.status === 'PENDING' || e.status === 'UNDER_REVIEW');
    }

    /**
     * Subscribe to expenses changes
     */
    subscribeToExpenses(callback: (expenses: ExpenseWithTx[]) => void): () => void {
        const expensesRef = ref(database, 'expenses');
        const unsubscribe = onValue(expensesRef, (snapshot) => {
            const expenses: ExpenseWithTx[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    expenses.push({ ...child.val(), id: child.key! });
                });
            }
            // Sort by submitted date (newest first)
            callback(expenses.sort((a, b) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
            ));
        });
        return unsubscribe;
    }

    /**
     * Subscribe to pending expenses (for manager dashboard)
     */
    subscribeToPendingExpenses(callback: (expenses: ExpenseWithTx[]) => void): () => void {
        const expensesRef = ref(database, 'expenses');
        const unsubscribe = onValue(expensesRef, (snapshot) => {
            const expenses: ExpenseWithTx[] = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const expense = child.val();
                    if (expense.status === 'PENDING' || expense.status === 'UNDER_REVIEW') {
                        expenses.push({ ...expense, id: child.key! });
                    }
                });
            }
            callback(expenses.sort((a, b) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
            ));
        });
        return unsubscribe;
    }

    // =====================
    // PAYMENT RECORDS
    // =====================

    /**
     * Record a payment transaction
     */
    async recordPayment(payment: Omit<PaymentRecord, 'id'>): Promise<{ success: boolean; paymentId?: string; error?: string }> {
        try {
            const paymentsRef = ref(database, 'payments');
            const newPaymentRef = push(paymentsRef);
            const paymentData: PaymentRecord = {
                ...payment,
                id: newPaymentRef.key!,
            };
            await set(newPaymentRef, paymentData);
            return { success: true, paymentId: newPaymentRef.key! };
        } catch (error: any) {
            console.error('Record payment error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all payment records
     */
    async getAllPayments(): Promise<PaymentRecord[]> {
        try {
            const paymentsRef = ref(database, 'payments');
            const snapshot = await get(paymentsRef);
            if (!snapshot.exists()) return [];

            const payments: PaymentRecord[] = [];
            snapshot.forEach((child) => {
                payments.push({ ...child.val(), id: child.key! });
            });

            return payments.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } catch (error) {
            console.error('Get all payments error:', error);
            return [];
        }
    }

    // =====================
    // USER WALLET MAPPING
    // =====================

    /**
     * Save user wallet address
     */
    async saveUserWallet(userId: string, walletAddress: string): Promise<{ success: boolean; error?: string }> {
        try {
            const userRef = ref(database, `users/${userId}/walletAddress`);
            await set(userRef, walletAddress);
            return { success: true };
        } catch (error: any) {
            console.error('Save wallet error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user wallet address
     */
    async getUserWallet(userId: string): Promise<string | null> {
        try {
            const walletRef = ref(database, `users/${userId}/walletAddress`);
            const snapshot = await get(walletRef);
            if (snapshot.exists()) {
                return snapshot.val();
            }
            return null;
        } catch (error) {
            console.error('Get wallet error:', error);
            return null;
        }
    }

    // =====================
    // STATISTICS
    // =====================

    /**
     * Get expense statistics
     */
    async getExpenseStatistics(): Promise<{
        totalPending: number;
        totalApproved: number;
        totalPaid: number;
        totalRejected: number;
        pendingAmount: number;
        paidAmount: number;
    }> {
        const allExpenses = await this.getAllExpenses();

        return {
            totalPending: allExpenses.filter(e => e.status === 'PENDING' || e.status === 'UNDER_REVIEW').length,
            totalApproved: allExpenses.filter(e => e.status === 'APPROVED').length,
            totalPaid: allExpenses.filter(e => e.status === 'PAID').length,
            totalRejected: allExpenses.filter(e => e.status === 'REJECTED').length,
            pendingAmount: allExpenses
                .filter(e => e.status === 'PENDING' || e.status === 'UNDER_REVIEW' || e.status === 'APPROVED')
                .reduce((sum, e) => sum + e.amount, 0),
            paidAmount: allExpenses
                .filter(e => e.status === 'PAID')
                .reduce((sum, e) => sum + e.amount, 0),
        };
    }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService;
