package com.stableflow.app.ui.dashboard;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.stableflow.app.R;
import com.stableflow.app.data.model.ExpenseRequest;
import com.stableflow.app.data.model.User;
import com.stableflow.app.ui.analytics.AnalyticsActivity;
import com.stableflow.app.ui.auth.LoginActivity;
import com.stableflow.app.ui.base.BaseActivity;
import com.stableflow.app.ui.expense.ExpenseDetailActivity;
import com.stableflow.app.ui.expense.SubmitExpenseActivity;
import com.stableflow.app.ui.settings.SettingsActivity;

import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * DashboardActivity
 * Main dashboard showing balance, stats, and expense list
 */
public class DashboardActivity extends BaseActivity {

    private DashboardViewModel viewModel;
    private ExpenseAdapter expenseAdapter;

    // Views
    private TextView tvAvatar, tvUserName, tvUserEmail;
    private TextView tvBalance, tvLastUpdated;
    private TextView tvIncome, tvExpense;
    private TextView tvNotificationCount;
    private TextView tvWalletAddress, tvWalletStatus;
    private FrameLayout badgeNotifications;
    private RecyclerView rvExpenses;
    private LinearLayout emptyState, walletAddressContainer;
    private SwipeRefreshLayout swipeRefresh;
    private FloatingActionButton fabAdd;
    private ImageView ivRefresh;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        viewModel = new ViewModelProvider(this).get(DashboardViewModel.class);

