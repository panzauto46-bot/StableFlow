package com.stableflow.app.ui.analytics;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.stableflow.app.data.model.ExpenseRequest;
import com.stableflow.app.data.repository.FirebaseRepository;

import java.util.List;

/**
 * AnalyticsViewModel
 * Handles expense statistics calculation
 */
public class AnalyticsViewModel extends ViewModel {

    private final FirebaseRepository repository;
    private final MutableLiveData<ExpenseStats> stats = new MutableLiveData<>(new ExpenseStats());

    public AnalyticsViewModel() {
        repository = FirebaseRepository.getInstance();

        // Observe expenses and calculate stats
        repository.getExpensesLiveData().observeForever(this::calculateStats);

        // Load expenses if not already loaded
        if (repository.getCurrentAuthUser() != null) {
            repository.loadUserExpenses(repository.getCurrentAuthUser().getUid());
        }
    }

    public LiveData<ExpenseStats> getStats() {
        return stats;
    }

    private void calculateStats(List<ExpenseRequest> expenses) {
        if (expenses == null)
            return;

        ExpenseStats newStats = new ExpenseStats();

        for (ExpenseRequest expense : expenses) {
            switch (expense.getStatus()) {
                case "PENDING":
                case "UNDER_REVIEW":
                    newStats.pending++;
                    newStats.pendingAmount += expense.getAmount();
                    break;
                case "APPROVED":
                    newStats.approved++;
                    newStats.approvedAmount += expense.getAmount();
                    break;
                case "PAID":
                    newStats.paid++;
                    newStats.paidAmount += expense.getAmount();
                    break;
                case "REJECTED":
                    newStats.rejected++;
                    newStats.rejectedAmount += expense.getAmount();
                    break;
            }
            newStats.totalAmount += expense.getAmount();
        }

        stats.setValue(newStats);
    }

    public static class ExpenseStats {
        public int pending = 0;
        public int approved = 0;
        public int paid = 0;
        public int rejected = 0;
        public double pendingAmount = 0;
        public double approvedAmount = 0;
        public double paidAmount = 0;
        public double rejectedAmount = 0;
        public double totalAmount = 0;
    }
}
