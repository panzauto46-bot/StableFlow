package com.stableflow.app.data.solana;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.stableflow.app.data.model.User;
import com.stableflow.app.data.repository.FirebaseRepository;

/**
 * SolanaManager
 * Manages Solana wallet operations and balance syncing
 */
public class SolanaManager {

    private static final String TAG = "SolanaManager";

    private static SolanaManager instance;

    private final SolanaClient client;
    private final FirebaseRepository firebaseRepository;

    private final MutableLiveData<Double> solBalance = new MutableLiveData<>(0.0);
    private final MutableLiveData<Double> usdcBalance = new MutableLiveData<>(0.0);
    private final MutableLiveData<Boolean> isLoading = new MutableLiveData<>(false);
    private final MutableLiveData<String> errorMessage = new MutableLiveData<>();

    private String currentWalletAddress = null;

    private SolanaManager() {
        // Use devnet for development, change to false for production
        client = new SolanaClient(true);
        firebaseRepository = FirebaseRepository.getInstance();
    }

    public static synchronized SolanaManager getInstance() {
        if (instance == null) {
            instance = new SolanaManager();
        }
        return instance;
    }

    // ==================
    // LIVE DATA
    // ==================

    public LiveData<Double> getSolBalance() {
        return solBalance;
    }

    public LiveData<Double> getUsdcBalance() {
        return usdcBalance;
    }

    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }

    public LiveData<String> getErrorMessage() {
        return errorMessage;
    }

    // ==================
    // WALLET OPERATIONS
    // ==================

    /**
     * Set the current wallet address and fetch balances
     */
    public void setWalletAddress(String address) {
        if (address != null && SolanaClient.isValidAddress(address)) {
            currentWalletAddress = address;
            refreshBalances();
        } else {
            currentWalletAddress = null;
            solBalance.postValue(0.0);
            usdcBalance.postValue(0.0);
        }
    }

    /**
     * Refresh balances from the blockchain
     */
    public void refreshBalances() {
        if (currentWalletAddress == null) {
            errorMessage.postValue("Wallet address not set");
            return;
        }

        isLoading.postValue(true);

        client.getBalances(currentWalletAddress, new SolanaClient.BalanceCallback() {
            @Override
            public void onSuccess(double sol, double usdc) {
                solBalance.postValue(sol);
                usdcBalance.postValue(usdc);
                isLoading.postValue(false);

                // Sync USDC balance to Firebase for dashboard display
                syncBalanceToFirebase(usdc);
            }

            @Override
            public void onError(String error) {
                Log.e(TAG, "Balance refresh error: " + error);
                errorMessage.postValue(error);
                isLoading.postValue(false);
            }
        });
    }

    /**
     * Sync the USDC balance to Firebase
     */
    private void syncBalanceToFirebase(double usdcAmount) {
        firebaseRepository.updateBalance(usdcAmount, new FirebaseRepository.OperationCallback() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "Balance synced to Firebase: " + usdcAmount);
            }

            @Override
            public void onError(String error) {
                Log.e(TAG, "Failed to sync balance: " + error);
            }
        });
    }

    // ==================
    // TRANSACTION OPERATIONS
    // ==================

    /**
     * Check if a transaction is confirmed
     */
    public void checkTransaction(String signature, SolanaClient.TransactionCallback callback) {
        client.isTransactionConfirmed(signature, callback);
    }

    /**
     * Open transaction in Solana Explorer
     */
    public void openInExplorer(Context context, String signature) {
        String url = client.getExplorerUrl(signature);
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        context.startActivity(intent);
    }

    /**
     * Open transaction in Solscan
     */
    public void openInSolscan(Context context, String signature) {
        String url = client.getSolscanUrl(signature);
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        context.startActivity(intent);
    }

    // ==================
    // DEEP LINK SUPPORT
    // ==================

    /**
     * Create a payment request deep link for Phantom wallet
     * Note: This creates a URL that can be used to request payment
     */
    public String createPaymentRequestUrl(String recipientAddress, double usdcAmount, String memo) {
        // Solana Pay URL format
        // solana:<recipient>?amount=<amount>&spl-token=<mint>&label=<label>&message=<message>

        StringBuilder url = new StringBuilder("solana:");
        url.append(recipientAddress);
        url.append("?amount=").append(usdcAmount);
        url.append("&spl-token=").append(client.getUsdcMint());
        url.append("&label=StableFlow");
        if (memo != null && !memo.isEmpty()) {
            url.append("&message=").append(Uri.encode(memo));
        }

        return url.toString();
    }

    /**
     * Open Phantom wallet for payment (if installed)
     */
    public void openPhantomForPayment(Context context, String paymentUrl) {
        try {
            // Try to open with Phantom
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(paymentUrl));
            intent.setPackage("app.phantom");
            context.startActivity(intent);
        } catch (Exception e) {
            // Phantom not installed, open in browser
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(paymentUrl));
            context.startActivity(intent);
        }
    }

    // ==================
    // UTILITY
    // ==================

    /**
     * Get the current wallet address
     */
    public String getCurrentWalletAddress() {
        return currentWalletAddress;
    }

    /**
     * Check if a wallet is connected
     */
    public boolean isWalletConnected() {
        return currentWalletAddress != null && !currentWalletAddress.isEmpty();
    }

    /**
     * Get a shortened version of the wallet address
     */
    public String getFormattedAddress() {
        if (currentWalletAddress == null)
            return "";
        if (currentWalletAddress.length() <= 12)
            return currentWalletAddress;
        return currentWalletAddress.substring(0, 6) + "..." +
                currentWalletAddress.substring(currentWalletAddress.length() - 4);
    }
}
