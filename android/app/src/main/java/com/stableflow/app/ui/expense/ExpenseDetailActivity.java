package com.stableflow.app.ui.expense;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.widget.Toolbar;

import com.bumptech.glide.Glide;
import com.stableflow.app.R;
import com.stableflow.app.data.model.ExpenseRequest;
import com.stableflow.app.data.repository.FirebaseRepository;
import com.stableflow.app.ui.base.BaseActivity;

import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * ExpenseDetailActivity
 * Shows detailed information about an expense claim
 */
public class ExpenseDetailActivity extends BaseActivity {

    public static final String EXTRA_EXPENSE_ID = "expense_id";

    private FirebaseRepository repository;
    private String expenseId;
    private ExpenseRequest expense;

    // Views
    private TextView tvTitle, tvDescription, tvAmount, tvCategory, tvStatus, tvDate;
    private TextView tvProcessedBy, tvProcessedDate, tvRejectionReason, tvTxLink;
    private ImageView ivReceipt;
    private androidx.cardview.widget.CardView receiptContainer;
    private LinearLayout txLinkContainer, rejectionContainer, processedContainer;
    private Button btnCancel, btnViewReceipt;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_expense_detail);

        repository = FirebaseRepository.getInstance();

        expenseId = getIntent().getStringExtra(EXTRA_EXPENSE_ID);
        if (expenseId == null) {
            Toast.makeText(this, R.string.error_invalid_claim_id, Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        initViews();
        setupToolbar();
        loadExpenseData();
    }

    private void initViews() {
        tvTitle = findViewById(R.id.tv_title);
        tvDescription = findViewById(R.id.tv_description);
        tvAmount = findViewById(R.id.tv_amount);
        tvCategory = findViewById(R.id.tv_category);
        tvStatus = findViewById(R.id.tv_status);
        tvDate = findViewById(R.id.tv_date);
        tvProcessedBy = findViewById(R.id.tv_processed_by);
        tvProcessedDate = findViewById(R.id.tv_processed_date);
        tvRejectionReason = findViewById(R.id.tv_rejection_reason);
        tvTxLink = findViewById(R.id.tv_tx_link);

        ivReceipt = findViewById(R.id.iv_receipt);

        receiptContainer = findViewById(R.id.receipt_container);
        txLinkContainer = findViewById(R.id.tx_link_container);
        rejectionContainer = findViewById(R.id.rejection_container);
        processedContainer = findViewById(R.id.processed_container);

        btnCancel = findViewById(R.id.btn_cancel);
        btnViewReceipt = findViewById(R.id.btn_view_receipt);
    }

    private void setupToolbar() {
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(R.string.expense_detail);
        }
        toolbar.setNavigationOnClickListener(v -> onBackPressed());
    }

    private void loadExpenseData() {
        repository.getExpenseById(expenseId, new FirebaseRepository.ExpenseCallback() {
            @Override
            public void onSuccess(ExpenseRequest result) {
                expense = result;
                runOnUiThread(() -> displayExpense());
            }

            @Override
            public void onError(String error) {
                runOnUiThread(() -> {
                    Toast.makeText(ExpenseDetailActivity.this, error, Toast.LENGTH_SHORT).show();
                    finish();
                });
            }
        });
    }

    private void displayExpense() {
        if (expense == null)
            return;

        // Basic info
        tvTitle.setText(expense.getTitle());
        tvDescription.setText(expense.getDescription());
        tvAmount.setText(formatCurrency(expense.getAmount()));
        tvCategory.setText(getCategoryString(expense.getCategory()));
        tvStatus.setText(getStatusString(expense.getStatus()));

        String formattedDate = formatDate(expense.getSubmittedAt());
        tvDate.setText(getString(R.string.submitted_at, formattedDate));

        // Status styling
        applyStatusStyle();

        // Receipt
        if (expense.getReceiptUrl() != null && !expense.getReceiptUrl().isEmpty()) {
            receiptContainer.setVisibility(View.VISIBLE);
            Glide.with(this)
                    .load(expense.getReceiptUrl())
                    .centerCrop()
                    .into(ivReceipt);

            btnViewReceipt.setOnClickListener(v -> {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(expense.getReceiptUrl()));
                startActivity(intent);
            });
        } else {
            receiptContainer.setVisibility(View.GONE);
        }

        // Processed info
        if (expense.getProcessedAt() != null) {
            processedContainer.setVisibility(View.VISIBLE);
            tvProcessedBy.setText(getString(R.string.processed_by,
                    (expense.getApprovedBy() != null ? expense.getApprovedBy() : "-")));
            tvProcessedDate.setText(getString(R.string.processed_date, formatDate(expense.getProcessedAt())));
        } else {
            processedContainer.setVisibility(View.GONE);
        }

        // Rejection reason
        if (expense.isRejected() && expense.getRejectionReason() != null) {
            rejectionContainer.setVisibility(View.VISIBLE);
            tvRejectionReason.setText(expense.getRejectionReason());
        } else {
            rejectionContainer.setVisibility(View.GONE);
        }

        // Transaction link
        if (expense.isPaid() && expense.getTxExplorerUrl() != null) {
            txLinkContainer.setVisibility(View.VISIBLE);
            txLinkContainer.setOnClickListener(v -> {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(expense.getTxExplorerUrl()));
                startActivity(intent);
            });
        } else {
            txLinkContainer.setVisibility(View.GONE);
        }

        // Cancel button
        if (expense.isPending()) {
            btnCancel.setVisibility(View.VISIBLE);
            btnCancel.setOnClickListener(v -> showCancelConfirmation());
        } else {
            btnCancel.setVisibility(View.GONE);
        }
    }

    private void applyStatusStyle() {
        int bgResId;
        int textColor;

        switch (expense.getStatus()) {
            case "APPROVED":
                bgResId = R.drawable.bg_status_approved;
                textColor = R.color.success_green;
                break;
            case "PAID":
                bgResId = R.drawable.bg_status_paid;
                textColor = R.color.success_green;
                break;
            case "REJECTED":
            case "CANCELLED":
                bgResId = R.drawable.bg_status_rejected;
                textColor = R.color.error_red;
                break;
            default:
                bgResId = R.drawable.bg_status_pending;
                textColor = R.color.warning_yellow;
                break;
        }

        tvStatus.setBackgroundResource(bgResId);
        tvStatus.setTextColor(getColor(textColor));
    }

    private void showCancelConfirmation() {
        new AlertDialog.Builder(this)
                .setTitle(R.string.cancel_claim_title)
                .setMessage(R.string.cancel_claim_message)
                .setPositiveButton(R.string.cancel_claim, (dialog, which) -> cancelExpense())
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void cancelExpense() {
        repository.cancelExpense(expenseId, new FirebaseRepository.SimpleCallback() {
            @Override
            public void onSuccess() {
                runOnUiThread(() -> {
                    Toast.makeText(ExpenseDetailActivity.this,
                            R.string.expense_cancelled_success, Toast.LENGTH_SHORT).show();
                    finish();
                });
            }

            @Override
            public void onError(String error) {
                runOnUiThread(() -> Toast.makeText(ExpenseDetailActivity.this, error, Toast.LENGTH_SHORT).show());
            }
        });
    }

    private String formatCurrency(double amount) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.US);
        return formatter.format(amount);
    }

    private String formatDate(String dateString) {
        try {
            SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
            Date date = isoFormat.parse(dateString.substring(0, Math.min(19, dateString.length())));
            SimpleDateFormat displayFormat = new SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault());
            return displayFormat.format(date);
        } catch (Exception e) {
            return dateString;
        }
    }

    private String getCategoryString(String category) {
        if (category == null)
            return "";
        int resId;
        switch (category) {
            case "TRAVEL":
                resId = R.string.category_travel;
                break;
            case "MEALS":
                resId = R.string.category_meals;
                break;
            case "SUPPLIES":
                resId = R.string.category_supplies;
                break;
            case "EQUIPMENT":
                resId = R.string.category_equipment;
                break;
            case "SOFTWARE":
                resId = R.string.category_software;
                break;
            case "TRAINING":
                resId = R.string.category_training;
                break;
            case "ENTERTAINMENT":
                resId = R.string.category_entertainment;
                break;
            case "UTILITIES":
                resId = R.string.category_utilities;
                break;
            case "OTHER":
                resId = R.string.category_other;
                break;
            default:
                return category;
        }
        return getString(resId);
    }

    private String getStatusString(String status) {
        if (status == null)
            return "";
        int resId;
        switch (status) {
            case "PENDING":
                resId = R.string.status_pending;
                break;
            case "UNDER_REVIEW":
                resId = R.string.status_under_review;
                break;
            case "APPROVED":
                resId = R.string.status_approved;
                break;
            case "REJECTED":
                resId = R.string.status_rejected;
                break;
            case "PAID":
                resId = R.string.status_paid;
                break;
            case "CANCELLED":
                resId = R.string.status_cancelled;
                break;
            default:
                return status;
        }
        return getString(resId);
    }
}
