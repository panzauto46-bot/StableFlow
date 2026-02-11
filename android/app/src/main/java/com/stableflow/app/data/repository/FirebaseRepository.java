package com.stableflow.app.data.repository;

import android.net.Uri;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;
import com.stableflow.app.data.model.ExpenseRequest;
import com.stableflow.app.data.model.User;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Firebase Repository
 * Handles all Firebase operations for authentication, database, and storage
 */
public class FirebaseRepository {

    private static final String TAG = "FirebaseRepository";

    private static FirebaseRepository instance;

    private final FirebaseAuth auth;
    private final FirebaseDatabase database;
    private final FirebaseStorage storage;

    private final MutableLiveData<User> currentUser = new MutableLiveData<>();
    private final MutableLiveData<List<ExpenseRequest>> expenses = new MutableLiveData<>(new ArrayList<>());
    private final MutableLiveData<Double> balance = new MutableLiveData<>(0.0);

    private ValueEventListener expensesListener;
    private ValueEventListener balanceListener;
    private ValueEventListener userListener;

    private FirebaseRepository() {
        auth = FirebaseAuth.getInstance();
        database = FirebaseDatabase.getInstance();
        storage = FirebaseStorage.getInstance();
    }

    public static synchronized FirebaseRepository getInstance() {
        if (instance == null) {
            instance = new FirebaseRepository();
        }
        return instance;
    }

    // ==================
    // AUTHENTICATION
    // ==================

    public interface AuthCallback {
        void onSuccess(FirebaseUser user);

        void onError(String error);
    }

    public void login(String email, String password, AuthCallback callback) {
        auth.signInWithEmailAndPassword(email, password)
                .addOnSuccessListener(authResult -> {
                    FirebaseUser user = authResult.getUser();
                    if (user != null) {
                        loadUserData(user.getUid());
                        callback.onSuccess(user);
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Login failed: " + e.getMessage());
                    callback.onError(translateFirebaseError(e.getMessage()));
                });
    }

    public void register(String email, String password, String displayName, AuthCallback callback) {
        auth.createUserWithEmailAndPassword(email, password)
                .addOnSuccessListener(authResult -> {
                    FirebaseUser firebaseUser = authResult.getUser();
                    if (firebaseUser != null) {
                        // Create user profile in database
                        User user = new User(firebaseUser.getUid(), email);
                        user.setDisplayName(displayName);
                        user.setBalance(1000.00); // Demo initial balance

                        DatabaseReference userRef = database.getReference("users").child(firebaseUser.getUid());
                        userRef.setValue(user)
                                .addOnSuccessListener(aVoid -> {
                                    loadUserData(firebaseUser.getUid());
                                    callback.onSuccess(firebaseUser);
                                })
                                .addOnFailureListener(e -> callback.onError(e.getMessage()));
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Registration failed: " + e.getMessage());
                    callback.onError(translateFirebaseError(e.getMessage()));
                });
    }

    public void logout() {
        removeListeners();
        auth.signOut();
        currentUser.setValue(null);
        expenses.setValue(new ArrayList<>());
        balance.setValue(0.0);
    }

    public FirebaseUser getCurrentAuthUser() {
        return auth.getCurrentUser();
    }

    public boolean isLoggedIn() {
        return auth.getCurrentUser() != null;
    }

    /**
     * Save Google Sign-In user data to database
     */
    public void saveGoogleUser(FirebaseUser firebaseUser) {
        if (firebaseUser == null)
            return;

        DatabaseReference userRef = database.getReference("users").child(firebaseUser.getUid());

        // Check if user already exists
        userRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                if (!snapshot.exists()) {
                    // Create new user
                    User user = new User(firebaseUser.getUid(), firebaseUser.getEmail());
                    user.setDisplayName(firebaseUser.getDisplayName());
                    if (firebaseUser.getPhotoUrl() != null) {
                        user.setPhotoUrl(firebaseUser.getPhotoUrl().toString());
                    }
                    user.setBalance(1000.00); // Demo initial balance
                    user.setAccountType("GOOGLE");

                    userRef.setValue(user)
                            .addOnSuccessListener(aVoid -> {
                                Log.d(TAG, "Google user saved to database");
                                loadUserData(firebaseUser.getUid());
                            })
                            .addOnFailureListener(e -> {
                                Log.e(TAG, "Failed to save Google user: " + e.getMessage());
                            });
                } else {
                    // User exists, just load data
                    loadUserData(firebaseUser.getUid());
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Log.e(TAG, "Database error: " + error.getMessage());
            }
        });
    }

