/**
 * ExpenseRequest Model
 * Struktur data untuk klaim reimburse dalam aplikasi StableFlow
 * 
 * Equivalent to ExpenseRequest.java in Android Native:
 * public class ExpenseRequest { ... }
 */

export interface ExpenseRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  amount: number;
  currency: 'USDC' | 'USD' | 'IDR';
  category: ExpenseCategory;
  status: ExpenseStatus;
  receiptUrl?: string;
  attachments?: string[];
  submittedAt: string;
  processedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

// Expense with blockchain transaction data
export interface ExpenseWithTx extends ExpenseRequest {
  txSignature?: string;
  txExplorerUrl?: string;
  paidAt?: string;
  payerAddress?: string;
}

export type ExpenseCategory =
  | 'TRAVEL'
  | 'MEALS'
  | 'SUPPLIES'
  | 'EQUIPMENT'
  | 'SOFTWARE'
  | 'TRAINING'
  | 'ENTERTAINMENT'
  | 'UTILITIES'
  | 'OTHER';

export type ExpenseStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CANCELLED';

export const ExpenseCategoryLabels: Record<ExpenseCategory, string> = {
  TRAVEL: 'Perjalanan Dinas',
  MEALS: 'Makan & Minum',
  SUPPLIES: 'Perlengkapan Kantor',
  EQUIPMENT: 'Peralatan',
  SOFTWARE: 'Software & Lisensi',
  TRAINING: 'Pelatihan & Sertifikasi',
  ENTERTAINMENT: 'Hiburan Klien',
  UTILITIES: 'Utilitas',
  OTHER: 'Lainnya'
};

export const ExpenseStatusLabels: Record<ExpenseStatus, string> = {
  PENDING: 'Menunggu',
  UNDER_REVIEW: 'Dalam Review',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  PAID: 'Dibayar',
  CANCELLED: 'Dibatalkan'
};

export const ExpenseStatusColors: Record<ExpenseStatus, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  UNDER_REVIEW: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  APPROVED: { bg: 'bg-green-500/20', text: 'text-green-400' },
  REJECTED: { bg: 'bg-red-500/20', text: 'text-red-400' },
  PAID: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  CANCELLED: { bg: 'bg-gray-500/20', text: 'text-gray-400' }
};

// Factory function to create a new ExpenseRequest
export const createExpenseRequest = (
  userId: string,
  title: string,
  description: string,
  amount: number,
  category: ExpenseCategory,
  receiptUrl?: string
): ExpenseRequest => {
  return {
    id: generateExpenseId(),
    userId,
    title,
    description,
    amount,
    currency: 'USDC',
    category,
    status: 'PENDING',
    receiptUrl,
    submittedAt: new Date().toISOString(),
  };
};

// Generate unique expense ID
const generateExpenseId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `EXP-${timestamp}-${randomStr}`.toUpperCase();
};

// Validation function
export const validateExpenseRequest = (expense: Partial<ExpenseRequest>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!expense.title || expense.title.trim().length < 3) {
    errors.push('Judul harus minimal 3 karakter');
  }

  if (!expense.description || expense.description.trim().length < 10) {
    errors.push('Deskripsi harus minimal 10 karakter');
  }

  if (!expense.amount || expense.amount <= 0) {
    errors.push('Jumlah harus lebih dari 0');
  }

  if (expense.amount && expense.amount > 100000) {
    errors.push('Jumlah maksimal 100,000 USDC');
  }

  if (!expense.category) {
    errors.push('Kategori harus dipilih');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
