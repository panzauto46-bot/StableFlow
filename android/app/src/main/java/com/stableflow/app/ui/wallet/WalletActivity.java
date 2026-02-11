package com.stableflow.app.ui.wallet;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.widget.Toolbar;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.stableflow.app.R;
import com.stableflow.app.data.model.User;
import com.stableflow.app.data.repository.FirebaseRepository;
import com.stableflow.app.data.solana.SolanaManager;
import com.stableflow.app.ui.base.BaseActivity;

import java.text.NumberFormat;
import java.util.Locale;

/**
 * WalletActivity
 * Shows Solana wallet details and balance
 */
public class WalletActivity extends BaseActivity {

    private SolanaManager solanaManager;
    private FirebaseRepository firebaseRepository;

    // Views
    private TextView tvWalletAddress, tvSolBalance, tvUsdcBalance;
    private TextView tvWalletStatus;
    private LinearLayout walletInfoContainer, noWalletContainer;
    private ProgressBar progressLoading;
    private SwipeRefreshLayout swipeRefresh;
    private Button btnConnectWallet, btnReceivePayment;
    private FrameLayout btnCopyAddress;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_wallet);

        solanaManager = SolanaManager.getInstance();
        firebaseRepository = FirebaseRepository.getInstance();

        initViews();
        setupToolbar();
        setupClickListeners();
        observeData();

        // Load wallet from user profile
        loadWalletFromProfile();
    }

    private void initViews() {
        tvWalletAddress = findViewById(R.id.tv_wallet_address);
        tvSolBalance = findViewById(R.id.tv_sol_balance);
        tvUsdcBalance = findViewById(R.id.tv_usdc_balance);
        tvWalletStatus = findViewById(R.id.tv_wallet_status);

        walletInfoContainer = findViewById(R.id.wallet_info_container);
        noWalletContainer = findViewById(R.id.no_wallet_container);

        progressLoading = findViewById(R.id.progress_loading);
        swipeRefresh = findViewById(R.id.swipe_refresh);
        swipeRefresh.setColorSchemeResources(R.color.gold_primary);
        swipeRefresh.setProgressBackgroundColorSchemeResource(R.color.card_background);

        btnConnectWallet = findViewById(R.id.btn_connect_wallet);
        btnReceivePayment = findViewById(R.id.btn_receive_payment);
        btnCopyAddress = findViewById(R.id.btn_copy_address);
    }

    private void setupToolbar() {
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(R.string.wallet_solana);
        }
        toolbar.setNavigationOnClickListener(v -> onBackPressed());
    }

    private void setupClickListeners() {
        // Swipe refresh
        swipeRefresh.setOnRefreshListener(() -> {
            solanaManager.refreshBalances();
        });

        // Copy address
        btnCopyAddress.setOnClickListener(v -> {
            String address = solanaManager.getCurrentWalletAddress();
            if (address != null) {
                copyToClipboard(address);
                Toast.makeText(this, R.string.address_copied, Toast.LENGTH_SHORT).show();
            }
        });

        // Connect wallet button (for when no wallet is set)
        btnConnectWallet.setOnClickListener(v -> {
            // Navigate to settings to set wallet
            Toast.makeText(this, R.string.set_wallet_hint, Toast.LENGTH_SHORT).show();
        });

        // Receive payment
        btnReceivePayment.setOnClickListener(v -> {
            String address = solanaManager.getCurrentWalletAddress();
            if (address != null) {
                // Show QR or share address
                shareWalletAddress(address);
            }
        });
    }

    private void observeData() {
        // SOL Balance
        solanaManager.getSolBalance().observe(this, balance -> {
            tvSolBalance.setText(formatSolBalance(balance));
        });

        // USDC Balance
        solanaManager.getUsdcBalance().observe(this, balance -> {
            tvUsdcBalance.setText(formatUsdcBalance(balance));
        });

        // Loading state
        solanaManager.getIsLoading().observe(this, isLoading -> {
            swipeRefresh.setRefreshing(isLoading);
            progressLoading.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        });

        // Error messages
        solanaManager.getErrorMessage().observe(this, error -> {
            if (error != null && !error.isEmpty()) {
                Toast.makeText(this, error, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void loadWalletFromProfile() {
        firebaseRepository.getCurrentUserLiveData().observe(this, user -> {
            if (user != null) {
                updateWalletUI(user);
            }
        });
    }

    private void updateWalletUI(User user) {
        String walletAddress = user.getWalletAddress();

        if (walletAddress != null && !walletAddress.isEmpty()) {
            // Wallet is set
            walletInfoContainer.setVisibility(View.VISIBLE);
            noWalletContainer.setVisibility(View.GONE);

            tvWalletAddress.setText(user.getFormattedWalletAddress());
            tvWalletStatus.setText("Terhubung");
            tvWalletStatus.setTextColor(getColor(R.color.success_green));

            // Set wallet and fetch balances
            solanaManager.setWalletAddress(walletAddress);
        } else {
            // No wallet
            walletInfoContainer.setVisibility(View.GONE);
            noWalletContainer.setVisibility(View.VISIBLE);
        }
    }

    private String formatSolBalance(double balance) {
        return String.format(Locale.US, "%.4f SOL", balance);
    }

    private String formatUsdcBalance(double balance) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.US);
        return formatter.format(balance) + " USDC";
    }

    private void copyToClipboard(String text) {
        ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("wallet_address", text);
        clipboard.setPrimaryClip(clip);
    }

    private void shareWalletAddress(String address) {
        android.content.Intent shareIntent = new android.content.Intent();
        shareIntent.setAction(android.content.Intent.ACTION_SEND);
        shareIntent.putExtra(android.content.Intent.EXTRA_TEXT,
                "Alamat Wallet Solana saya:\n" + address);
        shareIntent.setType("text/plain");
        startActivity(android.content.Intent.createChooser(shareIntent, "Bagikan Alamat Wallet"));
    }
}
