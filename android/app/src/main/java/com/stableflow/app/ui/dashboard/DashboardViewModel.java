package com.stableflow.app.ui.dashboard;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.google.firebase.auth.FirebaseUser;
import com.stableflow.app.data.model.ExpenseRequest;
import com.stableflow.app.data.model.User;
import com.stableflow.app.data.repository.FirebaseRepository;

import java.util.List;

/**
 * DashboardViewModel
 * Handles dashboard data and user operations
 */
public class DashboardViewModel extends ViewModel {

    private final FirebaseRepository repository;

    private final MutableLiveData<Boolean> isRefreshing = new MutableLiveData<>(false);
    private final MutableLiveData<String> toastMessage = new MutableLiveData<>();

    // Stats
    private final MutableLiveData<Integer> pendingCount = new MutableLiveData<>(0);
    private final MutableLiveData<Integer> approvedCount = new MutableLiveData<>(0);
    private final MutableLiveData<Integer> paidCount = new MutableLiveData<>(0);
    private final MutableLiveData<Double> totalReceived = new MutableLiveData<>(0.0);

    public DashboardViewModel() {
        repository = FirebaseRepository.getInstance();
        loadInitialData();
    }

    // ==================
    // LiveData Getters
    // ==================

    public LiveData<User> getCurrentUser() {
        return repository.getCurrentUserLiveData();
    }

    public LiveData<Double> getBalance() {
        return repository.getBalanceLiveData();
    }

    public LiveData<List<ExpenseRequest>> getExpenses() {
        return repository.getExpensesLiveData();
    }

    public LiveData<Boolean> getIsRefreshing() {
        return isRefreshing;
    }

    public LiveData<String> getToastMessage() {
        return toastMessage;
    }

    public LiveData<Integer> getPendingCount() {
        return pendingCount;
    }

    public LiveData<Integer> getApprovedCount() {
        return approvedCount;
    }

    public LiveData<Integer> getPaidCount() {
        return paidCount;
    }

    public LiveData<Double> getTotalReceived() {
        return totalReceived;
    }

    // ==================
    // Actions
    // ==================

    private void loadInitialData() {
        FirebaseUser authUser = repository.getCurrentAuthUser();
        if (authUser != null) {
            repository.loadUserData(authUser.getUid());
            repository.loadUserExpenses(authUser.getUid());
            loadStats(authUser.getUid());
        }
    }

    public void refresh() {
        isRefreshing.setValue(true);

        FirebaseUser authUser = repository.getCurrentAuthUser();
        if (authUser != null) {
            repository.loadUserData(authUser.getUid());
            loadStats(authUser.getUid());
        }

        // Simulate refresh delay
        new android.os.Handler(android.os.Looper.getMainLooper())
                .postDelayed(() -> isRefreshing.setValue(false), 1000);
    }

    private void loadStats(String userId) {
        repository.getUserExpenseStats(userId, (pending, approved, paid, rejected, totalAmount) -> {
            pendingCount.postValue(pending);
            approvedCount.postValue(approved);
            paidCount.postValue(paid);
            totalReceived.postValue(totalAmount);
        });
    }

    public void updateWalletAddress(String walletAddress) {
        repository.updateWalletAddress(walletAddress, new FirebaseRepository.OperationCallback() {
            @Override
            public void onSuccess() {
                toastMessage.postValue("Wallet address berhasil disimpan");
            }

            @Override
            public void onError(String error) {
                toastMessage.postValue("Gagal menyimpan wallet: " + error);
            }
        });
    }

    public void cancelExpense(String expenseId) {
        repository.cancelExpense(expenseId, new FirebaseRepository.SimpleCallback() {
            @Override
            public void onSuccess() {
                toastMessage.postValue("Klaim berhasil dibatalkan");
            }

            @Override
            public void onError(String error) {
                toastMessage.postValue("Gagal membatalkan klaim: " + error);
            }
        });
    }

    public void logout() {
        repository.logout();
    }

    public void clearToast() {
        toastMessage.setValue(null);
    }
}
