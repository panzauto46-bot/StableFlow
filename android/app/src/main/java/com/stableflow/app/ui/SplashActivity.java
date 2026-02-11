package com.stableflow.app.ui;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.stableflow.app.R;
import com.stableflow.app.ui.auth.LoginActivity;
import com.stableflow.app.ui.base.BaseActivity;
import com.stableflow.app.ui.dashboard.DashboardActivity;

/**
 * SplashActivity
 * Initial splash screen that checks authentication status
 */
public class SplashActivity extends BaseActivity {

    private static final int SPLASH_DELAY_MS = 2000;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Check authentication after delay
        new Handler(Looper.getMainLooper()).postDelayed(this::checkAuthAndNavigate, SPLASH_DELAY_MS);
    }

    private void checkAuthAndNavigate() {
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        Intent intent;

        if (user != null) {
            // User is logged in, go to dashboard
            intent = new Intent(this, DashboardActivity.class);
        } else {
            // User is not logged in, go to login
            intent = new Intent(this, LoginActivity.class);
        }

        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        finish();
    }
}
