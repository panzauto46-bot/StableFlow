/**
 * StableFlow - Solana Service
 * High-level service for Solana blockchain operations
 */

import { Keypair, PublicKey } from '@solana/web3.js';
import {
    getConnection,
    getSolBalance,
    getUSDCBalance,
    transferUSDC,
    batchTransferUSDC,
    isValidSolanaAddress,
    SOLANA_CONFIG,
    TransferResult,
    BatchTransferItem,
    BatchTransferResult,
} from '../config/solana';

// Company Treasury Wallet (for demo - in production, use proper key management)
// This would be securely stored in environment variables or a secure vault
const DEMO_TREASURY_SECRET = new Uint8Array([
    // This is a placeholder - generate a real keypair for production
    // You can generate one using: Keypair.generate().secretKey
]);

export interface WalletInfo {
    address: string;
    solBalance: number;
    usdcBalance: number;
    isValid: boolean;
}

export interface PaymentRequest {
    employeeId: string;
    employeeName: string;
    walletAddress: string;
    amount: number;
    reason: string;
    expenseId?: string;
}

export interface PaymentResult {
    success: boolean;
    signature?: string;
    explorerUrl?: string;
    error?: string;
    timestamp: string;
}

class SolanaService {
    private treasuryKeypair: Keypair | null = null;

    /**
     * Initialize the service with company treasury wallet
     */
    async initializeTreasury(secretKey?: Uint8Array): Promise<boolean> {
        try {
            if (secretKey && secretKey.length > 0) {
                this.treasuryKeypair = Keypair.fromSecretKey(secretKey);
            } else {
                // For demo purposes, create a new keypair
                // In production, this would be loaded from secure storage
                this.treasuryKeypair = Keypair.generate();
                console.log('Demo Treasury Address:', this.treasuryKeypair.publicKey.toBase58());
                console.log('⚠️ This is a demo wallet. In production, use a properly secured treasury.');
            }
            return true;
        } catch (error) {
            console.error('Failed to initialize treasury:', error);
            return false;
        }
    }

    /**
     * Get treasury wallet address
     */
    getTreasuryAddress(): string | null {
        return this.treasuryKeypair?.publicKey.toBase58() ?? null;
    }

    /**
     * Get wallet information
     */
    async getWalletInfo(address: string): Promise<WalletInfo> {
        const isValid = isValidSolanaAddress(address);

        if (!isValid) {
            return {
                address,
                solBalance: 0,
                usdcBalance: 0,
                isValid: false,
            };
        }

        const [solBalance, usdcBalance] = await Promise.all([
            getSolBalance(address),
            getUSDCBalance(address),
        ]);

        return {
            address,
            solBalance,
            usdcBalance,
            isValid: true,
        };
    }

    /**
     * Get treasury wallet balance
     */
    async getTreasuryBalance(): Promise<{ sol: number; usdc: number }> {
        if (!this.treasuryKeypair) {
            return { sol: 0, usdc: 0 };
        }

        const address = this.treasuryKeypair.publicKey.toBase58();
        const [sol, usdc] = await Promise.all([
            getSolBalance(address),
            getUSDCBalance(address),
        ]);

        return { sol, usdc };
    }

    /**
     * Process a single payment (expense reimbursement)
     */
    async processPayment(request: PaymentRequest): Promise<PaymentResult> {
        if (!this.treasuryKeypair) {
            return {
                success: false,
                error: 'Treasury wallet not initialized',
                timestamp: new Date().toISOString(),
            };
        }

        if (!isValidSolanaAddress(request.walletAddress)) {
            return {
                success: false,
                error: 'Invalid recipient wallet address',
                timestamp: new Date().toISOString(),
            };
        }

        const result = await transferUSDC(
            this.treasuryKeypair,
            request.walletAddress,
            request.amount
        );

        return {
            success: result.success,
            signature: result.signature,
            explorerUrl: result.explorerUrl,
            error: result.error,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Process payroll - batch payment to multiple employees
     */
    async processPayroll(payments: PaymentRequest[]): Promise<{
        success: boolean;
        results: BatchTransferResult;
        timestamp: string;
    }> {
        if (!this.treasuryKeypair) {
            return {
                success: false,
                results: {
                    success: false,
                    totalProcessed: 0,
                    successful: [],
                    failed: payments.map(p => ({
                        employeeId: p.employeeId,
                        error: 'Treasury wallet not initialized',
                    })),
                },
                timestamp: new Date().toISOString(),
            };
        }

        const transfers: BatchTransferItem[] = payments.map(p => ({
            recipientAddress: p.walletAddress,
            amount: p.amount,
            employeeId: p.employeeId,
            employeeName: p.employeeName,
        }));

        const results = await batchTransferUSDC(this.treasuryKeypair, transfers);

        return {
            success: results.success,
            results,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Validate employee wallet address
     */
    validateWalletAddress(address: string): { valid: boolean; error?: string } {
        if (!address || address.trim() === '') {
            return { valid: false, error: 'Wallet address is required' };
        }

        if (!isValidSolanaAddress(address)) {
            return { valid: false, error: 'Invalid Solana wallet address format' };
        }

        return { valid: true };
    }

    /**
     * Get Solana Explorer URL for transaction
     */
    getExplorerUrl(signature: string): string {
        return `${SOLANA_CONFIG.explorerUrl}/tx/${signature}?cluster=${SOLANA_CONFIG.network}`;
    }

    /**
     * Get Solana Explorer URL for address
     */
    getAddressExplorerUrl(address: string): string {
        return `${SOLANA_CONFIG.explorerUrl}/address/${address}?cluster=${SOLANA_CONFIG.network}`;
    }

    /**
     * Format USDC amount for display
     */
    formatUSDC(amount: number): string {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
        }).format(amount);
    }

    /**
     * Check network health
     */
    async checkNetworkHealth(): Promise<{ healthy: boolean; blockHeight?: number; error?: string }> {
        try {
            const conn = getConnection();
            const blockHeight = await conn.getBlockHeight();
            return { healthy: true, blockHeight };
        } catch (error: any) {
            return { healthy: false, error: error.message };
        }
    }
}

// Export singleton instance
export const solanaService = new SolanaService();
export default solanaService;
