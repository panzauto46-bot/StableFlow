/**
 * StableFlow - Solana Configuration
 * Production-ready Solana integration for USDC transfers
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';

// Solana Network Configuration
export const SOLANA_CONFIG = {
  // Devnet for development/hackathon
  network: 'devnet' as const,
  rpcUrl: 'https://api.devnet.solana.com',
  wsUrl: 'wss://api.devnet.solana.com',
  
  // USDC Token Mint Address on Devnet
  // This is the official USDC-Dev token on Solana Devnet
  usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  
  // USDC Decimals (6 decimals for USDC)
  usdcDecimals: 6,
  
  // Explorer URL
  explorerUrl: 'https://explorer.solana.com',
};

// Connection singleton
let connection: Connection | null = null;

export const getConnection = (): Connection => {
  if (!connection) {
    connection = new Connection(SOLANA_CONFIG.rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: SOLANA_CONFIG.wsUrl,
    });
  }
  return connection;
};

// Get USDC Mint Public Key
export const getUSDCMint = (): PublicKey => {
  return new PublicKey(SOLANA_CONFIG.usdcMint);
};

/**
 * Get SOL Balance for a wallet
 */
export const getSolBalance = async (walletAddress: string): Promise<number> => {
  try {
    const conn = getConnection();
    const publicKey = new PublicKey(walletAddress);
    const balance = await conn.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error fetching SOL balance:', error);
    return 0;
  }
};

/**
 * Get USDC Balance for a wallet
 * Returns balance in USDC (not lamports)
 */
export const getUSDCBalance = async (walletAddress: string): Promise<number> => {
  try {
    const conn = getConnection();
    const walletPubkey = new PublicKey(walletAddress);
    const usdcMint = getUSDCMint();
    
    const tokenAccountAddress = await getAssociatedTokenAddress(
      usdcMint,
      walletPubkey
    );
    
    const tokenAccountInfo = await conn.getTokenAccountBalance(tokenAccountAddress);
    return tokenAccountInfo.value.uiAmount ?? 0;
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    return 0;
  }
};

/**
 * Transfer USDC from one wallet to another
 * This is the core function for paying employees
 */
export interface TransferResult {
  success: boolean;
  signature?: string;
  error?: string;
  explorerUrl?: string;
}

export const transferUSDC = async (
  senderKeypair: Keypair,
  recipientAddress: string,
  amount: number
): Promise<TransferResult> => {
  try {
    const conn = getConnection();
    const usdcMint = getUSDCMint();
    const recipientPubkey = new PublicKey(recipientAddress);
    
    // Get or create sender's associated token account
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      conn,
      senderKeypair,
      usdcMint,
      senderKeypair.publicKey
    );
    
    // Get or create recipient's associated token account
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      conn,
      senderKeypair, // Payer for creating account if needed
      usdcMint,
      recipientPubkey
    );
    
    // Convert amount to token units (USDC has 6 decimals)
    const tokenAmount = Math.floor(amount * Math.pow(10, SOLANA_CONFIG.usdcDecimals));
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      senderTokenAccount.address,
      recipientTokenAccount.address,
      senderKeypair.publicKey,
      tokenAmount,
      [],
      TOKEN_PROGRAM_ID
    );
    
    // Create and send transaction
    const transaction = new Transaction().add(transferInstruction);
    
    const signature = await sendAndConfirmTransaction(
      conn,
      transaction,
      [senderKeypair],
      {
        commitment: 'confirmed',
      }
    );
    
    return {
      success: true,
      signature,
      explorerUrl: `${SOLANA_CONFIG.explorerUrl}/tx/${signature}?cluster=${SOLANA_CONFIG.network}`,
    };
  } catch (error: any) {
    console.error('USDC Transfer Error:', error);
    return {
      success: false,
      error: error.message || 'Transfer failed',
    };
  }
};

/**
 * Batch transfer USDC to multiple recipients
 * Useful for payroll processing
 */
export interface BatchTransferItem {
  recipientAddress: string;
  amount: number;
  employeeId: string;
  employeeName: string;
}

export interface BatchTransferResult {
  success: boolean;
  totalProcessed: number;
  successful: Array<{ employeeId: string; signature: string }>;
  failed: Array<{ employeeId: string; error: string }>;
}

export const batchTransferUSDC = async (
  senderKeypair: Keypair,
  transfers: BatchTransferItem[]
): Promise<BatchTransferResult> => {
  const results: BatchTransferResult = {
    success: true,
    totalProcessed: 0,
    successful: [],
    failed: [],
  };
  
  for (const transfer of transfers) {
    const result = await transferUSDC(
      senderKeypair,
      transfer.recipientAddress,
      transfer.amount
    );
    
    results.totalProcessed++;
    
    if (result.success && result.signature) {
      results.successful.push({
        employeeId: transfer.employeeId,
        signature: result.signature,
      });
    } else {
      results.failed.push({
        employeeId: transfer.employeeId,
        error: result.error || 'Unknown error',
      });
      results.success = false;
    }
  }
  
  return results;
};

/**
 * Create a new Solana wallet (for demo purposes)
 * In production, use proper key management
 */
export const createWallet = (): { publicKey: string; secretKey: Uint8Array } => {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: keypair.secretKey,
  };
};

/**
 * Restore wallet from secret key
 */
export const restoreWallet = (secretKey: Uint8Array): Keypair => {
  return Keypair.fromSecretKey(secretKey);
};

/**
 * Request airdrop for testing (Devnet only)
 */
export const requestAirdrop = async (walletAddress: string, amount: number = 1): Promise<boolean> => {
  try {
    const conn = getConnection();
    const publicKey = new PublicKey(walletAddress);
    const signature = await conn.requestAirdrop(publicKey, amount * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(signature, 'confirmed');
    return true;
  } catch (error) {
    console.error('Airdrop failed:', error);
    return false;
  }
};

/**
 * Validate Solana wallet address
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get transaction history for a wallet
 */
export const getTransactionHistory = async (
  walletAddress: string,
  limit: number = 10
): Promise<any[]> => {
  try {
    const conn = getConnection();
    const publicKey = new PublicKey(walletAddress);
    const signatures = await conn.getSignaturesForAddress(publicKey, { limit });
    
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await conn.getTransaction(sig.signature, {
          commitment: 'confirmed',
        });
        return {
          signature: sig.signature,
          slot: sig.slot,
          blockTime: sig.blockTime,
          memo: sig.memo,
          confirmationStatus: sig.confirmationStatus,
          transaction: tx,
        };
      })
    );
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
};

export default {
  SOLANA_CONFIG,
  getConnection,
  getUSDCMint,
  getSolBalance,
  getUSDCBalance,
  transferUSDC,
  batchTransferUSDC,
  createWallet,
  restoreWallet,
  requestAirdrop,
  isValidSolanaAddress,
  getTransactionHistory,
};
