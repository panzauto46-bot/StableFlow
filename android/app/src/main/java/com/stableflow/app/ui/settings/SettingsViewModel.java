package com.stableflow.app.ui.settings;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.stableflow.app.data.model.User;
import com.stableflow.app.data.repository.FirebaseRepository;

/**
 * SettingsViewModel
 * Handles settings and profile operations
 */
public class SettingsViewModel extends ViewModel {

    private final FirebaseRepository repository;

    private final MutableLiveData<Boolean> saveSuccess = new MutableLiveData<>();
    private final MutableLiveData<String> errorMessage = new MutableLiveData<>();

    public SettingsViewModel() {
        repository = FirebaseRepository.getInstance();

        // Load user data if logged in
        if (repository.getCurrentAuthUser() != null) {
            repository.loadUserData(repository.getCurrentAuthUser().getUid());
        }
    }

    public LiveData<User> getCurrentUser() {
        return repository.getCurrentUserLiveData();
    }

    public LiveData<Boolean> getSaveSuccess() {
        return saveSuccess;
    }

    public LiveData<String> getErrorMessage() {
        return errorMessage;
    }

    public void saveWalletAddress(String walletAddress) {
        repository.updateWalletAddress(walletAddress, new FirebaseRepository.OperationCallback() {
            @Override
            public void onSuccess() {
                saveSuccess.setValue(true);
            }

            @Override
            public void onError(String error) {
                errorMessage.setValue(error);
            }
        });
    }

    public void logout() {
        repository.logout();
    }
}
