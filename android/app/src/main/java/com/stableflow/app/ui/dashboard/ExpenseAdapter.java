package com.stableflow.app.ui.dashboard;

import android.content.res.ColorStateList;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.stableflow.app.R;
import com.stableflow.app.data.model.ExpenseRequest;

import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * ExpenseAdapter
 * RecyclerView adapter for expense list items
 */
public class ExpenseAdapter extends RecyclerView.Adapter<ExpenseAdapter.ExpenseViewHolder> {

    private List<ExpenseRequest> expenses;
    private final OnExpenseClickListener listener;

    public interface OnExpenseClickListener {
        void onExpenseClick(ExpenseRequest expense);
    }

    public ExpenseAdapter(List<ExpenseRequest> expenses, OnExpenseClickListener listener) {
        this.expenses = expenses;
        this.listener = listener;
    }

    public void updateData(List<ExpenseRequest> newExpenses) {
        this.expenses = newExpenses;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ExpenseViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_expense, parent, false);
        return new ExpenseViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ExpenseViewHolder holder, int position) {
        ExpenseRequest expense = expenses.get(position);
        holder.bind(expense);
    }

    @Override
    public int getItemCount() {
        return expenses != null ? expenses.size() : 0;
    }

    class ExpenseViewHolder extends RecyclerView.ViewHolder {

        private final TextView tvTitle, tvDescription, tvStatus, tvCategory, tvAmount, tvDate, tvTxLink;
        private final LinearLayout txLinkContainer;
        private final ImageView ivCategoryIcon;

        ExpenseViewHolder(@NonNull View itemView) {
            super(itemView);
            tvTitle = itemView.findViewById(R.id.tv_title);
            tvDescription = itemView.findViewById(R.id.tv_description);
            tvStatus = itemView.findViewById(R.id.tv_status);
            tvCategory = itemView.findViewById(R.id.tv_category);
            tvAmount = itemView.findViewById(R.id.tv_amount);
            tvDate = itemView.findViewById(R.id.tv_date);
            tvTxLink = itemView.findViewById(R.id.tv_tx_link);
            txLinkContainer = itemView.findViewById(R.id.tx_link_container);
            ivCategoryIcon = itemView.findViewById(R.id.iv_category_icon);
        }

        void bind(ExpenseRequest expense) {
            tvTitle.setText(expense.getTitle());
            tvDescription.setText(expense.getDescription());
            tvCategory.setText(getCategoryString(itemView.getContext(), expense.getCategory()));
            tvAmount.setText(formatCurrency(expense.getAmount()));

            String formattedDate = formatDate(expense.getSubmittedAt());
            tvDate.setText(itemView.getContext().getString(R.string.submitted_at, formattedDate));

            // Status styling
            tvStatus.setText(getStatusString(itemView.getContext(), expense.getStatus()));
            applyStatusStyle(expense.getStatus());

            // Transaction link
            if (expense.isPaid() && expense.getTxExplorerUrl() != null) {
                txLinkContainer.setVisibility(View.VISIBLE);
                txLinkContainer.setOnClickListener(v -> {
                    // Open explorer URL
                    android.content.Intent intent = new android.content.Intent(
                            android.content.Intent.ACTION_VIEW,
                            android.net.Uri.parse(expense.getTxExplorerUrl()));
                    itemView.getContext().startActivity(intent);
                });
            } else {
                txLinkContainer.setVisibility(View.GONE);
            }

            // Click listener
            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onExpenseClick(expense);
                }
            });
        }

        private void applyStatusStyle(String status) {
            int bgResId;
            int textColor;

            switch (status) {
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
                case "PENDING":
                case "UNDER_REVIEW":
                default:
                    bgResId = R.drawable.bg_status_pending;
                    textColor = R.color.warning_yellow;
                    break;
            }

            tvStatus.setBackgroundResource(bgResId);
            tvStatus.setTextColor(ContextCompat.getColor(itemView.getContext(), textColor));
        }

        private String formatCurrency(double amount) {
            NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.US);
            return formatter.format(amount);
        }

        private String formatDate(String dateString) {
            try {
                // Parse ISO date
                SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
                Date date = isoFormat.parse(dateString.substring(0, Math.min(19, dateString.length())));
                SimpleDateFormat displayFormat = new SimpleDateFormat("dd MMM yyyy", Locale.getDefault());
                return displayFormat.format(date);
            } catch (Exception e) {
                return dateString;
            }
        }

        private String getCategoryString(android.content.Context context, String category) {
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
            return context.getString(resId);
        }

        private String getStatusString(android.content.Context context, String status) {
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
            return context.getString(resId);
        }
    }
}
