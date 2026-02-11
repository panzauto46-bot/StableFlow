package com.stableflow.app.ui.auth;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.google.firebase.auth.FirebaseUser;
import com.stableflow.app.data.repository.FirebaseRepository;

/**
 * LoginViewModel
 * Handles authentication logic for login and registration
 */
public class LoginViewModel extends ViewModel {

    private final FirebaseRepository repository;

    private final MutableLiveData<Boolean> isLoading = new MutableLiveData<>(false);
    private final MutableLiveData<String> errorMessage = new MutableLiveData<>();
    private final MutableLiveData<FirebaseUser> loginSuccess = new MutableLiveData<>();

    public LoginViewModel() {
        repository = FirebaseRepository.getInstance();
    }

    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }

    public LiveData<String> getErrorMessage() {
        return errorMessage;
    }

    public LiveData<FirebaseUser> getLoginSuccess() {
        return loginSuccess;
    }

    public void login(String email, String password) {
        // Validate input
        if (email == null || email.trim().isEmpty()) {
            errorMessage.setValue("Email tidak boleh kosong");
            return;
        }

        if (!email.contains("@")) {
            errorMessage.setValue("Format email tidak valid");
            return;
        }

        if (password == null || password.length() < 6) {
            errorMessage.setValue("Password minimal 6 karakter");
            return;
        }

        isLoading.setValue(true);
        errorMessage.setValue(null);

        repository.login(email.trim(), password, new FirebaseRepository.AuthCallback() {
            @Override
            public void onSuccess(FirebaseUser user) {
                isLoading.postValue(false);
                loginSuccess.postValue(user);
            }

            @Override
            public void onError(String error) {
                isLoading.postValue(false);
                errorMessage.postValue(error);
            }
        });
    }

    public void register(String email, String password, String confirmPassword, String displayName) {
        // Validate input
        if (email == null || email.trim().isEmpty()) {
            errorMessage.setValue("Email tidak boleh kosong");
            return;
        }

        if (!email.contains("@")) {
            errorMessage.setValue("Format email tidak valid");
            return;
        }

        if (password == null || password.length() < 6) {
            errorMessage.setValue("Password minimal 6 karakter");
            return;
        }

        if (!password.equals(confirmPassword)) {
            errorMessage.setValue("Password tidak cocok");
            return;
        }

        if (displayName == null || displayName.trim().isEmpty()) {
            errorMessage.setValue("Nama tidak boleh kosong");
            return;
        }

        isLoading.setValue(true);
        errorMessage.setValue(null);

        repository.register(email.trim(), password, displayName.trim(), new FirebaseRepository.AuthCallback() {
            @Override
            public void onSuccess(FirebaseUser user) {
                isLoading.postValue(false);
                loginSuccess.postValue(user);
            }

            @Override
            public void onError(String error) {
                isLoading.postValue(false);
                errorMessage.postValue(error);
            }
        });
    }

    public void clearError() {
        errorMessage.setValue(null);
    }

    public boolean isAlreadyLoggedIn() {
        return repository.isLoggedIn();
    }

    /**
     * Handle successful Google Sign-In
     * Saves user data to Firebase database
     */
    public void handleGoogleSignInSuccess(FirebaseUser user) {
        if (user != null) {
            repository.saveGoogleUser(user);
        }
    }
}
