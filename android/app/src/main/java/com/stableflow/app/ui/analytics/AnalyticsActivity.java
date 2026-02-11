package com.stableflow.app.ui.analytics;

import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.widget.Toolbar;
import androidx.lifecycle.ViewModelProvider;

import com.stableflow.app.R;
import com.stableflow.app.ui.base.BaseActivity;

import java.text.NumberFormat;
import java.util.Locale;

/**
 * AnalyticsActivity
 * Shows expense statistics and analytics
 */
public class AnalyticsActivity extends BaseActivity {

    private AnalyticsViewModel viewModel;

    // Stats views
    private TextView tvTotalClaims, tvTotalAmount;
    private TextView tvPendingCount, tvApprovedCount, tvPaidCount, tvRejectedCount;
    private TextView tvPendingAmount, tvApprovedAmount, tvPaidAmount, tvRejectedAmount;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_analytics);

        viewModel = new ViewModelProvider(this).get(AnalyticsViewModel.class);

        initViews();
        setupToolbar();
        observeViewModel();
    }

    private void initViews() {
        // Summary
        tvTotalClaims = findViewById(R.id.tv_total_claims);
        tvTotalAmount = findViewById(R.id.tv_total_amount);

        // Status counts
        tvPendingCount = findViewById(R.id.tv_pending_count);
        tvApprovedCount = findViewById(R.id.tv_approved_count);
        tvPaidCount = findViewById(R.id.tv_paid_count);
        tvRejectedCount = findViewById(R.id.tv_rejected_count);

        // Status amounts
        tvPendingAmount = findViewById(R.id.tv_pending_amount);
        tvApprovedAmount = findViewById(R.id.tv_approved_amount);
        tvPaidAmount = findViewById(R.id.tv_paid_amount);
        tvRejectedAmount = findViewById(R.id.tv_rejected_amount);
    }

    private void setupToolbar() {
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(R.string.nav_analytics);
        }
        toolbar.setNavigationOnClickListener(v -> onBackPressed());
    }

    private void observeViewModel() {
        viewModel.getStats().observe(this, stats -> {
            if (stats != null) {
                updateStatsUI(stats);
            }
        });
    }

    private void updateStatsUI(AnalyticsViewModel.ExpenseStats stats) {
        // Total
        int total = stats.pending + stats.approved + stats.paid + stats.rejected;
        tvTotalClaims.setText(String.valueOf(total));
        tvTotalAmount.setText(formatCurrency(stats.totalAmount));

        // Counts
        tvPendingCount.setText(String.valueOf(stats.pending));
        tvApprovedCount.setText(String.valueOf(stats.approved));
        tvPaidCount.setText(String.valueOf(stats.paid));
        tvRejectedCount.setText(String.valueOf(stats.rejected));

        // Amounts
        tvPendingAmount.setText(formatCurrency(stats.pendingAmount));
        tvApprovedAmount.setText(formatCurrency(stats.approvedAmount));
        tvPaidAmount.setText(formatCurrency(stats.paidAmount));
        tvRejectedAmount.setText(formatCurrency(stats.rejectedAmount));
    }

    private String formatCurrency(double amount) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.US);
        return formatter.format(amount);
    }
}
