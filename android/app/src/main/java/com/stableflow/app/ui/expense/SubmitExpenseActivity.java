package com.stableflow.app.ui.expense;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.widget.Toolbar;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.lifecycle.ViewModelProvider;

import com.bumptech.glide.Glide;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.material.textfield.TextInputEditText;
import com.stableflow.app.R;
import com.stableflow.app.ui.base.BaseActivity;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * SubmitExpenseActivity
 * Form for submitting a new expense claim
 */
public class SubmitExpenseActivity extends BaseActivity {

    private SubmitExpenseViewModel viewModel;
    private FusedLocationProviderClient fusedLocationClient;

    // Views
    private TextInputEditText etTitle, etDescription, etAmount;
    private AutoCompleteTextView spinnerCategory;
    private Button btnSubmit, btnAddLocation;
    private LinearLayout btnCamera, btnGallery, uploadButtonsContainer;
    private LinearLayout errorContainer, locationPreviewContainer;
    private FrameLayout receiptPreviewContainer, btnRemoveReceipt;
    private ImageView ivReceiptPreview, btnRemoveLocation;
    private ProgressBar progressSubmit, progressUpload;
    private TextView tvError, tvLocation;

    // State
    private Uri currentPhotoUri;
    private String selectedCategory = "";

    // Categories
    private final String[] categoryValues = {
            "TRAVEL", "MEALS", "SUPPLIES", "EQUIPMENT",
            "SOFTWARE", "TRAINING", "ENTERTAINMENT", "UTILITIES", "OTHER"
    };
    // Category labels now loaded from resources

