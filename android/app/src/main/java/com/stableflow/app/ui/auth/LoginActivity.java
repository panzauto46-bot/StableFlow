package com.stableflow.app.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;
import com.stableflow.app.R;
import com.stableflow.app.ui.base.BaseActivity;
import com.stableflow.app.ui.dashboard.DashboardActivity;

/**
 * LoginActivity
 * Handles user authentication - login, registration, and Google Sign-In
 */
public class LoginActivity extends BaseActivity {

    private static final String TAG = "LoginActivity";

    private LoginViewModel viewModel;
    private GoogleSignInClient googleSignInClient;
    private FirebaseAuth firebaseAuth;

    // Views
    private TextInputLayout tilName, tilEmail, tilPassword, tilConfirmPassword;
    private TextInputEditText etName, etEmail, etPassword, etConfirmPassword;
    private Button btnTabLogin, btnTabRegister, btnSubmit, btnDemo, btnGoogle;
    private TextView tvError, tvForgotPassword;
    private ProgressBar progressBar;

    private boolean isLoginMode = true;

    // Activity Result Launcher for Google Sign-In
    private final ActivityResultLauncher<Intent> googleSignInLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(result.getData());
                handleGoogleSignInResult(task);
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        viewModel = new ViewModelProvider(this).get(LoginViewModel.class);
        firebaseAuth = FirebaseAuth.getInstance();

        // Configure Google Sign-In
        configureGoogleSignIn();

        // Check if already logged in
        if (viewModel.isAlreadyLoggedIn()) {
            navigateToDashboard();
            return;
        }