    private String translateFirebaseError(String error) {
        if (error == null)
            return "Terjadi kesalahan";
        if (error.contains("INVALID_EMAIL"))
            return "Email tidak valid";
        if (error.contains("WEAK_PASSWORD"))
            return "Password terlalu lemah (minimal 6 karakter)";
        if (error.contains("EMAIL_EXISTS"))
            return "Email sudah terdaftar";
        if (error.contains("USER_NOT_FOUND"))
            return "Akun tidak ditemukan";
        if (error.contains("WRONG_PASSWORD"))
            return "Password salah";
        if (error.contains("INVALID_CREDENTIAL"))
            return "Email atau password salah";
        if (error.contains("NETWORK"))
            return "Tidak ada koneksi internet";
        return error;
    }

    // ==================
    // USER DATA
    // ==================

    public LiveData<User> getCurrentUserLiveData() {
        return currentUser;
    }

    public LiveData<Double> getBalanceLiveData() {
        return balance;
    }

    public void loadUserData(String userId) {
        DatabaseReference userRef = database.getReference("users").child(userId);

        // Remove existing listener
        if (userListener != null) {
            userRef.removeEventListener(userListener);
        }

        userListener = new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                if (snapshot.exists()) {
                    User user = snapshot.getValue(User.class);
                    if (user != null) {
                        user.setUid(userId);
                        currentUser.setValue(user);
                        balance.setValue(user.getBalance());
                    }
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Log.e(TAG, "User data load cancelled: " + error.getMessage());
            }
        };