    // Launchers
    private ActivityResultLauncher<Uri> takePictureLauncher;
    private ActivityResultLauncher<String> pickImageLauncher;
    private ActivityResultLauncher<String> requestCameraPermissionLauncher;
    private ActivityResultLauncher<String> requestLocationPermissionLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_submit_expense);

        viewModel = new ViewModelProvider(this).get(SubmitExpenseViewModel.class);
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);

        setupLaunchers();
        initViews();
        setupToolbar();
        setupCategorySpinner();
        setupClickListeners();
        observeViewModel();
    }

    private void setupLaunchers() {
        // Camera launcher
        takePictureLauncher = registerForActivityResult(
                new ActivityResultContracts.TakePicture(),
                success -> {
                    if (success && currentPhotoUri != null) {
                        showReceiptPreview(currentPhotoUri);
                        viewModel.uploadReceipt(currentPhotoUri);
                    }
                });

        // Gallery launcher
        pickImageLauncher = registerForActivityResult(
                new ActivityResultContracts.GetContent(),
                uri -> {
                    if (uri != null) {
                        showReceiptPreview(uri);
                        viewModel.uploadReceipt(uri);
                    }
                });

        // Camera permission launcher
        requestCameraPermissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestPermission(),
                granted -> {
                    if (granted) {
                        openCamera();
                    } else {
                        Toast.makeText(this, R.string.permission_camera_required, Toast.LENGTH_SHORT).show();
                    }
                });

        // Location permission launcher
        requestLocationPermissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestPermission(),
                granted -> {
                    if (granted) {
                        getCurrentLocation();
                    } else {
                        Toast.makeText(this, R.string.permission_location_required, Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void initViews() {
        // Input fields
        etTitle = findViewById(R.id.et_title);
        etDescription = findViewById(R.id.et_description);
        etAmount = findViewById(R.id.et_amount);
        spinnerCategory = findViewById(R.id.spinner_category);

        // Buttons
        btnSubmit = findViewById(R.id.btn_submit);
        btnAddLocation = findViewById(R.id.btn_add_location);
        btnCamera = findViewById(R.id.btn_camera);
        btnGallery = findViewById(R.id.btn_gallery);

        // Containers
        errorContainer = findViewById(R.id.error_container);
        locationPreviewContainer = findViewById(R.id.location_preview_container);
        receiptPreviewContainer = findViewById(R.id.receipt_preview_container);
        uploadButtonsContainer = findViewById(R.id.upload_buttons_container);
        btnRemoveReceipt = findViewById(R.id.btn_remove_receipt);
        btnRemoveLocation = findViewById(R.id.btn_remove_location);

        // Preview
        ivReceiptPreview = findViewById(R.id.iv_receipt_preview);
        tvLocation = findViewById(R.id.tv_location);

        // Progress
        progressSubmit = findViewById(R.id.progress_submit);
        progressUpload = findViewById(R.id.progress_upload);

        // Error
        tvError = findViewById(R.id.tv_error);
    }

    private void setupToolbar() {
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        toolbar.setNavigationOnClickListener(v -> onBackPressed());
    }

    private void setupCategorySpinner() {
        String[] labels = new String[] {
                getString(R.string.category_travel),
                getString(R.string.category_meals),
                getString(R.string.category_supplies),
                getString(R.string.category_equipment),
                getString(R.string.category_software),
                getString(R.string.category_training),
                getString(R.string.category_entertainment),
                getString(R.string.category_utilities),
                getString(R.string.category_other)
        };
        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this, android.R.layout.simple_dropdown_item_1line, labels);
        spinnerCategory.setAdapter(adapter);
        spinnerCategory.setOnItemClickListener((parent, view, position, id) -> {
            selectedCategory = categoryValues[position];
            viewModel.setCategory(selectedCategory);
        });
    }

    private void setupClickListeners() {
        // Submit
        btnSubmit.setOnClickListener(v -> submitForm());

        // Camera
        btnCamera.setOnClickListener(v -> {
            if (ContextCompat.checkSelfPermission(this,
                    Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                openCamera();
            } else {
                requestCameraPermissionLauncher.launch(Manifest.permission.CAMERA);
            }
        });

        // Gallery
        btnGallery.setOnClickListener(v -> pickImageLauncher.launch("image/*"));

        // Add location
        btnAddLocation.setOnClickListener(v -> {
            if (ContextCompat.checkSelfPermission(this,
                    Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                getCurrentLocation();
            } else {
                requestLocationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION);
            }
        });

        // Remove receipt
        btnRemoveReceipt.setOnClickListener(v -> {
            viewModel.clearReceipt();
            hideReceiptPreview();
        });

        // Remove location
        btnRemoveLocation.setOnClickListener(v -> {
            viewModel.clearLocation();
            hideLocationPreview();
        });
    }

    private void observeViewModel() {
        // Loading
        viewModel.getIsLoading().observe(this, isLoading -> {
            progressSubmit.setVisibility(isLoading ? View.VISIBLE : View.GONE);
            btnSubmit.setEnabled(!isLoading);
        });

        // Uploading
        viewModel.getIsUploading().observe(this, isUploading -> {
            progressUpload.setVisibility(isUploading ? View.VISIBLE : View.GONE);
        });

        // Upload progress
        viewModel.getUploadProgress().observe(this, progress -> {
            if (progress != null) {
                progressUpload.setProgress(progress);
            }
        });

        // Error
        viewModel.getErrorMessage().observe(this, error -> {
            if (error != null && !error.isEmpty()) {
                tvError.setText(error);
                errorContainer.setVisibility(View.VISIBLE);
            } else {
                errorContainer.setVisibility(View.GONE);
            }
        });

        // Success
        viewModel.getSubmitSuccess().observe(this, success -> {
            if (success != null && success) {
                Toast.makeText(this, R.string.expense_submitted_success, Toast.LENGTH_LONG).show();
                finish();
            }
        });
    }

    private void submitForm() {
        // Get form data
        String title = etTitle.getText() != null ? etTitle.getText().toString() : "";
        String description = etDescription.getText() != null ? etDescription.getText().toString() : "";
        String amountStr = etAmount.getText() != null ? etAmount.getText().toString() : "0";

        double amount;
        try {
            amount = Double.parseDouble(amountStr);
        } catch (NumberFormatException e) {
            amount = 0;
        }

        // Set to ViewModel
        viewModel.setTitle(title);
        viewModel.setDescription(description);
        viewModel.setAmount(amount);

        // Submit
        viewModel.submit();
    }

    private void openCamera() {
        try {
            File photoFile = createImageFile();
            currentPhotoUri = FileProvider.getUriForFile(
                    this,
                    getPackageName() + ".fileprovider",
                    photoFile);
            takePictureLauncher.launch(currentPhotoUri);
        } catch (IOException e) {
            Toast.makeText(this, R.string.error_camera_open, Toast.LENGTH_SHORT).show();
        }
    }

    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "RECEIPT_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(null);
        return File.createTempFile(imageFileName, ".jpg", storageDir);
    }

    private void showReceiptPreview(Uri uri) {
        receiptPreviewContainer.setVisibility(View.VISIBLE);
        uploadButtonsContainer.setVisibility(View.GONE);
        Glide.with(this).load(uri).into(ivReceiptPreview);
    }

    private void hideReceiptPreview() {
        receiptPreviewContainer.setVisibility(View.GONE);
        uploadButtonsContainer.setVisibility(View.VISIBLE);
        ivReceiptPreview.setImageDrawable(null);
        currentPhotoUri = null;
    }

    private void getCurrentLocation() {
        if (ActivityCompat.checkSelfPermission(this,
                Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        fusedLocationClient.getLastLocation()
                .addOnSuccessListener(this, location -> {
                    if (location != null) {
                        getAddressFromLocation(location);
                    } else {
                        Toast.makeText(this, R.string.error_location_unavailable, Toast.LENGTH_SHORT).show();
                    }
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(this, R.string.error_location_fetch, Toast.LENGTH_SHORT).show();
                });
    }

    private void getAddressFromLocation(Location location) {
        Geocoder geocoder = new Geocoder(this, Locale.getDefault());
        try {
            List<Address> addresses = geocoder.getFromLocation(
                    location.getLatitude(),
                    location.getLongitude(),
                    1);

            if (addresses != null && !addresses.isEmpty()) {
                Address address = addresses.get(0);
                String addressLine = address.getAddressLine(0);

                viewModel.setLocation(location.getLatitude(), location.getLongitude(), addressLine);
                showLocationPreview(addressLine);
            }
        } catch (IOException e) {
            // Fallback to coordinates
            String coords = String.format(Locale.US, "%.6f, %.6f",
                    location.getLatitude(), location.getLongitude());
            viewModel.setLocation(location.getLatitude(), location.getLongitude(), coords);
            showLocationPreview(coords);
        }
    }

    private void showLocationPreview(String address) {
        locationPreviewContainer.setVisibility(View.VISIBLE);
        btnAddLocation.setVisibility(View.GONE);
        tvLocation.setText(address);
    }

    private void hideLocationPreview() {
        locationPreviewContainer.setVisibility(View.GONE);
        btnAddLocation.setVisibility(View.VISIBLE);
    }
}