        initViews();
        setupClickListeners();
        observeViewModel();
    }

    private void configureGoogleSignIn() {
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(getString(R.string.default_web_client_id))
                .requestEmail()
                .build();

        googleSignInClient = GoogleSignIn.getClient(this, gso);
    }

    private void initViews() {
        // Input layouts
        tilName = findViewById(R.id.til_name);
        tilEmail = findViewById(R.id.til_email);
        tilPassword = findViewById(R.id.til_password);
        tilConfirmPassword = findViewById(R.id.til_confirm_password);

        // Input fields
        etName = findViewById(R.id.et_name);
        etEmail = findViewById(R.id.et_email);
        etPassword = findViewById(R.id.et_password);
        etConfirmPassword = findViewById(R.id.et_confirm_password);

        // Buttons
        btnTabLogin = findViewById(R.id.btn_tab_login);
        btnTabRegister = findViewById(R.id.btn_tab_register);
        btnSubmit = findViewById(R.id.btn_submit);
        btnDemo = findViewById(R.id.btn_demo);
        btnGoogle = findViewById(R.id.btn_google);

        // Other views
        tvError = findViewById(R.id.tv_error);
        tvForgotPassword = findViewById(R.id.tv_forgot_password);
        progressBar = findViewById(R.id.progress_bar);
    }

    private void setupClickListeners() {
        // Tab switchers
        btnTabLogin.setOnClickListener(v -> switchToLoginMode());
        btnTabRegister.setOnClickListener(v -> switchToRegisterMode());

        // Submit
        btnSubmit.setOnClickListener(v -> {
            if (isLoginMode) {
                performLogin();
            } else {
                performRegister();
            }
        });

        // Google Sign-In
        if (btnGoogle != null) {
            btnGoogle.setOnClickListener(v -> performGoogleSignIn());
        }

        // Demo mode
        btnDemo.setOnClickListener(v -> {
            // Login with demo account
            viewModel.login("demo@stableflow.app", "demo123456");
        });

        // Forgot password
        tvForgotPassword.setOnClickListener(v -> {
            Toast.makeText(this, "Fitur reset password akan segera hadir", Toast.LENGTH_SHORT).show();
        });
    }

    private void performGoogleSignIn() {
        showLoading(true);
        tvError.setVisibility(View.GONE);

        // Sign out first to allow account selection
        googleSignInClient.signOut().addOnCompleteListener(task -> {
            Intent signInIntent = googleSignInClient.getSignInIntent();
            googleSignInLauncher.launch(signInIntent);
        });
    }

    private void handleGoogleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            Log.d(TAG, "Google Sign-In successful: " + account.getEmail());
            firebaseAuthWithGoogle(account.getIdToken());
        } catch (ApiException e) {
            Log.w(TAG, "Google Sign-In failed: " + e.getStatusCode());
            showLoading(false);

            String errorMessage;
            switch (e.getStatusCode()) {
                case 12501:
                    errorMessage = "Login dibatalkan";
                    break;
                case 12500:
                    errorMessage = "Google Play Services error";
                    break;
                case 7:
                    errorMessage = "Tidak ada koneksi internet";
                    break;
                default:
                    errorMessage = "Google Sign-In gagal (Error: " + e.getStatusCode() + ")";
            }

            tvError.setText(errorMessage);
            tvError.setVisibility(View.VISIBLE);
        }
    }

    private void firebaseAuthWithGoogle(String idToken) {
        AuthCredential credential = GoogleAuthProvider.getCredential(idToken, null);
        firebaseAuth.signInWithCredential(credential)
                .addOnCompleteListener(this, task -> {
                    showLoading(false);
                    if (task.isSuccessful()) {
                        Log.d(TAG, "Firebase auth with Google successful");
                        FirebaseUser user = firebaseAuth.getCurrentUser();
                        if (user != null) {
                            // Save user to database
                            viewModel.handleGoogleSignInSuccess(user);
                            navigateToDashboard();
                        }
                    } else {
                        Log.w(TAG, "Firebase auth with Google failed", task.getException());
                        tvError.setText("Autentikasi Firebase gagal");
                        tvError.setVisibility(View.VISIBLE);
                    }
                });
    }

    private void showLoading(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
        btnSubmit.setEnabled(!show);
        btnDemo.setEnabled(!show);
        if (btnGoogle != null) {
            btnGoogle.setEnabled(!show);
        }
    }

    private void observeViewModel() {
        viewModel.getIsLoading().observe(this, this::showLoading);

        viewModel.getErrorMessage().observe(this, error -> {
            if (error != null && !error.isEmpty()) {
                tvError.setText(error);
                tvError.setVisibility(View.VISIBLE);
            } else {
                tvError.setVisibility(View.GONE);
            }
        });

        viewModel.getLoginSuccess().observe(this, user -> {
            if (user != null) {
                navigateToDashboard();
            }
        });
    }

    private void switchToLoginMode() {
        isLoginMode = true;

        // Update tabs
        btnTabLogin.setBackgroundResource(R.drawable.bg_tab_selected);
        btnTabLogin.setTextColor(getColor(R.color.navy_primary));
        btnTabRegister.setBackgroundColor(android.graphics.Color.TRANSPARENT);
        btnTabRegister.setTextColor(getColor(R.color.text_secondary));

        // Show/hide fields
        tilName.setVisibility(View.GONE);
        tilConfirmPassword.setVisibility(View.GONE);
        tvForgotPassword.setVisibility(View.VISIBLE);

        // Update button
        btnSubmit.setText(R.string.login);

        // Clear errors
        tvError.setVisibility(View.GONE);
    }

    private void switchToRegisterMode() {
        isLoginMode = false;

        // Update tabs
        btnTabRegister.setBackgroundResource(R.drawable.bg_tab_selected);
        btnTabRegister.setTextColor(getColor(R.color.navy_primary));
        btnTabLogin.setBackgroundColor(android.graphics.Color.TRANSPARENT);
        btnTabLogin.setTextColor(getColor(R.color.text_secondary));

        // Show/hide fields
        tilName.setVisibility(View.VISIBLE);
        tilConfirmPassword.setVisibility(View.VISIBLE);
        tvForgotPassword.setVisibility(View.GONE);

        // Update button
        btnSubmit.setText(R.string.register);

        // Clear errors
        tvError.setVisibility(View.GONE);
    }

    private void performLogin() {
        String email = etEmail.getText() != null ? etEmail.getText().toString() : "";
        String password = etPassword.getText() != null ? etPassword.getText().toString() : "";

        viewModel.login(email, password);
    }

    private void performRegister() {
        String name = etName.getText() != null ? etName.getText().toString() : "";
        String email = etEmail.getText() != null ? etEmail.getText().toString() : "";
        String password = etPassword.getText() != null ? etPassword.getText().toString() : "";
        String confirmPassword = etConfirmPassword.getText() != null ? etConfirmPassword.getText().toString() : "";

        viewModel.register(email, password, confirmPassword, name);
    }

    private void navigateToDashboard() {
        Intent intent = new Intent(this, DashboardActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        finish();
    }
}