        initViews();
        setupRecyclerView();
        setupClickListeners();
        observeViewModel();
    }

    private void initViews() {
        // User info
        tvAvatar = findViewById(R.id.tv_avatar);
        tvUserName = findViewById(R.id.tv_user_name);
        tvUserEmail = findViewById(R.id.tv_user_email);

        // Balance
        tvBalance = findViewById(R.id.tv_balance);
        tvLastUpdated = findViewById(R.id.tv_last_updated);
        ivRefresh = findViewById(R.id.iv_refresh);

        // Wallet address
        walletAddressContainer = findViewById(R.id.wallet_address_container);
        tvWalletAddress = findViewById(R.id.tv_wallet_address);
        tvWalletStatus = findViewById(R.id.tv_wallet_status);

        // Stats
        tvIncome = findViewById(R.id.tv_income);
        tvExpense = findViewById(R.id.tv_expense);

        // Notifications
        badgeNotifications = findViewById(R.id.badge_notifications);
        tvNotificationCount = findViewById(R.id.tv_notification_count);

        // Expenses
        rvExpenses = findViewById(R.id.rv_expenses);
        emptyState = findViewById(R.id.empty_state);

        // SwipeRefresh
        swipeRefresh = findViewById(R.id.swipe_refresh);
        swipeRefresh.setColorSchemeResources(R.color.gold_primary);
        swipeRefresh.setProgressBackgroundColorSchemeResource(R.color.card_background);

        // FAB
        fabAdd = findViewById(R.id.fab_add);
    }

    private void setupRecyclerView() {
        expenseAdapter = new ExpenseAdapter(new ArrayList<>(), expense -> {
            // Open expense detail
            if (expense.getId() != null) {
                Intent intent = new Intent(this, ExpenseDetailActivity.class);
                intent.putExtra(ExpenseDetailActivity.EXTRA_EXPENSE_ID, expense.getId());
                startActivity(intent);
            } else {
                Toast.makeText(this, "ID klaim tidak valid", Toast.LENGTH_SHORT).show();
            }
        });

        rvExpenses.setLayoutManager(new LinearLayoutManager(this));
        rvExpenses.setAdapter(expenseAdapter);
        rvExpenses.setNestedScrollingEnabled(false);
    }

    private void setupClickListeners() {
        // Refresh balance
        findViewById(R.id.btn_refresh).setOnClickListener(v -> {
            ivRefresh.animate().rotation(ivRefresh.getRotation() + 360).setDuration(500).start();
            viewModel.refresh();
        });

        // Quick actions
        findViewById(R.id.btn_send).setOnClickListener(
                v -> Toast.makeText(this, "Fitur Kirim akan segera hadir", Toast.LENGTH_SHORT).show());

        findViewById(R.id.btn_receive).setOnClickListener(
                v -> Toast.makeText(this, "Fitur Terima akan segera hadir", Toast.LENGTH_SHORT).show());

        findViewById(R.id.btn_scan).setOnClickListener(
                v -> Toast.makeText(this, "Fitur Scan akan segera hadir", Toast.LENGTH_SHORT).show());

        findViewById(R.id.btn_reimburse).setOnClickListener(v -> navigateToSubmitExpense());

        // Add expense button
        findViewById(R.id.btn_add_expense).setOnClickListener(v -> navigateToSubmitExpense());

        // FAB
        fabAdd.setOnClickListener(v -> navigateToSubmitExpense());

        // Swipe refresh
        swipeRefresh.setOnRefreshListener(() -> viewModel.refresh());

        // Logout
        findViewById(R.id.btn_logout).setOnClickListener(v -> showLogoutConfirmation());

        // Bottom navigation
        BottomNavigationView bottomNav = findViewById(R.id.bottom_nav);
        bottomNav.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();
            if (itemId == R.id.nav_wallet) {
                // Already on wallet
                return true;
            } else if (itemId == R.id.nav_analytics) {
                startActivity(new Intent(this, AnalyticsActivity.class));
                return true;
            } else if (itemId == R.id.nav_claims) {
                // Scroll to expenses
                rvExpenses.smoothScrollToPosition(0);
                return true;
            } else if (itemId == R.id.nav_settings) {
                startActivity(new Intent(this, SettingsActivity.class));
                return true;
            }
            return false;
        });
    }

    private void observeViewModel() {
        // User data
        viewModel.getCurrentUser().observe(this, user -> {
            if (user != null) {
                updateUserUI(user);
            }
        });

        // Balance
        viewModel.getBalance().observe(this, balance -> {
            if (balance != null) {
                tvBalance.setText(formatCurrency(balance));
                tvLastUpdated.setText(getString(R.string.last_updated,
                        new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date())));
            }
        });

        // Expenses
        viewModel.getExpenses().observe(this, expenses -> {
            updateExpensesList(expenses);
        });

        // Refreshing state
        viewModel.getIsRefreshing().observe(this, isRefreshing -> {
            swipeRefresh.setRefreshing(isRefreshing);
        });

        // Stats
        viewModel.getPendingCount().observe(this, count -> {
            if (count != null && count > 0) {
                badgeNotifications.setVisibility(View.VISIBLE);
                tvNotificationCount.setText(String.valueOf(count));
            } else {
                badgeNotifications.setVisibility(View.GONE);
            }
        });

        // Toast messages
        viewModel.getToastMessage().observe(this, message -> {
            if (message != null && !message.isEmpty()) {
                Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
                viewModel.clearToast();
            }
        });
    }

    private void updateUserUI(User user) {
        tvAvatar.setText(user.getInitials());
        tvUserName.setText(user.getDisplayName() != null ? user.getDisplayName() : getString(R.string.user));
        tvUserEmail.setText(user.getEmail());

        // Update wallet address display
        if (user.getWalletAddress() != null && !user.getWalletAddress().isEmpty()) {
            tvWalletAddress.setText(user.getFormattedWalletAddress());
            tvWalletStatus.setText(R.string.wallet_connected);
            tvWalletStatus.setTextColor(getColor(R.color.success_green));
            tvWalletStatus.setBackgroundResource(R.drawable.bg_status_approved);
        } else {
            tvWalletAddress.setText(R.string.wallet_not_connected);
            tvWalletStatus.setText(R.string.wallet_offline);
            tvWalletStatus.setTextColor(getColor(R.color.error_red));
            tvWalletStatus.setBackgroundResource(R.drawable.bg_status_rejected);
        }

        // Make wallet container clickable to open settings
        walletAddressContainer.setOnClickListener(v -> {
            startActivity(new Intent(this, SettingsActivity.class));
        });
    }

    private void updateExpensesList(List<ExpenseRequest> expenses) {
        if (expenses == null || expenses.isEmpty()) {
            rvExpenses.setVisibility(View.GONE);
            emptyState.setVisibility(View.VISIBLE);
            expenseAdapter.updateData(new ArrayList<>());
        } else {
            rvExpenses.setVisibility(View.VISIBLE);
            emptyState.setVisibility(View.GONE);
            expenseAdapter.updateData(expenses);
        }
    }

    private String formatCurrency(double amount) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.US);
        return formatter.format(amount).replace("$", "$");
    }

    private void navigateToSubmitExpense() {
        Intent intent = new Intent(this, SubmitExpenseActivity.class);
        startActivity(intent);
        overridePendingTransition(android.R.anim.slide_in_left, android.R.anim.fade_out);
    }

    private void showLogoutConfirmation() {
        new AlertDialog.Builder(this, R.style.Theme_StableFlow)
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
