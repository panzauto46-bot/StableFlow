/**
 * User Model
 * Struktur data untuk user dalam aplikasi StableFlow
 */

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  balance: number;
  createdAt: string;
  lastLoginAt?: string;
  isVerified: boolean;
  accountType: AccountType;
}

export type AccountType = 'PERSONAL' | 'BUSINESS' | 'ENTERPRISE';

export interface UserSession {
  isLoggedIn: boolean;
  user: UserData | null;
  token?: string;
  expiresAt?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  timestamp: string;
  status: TransactionStatus;
  fromAddress?: string;
  toAddress?: string;
  txHash?: string;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT' | 'REIMBURSEMENT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// Mock user data for demo purposes
export const mockUserData: UserData = {
  uid: 'demo-user-001',
  email: 'demo@stableflow.com',
  displayName: 'Demo User',
  balance: 12458.75,
  createdAt: '2024-01-15T10:30:00Z',
  lastLoginAt: new Date().toISOString(),
  isVerified: true,
  accountType: 'BUSINESS'
};

export const mockTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    type: 'DEPOSIT',
    amount: 5000,
    currency: 'USDC',
    description: 'Deposit from Bank Transfer',
    timestamp: '2024-01-20T14:30:00Z',
    status: 'COMPLETED',
    txHash: '0x1234...abcd'
  },
  {
    id: 'TXN-002',
    type: 'PAYMENT',
    amount: -250.50,
    currency: 'USDC',
    description: 'Software Subscription',
    timestamp: '2024-01-19T09:15:00Z',
    status: 'COMPLETED'
  },
  {
    id: 'TXN-003',
    type: 'REIMBURSEMENT',
    amount: 780,
    currency: 'USDC',
    description: 'Travel Expense Reimbursement',
    timestamp: '2024-01-18T16:45:00Z',
    status: 'COMPLETED'
  },
  {
    id: 'TXN-004',
    type: 'TRANSFER',
    amount: -1500,
    currency: 'USDC',
    description: 'Transfer to External Wallet',
    timestamp: '2024-01-17T11:20:00Z',
    status: 'COMPLETED',
    toAddress: '0x9876...wxyz'
  },
  {
    id: 'TXN-005',
    type: 'WITHDRAWAL',
    amount: -500,
    currency: 'USDC',
    description: 'Withdrawal to Bank Account',
    timestamp: '2024-01-16T08:00:00Z',
    status: 'PENDING'
  }
];
