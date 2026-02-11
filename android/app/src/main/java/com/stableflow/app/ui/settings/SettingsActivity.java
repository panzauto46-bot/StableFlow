package com.stableflow.app.ui.settings;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.widget.Toolbar;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.textfield.TextInputEditText;
import com.stableflow.app.R;
import com.stableflow.app.data.model.User;
import com.stableflow.app.ui.auth.LoginActivity;
import com.stableflow.app.ui.base.BaseActivity;
import com.stableflow.app.ui.dashboard.DashboardActivity;
import com.stableflow.app.util.LocaleHelper;

/**
 * SettingsActivity
 * User settings and profile management with language switching
 */
public class SettingsActivity extends BaseActivity {

    private SettingsViewModel viewModel;

    // Views
    private TextView tvAvatar, tvUserName, tvUserEmail;
    private TextView tvWalletAddress, tvWalletStatus;
    private TextView tvCurrentLanguage;
    private LinearLayout walletContainer, itemLanguage;
    private Button btnEditWallet, btnLogout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        viewModel = new ViewModelProvider(this).get(SettingsViewModel.class);

        initViews();
        setupToolbar();
        setupClickListeners();
        observeViewModel();
        updateLanguageDisplay();
    }

    private void initViews() {
        // Profile
        tvAvatar = findViewById(R.id.tv_avatar);
        tvUserName = findViewById(R.id.tv_user_name);
        tvUserEmail = findViewById(R.id.tv_user_email);

        // Wallet
        walletContainer = findViewById(R.id.wallet_container);
        tvWalletAddress = findViewById(R.id.tv_wallet_address);
        tvWalletStatus = findViewById(R.id.tv_wallet_status);
        btnEditWallet = findViewById(R.id.btn_edit_wallet);

        // Language
        itemLanguage = findViewById(R.id.item_language);
        tvCurrentLanguage = findViewById(R.id.tv_current_language);

        // Actions
        btnLogout = findViewById(R.id.btn_logout);
    }

    private void setupToolbar() {
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(R.string.settings);
        }
        toolbar.setNavigationOnClickListener(v -> onBackPressed());
    }

    private void setupClickListeners() {
        // Edit wallet
        btnEditWallet.setOnClickListener(v -> showWalletDialog());

        // Copy wallet address
        walletContainer.setOnClickListener(v -> {
            User user = viewModel.getCurrentUser().getValue();
            if (user != null && user.getWalletAddress() != null) {
                copyToClipboard(user.getWalletAddress());
                Toast.makeText(this, R.string.wallet_saved_success, Toast.LENGTH_SHORT).show();
            }
        });

        // Language selection
        itemLanguage.setOnClickListener(v -> showLanguageDialog());

        // Logout
        btnLogout.setOnClickListener(v -> showLogoutConfirmation());

        // About section
        findViewById(R.id.item_about)
                .setOnClickListener(v -> Toast.makeText(this, R.string.version_info, Toast.LENGTH_SHORT).show());

        // Privacy policy
        findViewById(R.id.item_privacy).setOnClickListener(
                v -> Toast.makeText(this, R.string.coming_soon, Toast.LENGTH_SHORT).show());

        // Terms of service
        findViewById(R.id.item_terms).setOnClickListener(
                v -> Toast.makeText(this, R.string.coming_soon, Toast.LENGTH_SHORT).show());

        // Help & Support
        findViewById(R.id.item_help).setOnClickListener(
                v -> Toast.makeText(this, R.string.coming_soon, Toast.LENGTH_SHORT).show());
    }

    private void observeViewModel() {
        viewModel.getCurrentUser().observe(this, user -> {
            if (user != null) {
                updateUserUI(user);
            }
        });

        viewModel.getSaveSuccess().observe(this, success -> {
            if (success != null && success) {
                Toast.makeText(this, R.string.wallet_saved_success, Toast.LENGTH_SHORT).show();
            }
        });

        viewModel.getErrorMessage().observe(this, error -> {
            if (error != null && !error.isEmpty()) {
                Toast.makeText(this, error, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void updateUserUI(User user) {
        tvAvatar.setText(user.getInitials());
        tvUserName.setText(user.getDisplayName() != null ? user.getDisplayName() : getString(R.string.user));
        tvUserEmail.setText(user.getEmail());

        // Wallet
        if (user.getWalletAddress() != null && !user.getWalletAddress().isEmpty()) {
            tvWalletAddress.setText(user.getFormattedWalletAddress());
            tvWalletStatus.setText(R.string.wallet_connected);
            tvWalletStatus.setTextColor(getColor(R.color.success_green));
        } else {
            tvWalletAddress.setText(R.string.wallet_not_set);
            tvWalletStatus.setText(R.string.wallet_not_connected);
            tvWalletStatus.setTextColor(getColor(R.color.error_red));
        }
    }

    private void updateLanguageDisplay() {
        String currentLang = LocaleHelper.getPersistedLanguage(this);
        tvCurrentLanguage.setText(LocaleHelper.getLanguageDisplayName(currentLang));
    }

    private void showLanguageDialog() {
        final String[] languages = {
                getString(R.string.language_english),
                getString(R.string.language_indonesian)
        };
        final String[] languageCodes = {
                LocaleHelper.LANGUAGE_ENGLISH,
                LocaleHelper.LANGUAGE_INDONESIAN
        };

        String currentLang = LocaleHelper.getPersistedLanguage(this);
        int selectedIndex = currentLang.equals(LocaleHelper.LANGUAGE_ENGLISH) ? 0 : 1;

        new AlertDialog.Builder(this)
                .setTitle(R.string.select_language)
                .setSingleChoiceItems(languages, selectedIndex, (dialog, which) -> {
                    String selectedLang = languageCodes[which];
                    if (!selectedLang.equals(currentLang)) {
                        // Set new locale
                        LocaleHelper.setLocale(this, selectedLang);

                        // Show success message
                        Toast.makeText(this, R.string.language_changed, Toast.LENGTH_SHORT).show();

                        dialog.dismiss();

                        // Restart activity to apply changes
                        restartApp();
                    } else {
                        dialog.dismiss();
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void restartApp() {
        // Restart from Dashboard to apply locale to all activities
        Intent intent = new Intent(this, DashboardActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void showWalletDialog() {
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_wallet_input, null);
        TextInputEditText etWallet = dialogView.findViewById(R.id.et_wallet_address);

        User user = viewModel.getCurrentUser().getValue();
        if (user != null && user.getWalletAddress() != null) {
            etWallet.setText(user.getWalletAddress());
        }

        new AlertDialog.Builder(this)
                .setTitle(R.string.wallet_input_title)
                .setMessage(R.string.wallet_input_message)
                .setView(dialogView)
                .setPositiveButton(R.string.save, (dialog, which) -> {
                    String address = etWallet.getText() != null ? etWallet.getText().toString().trim() : "";
                    if (isValidSolanaAddress(address)) {
                        viewModel.saveWalletAddress(address);
                    } else {
                        Toast.makeText(this, R.string.error_invalid_wallet, Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private boolean isValidSolanaAddress(String address) {
        // Basic validation: Solana addresses are 32-44 characters, base58 encoded
        if (address == null || address.isEmpty())
            return false;
        if (address.length() < 32 || address.length() > 44)
            return false;
        return address.matches("^[1-9A-HJ-NP-Za-km-z]+$");
    }

    private void copyToClipboard(String text) {
        ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("wallet_address", text);
        clipboard.setPrimaryClip(clip);
    }

    private void showLogoutConfirmation() {
        new AlertDialog.Builder(this)
                .setTitle(R.string.logout)
                .setMessage(R.string.logout_confirmation)
                .setPositiveButton(R.string.logout_button, (dialog, which) -> {
                    viewModel.logout();
                    navigateToLogin();
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void navigateToLogin() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