        userRef.addValueEventListener(userListener);
    }

    public void updateWalletAddress(String walletAddress, OperationCallback callback) {
        FirebaseUser user = auth.getCurrentUser();
        if (user == null) {
            callback.onError("Pengguna tidak terautentikasi");
            return;
        }

        database.getReference("users")
                .child(user.getUid())
                .child("walletAddress")
                .setValue(walletAddress)
                .addOnSuccessListener(aVoid -> {
                    // Update local User LiveData for real-time UI update
                    User currentUserData = currentUser.getValue();
                    if (currentUserData != null) {
                        currentUserData.setWalletAddress(walletAddress);
                        currentUser.postValue(currentUserData);
                    }
                    callback.onSuccess();
                })
                .addOnFailureListener(e -> callback.onError(e.getMessage()));
    }

    public void updateBalance(double newBalance, OperationCallback callback) {
        FirebaseUser user = auth.getCurrentUser();
        if (user == null) {
            callback.onError("Pengguna tidak terautentikasi");
            return;
        }

        database.getReference("users")
                .child(user.getUid())
                .child("balance")
                .setValue(newBalance)
                .addOnSuccessListener(aVoid -> {
                    balance.setValue(newBalance);
                    callback.onSuccess();
                })
                .addOnFailureListener(e -> callback.onError(e.getMessage()));
    }

    // ==================
    // EXPENSE REQUESTS
    // ==================

    public interface OperationCallback {
        void onSuccess();

        void onError(String error);
    }

    public interface SubmitCallback {
        void onSuccess(String expenseId);

        void onError(String error);
    }

    public interface ExpenseCallback {
        void onSuccess(ExpenseRequest result);

        void onError(String error);
    }

    public LiveData<List<ExpenseRequest>> getExpensesLiveData() {
        return expenses;
    }

    public void getExpenseById(String expenseId, ExpenseCallback callback) {
        database.getReference("expenses")
                .child(expenseId)
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(@NonNull DataSnapshot snapshot) {
                        if (snapshot.exists()) {
                            ExpenseRequest expense = snapshot.getValue(ExpenseRequest.class);
                            if (expense != null) {
                                expense.setId(snapshot.getKey());
                                callback.onSuccess(expense);
                            } else {
                                callback.onError("Data klaim tidak valid");
                            }
                        } else {
                            callback.onError("Klaim tidak ditemukan");
                        }
                    }

                    @Override
                    public void onCancelled(@NonNull DatabaseError error) {
                        callback.onError(error.getMessage());
                    }
                });
    }

    public void loadUserExpenses(String userId) {
        DatabaseReference expensesRef = database.getReference("expenses");

        // Remove existing listener
        if (expensesListener != null) {
            expensesRef.removeEventListener(expensesListener);
        }

        expensesListener = new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                List<ExpenseRequest> expenseList = new ArrayList<>();
                for (DataSnapshot child : snapshot.getChildren()) {
                    ExpenseRequest expense = child.getValue(ExpenseRequest.class);
                    if (expense != null && userId.equals(expense.getUserId())) {
                        expense.setId(child.getKey());
                        expenseList.add(expense);
                    }
                }
                // Sort by submitted date (newest first) with null safety
                expenseList.sort((a, b) -> {
                    String dateA = a.getSubmittedAt();
                    String dateB = b.getSubmittedAt();
                    if (dateA == null && dateB == null)
                        return 0;
                    if (dateA == null)
                        return 1;
                    if (dateB == null)
                        return -1;
                    return dateB.compareTo(dateA);
                });
                expenses.setValue(expenseList);
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Log.e(TAG, "Expenses load cancelled: " + error.getMessage());
            }
        };

        expensesRef.addValueEventListener(expensesListener);
    }

    public void submitExpense(ExpenseRequest expense, SubmitCallback callback) {
        DatabaseReference expensesRef = database.getReference("expenses");
        String expenseId = expensesRef.push().getKey();

        if (expenseId == null) {
            callback.onError("Gagal membuat ID klaim");
            return;
        }

        expense.setId(expenseId);
        expense.setSubmittedAt(java.time.Instant.now().toString());
        expense.setStatus("PENDING");
        expense.setCurrency("USDC");

        expensesRef.child(expenseId).setValue(expense)
                .addOnSuccessListener(aVoid -> callback.onSuccess(expenseId))
                .addOnFailureListener(e -> callback.onError(e.getMessage()));
    }

    public void cancelExpense(String expenseId, SimpleCallback callback) {
        database.getReference("expenses")
                .child(expenseId)
                .child("status")
                .setValue("CANCELLED")
                .addOnSuccessListener(aVoid -> callback.onSuccess())
                .addOnFailureListener(e -> callback.onError(e.getMessage()));
    }

    public interface SimpleCallback {
        void onSuccess();

        void onError(String error);
    }

    // ==================
    // FILE UPLOAD
    // ==================

    public interface UploadCallback {
        void onSuccess(String downloadUrl);

        void onProgress(int progress);

        void onError(String error);
    }

    public void uploadReceiptImage(Uri imageUri, UploadCallback callback) {
        FirebaseUser user = auth.getCurrentUser();
        if (user == null) {
            callback.onError("Pengguna tidak terautentikasi");
            return;
        }

        String filename = "receipts/" + user.getUid() + "/" + UUID.randomUUID().toString() + ".jpg";
        StorageReference storageRef = storage.getReference().child(filename);

        storageRef.putFile(imageUri)
                .addOnProgressListener(snapshot -> {
                    int progress = (int) ((100.0 * snapshot.getBytesTransferred()) / snapshot.getTotalByteCount());
                    callback.onProgress(progress);
                })
                .addOnSuccessListener(taskSnapshot -> {
                    storageRef.getDownloadUrl()
                            .addOnSuccessListener(uri -> callback.onSuccess(uri.toString()))
                            .addOnFailureListener(e -> callback.onError(e.getMessage()));
                })
                .addOnFailureListener(e -> callback.onError(e.getMessage()));
    }

    // ==================
    // STATISTICS
    // ==================

    public interface StatsCallback {
        void onResult(int pending, int approved, int paid, int rejected, double totalAmount);
    }

    public void getUserExpenseStats(String userId, StatsCallback callback) {
        database.getReference("expenses")
                .addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(@NonNull DataSnapshot snapshot) {
                        int pending = 0, approved = 0, paid = 0, rejected = 0;
                        double totalAmount = 0;

                        for (DataSnapshot child : snapshot.getChildren()) {
                            ExpenseRequest expense = child.getValue(ExpenseRequest.class);
                            if (expense != null && userId.equals(expense.getUserId())) {
                                switch (expense.getStatus()) {
                                    case "PENDING":
                                    case "UNDER_REVIEW":
                                        pending++;
                                        break;
                                    case "APPROVED":
                                        approved++;
                                        break;
                                    case "PAID":
                                        paid++;
                                        totalAmount += expense.getAmount();
                                        break;
                                    case "REJECTED":
                                        rejected++;
                                        break;
                                }
                            }
                        }

                        callback.onResult(pending, approved, paid, rejected, totalAmount);
                    }

                    @Override
                    public void onCancelled(@NonNull DatabaseError error) {
                        callback.onResult(0, 0, 0, 0, 0);
                    }
                });
    }

    // ==================
    // CLEANUP
    // ==================

    private void removeListeners() {
        FirebaseUser user = auth.getCurrentUser();
        if (user != null) {
            if (expensesListener != null) {
                database.getReference("expenses").removeEventListener(expensesListener);
            }
            if (userListener != null) {
                database.getReference("users").child(user.getUid()).removeEventListener(userListener);
            }
        }
    }
}
