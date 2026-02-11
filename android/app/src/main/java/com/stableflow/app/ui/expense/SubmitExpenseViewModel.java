package com.stableflow.app.ui.expense;

import android.net.Uri;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.google.firebase.auth.FirebaseUser;
import com.stableflow.app.data.model.ExpenseRequest;
import com.stableflow.app.data.repository.FirebaseRepository;

/**
 * SubmitExpenseViewModel
 * Handles expense submission with image upload
 */
public class SubmitExpenseViewModel extends ViewModel {

    private final FirebaseRepository repository;

    private final MutableLiveData<Boolean> isLoading = new MutableLiveData<>(false);
    private final MutableLiveData<Boolean> isUploading = new MutableLiveData<>(false);
    private final MutableLiveData<Integer> uploadProgress = new MutableLiveData<>(0);
    private final MutableLiveData<String> errorMessage = new MutableLiveData<>();
    private final MutableLiveData<Boolean> submitSuccess = new MutableLiveData<>();
    private final MutableLiveData<String> receiptUrl = new MutableLiveData<>();

    // Form data
    private String title = "";
    private String description = "";
    private double amount = 0;
    private String category = "";
    private Double latitude = null;
    private Double longitude = null;
    private String locationAddress = null;

    public SubmitExpenseViewModel() {
        repository = FirebaseRepository.getInstance();
    }

    // ==================
    // LiveData Getters
    // ==================

    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }

    public LiveData<Boolean> getIsUploading() {
        return isUploading;
    }

    public LiveData<Integer> getUploadProgress() {
        return uploadProgress;
    }

    public LiveData<String> getErrorMessage() {
        return errorMessage;
    }

    public LiveData<Boolean> getSubmitSuccess() {
        return submitSuccess;
    }

    public LiveData<String> getReceiptUrl() {
        return receiptUrl;
    }

    // ==================
    // Form Setters
    // ==================

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setLocation(Double latitude, Double longitude, String address) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.locationAddress = address;
    }

    public void clearLocation() {
        this.latitude = null;
        this.longitude = null;
        this.locationAddress = null;
    }

    // ==================
    // Actions
    // ==================

    public void uploadReceipt(Uri imageUri) {
        isUploading.setValue(true);
        uploadProgress.setValue(0);
        errorMessage.setValue(null);

        repository.uploadReceiptImage(imageUri, new FirebaseRepository.UploadCallback() {
            @Override
            public void onSuccess(String downloadUrl) {
                isUploading.postValue(false);
                uploadProgress.postValue(100);
                receiptUrl.postValue(downloadUrl);
            }

            @Override
            public void onProgress(int progress) {
                uploadProgress.postValue(progress);
            }

            @Override
            public void onError(String error) {
                isUploading.postValue(false);
                errorMessage.postValue("Gagal upload gambar: " + error);
            }
        });
    }

    public void clearReceipt() {
        receiptUrl.setValue(null);
        uploadProgress.setValue(0);
    }

    public void submit() {
        // Validate
        if (title == null || title.trim().length() < 3) {
            errorMessage.setValue("Judul harus minimal 3 karakter");
            return;
        }

        if (description == null || description.trim().length() < 10) {
            errorMessage.setValue("Deskripsi harus minimal 10 karakter");
            return;
        }

        if (amount <= 0) {
            errorMessage.setValue("Jumlah harus lebih dari 0");
            return;
        }

        if (amount > 100000) {
            errorMessage.setValue("Jumlah maksimal 100,000 USDC");
            return;
        }

        if (category == null || category.isEmpty()) {
            errorMessage.setValue("Kategori harus dipilih");
            return;
        }

        FirebaseUser user = repository.getCurrentAuthUser();
        if (user == null) {
            errorMessage.setValue("Pengguna tidak terautentikasi");
            return;
        }

        isLoading.setValue(true);
        errorMessage.setValue(null);

        // Create expense request
        ExpenseRequest expense = new ExpenseRequest(
                user.getUid(),
                title.trim(),
                description.trim(),
                amount,
                category);

        // Add optional fields
        String receipt = receiptUrl.getValue();
        if (receipt != null && !receipt.isEmpty()) {
            expense.setReceiptUrl(receipt);
        }

        if (latitude != null && longitude != null) {
            expense.setLatitude(latitude);
            expense.setLongitude(longitude);
            expense.setLocationAddress(locationAddress);
            expense.setNotes("Lokasi: " + locationAddress);
        }

        // Submit to Firebase
        repository.submitExpense(expense, new FirebaseRepository.SubmitCallback() {
            @Override
            public void onSuccess(String expenseId) {
                isLoading.postValue(false);
                submitSuccess.postValue(true);
            }

            @Override
            public void onError(String error) {
                isLoading.postValue(false);
                errorMessage.postValue("Gagal mengajukan klaim: " + error);
            }
        });
    }

    public void clearError() {
        errorMessage.setValue(null);
    }

    public void resetForm() {
        title = "";
        description = "";
        amount = 0;
        category = "";
        latitude = null;
        longitude = null;
        locationAddress = null;
        receiptUrl.setValue(null);
        uploadProgress.setValue(0);
        submitSuccess.setValue(false);
    }
}
