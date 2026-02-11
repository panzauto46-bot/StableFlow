package com.stableflow.app.data.solana;

import android.util.Log;

import androidx.annotation.NonNull;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * SolanaClient
 * Handles Solana RPC calls for balance checking and USDC operations
 */
public class SolanaClient {

    private static final String TAG = "SolanaClient";

    // RPC Endpoints
    private static final String MAINNET_RPC = "https://api.mainnet-beta.solana.com";
    private static final String DEVNET_RPC = "https://api.devnet.solana.com";

    // USDC Token Program IDs
    private static final String USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    private static final String USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

    // Token Program
    private static final String TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final boolean useDevnet;

    public SolanaClient(boolean useDevnet) {
        this.useDevnet = useDevnet;
    }

    public String getRpcUrl() {
        return useDevnet ? DEVNET_RPC : MAINNET_RPC;
    }

    public String getUsdcMint() {
        return useDevnet ? USDC_MINT_DEVNET : USDC_MINT_MAINNET;
    }

    // ==================
    // CALLBACKS
    // ==================

    public interface BalanceCallback {
        void onSuccess(double solBalance, double usdcBalance);

        void onError(String error);
    }

    public interface TransactionCallback {
        void onSuccess(String signature);

        void onError(String error);
    }

    // ==================
    // BALANCE CHECKING
    // ==================

    /**
     * Get SOL balance for a wallet address
     */
    public void getSolBalance(String walletAddress, BalanceCallback callback) {
        executor.execute(() -> {
            try {
                JSONObject request = new JSONObject();
                request.put("jsonrpc", "2.0");
                request.put("id", 1);
                request.put("method", "getBalance");
                request.put("params", new JSONArray().put(walletAddress));

                String response = makeRpcCall(request.toString());
                JSONObject json = new JSONObject(response);

                if (json.has("result")) {
                    long lamports = json.getJSONObject("result").getLong("value");
                    double solBalance = lamports / 1_000_000_000.0; // Convert lamports to SOL
                    callback.onSuccess(solBalance, 0);
                } else if (json.has("error")) {
                    callback.onError(json.getJSONObject("error").getString("message"));
                }
            } catch (Exception e) {
                Log.e(TAG, "getSolBalance error: " + e.getMessage());
                callback.onError(e.getMessage());
            }
        });
    }

    /**
     * Get USDC balance for a wallet address
     */
    public void getUsdcBalance(String walletAddress, BalanceCallback callback) {
        executor.execute(() -> {
            try {
                // Get token accounts by owner
                JSONObject request = new JSONObject();
                request.put("jsonrpc", "2.0");
                request.put("id", 1);
                request.put("method", "getTokenAccountsByOwner");

                JSONArray params = new JSONArray();
                params.put(walletAddress);

                JSONObject mintFilter = new JSONObject();
                mintFilter.put("mint", getUsdcMint());
                params.put(mintFilter);

                JSONObject encoding = new JSONObject();
                encoding.put("encoding", "jsonParsed");
                params.put(encoding);

                request.put("params", params);

                String response = makeRpcCall(request.toString());
                JSONObject json = new JSONObject(response);

                if (json.has("result")) {
                    JSONArray accounts = json.getJSONObject("result").getJSONArray("value");
                    double usdcBalance = 0;

                    for (int i = 0; i < accounts.length(); i++) {
                        JSONObject account = accounts.getJSONObject(i);
                        JSONObject parsed = account.getJSONObject("account")
                                .getJSONObject("data")
                                .getJSONObject("parsed")
                                .getJSONObject("info")
                                .getJSONObject("tokenAmount");

                        usdcBalance += parsed.getDouble("uiAmount");
                    }

                    callback.onSuccess(0, usdcBalance);
                } else if (json.has("error")) {
                    callback.onError(json.getJSONObject("error").getString("message"));
                }
            } catch (Exception e) {
                Log.e(TAG, "getUsdcBalance error: " + e.getMessage());
                callback.onError(e.getMessage());
            }
        });
    }

    /**
     * Get both SOL and USDC balances
     */
    public void getBalances(String walletAddress, BalanceCallback callback) {
        executor.execute(() -> {
            try {
                // Get SOL balance
                JSONObject solRequest = new JSONObject();
                solRequest.put("jsonrpc", "2.0");
                solRequest.put("id", 1);
                solRequest.put("method", "getBalance");
                solRequest.put("params", new JSONArray().put(walletAddress));

                String solResponse = makeRpcCall(solRequest.toString());
                JSONObject solJson = new JSONObject(solResponse);

                double solBalance = 0;
                if (solJson.has("result")) {
                    long lamports = solJson.getJSONObject("result").getLong("value");
                    solBalance = lamports / 1_000_000_000.0;
                }

                // Get USDC balance
                JSONObject usdcRequest = new JSONObject();
                usdcRequest.put("jsonrpc", "2.0");
                usdcRequest.put("id", 2);
                usdcRequest.put("method", "getTokenAccountsByOwner");

                JSONArray params = new JSONArray();
                params.put(walletAddress);

                JSONObject mintFilter = new JSONObject();
                mintFilter.put("mint", getUsdcMint());
                params.put(mintFilter);

                JSONObject encoding = new JSONObject();
                encoding.put("encoding", "jsonParsed");
                params.put(encoding);

                usdcRequest.put("params", params);

                String usdcResponse = makeRpcCall(usdcRequest.toString());
                JSONObject usdcJson = new JSONObject(usdcResponse);

                double usdcBalance = 0;
                if (usdcJson.has("result")) {
                    JSONArray accounts = usdcJson.getJSONObject("result").getJSONArray("value");
                    for (int i = 0; i < accounts.length(); i++) {
                        JSONObject account = accounts.getJSONObject(i);
                        JSONObject parsed = account.getJSONObject("account")
                                .getJSONObject("data")
                                .getJSONObject("parsed")
                                .getJSONObject("info")
                                .getJSONObject("tokenAmount");

                        usdcBalance += parsed.getDouble("uiAmount");
                    }
                }

                callback.onSuccess(solBalance, usdcBalance);

            } catch (Exception e) {
                Log.e(TAG, "getBalances error: " + e.getMessage());
                callback.onError(e.getMessage());
            }
        });
    }

    // ==================
    // TRANSACTION INFO
    // ==================

    /**
     * Get transaction details by signature
     */
    public void getTransaction(String signature, TransactionCallback callback) {
        executor.execute(() -> {
            try {
                JSONObject request = new JSONObject();
                request.put("jsonrpc", "2.0");
                request.put("id", 1);
                request.put("method", "getTransaction");

                JSONArray params = new JSONArray();
                params.put(signature);

                JSONObject options = new JSONObject();
                options.put("encoding", "jsonParsed");
                options.put("maxSupportedTransactionVersion", 0);
                params.put(options);

                request.put("params", params);

                String response = makeRpcCall(request.toString());
                JSONObject json = new JSONObject(response);

                if (json.has("result") && !json.isNull("result")) {
                    callback.onSuccess(signature);
                } else {
                    callback.onError("Transaction not found");
                }
            } catch (Exception e) {
                Log.e(TAG, "getTransaction error: " + e.getMessage());
                callback.onError(e.getMessage());
            }
        });
    }

    /**
     * Check if a transaction is confirmed
     */
    public void isTransactionConfirmed(String signature, TransactionCallback callback) {
        executor.execute(() -> {
            try {
                JSONObject request = new JSONObject();
                request.put("jsonrpc", "2.0");
                request.put("id", 1);
                request.put("method", "getSignatureStatuses");

                JSONArray signatures = new JSONArray();
                signatures.put(signature);

                JSONArray params = new JSONArray();
                params.put(signatures);

                request.put("params", params);

                String response = makeRpcCall(request.toString());
                JSONObject json = new JSONObject(response);

                if (json.has("result")) {
                    JSONArray values = json.getJSONObject("result").getJSONArray("value");
                    if (values.length() > 0 && !values.isNull(0)) {
                        JSONObject status = values.getJSONObject(0);
                        String confirmationStatus = status.optString("confirmationStatus", "");

                        if ("confirmed".equals(confirmationStatus) || "finalized".equals(confirmationStatus)) {
                            callback.onSuccess(signature);
                        } else {
                            callback.onError("Transaction pending: " + confirmationStatus);
                        }
                    } else {
                        callback.onError("Transaction not found");
                    }
                } else {
                    callback.onError("Failed to check status");
                }
            } catch (Exception e) {
                Log.e(TAG, "isTransactionConfirmed error: " + e.getMessage());
                callback.onError(e.getMessage());
            }
        });
    }

    // ==================
    // HELPER METHODS
    // ==================

    private String makeRpcCall(String jsonPayload) throws Exception {
        URL url = new URL(getRpcUrl());
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        conn.setConnectTimeout(30000);
        conn.setReadTimeout(30000);

        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        StringBuilder response = new StringBuilder();
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }
        }

        return response.toString();
    }

    /**
     * Get Solana Explorer URL for a transaction
     */
    public String getExplorerUrl(String signature) {
        String cluster = useDevnet ? "?cluster=devnet" : "";
        return "https://explorer.solana.com/tx/" + signature + cluster;
    }

    /**
     * Get Solscan URL for a transaction
     */
    public String getSolscanUrl(String signature) {
        String cluster = useDevnet ? "?cluster=devnet" : "";
        return "https://solscan.io/tx/" + signature + cluster;
    }

    /**
     * Validate Solana wallet address format
     */
    public static boolean isValidAddress(String address) {
        if (address == null || address.isEmpty())
            return false;
        if (address.length() < 32 || address.length() > 44)
            return false;
        return address.matches("^[1-9A-HJ-NP-Za-km-z]+$");
    }
}
